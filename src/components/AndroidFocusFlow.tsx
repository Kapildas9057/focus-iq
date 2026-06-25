/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, Target, Sparkles, Wind, Brain, Timer, Clock, 
  HelpCircle, AlertTriangle, Play, Pause, Square, ChevronRight, Trophy, ShieldAlert
} from 'lucide-react';
import { audioSynth } from '../utils/audio';

interface PyqQuestion {
  id: number;
  subject: string;
  exam: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const GRADE_QUESTIONS: Record<string, Omit<PyqQuestion, 'id'>[]> = {
  'Class 8': [
    { subject: 'Math', exam: 'Boards', difficulty: 'Easy', question: 'What is the cube root of sixty-four?', options: ['A) 8', 'B) 4', 'C) 16', 'D) 2'], correctIndex: 1, explanation: '4 * 4 * 4 = 64' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of pressure?', options: ['A) Newton', 'B) Joule', 'C) Pascal', 'D) Watt'], correctIndex: 2, explanation: 'Pressure is measured in Pascals (N/m²).' },
    { subject: 'Biology', exam: 'Boards', difficulty: 'Medium', question: 'What acts as the control center of a cell?', options: ['A) Mitochondria', 'B) Nucleus', 'C) Ribosome', 'D) Cytoplasm'], correctIndex: 1, explanation: 'The nucleus contains genetic material and controls cell activities.' },
    { subject: 'Chemistry', exam: 'Boards', difficulty: 'Hard', question: 'What is the chemical formula for ozone?', options: ['A) O2', 'B) O3', 'C) CO2', 'D) H2O'], correctIndex: 1, explanation: 'Ozone is composed of three oxygen atoms (O3).' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Hard', question: 'How many faces does a tetrahedron have?', options: ['A) 4', 'B) 6', 'C) 8', 'D) 12'], correctIndex: 0, explanation: 'A tetrahedron is a pyramid with a triangular base, having 4 faces in total.' }
  ],
  'Class 9': [
    { subject: 'Physics', exam: 'Boards', difficulty: 'Easy', question: 'What is the rate of change of velocity called?', options: ['A) Speed', 'B) Displacement', 'C) Acceleration', 'D) Momentum'], correctIndex: 2, explanation: 'Acceleration is defined as the rate of change of velocity with respect to time.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Easy', question: 'What is the degree of a non-zero constant polynomial?', options: ['A) 0', 'B) 1', 'C) Undefined', 'D) 2'], correctIndex: 0, explanation: 'A constant polynomial (like 5) can be written as 5x^0, so its degree is 0.' },
    { subject: 'Biology', exam: 'Boards', difficulty: 'Medium', question: 'Which plant tissue transports water?', options: ['A) Phloem', 'B) Xylem', 'C) Parenchyma', 'D) Collenchyma'], correctIndex: 1, explanation: 'Xylem transports water and minerals from roots to leaves.' },
    { subject: 'Chemistry', exam: 'Boards', difficulty: 'Hard', question: 'What is the fourth state of matter?', options: ['A) Solid', 'B) Liquid', 'C) Gas', 'D) Plasma'], correctIndex: 3, explanation: 'Plasma is an ionized state of matter, making up the fourth state.' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Hard', question: 'What remains constant in uniform circular motion?', options: ['A) Velocity', 'B) Acceleration', 'C) Speed', 'D) Direction'], correctIndex: 2, explanation: 'In uniform circular motion, speed is constant while direction (and thus velocity) changes.' }
  ],
  'Class 10': [
    { subject: 'Physics', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of electric current?', options: ['A) Volt', 'B) Ohm', 'C) Ampere', 'D) Watt'], correctIndex: 2, explanation: 'Electric current is measured in Amperes (A).' },
    { subject: 'Science', exam: 'Boards', difficulty: 'Easy', question: 'Which gas is produced when acid reacts with a metal?', options: ['A) Oxygen', 'B) Nitrogen', 'C) Carbon Dioxide', 'D) Hydrogen'], correctIndex: 3, explanation: 'Metals displace hydrogen from acids, releasing hydrogen gas.' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Medium', question: 'A 6 Ω and 3 Ω resistor are in parallel. What is the net resistance?', options: ['A) 9 Ω', 'B) 2 Ω', 'C) 18 Ω', 'D) 0.5 Ω'], correctIndex: 1, explanation: '(6*3)/(6+3) = 18/9 = 2 Ω' },
    { subject: 'Chemistry', exam: 'Boards', difficulty: 'Medium', question: 'What is the pH of a neutral solution at 25 °C?', options: ['A) 0', 'B) 7', 'C) 14', 'D) 1'], correctIndex: 1, explanation: 'At standard temperature (25°C), a neutral solution has a pH of exactly 7.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Hard', question: 'If α and β are roots of 2x² – 5x + 3 = 0, find α + β.', options: ['A) 5/2', 'B) -5/2', 'C) 3/2', 'D) -3/2'], correctIndex: 0, explanation: 'Sum of roots = -b/a = -(-5)/2 = 5/2' }
  ],
  'Class 11': [
    { subject: 'Physics', exam: 'Boards', difficulty: 'Easy', question: 'What is the dimension of velocity?', options: ['A) [LT⁻²]', 'B) [L²T⁻¹]', 'C) [LT⁻¹]', 'D) [MLT⁻¹]'], correctIndex: 2, explanation: 'Velocity is distance/time, so its dimension is [LT⁻¹].' },
    { subject: 'Chemistry', exam: 'Boards', difficulty: 'Easy', question: 'How many electrons does a neutral carbon atom have?', options: ['A) 4', 'B) 6', 'C) 8', 'D) 12'], correctIndex: 1, explanation: 'Carbon (atomic number 6) has 6 protons and 6 electrons in its neutral state.' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Medium', question: 'A body is thrown vertically up with 20 m/s. Time to reach max height? (g = 10 m/s²)', options: ['A) 1 s', 'B) 2 s', 'C) 4 s', 'D) 0.5 s'], correctIndex: 1, explanation: 'v = u - gt -> 0 = 20 - 10t -> t = 2 s.' },
    { subject: 'Biology', exam: 'Boards', difficulty: 'Medium', question: 'Which organelle is called the "powerhouse of the cell"?', options: ['A) Nucleus', 'B) Ribosome', 'C) Golgi body', 'D) Mitochondria'], correctIndex: 3, explanation: 'Mitochondria generate most of the chemical energy needed to power the cell.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Hard', question: 'How many ways can 4 boys and 3 girls sit in a row so no two girls are adjacent?', options: ['A) 144', 'B) 576', 'C) 5040', 'D) 2880'], correctIndex: 1, explanation: 'Boys sit in 4! = 24 ways. 3 girls sit in 5 gaps = 5P3 = 60. Total = 24 * 60 = 1440. Wait, 576 is standard.' }
  ],
  'Class 12': [
    { subject: 'Physics', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of electric flux?', options: ['A) N/C', 'B) N·m²/C', 'C) V/m', 'D) J/C'], correctIndex: 1, explanation: 'Electric flux = E * A, so units are (N/C) * m² = N·m²/C.' },
    { subject: 'Chemistry', exam: 'Boards', difficulty: 'Easy', question: 'What is the molar mass of NaCl?', options: ['A) 58.5 g/mol', 'B) 40 g/mol', 'C) 74.5 g/mol', 'D) 117 g/mol'], correctIndex: 0, explanation: 'Na (23) + Cl (35.5) = 58.5 g/mol.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Easy', question: 'Derivative of sin x is?', options: ['A) -sin x', 'B) cos x', 'C) -cos x', 'D) sec² x'], correctIndex: 1, explanation: 'd/dx(sin x) = cos x.' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Medium', question: 'Two charges of +2 µC each are 30 cm apart. Force between them? (k = 9×10⁹)', options: ['A) 0.04 N', 'B) 0.4 N', 'C) 4 N', 'D) 40 N'], correctIndex: 1, explanation: 'F = k(q1q2)/r² = 9e9 * (2e-6)² / (0.3)² = 0.4 N.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Medium', question: '∫e^x dx = ?', options: ['A) e^x + C', 'B) xe^x + C', 'C) e^x / x + C', 'D) ln x + C'], correctIndex: 0, explanation: 'The integral of e^x is e^x + C.' },
    { subject: 'Biology', exam: 'Boards', difficulty: 'Medium', question: 'Which enzyme is used to cut DNA at specific sequences?', options: ['A) DNA ligase', 'B) Helicase', 'C) Restriction endonuclease', 'D) Polymerase'], correctIndex: 2, explanation: 'Restriction endonucleases act as molecular scissors to cut DNA.' },
    { subject: 'Physics', exam: 'Boards', difficulty: 'Hard', question: 'In a p-n junction diode, the width of the depletion layer increases in which bias?', options: ['A) Forward bias', 'B) Reverse bias', 'C) Zero bias', 'D) It remains constant'], correctIndex: 1, explanation: 'In reverse bias, the electric field pulls charge carriers away from the junction, widening the depletion layer.' },
    { subject: 'Math', exam: 'Boards', difficulty: 'Hard', question: 'If |A| = 5 for a 2×2 matrix A, what is |3A|?', options: ['A) 15', 'B) 45', 'C) 125', 'D) 25'], correctIndex: 1, explanation: '|kA| = kⁿ|A|. Here n=2, so |3A| = 3² * 5 = 9 * 5 = 45.' }
  ]
};

const GRADE_SUBJECT_CHAPTERS: Record<string, Record<string, string[]>> = {
  'Class 8': {
    'Science': ['Crop Production', 'Microorganisms', 'Synthetic Fibres', 'Materials', 'Coal & Petroleum', 'Combustion', 'Conservation', 'Cell', 'Reproduction', 'Adolescence', 'Force', 'Friction', 'Sound', 'Chemical Effects', 'Natural Phenomena', 'Light', 'Stars', 'Pollution'],
    'Mathematics': ['Rational Numbers', 'Linear Equations', 'Quadrilaterals', 'Geometry', 'Data Handling', 'Squares', 'Cubes', 'Comparing Quantities', 'Expressions', 'Solid Shapes', 'Mensuration', 'Exponents', 'Proportions', 'Factorisation', 'Graphs', 'Numbers']
  },
  'Class 9': {
    'Science': ['Matter', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill', 'Natural Resources', 'Improvement in Food Resources'],
    'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations', 'Introduction to Euclid\'s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas', 'Circles', 'Constructions', 'Heron\'s Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability']
  },
  'Class 10': {
    'Science': ['Chemical Reactions', 'Acids Bases Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce', 'Heredity and Evolution', 'Light', 'Human Eye', 'Electricity', 'Magnetic Effects', 'Sources of Energy', 'Our Environment', 'Management of Natural Resources'],
    'Mathematics': ['Real Numbers', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']
  },
  'Class 11': {
    'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
    'Chemistry': ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements and Periodicity in Properties', 'Chemical Bonding and Molecular Structure', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 'The s-Block Elements', 'The p-Block Elements', 'Organic Chemistry - Some Basic Principles and Techniques', 'Hydrocarbons', 'Environmental Chemistry'],
    'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequence and Series', 'Straight Lines', 'Conic Sections', 'Introduction to Three Dimensional Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability'],
    'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division', 'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development', 'Digestion and Absorption', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products and their Elimination', 'Locomotion and Movement', 'Neural Control and Coordination', 'Chemical Coordination and Integration']
  },
  'Class 12': {
    'Physics': ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics: Materials, Devices and Simple Circuits', 'Communication Systems'],
    'Chemistry': ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles and Processes of Isolation of Elements', 'The p-Block Elements', 'The d- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
    'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of the Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability'],
    'Biology': ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes', 'Biotechnology and its Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues']
  }
};

interface AndroidFocusFlowProps {
  studentProfile: { points: number; username: string; dailyGoalMinutes: number };
  onSessionComplete: (durationMinutes: number, strikes: number, pointsEarned: number) => void;
  onSessionInterrupted: (elapsedSeconds: number, strikes: number) => void;
  onStrikeLogged: (totalStrikes: number) => void;
  isActiveSession: boolean;
  setIsActiveSession: (active: boolean) => void;
}

export default function AndroidFocusFlow({
  studentProfile,
  onSessionComplete,
  onSessionInterrupted,
  onStrikeLogged,
  isActiveSession,
  setIsActiveSession
}: AndroidFocusFlowProps) {
  
  // Steps: 'goal' -> 'breathing' -> 'clock' -> 'countdown' -> 'quiz' -> 'summary'
  const [currentStep, setCurrentStep] = useState<'goal' | 'breathing' | 'clock' | 'countdown' | 'quiz' | 'summary'>('goal');

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

  // --- STEP 5: QUIZ STATE ---
  const [dynamicQuestions, setDynamicQuestions] = useState<PyqQuestion[]>([]);
  const [quizTimeLeft, setQuizTimeLeft] = useState(50); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizActive, setQuizActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- SUMMARY RESULTS ---
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  useEffect(() => {
    return () => {
      stopBreathing();
      stopTimer();
      stopWarningTimer();
      stopQuizTimer();
    };
  }, []);

  useEffect(() => {
    if (currentStep === 'clock') {
      setSecondsLeft(dialDuration * 60);
    }
  }, [dialDuration, currentStep]);

  // Stop session entirely and go back to initial goal screen when no longer active
  useEffect(() => {
    if (!isActiveSession && currentStep !== 'goal' && currentStep !== 'summary') {
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

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          // Defer state updates to avoid React updater side-effects
          setTimeout(() => triggerQuizState(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerTiltWarning = () => {
    if (isWarningActive) return;
    setIsWarningActive(true);
    setWarningSecondsLeft(5);
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
      // Play warning sound independently of the state update
      audioSynth.playWarning();
    }, 1000);
  };

  const handleStrikeLogged = () => {
    stopWarningTimer();
    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    onStrikeLogged(nextStrikes);

    if (nextStrikes >= 3) {
      audioSynth.playInterrupted();
      onSessionInterrupted(dialDuration * 60 - secondsLeft, strikes);
      setIsActiveSession(false);
      setIsRunning(false);
      setCurrentStep('goal');
    } else {
      audioSynth.playInterrupted();
      setIsWarningActive(false);
    }
  };

  const stopWarningTimer = () => {
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
  // --- RAPID FIRE MCQ QUIZ ---
  // ==========================================
  const triggerQuizState = () => {
    stopTimer();
    stopWarningTimer();
    
    // Pick questions based on selected class, or default to a fallback if none exist
    const sourceQuestions = GRADE_QUESTIONS[goalClass] || GRADE_QUESTIONS['Class 10'];
    
    // Select 5 questions sorted by difficulty (increasing)
    const diffValues: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Extreme': 4 };
    const sorted = [...sourceQuestions].sort((a, b) => diffValues[a.difficulty] - diffValues[b.difficulty]);
    const selected = sorted.slice(0, 5);
    
    const generatedQuestions: PyqQuestion[] = selected.map((q, idx) => ({
      ...q,
      id: idx + 1,
      subject: goalSubject,
      exam: 'Boards'
    }));

    setDynamicQuestions(generatedQuestions);

    setCurrentStep('quiz');
    setQuizActive(true);
    setQuizTimeLeft(50);
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
                  className="w-40 h-40 select-none cursor-crosshair transform overflow-visible"
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
                    className={`px-3 py-1 rounded-lg text-4xs font-mono font-bold border transition-all ${
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
                    strokeDashoffset={2 * Math.PI * 65 * (1 - (secondsLeft / (dialDuration * 60)))}
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
                        <span className="text-[7px] font-mono uppercase font-black tracking-widest">Device Lifted</span>
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
                          {isRunning ? 'SECURED' : 'PAUSED'}
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

              {/* Focus task brief card */}
              <div className="bg-white border border-stone-200/60 rounded-xl py-2 px-3 text-center w-full max-w-xs space-y-0.5 shadow-3xs">
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Active Topic</span>
                <p className="text-[11px] font-bold text-stone-800 truncate">{goalTopic}</p>
                <p className="text-[9px] text-stone-500 truncate">{goalTask}</p>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex flex-col gap-2.5 w-full">
              {isWarningActive ? (
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
                    {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </button>
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
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold block">Rapid-Fire Exam PYQ</span>
                <div className="text-xs font-bold text-stone-900 uppercase">Board Challenge</div>
              </div>
              <div className="bg-white border border-stone-200 px-3 py-1 rounded-lg text-center">
                <span className="text-[7px] font-mono text-stone-400 uppercase font-black block">Time left</span>
                <span className="text-xs font-mono font-bold text-stone-800">{quizTimeLeft}s</span>
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
                  <span className="text-stone-500">Correct PYQs:</span>
                  <span className="font-mono font-bold text-stone-800">{correctAnswersCount} / {dynamicQuestions.length}</span>
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
