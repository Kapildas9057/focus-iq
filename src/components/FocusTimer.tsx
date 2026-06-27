/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Coffee, Square, AlertTriangle, CheckCircle2, 
  XCircle, Smartphone, Zap, RotateCcw, Volume2, ShieldAlert
} from 'lucide-react';
import { audioSynth } from '../utils/audio';

interface FocusTimerProps {
  onSessionComplete: (durationMinutes: number, strikes: number, pointsEarned: number) => void;
  onSessionInterrupted: (elapsedSeconds: number, strikes: number) => void;
  onStrikeLogged: (totalStrikes: number) => void;
  isActiveSession: boolean;
  setIsActiveSession: (active: boolean) => void;
}

export default function FocusTimer({
  onSessionComplete,
  onSessionInterrupted,
  onStrikeLogged,
  isActiveSession,
  setIsActiveSession
}: FocusTimerProps) {
  // Timer settings
  const presets = [1, 5, 15, 25, 45, 60];
  const [selectedDuration, setSelectedDuration] = useState(25); // minutes
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [strikes, setStrikes] = useState(0);

  // Warning / Tilt detection state
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(5);
  const [sensorStatus, setSensorStatus] = useState<'unsupported' | 'checking' | 'active' | 'denied'>('unsupported');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSecondsRef = useRef(25 * 60);

  // Track orientation values
  const [orientationData, setOrientationData] = useState({ beta: 0, gamma: 0 });
  const initialOrientation = useRef<{ beta: number; gamma: number } | null>(null);

  // Initialize timer seconds when selectedDuration changes
  useEffect(() => {
    if (!isRunning && !isWarningActive) {
      setSecondsLeft(selectedDuration * 60);
      initialSecondsRef.current = selectedDuration * 60;
    }
  }, [selectedDuration, isRunning, isWarningActive]);

  // Request device orientation permissions (mainly for iOS and some Android browsers)
  const requestSensorPermission = async () => {
    setSensorStatus('checking');
    if (
      typeof window !== 'undefined' &&
      'DeviceOrientationEvent' in window &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          setSensorStatus('active');
        } else {
          setSensorStatus('denied');
        }
      } catch (error) {
        console.error('Error requesting orientation permission:', error);
        setSensorStatus('denied');
      }
    } else if ('DeviceOrientationEvent' in window) {
      // Direct bind for standard browsers
      window.addEventListener('deviceorientation', handleOrientation);
      setSensorStatus('active');
    } else {
      setSensorStatus('unsupported');
    }
  };

  // Bind/unbind orientation handler
  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (!isRunning || isWarningActive) return;

    const beta = e.beta || 0;
    const gamma = e.gamma || 0;
    setOrientationData({ beta, gamma });

    if (!initialOrientation.current) {
      initialOrientation.current = { beta, gamma };
      return;
    }

    // Calculate displacement from starting orientation
    const deltaBeta = Math.abs(beta - initialOrientation.current.beta);
    const deltaGamma = Math.abs(gamma - initialOrientation.current.gamma);

    // If movement exceeds threshold (e.g. 25 degrees)
    if (deltaBeta > 25 || deltaGamma > 25) {
      triggerTiltWarning();
    }
  };

  useEffect(() => {
    // Attempt auto-bind if supported
    if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation);
      setSensorStatus('active');
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isRunning, isWarningActive]);

  // Handle the primary countdown timer
  useEffect(() => {
    if (isRunning && !isWarningActive) {
      setIsActiveSession(true);
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isWarningActive]);

  // Handle the 5-second warning grace countdown
  useEffect(() => {
    if (isWarningActive) {
      warningTimerRef.current = setInterval(() => {
        setWarningSecondsLeft((prev) => {
          if (prev <= 1) {
            handleWarningTimeout();
            return 0;
          }
          audioSynth.playWarning(); // alert sound
          if (navigator.vibrate) navigator.vibrate(100); // vibrate
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    }

    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [isWarningActive, strikes]);

  // Triggered when phone is tilted/lifted
  const triggerTiltWarning = () => {
    if (isWarningActive) return;
    setIsWarningActive(true);
    setWarningSecondsLeft(5);
    audioSynth.playWarning();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  // Recovered in time (phone put back down)
  const recoverSession = () => {
    setIsWarningActive(false);
    // Reset initial orientation reference to the current state to prevent immediate re-triggering
    initialOrientation.current = null;
  };

  // Failed to put phone down in 5 seconds
  const handleWarningTimeout = () => {
    setIsWarningActive(false);
    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    onStrikeLogged(nextStrikes);

    if (nextStrikes >= 3) {
      // 3 strikes: Session Interrupted
      handleSessionInterrupted();
    } else {
      // Warning beep for strike logged
      audioSynth.playInterrupted();
      initialOrientation.current = null;
    }
  };

  // Complete session successfully
  const handleSessionComplete = () => {
    setIsRunning(false);
    setIsActiveSession(false);
    audioSynth.playSuccess();
    
    // 10 pts per minute
    const basePoints = selectedDuration * 10;
    // Subtract 15 points per strike
    const penalty = strikes * 15;
    const pointsEarned = Math.max(0, basePoints - penalty);

    onSessionComplete(selectedDuration, strikes, pointsEarned);
    
    // Reset
    setStrikes(0);
    setSecondsLeft(selectedDuration * 60);
  };

  // Interrupted (3 strikes)
  const handleSessionInterrupted = () => {
    setIsRunning(false);
    setIsActiveSession(false);
    audioSynth.playInterrupted();
    
    const elapsedSeconds = initialSecondsRef.current - secondsLeft;
    onSessionInterrupted(elapsedSeconds, strikes);
    
    // Reset
    setStrikes(0);
    setSecondsLeft(selectedDuration * 60);
  };

  // Start Session button
  const startSession = () => {
    // Resume audio context
    audioSynth.playStart();
    setIsRunning(true);
    setIsActiveSession(true);
    setStrikes(0);
    initialOrientation.current = null;
  };

  // Break / Resume manually
  const toggleBreak = () => {
    setIsRunning(!isRunning);
  };

  // Force Stop / Cancel Session
  const cancelSession = () => {
    if (window.confirm('Are you sure you want to cancel your focus session? Progress and streaks will be lost.')) {
      setIsRunning(false);
      setIsActiveSession(false);
      setIsWarningActive(false);
      setStrikes(0);
      setSecondsLeft(selectedDuration * 60);
      audioSynth.playInterrupted();
    }
  };

  // Formatting helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Radial progress stroke math
  const progressPercent = (secondsLeft / (selectedDuration * 60)) * 100;
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - progressPercent / 100);

  return (
    <div className="bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.3)]">
      
      {/* Background ambient light */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 transition-colors duration-1000 ${
        isWarningActive ? 'bg-red-500' : isRunning ? 'bg-cyan-500' : 'bg-slate-500'
      }`} />

      <h2 id="timer-title" className="text-2xl font-display font-bold tracking-tight mb-1 text-slate-100 flex items-center gap-2">
        <Zap className={`w-5 h-5 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
        Focus Countdown
      </h2>
      <p className="text-xs text-slate-400 font-mono mb-6 text-center tracking-wider">
        3-STRIKE GRACE SYSTEM • STRIKE PENALTY ACTIVE
      </p>

      {/* Preset Pickers */}
      {!isRunning && !isWarningActive && (
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-sm">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedDuration(preset)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                selectedDuration === preset
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {preset}m
            </button>
          ))}
        </div>
      )}

      {/* Main Circular Timer */}
      <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center mb-8">
        
        {/* Pulsed glowing outer ring decor */}
        <div className="absolute w-72 h-72 border border-cyan-500/5 rounded-full pointer-events-none animate-pulse hidden md:block" />
        <div className="absolute w-[17rem] h-[17rem] border border-dashed border-cyan-500/10 rounded-full pointer-events-none hidden md:block" />

        {/* SVG Progress Ring */}
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Track circle */}
          <circle
            cx="50%"
            cy="50%"
            r="90"
            className="stroke-slate-800/60 fill-none"
            strokeWidth="8"
          />
          {/* Animated active circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r="90"
            className={`fill-none transition-all duration-300 ${
              isWarningActive ? 'stroke-red-500' : 'stroke-cyan-400'
            }`}
            style={{
              filter: isRunning ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))' : 'none'
            }}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 90}
            animate={{ strokeDashoffset }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="text-center z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isWarningActive ? (
              <motion.div
                key="warning"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-400 flex flex-col items-center"
              >
                <AlertTriangle className="w-10 h-10 animate-bounce mb-1" />
                <span className="text-sm font-bold uppercase tracking-widest font-display">Put Phone Down</span>
                <span className="text-4xl font-display font-bold mt-1">{warningSecondsLeft}s</span>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs text-cyan-300 uppercase tracking-widest mt-1.5 font-bold">
                  {isRunning ? 'Deep Focus' : 'Ready'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active strikes indicator */}
          {isRunning && (
            <div className="flex gap-1.5 mt-3 justify-center">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                    s <= strikes
                      ? 'bg-red-500 border-red-400 shadow-sm shadow-red-900'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                  title={`Strike ${s}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center z-10 w-full max-w-xs">
        {!isRunning && !isWarningActive ? (
          <button
            onClick={startSession}
            id="start-focus-btn"
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_35px_rgba(255,255,255,0.25)] transition-all duration-200 py-3.5 px-6 flex items-center justify-center gap-2 border border-white text-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Focus Session
          </button>
        ) : isWarningActive ? (
          <button
            onClick={recoverSession}
            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-slate-200 font-medium py-3 px-6 rounded-full border border-slate-700 flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Simulate Put Down
          </button>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={toggleBreak}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium py-3 px-4 rounded-full border border-slate-800 flex items-center justify-center gap-2 transition-all duration-200"
            >
              {isRunning ? <Coffee className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? 'Break' : 'Resume'}
            </button>
            <button
              onClick={cancelSession}
              className="px-4 bg-red-950/20 hover:bg-red-900/20 text-red-400 border border-red-900/40 rounded-full flex items-center justify-center transition-all duration-200"
              title="Cancel Session"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>
        )}
      </div>

      {/* Sensor Controls / Simulator Panel */}
      <div className="w-full border-t border-slate-700/50 mt-6 pt-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              Tilt / Lift Sensor status:
            </span>
            <span className={`font-mono font-semibold capitalize ${
              sensorStatus === 'active' ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {sensorStatus}
            </span>
          </div>

          {sensorStatus === 'unsupported' && (
            <button
              onClick={requestSensorPermission}
              className="text-2xs bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 py-1.5 px-3 rounded-lg border border-slate-700/60 transition-all text-center"
            >
              Enable Browser Gyroscope
            </button>
          )}

          {/* Development / Testing Simulator Controls */}
          {isRunning && !isWarningActive && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/25 border border-red-900/30 rounded-xl p-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Browser Simulator Tools
              </div>
              <p className="text-2xs text-slate-400 mb-2 leading-relaxed">
                Tilt/orientation API is typically disabled inside iframes or on desktop. Trigger a simulated lift below to test the 3-strike grace countdown.
              </p>
              <button
                onClick={triggerTiltWarning}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-1.5 px-3 rounded-lg border border-red-500/30 text-xs font-medium transition-all"
              >
                Simulate Phone Lift / Tilt 📱💨
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
