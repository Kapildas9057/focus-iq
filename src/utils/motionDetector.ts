/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Real device motion detection using the Web DeviceMotion API.
 * Works in Capacitor WebView and modern mobile browsers.
 * Detects when the phone is lifted/tilted during a focus session,
 * and when it returns flat (lift resolved).
 */

type LiftCallback = () => void;

interface MotionState {
  isMonitoring: boolean;
  callback: LiftCallback | null;
  onLiftResolved: LiftCallback | null;
  lastTriggerTime: number;
  cooldownMs: number;
  liftThreshold: number;    // acceleration threshold in m/s² to detect a lift
  resolveThreshold: number; // acceleration threshold below which phone is considered flat again
  baselineSet: boolean;
  baselineX: number;
  baselineY: number;
  baselineZ: number;
  isCurrentlyLifted: boolean; // whether the phone is currently in a lifted state
}

const state: MotionState = {
  isMonitoring: false,
  callback: null,
  onLiftResolved: null,
  lastTriggerTime: 0,
  cooldownMs: 3000, // 3 second cooldown between lift triggers
  liftThreshold: 3.0, // m/s² change threshold for "lift" detection
  resolveThreshold: 1.2, // m/s² — below this, phone is considered flat/returned
  baselineSet: false,
  baselineX: 0,
  baselineY: 0,
  baselineZ: 0,
  isCurrentlyLifted: false,
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

  if (!state.isCurrentlyLifted) {
    // Phone is flat — check if it gets lifted
    if (totalDelta > state.liftThreshold) {
      const now = Date.now();
      if (now - state.lastTriggerTime > state.cooldownMs) {
        state.lastTriggerTime = now;
        state.isCurrentlyLifted = true;
        state.callback();
      }
    }
  } else {
    // Phone is currently lifted — check if it returns flat
    if (totalDelta < state.resolveThreshold) {
      state.isCurrentlyLifted = false;
      // Update baseline to the new resting position
      state.baselineX = x;
      state.baselineY = y;
      state.baselineZ = z;
      if (state.onLiftResolved) {
        state.onLiftResolved();
      }
    }
  }

  // Slowly update baseline only when phone is flat (to account for gradual repositioning)
  if (!state.isCurrentlyLifted) {
    const alpha = 0.02;
    state.baselineX = state.baselineX * (1 - alpha) + x * alpha;
    state.baselineY = state.baselineY * (1 - alpha) + y * alpha;
    state.baselineZ = state.baselineZ * (1 - alpha) + z * alpha;
  }
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
 * @param onLiftResolved - Optional callback fired when phone is placed back flat automatically
 */
export function startMotionMonitoring(
  onLiftDetected: LiftCallback,
  onLiftResolved?: LiftCallback
): void {
  if (state.isMonitoring) {
    stopMotionMonitoring();
  }

  state.isMonitoring = true;
  state.callback = onLiftDetected;
  state.onLiftResolved = onLiftResolved || null;
  state.lastTriggerTime = 0;
  state.baselineSet = false;
  state.isCurrentlyLifted = false;

  window.addEventListener('devicemotion', handleMotionEvent, { passive: true });
  console.log('[MotionDetector] Started monitoring device motion');
}

/**
 * Stop monitoring device motion.
 */
export function stopMotionMonitoring(): void {
  state.isMonitoring = false;
  state.callback = null;
  state.onLiftResolved = null;
  state.baselineSet = false;
  state.isCurrentlyLifted = false;

  window.removeEventListener('devicemotion', handleMotionEvent);
  console.log('[MotionDetector] Stopped monitoring device motion');
}

/**
 * Update detection sensitivity
 * @param liftThreshold - acceleration change threshold in m/s² for lift (default 3.0)
 * @param cooldownMs - minimum time between lift triggers in ms (default 3000)
 * @param resolveThreshold - delta below which phone is considered flat again (default 1.2)
 */
export function setMotionSensitivity(
  liftThreshold: number,
  cooldownMs: number,
  resolveThreshold?: number
): void {
  state.liftThreshold = liftThreshold;
  state.cooldownMs = cooldownMs;
  if (resolveThreshold !== undefined) {
    state.resolveThreshold = resolveThreshold;
  }
}
