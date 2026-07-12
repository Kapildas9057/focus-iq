/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, Target, Sparkles, Wind, Brain, Timer, Clock, 
  HelpCircle, AlertTriangle, Play, Coffee, Square, ChevronRight, Trophy, ShieldAlert
} from 'lucide-react';
import { audioSynth } from '../utils/audio';
import { startMotionMonitoring, stopMotionMonitoring, isMotionSupported, requestMotionPermission } from '../utils/motionDetector';

import { PyqQuestion, getQuestionsByChapter, getQuestionsBySubject, GRADE_SUBJECT_CHAPTERS } from '../utils/questions';


interface AndroidFocusFlowProps {
  studentProfile: { points: number; username: string; dailyGoalMinutes: number };
  onSessionComplete: (durationMinutes: number, strikes: number, pointsEarned: number) => void;
  onSessionInterrupted: (elapsedSeconds: number, strikes: number) => void;
  onStrikeLogged: (totalStrikes: number) => void;
  isActiveSession: boolean;
  setIsActiveSession: (active: boolean) => void;
  onMotionStrike: () => void;
  endSessionTrigger?: number;
}

export default function AndroidFocusFlow({
  studentProfile,
  onSessionComplete,
  onSessionInterrupted,
  onStrikeLogged,
  isActiveSession,
  setIsActiveSession,
  onMotionStrike,
  endSessionTrigger
}: AndroidFocusFlowProps) {
  
  // Steps: 'clock' -> 'countdown'
  const [currentStep, setCurrentStep] = useState<'goal' | 'breathing' | 'clock' | 'countdown' | 'quiz' | 'summary'>('clock');

  // --- STEP 1: GOAL STATE ---
  const [goalClass, setGoalClass] = useState('Class 12');
  const [goalSubject, setGoalSubject] = useState('Physics');
  const [goalTopic, setGoalTopic] = useState('Electric Charges and Fields');
  const [goalTask, setGoalTask] = useState('Solve 10 questions');

  useEffect(() => {
    // When class changes, reset subject to the first available subject
    const availableSubjects = Object.keys(GRADE_SUBJECT_CHAPTERS[goalClass] || {});
    if (availableSubjects.length > 0) {
      if (!availableSubjects.includes(goalSubject)) {
        setGoalSubject(availableSubjects[0]);
      }
    }
  }, [goalClass]);

  useEffect(() => {
    // When class or subject changes, reset topic to the first available chapter
    const availableChapters = (GRADE_SUBJECT_CHAPTERS[goalClass] && GRADE_SUBJECT_CHAPTERS[goalClass][goalSubject]) || [];
    if (availableChapters.length > 0) {
      if (!availableChapters.includes(goalTopic)) {
        setGoalTopic(availableChapters[0]);
      }
    }
  }, [goalClass, goalSubject]);

  // --- STEP 2: BREATHING STATE ---
  const [breathingCycle, setBreathingCycle] = useState(1); // 1 to 3
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(4); // 4 seconds
  const [breathingActive, setBreathingActive] = useState(false);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- STEP 3: CLOCK SETTINGS (MINIMAL NEEDLE DIAL) ---
  const dialRef = useRef<SVGSVGElement | null>(null);
  const [dialDuration, setDialDuration] = useState(25); // Selected duration in minutes
  const [isDraggingDial, setIsDraggingDial] = useState(false);

  // --- STEP 4: COUNTDOWN TIMER ---
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(5);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isWarningActiveRef = useRef(false);
  const secondsLeftRef = useRef(25 * 60);

  // --- OVERTIME LOGIC ---
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);
  const [isOvertimeMode, setIsOvertimeMode] = useState(false);
  const overtimeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger from Dashboard to physically end the session
  useEffect(() => {
    if (endSessionTrigger && endSessionTrigger > 0) {
      if (currentStep === 'countdown' || currentStep === 'clock') {
        finishSessionDirectly();
      }
    }
  }, [endSessionTrigger]);

  // --- STEP 5: QUIZ STATE ---
  const [dynamicQuestions, setDynamicQuestions] = useState<PyqQuestion[]>([]);
  const [quizTimeLeft, setQuizTimeLeft] = useState(60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStillBuilding, setQuizStillBuilding] = useState(false); // true when chapter has no questions
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- SUMMARY RESULTS ---
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Request motion permission on mount (needed for iOS 13+)
  const [motionPermissionGranted, setMotionPermissionGranted] = useState(false);
  
  useEffect(() => {
    if (isMotionSupported()) {
      requestMotionPermission().then(granted => {
        setMotionPermissionGranted(granted);
      });
    }
    return () => {
      stopBreathing();
      stopTimer();
      stopWarningTimer();
      stopQuizTimer();
      stopMotionMonitoring();
    };
  }, []);

  // Auto-start timer when component mounts in countdown state
  useEffect(() => {
    if (isActiveSession && currentStep === 'countdown' && !isRunning) {
      startFocusTimer();
    }
  }, [isActiveSession, currentStep]);

  useEffect(() => {
    if (currentStep === 'clock') {
      setSecondsLeft(dialDuration * 60);
    }
  }, [dialDuration, currentStep]);

  // Stop session entirely and go back to initial goal screen when no longer active
  useEffect(() => {
    if (!isActiveSession && !['goal', 'clock', 'breathing', 'summary'].includes(currentStep)) {
      setCurrentStep('goal');
    }
  }, [isActiveSession, currentStep]);



  // ==========================================
  // --- BREATHING LOGIC ---
  // ==========================================
  const breathingPhaseRef = useRef<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const breathingCycleRef = useRef(1);

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingCycle(1);
    setBreathingPhase('inhale');
    setBreathingTimer(4);
    
    breathingPhaseRef.current = 'inhale';
    breathingCycleRef.current = 1;

    breathingIntervalRef.current = setInterval(() => {
      setBreathingTimer((prev) => {
        if (prev <= 1) {
          // Switch phase
          let nextTimer = 4;
          let nextPhase = breathingPhaseRef.current;
          
          if (breathingPhaseRef.current === 'inhale') {
            nextPhase = 'hold1';
          } else if (breathingPhaseRef.current === 'hold1') {
            nextPhase = 'exhale';
          } else if (breathingPhaseRef.current === 'exhale') {
            nextPhase = 'hold2';
          } else {
            // hold2 complete, next cycle
            if (breathingCycleRef.current >= 3) {
              clearInterval(breathingIntervalRef.current!);
              breathingIntervalRef.current = null;
              
              // Use setTimeout to defer side effects and parent updates outside the render phase
              setTimeout(() => {
                stopBreathing();
                setCurrentStep('countdown');
                startFocusTimer();
              }, 500);
              return 0;
            } else {
              breathingCycleRef.current += 1;
              nextPhase = 'inhale';
              // Defer state update for cycle
              setTimeout(() => setBreathingCycle(breathingCycleRef.current), 0);
            }
          }
          
          breathingPhaseRef.current = nextPhase;
          // Defer state update for phase
          setTimeout(() => setBreathingPhase(nextPhase), 0);
          
          return nextTimer;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (currentStep === 'breathing') {
      startBreathing();
    }
  }, [currentStep]);

  const stopBreathing = () => {
    setBreathingActive(false);
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
  };

  const skipBreathing = () => {
    stopBreathing();
    setCurrentStep('countdown');
    startFocusTimer();
  };

  // ==========================================
  // --- CLOCK NESTED DIAL ---
  // ==========================================
  const handleDialPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDraggingDial(true);
    updateDialAngle(e);
  };

  const handleDialPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingDial) return;
    updateDialAngle(e);
  };

  const handleDialPointerUp = () => {
    setIsDraggingDial(false);
  };

  const updateDialAngle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    const radians = Math.atan2(y, x);
    let degrees = radians * (180 / Math.PI);
    let adjustedDegrees = (degrees + 90 + 360) % 360;
    let rawMinutes = (adjustedDegrees / 360) * 60;
    let snappedMinutes = Math.round(rawMinutes);
    if (snappedMinutes === 0) snappedMinutes = 60;
    setDialDuration(Math.max(5, Math.min(60, snappedMinutes)));
  };

  // ==========================================
  // --- TIMER COUNTDOWN ---
  // ==========================================
  const startFocusTimer = () => {
    setIsActiveSession(true);
    setIsRunning(true);
    setStrikes(0);
    audioSynth.playStart();

    // Start real accelerometer monitoring for phone lift/tilt detection
    if (isMotionSupported() && motionPermissionGranted) {
      startMotionMonitoring(
        () => {
          // Fired when phone is lifted/tilted — non-shaming message
          triggerTiltWarning();
          audioSynth.playSpeech("Streak at risk. Put the phone down and stay with it.");
          onMotionStrike();
        },
        () => {
          // Fired automatically when phone is placed flat again — auto-recover
          recoverSession();
        }
      );
    }

  };

  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    if (isRunning && !isWarningActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            // Instead of auto-finishing, pause and show overtime prompt
            setIsRunning(false);
            setShowOvertimePrompt(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isWarningActive, isOvertimeMode]);

  // Overtime Count-Up Timer
  useEffect(() => {
    if (isRunning && isOvertimeMode && !isWarningActive) {
      overtimeTimerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev + 1);
      }, 1000);
    } else {
      if (overtimeTimerRef.current) {
        clearInterval(overtimeTimerRef.current);
        overtimeTimerRef.current = null;
      }
    }
    return () => {
      if (overtimeTimerRef.current) {
        clearInterval(overtimeTimerRef.current);
        overtimeTimerRef.current = null;
      }
    };
  }, [isRunning, isOvertimeMode, isWarningActive]);

  // App Visibility (Minimize) monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && isActiveSession) {
        audioSynth.playSpeech("Streak at risk — come back to your study session.");
        onMotionStrike();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning, isActiveSession, onMotionStrike]);

  const stopTimer = () => {
    setIsRunning(false);
    stopMotionMonitoring();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerTiltWarning = () => {
    if (isWarningActiveRef.current) return;
    isWarningActiveRef.current = true;
    setIsWarningActive(true);
    setWarningSecondsLeft(5);
    // Play warning sound ONCE when the lift is first detected
    audioSynth.playWarning();

    warningTimerRef.current = setInterval(() => {
      setWarningSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(warningTimerRef.current!);
          warningTimerRef.current = null;
          setTimeout(() => handleStrikeLogged(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStrikeLogged = () => {
    stopWarningTimer();
    setStrikes(prev => {
      const nextStrikes = prev + 1;
      onStrikeLogged(nextStrikes);

      if (nextStrikes >= 3) {
        audioSynth.playInterrupted();
        stopMotionMonitoring();
        onSessionInterrupted(dialDuration * 60 - secondsLeftRef.current, nextStrikes);
        setIsActiveSession(false);
        setIsRunning(false);
        setCurrentStep('goal');
      } else {
        audioSynth.playInterrupted();
      }
      return nextStrikes;
    });
  };

  const stopWarningTimer = () => {
    isWarningActiveRef.current = false;
    setIsWarningActive(false);
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  };

  const recoverSession = () => {
    stopWarningTimer();
  };

  const cancelFocus = () => {
    if (window.confirm('Cancel active focus session? Your stats will not be recorded.')) {
      stopTimer();
      stopWarningTimer();
      setIsActiveSession(false);
      setCurrentStep('goal');
    }
  };

  // ==========================================
  // --- RAPID FIRE MCQ QUIZ (Bypassed) ---
  // ==========================================
  const finishSessionDirectly = () => {
    stopTimer();
    const duration = isOvertimeMode 
       ? dialDuration + Math.floor(secondsLeftRef.current / 60)
       : Math.floor((dialDuration * 60 - secondsLeftRef.current) / 60);
    // Don't reduce points for strikes anymore
    const earned = Math.max(0, duration * 10);
    onSessionComplete(duration, strikes, earned);
  };

  const triggerQuizState = () => {
    stopTimer();
    stopWarningTimer();

    // Try to get chapter-specific questions first; fall back to subject-level
    let chapterQs = getQuestionsByChapter(goalClass, goalSubject, goalTopic, 5);
    let isStillBuilding = false;
    if (chapterQs.length === 0) {
      // No chapter-specific questions — flag this and try subject fallback
      isStillBuilding = true;
      chapterQs = getQuestionsBySubject(goalClass, goalSubject, 5);
    }
    setQuizStillBuilding(isStillBuilding);

    const generatedQuestions: PyqQuestion[] = chapterQs.map((q, idx) => ({
      ...q,
      id: idx + 1,
    }));

    setDynamicQuestions(generatedQuestions);
    setCurrentStep('quiz');
    setQuizActive(true);
    setQuizTimeLeft(60);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    audioSynth.playSuccess();

    quizTimerRef.current = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(quizTimerRef.current!);
          quizTimerRef.current = null;
          setTimeout(() => stopQuizTimer(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuizTimer = () => {
    setQuizActive(false);
    if (quizTimerRef.current) {
      clearInterval(quizTimerRef.current);
      quizTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (currentStep === 'quiz' && quizTimeLeft === 0 && !quizFinished) {
      finishQuiz();
    }
  }, [quizTimeLeft, currentStep, quizFinished]);

  const selectAnswer = (questionId: number, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));

    if (optionIndex === dynamicQuestions[currentQuestionIndex].correctIndex) {
      audioSynth.playStart();
    } else {
      audioSynth.playWarning();
    }

    setTimeout(() => {
      // First check if we're on the last question using the current state
      if (currentQuestionIndex >= dynamicQuestions.length - 1) {
        // We just need to pass the updated answers to finishQuiz
        // Since we already queued the update, we can compute the new object here
        const newAnswers = { ...selectedAnswers, [questionId]: optionIndex };
        finishQuiz(newAnswers);
      } else {
        // Move to the next question
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1400);
  };

  const finishQuiz = (finalAnswers?: Record<number, number>) => {
    if (quizFinished) return;
    stopQuizTimer();
    setQuizFinished(true);

    const answersToUse = finalAnswers || selectedAnswers;

    let correct = 0;
    dynamicQuestions.forEach((q) => {
      if (answersToUse[q.id] === q.correctIndex) {
        correct += 1;
      }
    });

    setCorrectAnswersCount(correct);
    
    // Scoring Logic:
    // Base points for completing the timing = dialDuration * 10
    // Bonus points per correct answer = 5
    let baseFocusPoints = dialDuration * 10;
    let finalPoints = baseFocusPoints + (correct * 5);

    setEarnedPoints(finalPoints);
    onSessionComplete(dialDuration, strikes, finalPoints);
    setCurrentStep('summary');
  };

  const formatDigitalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const needleAngle = (dialDuration / 60) * 360;
  const needleX = 80 + 55 * Math.sin((needleAngle * Math.PI) / 180);
  const needleY = 80 - 55 * Math.cos((needleAngle * Math.PI) / 180);

  return (
    <div className="w-full flex flex-col justify-start relative text-stone-800">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SET GOALS */}
        {currentStep === 'goal' && (
          <motion.div
            key="step-goal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="text-center py-1">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase block font-bold mb-1">
                Step 1 of 6 • Goal
              </span>
              <h3 className="text-base font-display font-black text-stone-900 tracking-tight">Define Your Focus</h3>
            </div>

            <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4.5 space-y-4 shadow-sm">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Class / Grade</label>
                <select
                  value={goalClass}
                  onChange={(e) => setGoalClass(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400 transition-all cursor-pointer"
                >
                  {Object.keys(GRADE_SUBJECT_CHAPTERS).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Subject Area</label>
                <select
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400 transition-all cursor-pointer"
                >
                  {Object.keys(GRADE_SUBJECT_CHAPTERS[goalClass] || {}).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Chapter Topic</label>
                <select
                  value={goalTopic}
                  onChange={(e) => setGoalTopic(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all cursor-pointer font-sans"
                >
                  {(GRADE_SUBJECT_CHAPTERS[goalClass]?.[goalSubject] || []).map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Concrete Task</label>
                <input
                  type="text"
                  value={goalTask}
                  onChange={(e) => setGoalTask(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                  placeholder="e.g. Complete 10 derivations"
                />
              </div>


            </div>

            <button
              onClick={() => setCurrentStep('clock')}
              className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              Next: Setup Timer
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 3: BREATHING */}
        {currentStep === 'breathing' && (
          <motion.div
            key="step-breathing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4 flex flex-col items-center py-2"
          >
            <div className="text-center">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase block font-bold mb-1">
                Step 3 of 6 • Breathing Calibration
              </span>
              <h3 className="text-base font-display font-black text-stone-900 tracking-tight">Prepare Your Mind</h3>
            </div>

            <div className="w-full bg-[#FAF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`${breathingPhase}-${breathingCycle}`}
                    initial={{ scale: breathingPhase === 'inhale' ? 1.0 : (breathingPhase === 'hold1' ? 1.3 : (breathingPhase === 'exhale' ? 1.3 : 1.0)) }}
                    animate={{ scale: breathingPhase === 'inhale' ? 1.3 : (breathingPhase === 'hold1' ? 1.3 : (breathingPhase === 'exhale' ? 1.0 : 1.0)) }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                    className={`w-28 h-28 rounded-full border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      breathingPhase === 'inhale'
                        ? 'bg-stone-100 border-stone-300 text-stone-800 shadow-sm'
                        : breathingPhase === 'hold1'
                        ? 'bg-stone-300 border-stone-400 text-stone-900 shadow-md'
                        : breathingPhase === 'exhale'
                        ? 'bg-stone-900 border-stone-800 text-white shadow-sm'
                        : 'bg-stone-300 border-stone-400 text-stone-900 shadow-md'
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase tracking-widest font-black">
                      {breathingPhase === 'inhale' ? 'Inhale 💨' : breathingPhase === 'exhale' ? 'Exhale 😮‍💨' : 'Hold ✋'}
                    </span>
                    <span className="text-3xl font-mono font-bold">
                      {breathingTimer}s
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step indicator dots */}
              <div className="flex gap-2">
                {[1, 2, 3].map((cycle) => (
                  <div
                    key={cycle}
                    className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                      cycle < breathingCycle
                        ? 'bg-stone-950 border-stone-950'
                        : cycle === breathingCycle
                        ? 'bg-stone-400 border-stone-500 animate-pulse'
                        : 'bg-stone-100 border-stone-200'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center max-w-xs space-y-1">
                <div className="text-[10px] font-mono text-stone-500 uppercase font-black tracking-widest">
                  CYCLE {breathingCycle} OF 3
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Inhale for 4 seconds, hold for 4, exhale for 4, and hold for 4 to clear cognitive fatigue before focus begins.
                </p>
              </div>
            </div>

            {breathingActive && (
              <button
                onClick={skipBreathing}
                className="px-6 py-2.5 bg-white hover:bg-stone-50 text-stone-500 rounded-xl text-xs font-mono uppercase border border-stone-200 tracking-wider cursor-pointer shadow-2xs"
              >
                Skip Exercise
              </button>
            )}
          </motion.div>
        )}

        {/* STEP 2: CLOCK SETTINGS */}
        {currentStep === 'clock' && (
          <motion.div
            key="step-clock"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 flex flex-col items-center py-1"
          >
            <div className="text-center">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase block font-bold mb-1">
                Step 2 of 6 • Duration Dial
              </span>
              <h3 className="text-base font-display font-black text-stone-900 tracking-tight">Set Focus Block Length</h3>
            </div>

            <div className="w-full bg-[#FAF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4 shadow-sm">
              {/* COMPACT DRAGGABLE DIAL */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg
                  ref={dialRef}
                  onPointerDown={handleDialPointerDown}
                  onPointerMove={handleDialPointerMove}
                  onPointerUp={handleDialPointerUp}
                  onPointerLeave={handleDialPointerUp}
                  className="w-40 h-40 select-none cursor-crosshair transform overflow-visible touch-none"
                >
                  <circle cx="80" cy="80" r="75" className="stroke-stone-200 fill-white" strokeWidth="2" />
                  <circle cx="80" cy="80" r="68" className="stroke-stone-100 fill-none" strokeWidth="1" strokeDasharray="3, 3" />

                  {/* Tick Marks */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x1 = 80 + 66 * Math.sin(angle);
                    const y1 = 80 - 66 * Math.cos(angle);
                    const x2 = 80 + 74 * Math.sin(angle);
                    const y2 = 80 - 74 * Math.cos(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className="stroke-stone-300"
                        strokeWidth="2"
                      />
                    );
                  })}

                  <text x="80" y="24" textAnchor="middle" className="fill-stone-400 font-mono text-[8px] font-bold">60m</text>
                  <text x="138" y="83" textAnchor="middle" className="fill-stone-400 font-mono text-[8px] font-bold">15m</text>
                  <text x="80" y="143" textAnchor="middle" className="fill-stone-400 font-mono text-[8px] font-bold">30m</text>
                  <text x="22" y="83" textAnchor="middle" className="fill-stone-400 font-mono text-[8px] font-bold">45m</text>

                  {/* Needle */}
                  <line
                    x1="80"
                    y1="80"
                    x2={needleX}
                    y2={needleY}
                    className="stroke-stone-900"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Handle */}
                  <circle
                    cx={needleX}
                    cy={needleY}
                    r="6.5"
                    className="fill-stone-900 stroke-white"
                    strokeWidth="1.5"
                  />

                  {/* Center pin */}
                  <circle cx="80" cy="80" r="4" className="fill-stone-400 stroke-white" strokeWidth="1" />
                </svg>

                {/* Center duration read-out */}
                <div className="absolute pointer-events-none flex flex-col items-center">
                  <span className="text-2xl font-mono font-black text-stone-900">
                    {dialDuration}
                  </span>
                  <span className="text-[7px] font-mono text-stone-400 uppercase tracking-widest font-black">
                    MINUTES
                  </span>
                </div>
              </div>

              {/* Quick Preset Selects */}
              <div className="flex gap-2 justify-center">
                {[15, 25, 45, 60].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDialDuration(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      dialDuration === preset
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentStep('breathing');
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              Next: Mindful Breathing
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 4: COUNTDOWN */}
        {currentStep === 'countdown' && (
          <motion.div
            key="step-countdown"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4 flex flex-col items-center py-1"
          >
            <div className="text-center">
              <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase block font-bold mb-1">
                Step 4 of 6 • Active Focus Timer
              </span>
              <h3 className="text-sm font-semibold text-stone-800 font-mono uppercase tracking-widest">{goalSubject}</h3>
            </div>

            <div className="w-full bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3.5 shadow-sm">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Dial circle progress */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="65" className="stroke-stone-100 fill-none" strokeWidth="4.5" />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="65"
                    className={`fill-none transition-all duration-300 ${
                      isWarningActive ? 'stroke-red-500' : 'stroke-stone-900'
                    }`}
                    strokeWidth="4.5"
                    strokeDasharray={2 * Math.PI * 65}
                    strokeDashoffset={isOvertimeMode ? 0 : 2 * Math.PI * 65 * (1 - (secondsLeft / (dialDuration * 60)))}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="text-center z-10 flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {isWarningActive ? (
                      <motion.div
                        key="warning-tilt"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-red-600 flex flex-col items-center"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-500 mb-0.5 animate-bounce" />
                        <span className="text-[7px] font-mono uppercase font-black tracking-widest text-center leading-tight">Streak at risk</span>
                        <span className="text-[6px] font-mono text-red-400 tracking-wide text-center">stay with it</span>
                        <span className="text-xl font-mono font-bold">{warningSecondsLeft}s</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="timer-num"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-2xl font-mono font-bold tracking-tight text-stone-900">
                          {formatDigitalTime(secondsLeft)}
                        </span>
                        <span className="text-[7px] text-stone-400 font-mono uppercase tracking-widest mt-1 font-bold">
                          {isOvertimeMode ? 'OVERTIME' : isRunning ? 'DEEP FOCUS' : 'PAUSED'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Strikes indicator */}
                  <div className="flex gap-1.5 mt-2 justify-center">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`w-1.5 h-1.5 rounded-full border transition-all duration-300 ${
                          s <= strikes
                            ? 'bg-red-500 border-red-500'
                            : 'bg-stone-100 border-stone-200'
                        }`}
                        title={`Strike ${s}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Actions panel */}
            <div className="flex flex-col gap-2.5 w-full">
              {showOvertimePrompt ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setShowOvertimePrompt(false); setIsOvertimeMode(true); setIsRunning(true); }}
                    className="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-800 shadow-sm"
                  >
                    Continue for Overtime
                  </button>
                  <button
                    onClick={() => finishSessionDirectly()}
                    className="w-full bg-white border border-stone-200 text-stone-700 hover:text-stone-900 font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center cursor-pointer"
                  >
                    Finish Session
                  </button>
                </div>
              ) : isWarningActive ? (
                <button
                  onClick={recoverSession}
                  className="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-800 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Put Device Flat (Simulate)
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-2xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {isRunning ? <Coffee className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isRunning ? 'Break' : 'Resume'}
                  </button>
                  {/* The manual finish button is removed to enforce NFC tap */}
                  <div className="flex-1 text-center text-xs font-mono text-stone-500 uppercase tracking-widest py-2.5">
                    Tap NFC Tag to End Session
                  </div>
                  <button
                    onClick={cancelFocus}
                    className="px-4.5 bg-white border border-stone-200 text-stone-400 hover:text-red-500 hover:border-stone-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Cancel"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 5: PYQ RAPID FIRE MCQ QUIZ */}
        {currentStep === 'quiz' && (
          <motion.div
            key="step-quiz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center bg-[#FAF9F5] border border-stone-200 p-2.5 rounded-xl shadow-3xs">
              <div className="text-left">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold block">
                  {quizStillBuilding ? `${goalSubject} • General` : `${goalSubject} • ${goalTopic}`}
                </span>
                <div className="text-xs font-bold text-stone-900 uppercase">Rapid-Fire PYQ</div>
                {quizStillBuilding && (
                  <span className="text-[8px] font-mono text-amber-600 font-bold block mt-0.5">
                    ⚡ Building {goalTopic} — mixed Qs for now
                  </span>
                )}
              </div>
              <div className="bg-white border border-stone-200 px-3 py-1 rounded-lg text-center">
                <span className="text-[7px] font-mono text-stone-400 uppercase font-black block">Time left</span>
                <span className={`text-xs font-mono font-bold ${quizTimeLeft <= 10 ? 'text-red-600' : 'text-stone-800'}`}>{quizTimeLeft}s</span>
              </div>
            </div>

            {/* Micro progress line */}
            <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(quizTimeLeft / 60) * 100}%` }}
                className="h-full bg-stone-900"
              />
            </div>

            {/* Active Question Panel (highly compact, strictly NO scrolling) */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-3.5 rounded-xl space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-stone-200/60 pb-1.5">
                <span className="text-[8px] font-mono text-stone-500 uppercase tracking-widest font-bold">
                  Q {currentQuestionIndex + 1} of {dynamicQuestions.length}
                </span>
                <span className="text-[8px] font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-400 uppercase tracking-wider">
                  {dynamicQuestions[currentQuestionIndex]?.difficulty}
                </span>
              </div>

              <div className="text-[8px] font-mono text-stone-400 uppercase font-bold">
                {dynamicQuestions[currentQuestionIndex]?.subject}
              </div>

              <p className="text-[11px] text-stone-800 font-bold leading-relaxed">
                {dynamicQuestions[currentQuestionIndex]?.question}
              </p>

              {/* Options */}
              <div className="space-y-1.5">
                {dynamicQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                  const currentQId = dynamicQuestions[currentQuestionIndex].id;
                  const isAnswered = selectedAnswers[currentQId] !== undefined;
                  const chosenIdx = selectedAnswers[currentQId];
                  const correctIdx = dynamicQuestions[currentQuestionIndex].correctIndex;

                  let optionStyle = 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50';
                  if (isAnswered) {
                    if (idx === correctIdx) {
                      optionStyle = 'bg-stone-900 border-stone-900 text-white';
                    } else if (idx === chosenIdx) {
                      optionStyle = 'bg-red-50 border-red-200 text-red-700';
                    } else {
                      optionStyle = 'bg-white border-stone-100 text-stone-300';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(currentQId, idx)}
                      disabled={isAnswered}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] text-left leading-normal transition-all font-sans font-medium ${optionStyle} ${!isAnswered ? 'cursor-pointer' : ''}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Micro Explanation feedback */}
              {dynamicQuestions[currentQuestionIndex] && selectedAnswers[dynamicQuestions[currentQuestionIndex].id] !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-stone-200 p-2 rounded-lg text-left text-[9px] leading-relaxed text-stone-500 font-sans"
                >
                  <span className="font-bold uppercase text-stone-800 block text-[8px] mb-0.5">
                    {selectedAnswers[dynamicQuestions[currentQuestionIndex].id] === dynamicQuestions[currentQuestionIndex].correctIndex
                      ? '✓ Explanation'
                      : '✗ Explanation'}
                  </span>
                  {dynamicQuestions[currentQuestionIndex].explanation}
                </motion.div>
              )}
            </div>

            <button
              onClick={finishQuiz}
              className="w-full py-2 border border-stone-200 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-all cursor-pointer"
            >
              Skip & Finish Quiz
            </button>
          </motion.div>
        )}

        {/* STEP 6: SUMMARY RESULTS */}
        {currentStep === 'summary' && (
          <motion.div
            key="step-summary"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4 text-center py-2"
          >
            <div className="inline-flex p-3 rounded-full bg-stone-100 border border-stone-200 mb-1">
              <Trophy className="w-6 h-6 text-stone-800" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-display font-black text-stone-900 tracking-tight">Session Cleared!</h3>
              <p className="text-[9px] font-mono text-stone-400 tracking-widest uppercase">Score Recorded to Profile</p>
            </div>

            <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-left">
                  <span className="text-[7px] font-mono text-stone-400 uppercase tracking-widest block">Duration</span>
                  <span className="text-sm font-mono font-bold text-stone-900">{dialDuration}m focus</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-left">
                  <span className="text-[7px] font-mono text-stone-400 uppercase tracking-widest block">Warnings</span>
                  <span className="text-sm font-mono font-bold text-stone-900">{strikes} strikes</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200/60 text-left space-y-1">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Quiz Performance</span>
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-stone-500">Topic:</span>
                  <span className="font-mono font-bold text-stone-800 text-[10px]">{goalTopic}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-sans border-t border-stone-100 pt-1">
                  <span className="text-stone-500">Correct PYQs:</span>
                  <span className="font-mono font-bold text-stone-800">{correctAnswersCount} / {dynamicQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-sans border-t border-stone-100 pt-1">
                  <span className="text-stone-500">Accuracy:</span>
                  <span className={`font-mono font-bold ${
                    dynamicQuestions.length > 0 && correctAnswersCount / dynamicQuestions.length >= 0.6
                      ? 'text-stone-800'
                      : 'text-red-600'
                  }`}>
                    {dynamicQuestions.length > 0
                      ? Math.round((correctAnswersCount / dynamicQuestions.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-sans border-t border-stone-100 pt-1">
                  <span className="text-stone-500">Base Points:</span>
                  <span className="font-mono font-bold text-stone-800">{dialDuration * 10}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-sans border-t border-stone-100 pt-1">
                  <span className="text-stone-500">Quiz Bonus:</span>
                  <span className="font-mono font-bold text-stone-800">+{correctAnswersCount * 5}</span>
                </div>
              </div>

              {/* Weak-topic callout — shown when ≤ 2/5 correct */}
              {dynamicQuestions.length > 0 && correctAnswersCount <= 2 && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-left">
                  <span className="text-[8px] font-mono text-amber-700 uppercase tracking-widest block font-bold mb-0.5">📚 Revise this topic</span>
                  <p className="text-[10px] text-amber-800 leading-relaxed font-sans">
                    You got {correctAnswersCount}/{dynamicQuestions.length} on <strong>{goalTopic}</strong>. Review your notes before the next session.
                  </p>
                </div>
              )}

              <div className="bg-stone-100 p-2.5 rounded-xl text-center border border-stone-200/60">
                <span className="text-[7px] font-mono text-stone-500 uppercase tracking-widest block font-bold">Total Points Earned</span>
                <span className="text-xl font-mono font-black text-stone-900">+{earnedPoints} PTS</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsActiveSession(false);
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              Finish Session & Close
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
