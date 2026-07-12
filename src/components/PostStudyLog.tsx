import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Send, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { GRADE_SUBJECT_CHAPTERS, GRADE_QUESTIONS, PyqQuestion } from '../utils/questions';

interface PostStudyLogProps {
  studentProfile: { grade?: string; board?: string; username: string; points: number };
  onLogComplete: (subject: string, notes: string, earnedQuizPoints?: number) => void;
  pendingPoints: number;
}

export default function PostStudyLog({ studentProfile, onLogComplete, pendingPoints }: PostStudyLogProps) {
  const [step, setStep] = useState<'logging' | 'quiz' | 'summary'>('logging');
  
  const grade = studentProfile.grade || 'Class 10';
  const board = studentProfile.board || 'CBSE';
  
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');
  
  const [quizQuestions, setQuizQuestions] = useState<PyqQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [quizPoints, setQuizPoints] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Initialize subject dropdown
  const availableSubjects = Object.keys(GRADE_SUBJECT_CHAPTERS[grade] || {});
  
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [grade]);

  useEffect(() => {
    const availableChapters = (GRADE_SUBJECT_CHAPTERS[grade]?.[subject] || []);
    if (availableChapters.length > 0) {
      setChapter(availableChapters[0]);
    } else {
      setChapter('');
    }
  }, [subject, grade]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find questions for this grade and subject
    const allQuestions = GRADE_QUESTIONS[grade] || [];
    const subjectQuestions = allQuestions.filter(q => q.subject === subject);
    
    if (subjectQuestions.length > 0) {
      // Shuffle and pick up to 5
      const shuffled = [...subjectQuestions].sort(() => 0.5 - Math.random());
      setQuizQuestions(shuffled.slice(0, 5));
      setStep('quiz');
    } else {
      // No questions found, skip quiz
      onLogComplete(`${subject} - ${chapter}`, notes, 0);
    }
  };

  const handleAnswerSubmit = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(index);
    setIsAnswerRevealed(true);
    
    const isCorrect = index === quizQuestions[currentQIndex].correctIndex;
    if (isCorrect) {
      setQuizPoints(prev => prev + 10);
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQIndex < quizQuestions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);
      } else {
        setStep('summary');
      }
    }, 2000);
  };

  const handleFinishLog = () => {
    onLogComplete(`${subject} - ${chapter}`, notes, quizPoints);
  };

  return (
    <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl p-5 space-y-6 shadow-2xs max-w-md w-full mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: LOGGING */}
        {step === 'logging' && (
          <motion.div
            key="step-logging"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200">
                <BookOpen className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Session Complete!</h2>
              <p className="text-xs font-mono text-stone-500 uppercase tracking-widest font-bold">
                {board} • {grade}
              </p>
            </div>

            <form onSubmit={handleStartQuiz} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Chapter Topic</label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                >
                  {(GRADE_SUBJECT_CHAPTERS[grade]?.[subject] || []).map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                  <option value="Other">Other / General</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Study Notes (Optional)</label>
                <textarea
                  placeholder="What did you learn today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-stone-400 transition-all min-h-[60px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!subject}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-stone-900 text-white text-xs font-mono font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-stone-800 transition-all disabled:opacity-40 mt-2"
              >
                Log & Take Quiz
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2: QUIZ */}
        {step === 'quiz' && (
          <motion.div
            key="step-quiz"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-5"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest font-bold">
                Question {currentQIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                {quizPoints} Pts
              </span>
            </div>

            <div className="text-left space-y-4">
              <h3 className="text-sm font-bold text-stone-800">
                {quizQuestions[currentQIndex]?.question}
              </h3>
              
              <div className="space-y-2">
                {quizQuestions[currentQIndex]?.options.map((opt, i) => {
                  const isCorrect = i === quizQuestions[currentQIndex].correctIndex;
                  const isSelected = selectedAnswer === i;
                  
                  let btnClass = "bg-white border-stone-200 text-stone-700 hover:border-stone-400";
                  if (isAnswerRevealed) {
                    if (isCorrect) btnClass = "bg-green-50 border-green-500 text-green-800 font-bold shadow-sm";
                    else if (isSelected) btnClass = "bg-red-50 border-red-500 text-red-800 font-bold";
                    else btnClass = "bg-stone-50 border-stone-200 text-stone-400 opacity-50";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswerSubmit(i)}
                      disabled={isAnswerRevealed}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswerRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] mt-4"
                >
                  <span className="font-bold">Explanation:</span> {quizQuestions[currentQIndex].explanation}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 'summary' && (
          <motion.div
            key="step-summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-6"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto border border-purple-200">
              <BrainCircuit className="w-8 h-8 text-purple-700" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Quiz Complete!</h2>
              <p className="text-xs text-stone-500 font-mono mt-2">
                You earned <span className="font-bold text-stone-800">{quizPoints}</span> bonus points.
              </p>
            </div>

            <button
              onClick={handleFinishLog}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-stone-900 text-white text-xs font-mono font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-stone-800 transition-all"
            >
              Claim Total: {pendingPoints + quizPoints} Pts
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
