/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Smartphone, CheckCircle, AlertTriangle, Zap, Shield, Activity, Lock
} from 'lucide-react';
import { UserProfile, FocusSession, BlockedApp, LeaderboardEntry } from '../types';
import AndroidFocusFlow from './AndroidFocusFlow';
import AppBlocker from './AppBlocker';
import Leaderboard from './Leaderboard';

interface StudentDashboardProps {
  studentProfile: UserProfile;
  parentProfile: UserProfile | null;
  focusHistory: FocusSession[];
  onSessionComplete: (durationMinutes: number, strikes: number, pointsEarned: number) => void;
  onSessionInterrupted: (elapsedSeconds: number, strikes: number) => void;
  onStrikeLogged: (totalStrikes: number) => void;
  isActiveSession: boolean;
  setIsActiveSession: (active: boolean) => void;
  
  // Pairing fields
  onVerifyPairingCode: (code: string) => boolean | Promise<boolean>;
  isPairingLocked: boolean;
  lockoutRemainingTime: string;

  // Android Navigation integration
  blockedApps: BlockedApp[];
  setBlockedApps: (apps: BlockedApp[]) => void;
  leaderboard: LeaderboardEntry[];
  onDistractionAttempt: (appName: string) => void;
}

export default function StudentDashboard({
  studentProfile,
  parentProfile,
  focusHistory,
  onSessionComplete,
  onSessionInterrupted,
  onStrikeLogged,
  isActiveSession,
  setIsActiveSession,
  onVerifyPairingCode,
  isPairingLocked,
  lockoutRemainingTime,
  blockedApps,
  setBlockedApps,
  leaderboard,
  onDistractionAttempt
}: StudentDashboardProps) {
  
  // Navigation active tab: 'focus' | 'shield' | 'leaderboard' | 'metrics'
  const [activeTab, setActiveTab] = useState<'focus' | 'shield' | 'leaderboard' | 'metrics'>('focus');

  const [codeInputValue, setCodeInputValue] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [nfcAlertMsg, setNfcAlertMsg] = useState<string | null>(null);
  
  // NFC simulation
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  // Handle pairing form submission
  const handlePairingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isPairingLocked) {
      setPairingError(`System locked. Try again in ${lockoutRemainingTime}.`);
      return;
    }

    if (codeInputValue.length !== 6) {
      setPairingError('Sync code must be 6 characters.');
      return;
    }

    const success = await onVerifyPairingCode(codeInputValue);
    if (success) {
      setPairingSuccess(true);
      setPairingError(null);
    } else {
      setPairingError('Invalid sync code. Too many failures locks sync.');
    }
  };

  // Simulate NFC sticker scan
  const triggerNfcScan = () => {
    if (isActiveSession) return;
    setNfcScanning(true);
    setNfcStatus('scanning');
    
    setTimeout(() => {
      setNfcScanning(false);
      setNfcStatus('success');
      
      setTimeout(() => setNfcStatus('idle'), 2500);
      
      setNfcAlertMsg('NFC Sticker detected! Focus countdown timer window opened.');
      setIsActiveSession(true);
      setActiveTab('focus');
    }, 1200);
  };

  // Safe tab click handler that locks other screens if NFC hasn't been scanned
  const handleTabClick = (tab: 'focus' | 'shield' | 'leaderboard' | 'metrics') => {
    if (tab === 'focus') {
      setActiveTab('focus');
      return;
    }
    
    if (!isActiveSession) {
      setNfcAlertMsg('🔒 Please scan the NFC study sticker first to activate your Focus block and unlock all companion pages!');
      return;
    }
    
    setActiveTab(tab);
  };

  // Aggregated student stats
  const todayMinutes = focusHistory
    .filter(s => {
      const todayStr = new Date().toDateString();
      const sessionStr = new Date(s.createdAt).toDateString();
      return s.status === 'completed' && todayStr === sessionStr;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const dailyGoalPercent = Math.min(100, (todayMinutes / studentProfile.dailyGoalMinutes) * 100);

  return (
    <div className="flex flex-col bg-white overflow-hidden w-full h-full relative xl:border xl:border-stone-250/80 xl:rounded-[40px] xl:shadow-lg xl:min-h-[670px] xl:max-h-[710px]">
      
      {/* 1. Top App Bar */}
      <div className="bg-[#FAF8F5] border-b border-stone-200/80 px-5 py-3 flex justify-between items-center z-15 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-stone-800 animate-pulse shrink-0" />
          <span className="font-display font-black text-xs text-stone-900 tracking-wider uppercase">FocusLoop</span>
        </div>
        
        {/* Profile Status Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full text-[9px] font-mono text-stone-800 font-bold">
            <Trophy className="w-2.5 h-2.5 text-stone-700" />
            {studentProfile.points}
          </div>
          <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full text-[9px] font-mono text-stone-800 font-bold">
            <Flame className="w-2.5 h-2.5 text-stone-700" />
            {studentProfile.streak}D
          </div>
        </div>
      </div>

      {/* 2. Notification/NFC Banner Alerts */}
      <AnimatePresence>
        {nfcAlertMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex justify-between items-start gap-4 text-stone-700 font-sans text-[10px] leading-relaxed z-15 shrink-0"
          >
            <div>
              <span className="font-bold text-stone-900">NFC:</span> {nfcAlertMsg}
            </div>
            <button 
              onClick={() => setNfcAlertMsg(null)}
              className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[9px] font-bold cursor-pointer"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Viewport Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 scrollbar-none bg-white relative flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: FOCUS FLOW */}
          {activeTab === 'focus' && !isActiveSession && (
            <motion.div
              key="nfc-scan-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center text-center py-5 px-3 space-y-4 min-h-[460px] h-full select-none"
            >
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-black block">FocusLoop NFC Protocol</span>
                <h3 className="text-sm font-display font-black text-stone-900 tracking-tight uppercase">Ready to Scan</h3>
              </div>

              {/* NFC Contactless Scanning Pulse Animation */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Concentric rotating/pulse rings */}
                <div className="absolute w-32 h-32 border-2 border-dashed border-stone-200/80 rounded-full animate-spin [animation-duration:20s]" />
                <motion.div 
                  animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.7, 0.35] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="absolute w-24 h-24 bg-stone-50 border border-stone-150 rounded-full flex items-center justify-center"
                />
                <motion.div 
                  animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.35, 0.12] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.4 }}
                  className="absolute w-32 h-32 bg-stone-100/60 rounded-full"
                />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center shadow-md">
                  <Smartphone className="w-7 h-7 text-white animate-bounce [animation-duration:2.5s]" />
                </div>
              </div>

              <div className="space-y-1 max-w-[260px]">
                <p className="text-xs font-bold text-stone-850">Tap Desk Sticker to Open Timer Window</p>
                <p className="text-[10px] text-stone-500 leading-normal font-sans">
                  Place your mobile phone on the physical NFC study tag. Tapping opens the focus session timer dial and locks background distracting apps.
                </p>
              </div>

              <button
                onClick={triggerNfcScan}
                disabled={nfcScanning}
                className={`w-full max-w-[210px] py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase border tracking-wider transition-all cursor-pointer shadow-3xs ${
                  nfcScanning
                    ? 'bg-stone-100 border-stone-300 text-stone-500'
                    : 'bg-stone-900 border-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'
                }`}
              >
                {nfcScanning ? 'Calibrating Tag...' : '⚡ Simulate NFC Tap'}
              </button>
            </motion.div>
          )}

          {activeTab === 'focus' && isActiveSession && (
            <motion.div
              key="focus-active-screen"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <AndroidFocusFlow
                studentProfile={studentProfile}
                onSessionComplete={onSessionComplete}
                onSessionInterrupted={onSessionInterrupted}
                onStrikeLogged={onStrikeLogged}
                isActiveSession={isActiveSession}
                setIsActiveSession={setIsActiveSession}
              />
            </motion.div>
          )}

          {/* SCREEN 2: APP BLOCK SHIELD */}
          {activeTab === 'shield' && (
            <motion.div
              key="shield-screen"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="text-center py-1">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">Device Shields</h3>
                <p className="text-sm font-bold text-stone-800">Distraction Prevention</p>
              </div>

              <AppBlocker
                blockedApps={blockedApps}
                setBlockedApps={setBlockedApps}
                isSessionActive={isActiveSession}
                onDistractionAttempt={onDistractionAttempt}
              />
            </motion.div>
          )}

          {/* SCREEN 3: LEADERBOARD PEERS */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard-screen"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="text-center py-1">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">Classmates</h3>
                <p className="text-sm font-bold text-stone-800">State Leaderboard</p>
              </div>

              <Leaderboard
                entries={leaderboard}
                currentUserUsername={studentProfile.username}
              />
            </motion.div>
          )}

          {/* SCREEN 4: METRICS & CONSOLE STATS */}
          {activeTab === 'metrics' && (
            <motion.div
              key="metrics-screen"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4 text-left"
            >
              <div className="text-center py-1">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">Daily Analytics</h3>
                <p className="text-sm font-bold text-stone-800">Focus Performance</p>
              </div>

              {/* Goal Progress Card */}
              <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Daily Goal Progress</span>
                  <span className="text-[9px] font-mono text-stone-700 font-bold uppercase">
                    {dailyGoalPercent.toFixed(0)}% Complete
                  </span>
                </div>

                <div className="flex justify-between text-xs text-stone-600">
                  <span>Today's Focus:</span>
                  <span className="font-bold">{todayMinutes} / {studentProfile.dailyGoalMinutes} mins</span>
                </div>

                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyGoalPercent}%` }}
                    className="h-full bg-stone-900 rounded-full"
                  />
                </div>
              </div>

              {/* Pairing code module */}
              {!parentProfile && (
                <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Parent Dashboard Link</span>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Connect your statistics with your parent by entering their dashboard sync key.
                  </p>

                  <form onSubmit={handlePairingSubmit} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={codeInputValue}
                      onChange={(e) => setCodeInputValue(e.target.value.toUpperCase().trim())}
                      placeholder="SYNC CODE"
                      disabled={isPairingLocked}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold tracking-widest text-center text-stone-800 focus:outline-none focus:border-stone-400 transition-all uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isPairingLocked}
                      className="bg-stone-900 text-white font-bold px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer hover:bg-stone-800"
                    >
                      Sync
                    </button>
                  </form>

                  {pairingError && (
                    <div className="text-[9px] text-red-600 font-semibold font-mono flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> {pairingError}
                    </div>
                  )}
                </div>
              )}

              {/* Recent focus sessions log history */}
              <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Session History Log</span>
                
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 no-scrollbar text-[10px] font-mono">
                  {focusHistory.length === 0 ? (
                    <div className="text-stone-400 text-center py-2">No focus sessions recorded yet.</div>
                  ) : (
                    [...focusHistory].reverse().slice(0, 3).map((session) => (
                      <div key={session.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-200/60">
                        <span className="text-stone-600">{session.durationMinutes}m ({session.status})</span>
                        <span className={session.status === 'completed' ? 'text-stone-800 font-bold' : 'text-red-600 font-bold'}>
                          {session.status === 'completed' ? `+${session.pointsEarned} PTS` : `-${session.strikes * 15} PTS`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. Bottom Tab Bar (Compact layout) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FAF8F5]/95 border-t border-stone-200/80 backdrop-blur-md flex justify-around items-center z-20 px-3 pb-2 shrink-0">
        
        {/* Tab 1: Focus */}
        <button
          onClick={() => handleTabClick('focus')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'focus' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {activeTab === 'focus' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Zap className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-widest">Focus</span>
        </button>

        {/* Tab 2: App Block Shield */}
        <button
          onClick={() => handleTabClick('shield')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'shield' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          } ${!isActiveSession ? 'opacity-40' : ''}`}
        >
          {activeTab === 'shield' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {!isActiveSession ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Shield className="w-4 h-4" />}
          <span className="text-[8px] font-mono uppercase tracking-widest">Shield</span>
        </button>

        {/* Tab 3: Leaderboard */}
        <button
          onClick={() => handleTabClick('leaderboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'leaderboard' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          } ${!isActiveSession ? 'opacity-40' : ''}`}
        >
          {activeTab === 'leaderboard' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {!isActiveSession ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Trophy className="w-4 h-4" />}
          <span className="text-[8px] font-mono uppercase tracking-widest">Peers</span>
        </button>

        {/* Tab 4: Metrics/Stats */}
        <button
          onClick={() => handleTabClick('metrics')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'metrics' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          } ${!isActiveSession ? 'opacity-40' : ''}`}
        >
          {activeTab === 'metrics' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {!isActiveSession ? <Lock className="w-3.5 h-3.5 text-stone-500" /> : <Activity className="w-4 h-4" />}
          <span className="text-[8px] font-mono uppercase tracking-widest">Metrics</span>
        </button>

      </div>

    </div>
  );
}
