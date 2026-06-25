/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, RefreshCw, Key, Clock, Ban, Trophy, 
  User, AlertCircle, Flame
} from 'lucide-react';
import { UserProfile, FocusSession, DistractionAttempt } from '../types';

interface ParentDashboardProps {
  parentProfile: UserProfile | null;
  studentProfile: UserProfile | null;
  focusHistory: FocusSession[];
  distractionAttempts: DistractionAttempt[];
  pairingCode: string | null;
  onGenerateCode: () => void;
  codeExpirySeconds: number;
}

export default function ParentDashboard({
  parentProfile,
  studentProfile,
  focusHistory,
  distractionAttempts,
  pairingCode,
  onGenerateCode,
  codeExpirySeconds
}: ParentDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sessions' | 'distractions'>('overview');

  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalFocusedSeconds = focusHistory
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.durationMinutes * 60, 0);
  
  const totalFocusedHours = (totalFocusedSeconds / 3600).toFixed(1);
  const totalStrikesCount = focusHistory.reduce((sum, s) => sum + s.strikes, 0);
  const totalDistractionsCount = distractionAttempts.length;

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyHours = [1.5, 2.0, 0.8, 3.5, 0.0, 1.2, parseFloat(totalFocusedHours) || 0.0];
  const maxHours = Math.max(...dailyHours, 4.0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto text-left text-stone-800">
      
      {/* Profile & pairing status header card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">Linked Account</div>
              <h1 className="text-lg font-display font-black text-stone-900 uppercase tracking-tight">
                {parentProfile ? `Parent View • ${parentProfile.username}` : 'Parent Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center">
            {studentProfile ? (
              <div className="flex items-center gap-1.5 bg-stone-100 text-stone-800 border border-stone-200 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-stone-800" />
                Linked: {studentProfile.username}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase">
                <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                No Student Linked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pairing Setup Module (If unlinked) */}
      {!studentProfile && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-2xs">
          <div className="max-w-md mx-auto text-center space-y-5">
            <div className="w-12 h-12 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-6 h-6 text-stone-850" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-stone-900 uppercase">Synchronize Student App</h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Enter this sync code in the student device FocusLoop settings to monitor progress and block limits in real-time.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {pairingCode ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
                    Sync Code (Expires in {formatExpiryTime(codeExpirySeconds)})
                  </div>
                  <div className="text-3xl md:text-4xl font-mono font-black tracking-widest text-stone-900">
                    {pairingCode}
                  </div>
                  <p className="text-[10px] text-red-600 font-mono uppercase">
                    Code expires in 10 minutes. 5 incorrect entries locks pairing.
                  </p>
                </motion.div>
              ) : (
                <button
                  onClick={onGenerateCode}
                  className="w-full max-w-xs bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate Sync Code
                </button>
              )}
            </AnimatePresence>

            {/* Instruction Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-stone-100 text-left text-stone-500">
              <div className="space-y-1">
                <div className="text-xs font-bold text-stone-800 font-display flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-mono text-[10px] font-bold flex items-center justify-center border border-stone-200">1</span>
                  Generate Code
                </div>
                <p className="text-[10px] leading-relaxed pl-6">Click code button above to generate a sync key.</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-stone-800 font-display flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-mono text-[10px] font-bold flex items-center justify-center border border-stone-200">2</span>
                  Student Inputs Code
                </div>
                <p className="text-[10px] leading-relaxed pl-6">Open FocusLoop on student device and enter sync code.</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-stone-800 font-display flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-mono text-[10px] font-bold flex items-center justify-center border border-stone-200">3</span>
                  Enjoy Dashboard
                </div>
                <p className="text-[10px] leading-relaxed pl-6">Review weekly charts and focus session logs instantly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Dashboard Modules */}
      {studentProfile && (
        <div className="space-y-5">
          
          {/* Dashboard SubTabs */}
          <div className="bg-stone-100 p-1 rounded-xl border border-stone-200 flex gap-1 w-full sm:max-w-md">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSubTab('sessions')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'sessions'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Logs
            </button>
            <button
              onClick={() => setActiveSubTab('distractions')}
              className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'distractions'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Shield ({totalDistractionsCount})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeSubTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-5"
              >
                {/* Analytics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Hours focused */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between h-28 hover:border-stone-300 transition-all duration-300 shadow-2xs">
                    <div className="flex justify-between items-start text-stone-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <span>Focused</span>
                      <Clock className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-black text-stone-900">
                        {totalFocusedHours}h
                      </div>
                      <div className="text-[10px] text-stone-500 leading-none mt-1">
                        Completed blocks this week
                      </div>
                    </div>
                  </div>

                  {/* Daily streak */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between h-28 hover:border-stone-300 transition-all duration-300 shadow-2xs">
                    <div className="flex justify-between items-start text-stone-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <span>Streak</span>
                      <Flame className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-black text-stone-900">
                        {studentProfile.streak}d
                      </div>
                      <div className="text-[10px] text-stone-500 leading-none mt-1">
                        Active daily streak
                      </div>
                    </div>
                  </div>

                  {/* App Blocks */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between h-28 hover:border-stone-300 transition-all duration-300 shadow-2xs">
                    <div className="flex justify-between items-start text-stone-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <span>Shield Blocks</span>
                      <Ban className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-black text-stone-900">
                        {totalDistractionsCount}
                      </div>
                      <div className="text-[10px] text-stone-500 leading-none mt-1">
                        Blocked distractions
                      </div>
                    </div>
                  </div>

                  {/* Strikes */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between h-28 hover:border-stone-300 transition-all duration-300 shadow-2xs">
                    <div className="flex justify-between items-start text-stone-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <span>Lifts</span>
                      <AlertCircle className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-black text-stone-900">
                        {totalStrikesCount}
                      </div>
                      <div className="text-[10px] text-stone-500 leading-none mt-1">
                        Warning strikes logged
                      </div>
                    </div>
                  </div>

                </div>

                {/* SVG Visual Bar Chart */}
                <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-500 mb-4 text-left">
                    Daily Focus Profile (Hours)
                  </h3>

                  <div className="flex items-end justify-between h-36 pt-4 px-2 max-w-lg mx-auto">
                    {daysOfWeek.map((day, idx) => {
                      const value = dailyHours[idx];
                      const pct = (value / maxHours) * 100;
                      return (
                        <div key={day} className="flex flex-col items-center flex-1">
                          <div className="text-[9px] font-mono text-stone-500 mb-1">{value.toFixed(1)}h</div>
                          <div className="w-6 sm:w-8 bg-stone-50 border border-stone-200/50 rounded-t-md h-24 flex items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${pct}%` }}
                              transition={{ delay: idx * 0.04, duration: 0.5 }}
                              className="w-full rounded-t-sm bg-stone-900"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-stone-400 mt-2 font-mono">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Policy Notice Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-4 text-left space-y-1">
                  <div className="text-xs font-bold text-stone-900 font-display uppercase tracking-wider">
                    ⚖️ Strict Zero-Interference Policy
                  </div>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    This companion platform enforces zero interference. Parents can review statistics and log details, but cannot manipulate active sessions, streaking metrics, or point systems. This ensures healthy accountability and builds lasting trust.
                  </p>
                </div>

              </motion.div>
            )}

            {activeSubTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs"
              >
                <h3 className="text-xs font-mono font-bold text-stone-500 mb-4 uppercase">
                  Historical Study Blocks
                </h3>

                {focusHistory.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    No focus blocks logged yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {focusHistory.map((session) => (
                      <div 
                        key={session.id}
                        className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 flex justify-between items-center"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-850">
                              {session.durationMinutes}m study block
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                              session.status === 'completed'
                                ? 'bg-stone-100 border-stone-300 text-stone-800'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <div className="text-[9px] font-mono text-stone-400 mt-1">
                            {new Date(session.createdAt).toLocaleTimeString()} • {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-stone-850">
                            {session.status === 'completed' ? `+${session.pointsEarned} PTS` : '0 PTS'}
                          </div>
                          <div className="text-[9px] text-stone-400 font-mono">
                            {session.strikes} warning strikes
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeSubTab === 'distractions' && (
              <motion.div
                key="distractions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs"
              >
                <h3 className="text-xs font-mono font-bold text-stone-500 mb-4 uppercase">
                  Shielded Application Interruptions
                </h3>

                {distractionAttempts.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    Amazing! Zero distractions logged during study time.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {distractionAttempts.map((attempt) => (
                      <div 
                        key={attempt.id}
                        className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center">
                            <Ban className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-stone-800">
                              Blocked app: {attempt.appName}
                            </div>
                            <div className="text-[9px] font-mono text-stone-400">
                              {new Date(attempt.timestamp).toLocaleTimeString()} • {new Date(attempt.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <span className="text-[8px] font-mono bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded font-bold uppercase">
                          Redirect Shielded
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
