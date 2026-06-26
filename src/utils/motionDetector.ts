/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Real device motion detection using the Web DeviceMotion API.
 * Works in Capacitor WebView and modern mobile browsers.
 * Detects when the phone is lifted/tilted during a focus session.
 */

type LiftCallback = () => void;

interface MotionState {
  isMonitoring: boolean;
  callback: LiftCallback | null;
  lastTriggerTime: number;
  cooldownMs: number;
  threshold: number; // acceleration threshold in m/s²
  baselineSet: boolean;
  baselineX: number;
  baselineY: number;
  baselineZ: number;
}

const state: MotionState = {
  isMonitoring: false,
  callback: null,
  lastTriggerTime: 0,
  cooldownMs: 2000, // 2 second cooldown between triggers
  threshold: 3.0, // m/s² change threshold for "lift" detection
  baselineSet: false,
  baselineX: 0,
  baselineY: 0,
  baselineZ: 0,
};

function handleMotionEvent(event: DeviceMotionEvent) {
  if (!state.isMonitoring || !state.callback) return;

  const acc = event.accelerationIncludingGravity;
  if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

  const x = acc.x;
  const y = acc.y;
  const z = acc.z;

  // Set baseline on first reading (phone lying flat)
  if (!state.baselineSet) {
    state.baselineX = x;
    state.baselineY = y;
    state.baselineZ = z;
    state.baselineSet = true;
    return;
  }

  // Calculate delta from baseline
  const deltaX = Math.abs(x - state.baselineX);
  const deltaY = Math.abs(y - state.baselineY);
  const deltaZ = Math.abs(z - state.baselineZ);
  const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  // Check if movement exceeds threshold
  if (totalDelta > state.threshold) {
    const now = Date.now();
    if (now - state.lastTriggerTime > state.cooldownMs) {
      state.lastTriggerTime = now;
      state.callback();
    }
  }

  // Slowly update baseline to account for gradual repositioning
  const alpha = 0.02;
  state.baselineX = state.baselineX * (1 - alpha) + x * alpha;
  state.baselineY = state.baselineY * (1 - alpha) + y * alpha;
  state.baselineZ = state.baselineZ * (1 - alpha) + z * alpha;
}

/**
 * Check if the device supports motion detection
 */
export function isMotionSupported(): boolean {
  return 'DeviceMotionEvent' in window;
}

/**
 * Request permission for motion sensors (required on iOS 13+)
 */
export async function requestMotionPermission(): Promise<boolean> {
  // iOS 13+ requires explicit permission request
  if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Motion permission request failed:', e);
      return false;
    }
  }
  // Android and older iOS don't need explicit permission
  return true;
}

/**
 * Start monitoring device motion for lift/tilt detection.
 * @param onLiftDetected - Callback fired when phone is lifted/tilted significantly
 */
export function startMotionMonitoring(onLiftDetected: LiftCallback): void {
  if (state.isMonitoring) {
    stopMotionMonitoring();
  }

  state.isMonitoring = true;
  state.callback = onLiftDetected;
  state.lastTriggerTime = 0;
  state.baselineSet = false;

  window.addEventListener('devicemotion', handleMotionEvent, { passive: true });
  console.log('[MotionDetector] Started monitoring device motion');
}

/**
 * Stop monitoring device motion.
 */
export function stopMotionMonitoring(): void {
  state.isMonitoring = false;
  state.callback = null;
  state.baselineSet = false;

  window.removeEventListener('devicemotion', handleMotionEvent);
  console.log('[MotionDetector] Stopped monitoring device motion');
}

/**
 * Update detection sensitivity
 * @param threshold - acceleration change threshold in m/s² (default 3.0)
 * @param cooldownMs - minimum time between triggers in ms (default 2000)
 */
export function setMotionSensitivity(threshold: number, cooldownMs: number): void {
  state.threshold = threshold;
  state.cooldownMs = cooldownMs;
}
