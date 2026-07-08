package com.focusloop.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register the local NFC + DND plugin before Capacitor initializes the bridge
        registerPlugin(NfcDndPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
