package com.focusloop.app;

import android.app.Activity;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * NfcDndPlugin — Capacitor local plugin for FocusLoop.
 *
 * Bridges Android NFC foreground dispatch and Do-Not-Disturb APIs
 * to the React/TypeScript layer.
 *
 * NFC flow:
 *   JS calls startScanning() → enables foreground dispatch
 *   Tag detected → fires "nfcTagDetected" event with { uid: "AABBCCDD" }
 *   JS calls stopScanning() → disables foreground dispatch
 *
 * DND flow:
 *   JS calls checkDndPermission()  → returns { granted: boolean }
 *   JS calls requestDndPermission() → opens system DND access settings
 *   JS calls enableDnd({ filterLevel: "priority"|"alarms"|"total_silence" })
 *   JS calls disableDnd()
 */
@CapacitorPlugin(name = "NfcDndPlugin")
public class NfcDndPlugin extends Plugin {

    private static final String TAG = "NfcDndPlugin";
    private static final String EVENT_TAG_DETECTED = "nfcTagDetected";

    private NfcAdapter nfcAdapter;
    private PendingIntent nfcPendingIntent;
    private boolean isScanning = false;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void load() {
        Activity activity = getActivity();
        if (activity == null) return;

        nfcAdapter = NfcAdapter.getDefaultAdapter(activity);
        if (nfcAdapter == null) {
            Log.w(TAG, "NFC hardware not available on this device");
            return;
        }

        // Build a PendingIntent that re-delivers the NFC intent to *this* activity
        Intent intent = new Intent(activity, activity.getClass());
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        nfcPendingIntent = PendingIntent.getActivity(
                activity, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
    }

    /**
     * Capacitor calls this when the hosting Activity receives onNewIntent().
     * This is how foreground dispatch delivers NFC tags.
     */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_TECH_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)) {

            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                String uid = bytesToHex(tag.getId());
                String[] techList = tag.getTechList();

                JSObject data = new JSObject();
                data.put("uid", uid);
                data.put("timestamp", System.currentTimeMillis());

                // Include tech list for debugging
                StringBuilder techs = new StringBuilder();
                for (String tech : techList) {
                    if (techs.length() > 0) techs.append(",");
                    techs.append(tech.substring(tech.lastIndexOf('.') + 1));
                }
                data.put("techList", techs.toString());

                Log.i(TAG, "NFC tag detected — UID: " + uid + " | techs: " + techs);
                notifyListeners(EVENT_TAG_DETECTED, data);
            }
        }
    }

    @Override
    protected void handleOnResume() {
        if (isScanning) {
            enableForegroundDispatchInternal();
        }
    }

    @Override
    protected void handleOnPause() {
        disableForegroundDispatchInternal();
    }

    // ─── NFC Methods ──────────────────────────────────────────────────────────

    @PluginMethod()
    public void startScanning(PluginCall call) {
        if (nfcAdapter == null) {
            call.reject("NFC is not available on this device");
            return;
        }
        if (!nfcAdapter.isEnabled()) {
            call.reject("NFC is disabled. Please enable NFC in device settings.");
            return;
        }

        isScanning = true;
        enableForegroundDispatchInternal();

        JSObject ret = new JSObject();
        ret.put("scanning", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void stopScanning(PluginCall call) {
        isScanning = false;
        disableForegroundDispatchInternal();

        JSObject ret = new JSObject();
        ret.put("scanning", false);
        call.resolve(ret);
    }

    @PluginMethod()
    public void isNfcAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", nfcAdapter != null);
        ret.put("enabled", nfcAdapter != null && nfcAdapter.isEnabled());
        call.resolve(ret);
    }

    // ─── DND Methods ──────────────────────────────────────────────────────────

    @PluginMethod()
    public void checkDndPermission(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        NotificationManager nm = (NotificationManager)
                activity.getSystemService(Context.NOTIFICATION_SERVICE);

        boolean granted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
            granted = nm.isNotificationPolicyAccessGranted();
        } else {
            // Pre-Marshmallow: DND API not available, treat as granted
            granted = true;
        }

        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod()
    public void requestDndPermission(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
            activity.startActivity(intent);
        }

        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void enableDnd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        NotificationManager nm = (NotificationManager)
                activity.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.reject("NotificationManager not available");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!nm.isNotificationPolicyAccessGranted()) {
                call.reject("DND permission not granted. Call requestDndPermission() first.");
                return;
            }
        }

        // Parse filter level from JS
        String filterLevel = call.getString("filterLevel", "priority");
        int filter;
        switch (filterLevel) {
            case "total_silence":
                filter = NotificationManager.INTERRUPTION_FILTER_NONE;
                break;
            case "alarms":
                filter = NotificationManager.INTERRUPTION_FILTER_ALARMS;
                break;
            case "priority":
            default:
                filter = NotificationManager.INTERRUPTION_FILTER_PRIORITY;
                break;
        }

        nm.setInterruptionFilter(filter);
        Log.i(TAG, "DND enabled with filter: " + filterLevel);

        JSObject ret = new JSObject();
        ret.put("enabled", true);
        ret.put("filterLevel", filterLevel);
        call.resolve(ret);
    }

    @PluginMethod()
    public void disableDnd(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        NotificationManager nm = (NotificationManager)
                activity.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.reject("NotificationManager not available");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!nm.isNotificationPolicyAccessGranted()) {
                call.reject("DND permission not granted");
                return;
            }
        }

        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
        Log.i(TAG, "DND disabled");

        JSObject ret = new JSObject();
        ret.put("enabled", false);
        call.resolve(ret);
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    private void enableForegroundDispatchInternal() {
        Activity activity = getActivity();
        if (activity == null || nfcAdapter == null || nfcPendingIntent == null) return;

        try {
            // Accept all tag types — no filters → catches any NFC tag/emulator
            nfcAdapter.enableForegroundDispatch(
                    activity,
                    nfcPendingIntent,
                    null,   // no IntentFilter array → match everything
                    null    // no tech list filter → match all techs
            );
            Log.d(TAG, "NFC foreground dispatch enabled");
        } catch (IllegalStateException e) {
            Log.e(TAG, "Failed to enable foreground dispatch", e);
        }
    }

    private void disableForegroundDispatchInternal() {
        Activity activity = getActivity();
        if (activity == null || nfcAdapter == null) return;

        try {
            nfcAdapter.disableForegroundDispatch(activity);
            Log.d(TAG, "NFC foreground dispatch disabled");
        } catch (IllegalStateException e) {
            Log.e(TAG, "Failed to disable foreground dispatch", e);
        }
    }

    /**
     * Converts a byte array (NFC tag UID) to an uppercase hex string.
     * e.g., {0xAB, 0xCD, 0x12} → "ABCD12"
     */
    private static String bytesToHex(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return "";
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
