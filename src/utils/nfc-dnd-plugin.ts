/**
 * nfc-dnd-plugin.ts
 *
 * TypeScript bridge for the native NfcDndPlugin Capacitor plugin.
 * Provides typed methods for NFC scanning and DND control,
 * plus a useNfcDnd() React hook for easy component integration.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Plugin Interface ────────────────────────────────────────────────────────

export type DndFilterLevel = 'priority' | 'alarms' | 'total_silence';

export interface NfcTagEvent {
  uid: string;
  timestamp: number;
  techList: string;
}

export interface NfcDndPluginInterface {
  // NFC
  startScanning(): Promise<{ scanning: boolean }>;
  stopScanning(): Promise<{ scanning: boolean }>;
  isNfcAvailable(): Promise<{ available: boolean; enabled: boolean }>;

  // DND
  checkDndPermission(): Promise<{ granted: boolean }>;
  requestDndPermission(): Promise<{ opened: boolean }>;
  enableDnd(options: { filterLevel: DndFilterLevel }): Promise<{ enabled: boolean; filterLevel: string }>;
  disableDnd(): Promise<{ enabled: boolean }>;

  // Events
  addListener(
    eventName: 'nfcTagDetected',
    listenerFunc: (event: NfcTagEvent) => void
  ): Promise<{ remove: () => Promise<void> }>;
  removeAllListeners(): Promise<void>;
}

// Register the plugin — on web it will be a no-op stub
const NfcDndPlugin = registerPlugin<NfcDndPluginInterface>('NfcDndPlugin');

export { NfcDndPlugin };

// ─── React Hook ──────────────────────────────────────────────────────────────

export type NfcScanStatus = 'idle' | 'scanning' | 'detected' | 'error' | 'unavailable';

export interface UseNfcDndReturn {
  // NFC state
  scanStatus: NfcScanStatus;
  lastTagUid: string | null;
  lastTagTimestamp: number | null;
  nfcAvailable: boolean;
  nfcEnabled: boolean;
  errorMessage: string | null;

  // DND state
  dndPermissionGranted: boolean;
  dndActive: boolean;

  // Actions
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  checkDndPermission: () => Promise<boolean>;
  requestDndPermission: () => Promise<void>;
  enableDnd: (level?: DndFilterLevel) => Promise<void>;
  disableDnd: () => Promise<void>;
  resetTag: () => void;
  simulateTagDetect: () => void;
}

export function useNfcDnd(): UseNfcDndReturn {
  const [scanStatus, setScanStatus] = useState<NfcScanStatus>('idle');
  const [lastTagUid, setLastTagUid] = useState<string | null>(null);
  const [lastTagTimestamp, setLastTagTimestamp] = useState<number | null>(null);
  const [nfcAvailable, setNfcAvailable] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dndPermissionGranted, setDndPermissionGranted] = useState(false);
  const [dndActive, setDndActive] = useState(false);

  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Check NFC availability on mount
  useEffect(() => {
    if (!isNative) {
      setScanStatus('unavailable');
      return;
    }

    NfcDndPlugin.isNfcAvailable().then(({ available, enabled }) => {
      setNfcAvailable(available);
      setNfcEnabled(enabled);
      if (!available) {
        setScanStatus('unavailable');
      }
    }).catch(() => {
      setScanStatus('unavailable');
    });

    // Also check DND permission eagerly
    NfcDndPlugin.checkDndPermission().then(({ granted }) => {
      setDndPermissionGranted(granted);
    }).catch(() => {});
  }, [isNative]);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!isNative) {
      setErrorMessage('NFC is only available on Android');
      setScanStatus('error');
      return;
    }

    try {
      setErrorMessage(null);

      // Attach listener for tag events
      if (listenerRef.current) {
        await listenerRef.current.remove();
      }
      listenerRef.current = await NfcDndPlugin.addListener('nfcTagDetected', (event: NfcTagEvent) => {
        setLastTagUid(event.uid);
        setLastTagTimestamp(event.timestamp);
        setScanStatus('detected');
      });

      await NfcDndPlugin.startScanning();
      setScanStatus('scanning');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start NFC scanning');
      setScanStatus('error');
    }
  }, [isNative]);

  const stopScanning = useCallback(async () => {
    if (!isNative) return;
    try {
      await NfcDndPlugin.stopScanning();
      if (listenerRef.current) {
        await listenerRef.current.remove();
        listenerRef.current = null;
      }
      setScanStatus('idle');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to stop NFC scanning');
    }
  }, [isNative]);

  const checkDndPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    try {
      const { granted } = await NfcDndPlugin.checkDndPermission();
      setDndPermissionGranted(granted);
      return granted;
    } catch {
      return false;
    }
  }, [isNative]);

  const requestDndPermission = useCallback(async () => {
    if (!isNative) return;
    await NfcDndPlugin.requestDndPermission();
    // Re-check after user returns from settings (small delay to let activity resume)
    setTimeout(async () => {
      const { granted } = await NfcDndPlugin.checkDndPermission();
      setDndPermissionGranted(granted);
    }, 1000);
  }, [isNative]);

  const enableDnd = useCallback(async (level: DndFilterLevel = 'priority') => {
    if (!isNative) return;
    try {
      await NfcDndPlugin.enableDnd({ filterLevel: level });
      setDndActive(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to enable DND');
    }
  }, [isNative]);

  const disableDnd = useCallback(async () => {
    if (!isNative) return;
    try {
      await NfcDndPlugin.disableDnd();
      setDndActive(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to disable DND');
    }
  }, [isNative]);

  const resetTag = useCallback(() => {
    setLastTagUid(null);
    setLastTagTimestamp(null);
    setScanStatus(nfcAvailable ? 'idle' : 'unavailable');
    setErrorMessage(null);
  }, [nfcAvailable]);

  const simulateTagDetect = useCallback(() => {
    setLastTagUid('SIMULATED_TAG_123');
    setLastTagTimestamp(Date.now());
    setScanStatus('detected');
  }, []);

  return {
    scanStatus,
    lastTagUid,
    lastTagTimestamp,
    nfcAvailable,
    nfcEnabled,
    errorMessage,
    dndPermissionGranted,
    dndActive,
    startScanning,
    stopScanning,
    checkDndPermission,
    requestDndPermission,
    enableDnd,
    disableDnd,
    resetTag,
    simulateTagDetect,
  };
}
