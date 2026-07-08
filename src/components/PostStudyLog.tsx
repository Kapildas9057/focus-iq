import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Send, Sparkles } from 'lucide-react';

interface PostStudyLogProps {
  onLogComplete: (subject: string, notes: string) => void;
  pendingPoints: number;
}

const PREDEFINED_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Coding', 'Literature'];

export default function PostStudyLog({ onLogComplete, pendingPoints }: PostStudyLogProps) {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [questions, setQuestions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'Other' ? customSubject : subject;
    if (!finalSubject.trim()) return;
    onLogComplete(finalSubject, questions);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FAF9F5] border border-stone-200 rounded-3xl p-5 space-y-6 shadow-2xs max-w-md w-full mx-auto"
    >
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200">
          <BookOpen className="w-6 h-6 text-green-700" />
        </div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Session Complete!</h2>
        <p className="text-xs font-mono text-stone-500 uppercase tracking-widest font-bold">
          Claim {pendingPoints} Points
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
            What did you study?
          </label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                  subject === s 
                    ? 'bg-stone-900 text-white border-stone-900' 
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubject('Other')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                subject === 'Other' 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              Other
            </button>
          </div>
          
          {subject === 'Other' && (
            <motion.input
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              type="text"
              placeholder="Type subject name..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full mt-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-stone-400 transition-all"
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            Ask AI Tutor (Optional)
          </label>
          <textarea
            placeholder="Got any doubts from this session? Ask them here..."
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all min-h-[80px] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!subject || (subject === 'Other' && !customSubject.trim())}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-stone-900 text-white text-xs font-mono font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-stone-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-4"
        >
          <Send className="w-4 h-4" />
          Log & Claim Points
        </button>
      </form>
    </motion.div>
  );
}
