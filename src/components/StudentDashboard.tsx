/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, CheckCircle, AlertTriangle, Zap, Shield, Activity, LogOut, User,
  Nfc, BellOff, Wifi, WifiOff, Smartphone
} from 'lucide-react';
import { UserProfile, FocusSession, BlockedApp, LeaderboardEntry } from '../types';
import { useNfcDnd } from '../utils/nfc-dnd-plugin';
import AndroidFocusFlow from './AndroidFocusFlow';
import AppBlocker from './AppBlocker';
import Leaderboard from './Leaderboard';
import BreathingTechnique from './BreathingTechnique';
import PostStudyLog from './PostStudyLog';
import FlexCard from './FlexCard';
import SquadView from './SquadView';

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

  // App management
  blockedApps: BlockedApp[];
  setBlockedApps: (apps: BlockedApp[]) => void;
  leaderboard: LeaderboardEntry[];
  onDistractionAttempt: (appName: string) => void;
  onMotionStrike: () => void;
  onSignOut: () => void;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
  distractionBlockCount?: number;
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
  onDistractionAttempt,
  onMotionStrike,
  onSignOut,
  onProfileUpdate,
  distractionBlockCount = 0,
}: StudentDashboardProps) {
  
  // NFC + DND hook
  const {
    scanStatus,
    lastTagUid,
    nfcAvailable,
    nfcEnabled,
    errorMessage: nfcError,
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
  } = useNfcDnd();



  // Navigation: all tabs always accessible (no NFC gating)
  const [activeTab, setActiveTab] = useState<'focus' | 'shield' | 'leaderboard' | 'metrics'>('focus');
  const [focusPhase, setFocusPhase] = useState<'scanning' | 'breathing' | 'studying' | 'logging'>('scanning');
  const [pendingSessionData, setPendingSessionData] = useState<{ durationMinutes: number; strikes: number; pointsEarned: number } | null>(null);
  const [endSessionTrigger, setEndSessionTrigger] = useState(0);

  // Auto-enable DND and route NFC taps
  useEffect(() => {
    if (scanStatus === 'detected' && lastTagUid) {
      (async () => {
        if (focusPhase === 'scanning') {
          const granted = await checkDndPermission();
          if (granted) {
            await enableDnd('priority');
          } else {
            await requestDndPermission();
          }
          // Transition to breathing first — then onComplete fires studying
          setTimeout(() => setFocusPhase('breathing'), 800);
        } else if (focusPhase === 'studying') {
          // Second NFC tap: end the session
          setEndSessionTrigger(prev => prev + 1);
        }
      })();
    }
  }, [scanStatus, lastTagUid, focusPhase]);

  const [codeInputValue, setCodeInputValue] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState(false);

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


  const handleSessionComplete = (durationMinutes: number, strikes: number, pointsEarned: number) => {
    setPendingSessionData({ durationMinutes, strikes, pointsEarned });
    setIsActiveSession(false);
    setFocusPhase('logging');
  };

  const handleLogComplete = (subject: string, notes: string) => {
    if (pendingSessionData) {
      onSessionComplete(pendingSessionData.durationMinutes, pendingSessionData.strikes, pendingSessionData.pointsEarned);
    }
    setPendingSessionData(null);
    setFocusPhase('scanning');
    resetTag();
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
    <div className="flex flex-col bg-white overflow-hidden w-full h-full relative">
      
      {/* 1. Top App Bar */}
      <div className="bg-[#FAF8F5] border-b border-stone-200/80 px-5 py-3 flex justify-between items-center z-15 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-stone-800 animate-pulse shrink-0" />
          <span className="font-display font-black text-xs text-stone-900 tracking-wider uppercase">FocusLoop</span>
        </div>
        
        {/* Profile Status Badges */}
        <div className="flex items-center gap-2">
          {/* DND Active Indicator */}
          {dndActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 bg-stone-900 text-white px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
            >
              <BellOff className="w-2.5 h-2.5" />
              DND
            </motion.div>
          )}
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

      {/* 2. Main Viewport Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 scrollbar-none bg-white relative flex flex-col">
        <div>
          
          {/* SCREEN 1: FOCUS FLOW — State Machine */}
          <div className={`space-y-3 ${activeTab === 'focus' ? 'block' : 'hidden'}`}>

            {focusPhase === 'scanning' && (
              <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-bold">NFC Tag Scanner</span>
                {nfcAvailable ? (
                  <span className="text-[9px] font-mono text-stone-500 flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" /> NFC Ready
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-stone-400 flex items-center gap-1">
                    <WifiOff className="w-2.5 h-2.5" /> Web Preview
                  </span>
                )}
              </div>

              {/* Scan Status Display */}
              <AnimatePresence mode="wait">
                {scanStatus === 'idle' || scanStatus === 'unavailable' ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                      <Nfc className="w-6 h-6 text-stone-400" />
                    </div>
                    <p className="text-[11px] text-stone-500 text-center">
                      Tap your phone to an NFC tag to activate focus mode
                    </p>
                    {!nfcAvailable && (
                      <button
                        onClick={simulateTagDetect}
                        className="mt-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-[10px] font-bold border border-pink-200 active:scale-95 transition-transform"
                      >
                        Developer: Simulate Tap
                      </button>
                    )}
                  </motion.div>
                ) : scanStatus === 'scanning' ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center"
                    >
                      <Nfc className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="text-[11px] text-stone-700 font-bold text-center">
                      Scanning... Bring NFC tag close
                    </p>
                  </motion.div>
                ) : scanStatus === 'detected' ? (
                  <motion.div
                    key="detected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                    </div>
                    <p className="text-[11px] text-green-800 font-bold text-center">Tag Detected!</p>
                    <code className="text-[9px] font-mono bg-stone-100 border border-stone-200 px-2 py-1 rounded-lg text-stone-600">
                      UID: {lastTagUid}
                    </code>
                    {dndActive && (
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-stone-700">
                        <BellOff className="w-3 h-3" /> Do Not Disturb Activated
                      </div>
                    )}
                  </motion.div>
                ) : scanStatus === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-[10px] text-red-600 font-mono text-center">{nfcError}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {scanStatus === 'idle' || scanStatus === 'error' || scanStatus === 'unavailable' ? (
                  <button
                    onClick={simulateTagDetect} // Allow dev simulation on web
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition-all"
                  >
                    <Nfc className="w-3.5 h-3.5" />
                    Simulate Scan
                  </button>
                ) : scanStatus === 'scanning' ? (
                  <button
                    onClick={stopScanning}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-50 transition-all"
                  >
                    Stop Scan
                  </button>
                ) : scanStatus === 'detected' ? (
                  <>
                    {dndActive && (
                      <button
                        onClick={disableDnd}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-50 transition-all"
                      >
                        <BellOff className="w-3.5 h-3.5" />
                        Disable DND
                      </button>
                    )}
                    <button
                      onClick={() => { resetTag(); startScanning(); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-800 transition-all"
                    >
                      Scan Again
                    </button>
                  </>
                ) : null}
              </div>

              {/* DND Permission Prompt */}
              {nfcAvailable && !dndPermissionGranted && (
                <button
                  onClick={requestDndPermission}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-amber-100 transition-all"
                >
                  <BellOff className="w-3 h-3" />
                  Grant DND Permission
                </button>
              )}
            </div>
            )}


            {/* BREATHING — activated after NFC tap, before session starts */}
            {focusPhase === 'breathing' && (
              <BreathingTechnique
                onComplete={() => setFocusPhase('studying')}
              />
            )}

            {focusPhase === 'studying' && (
              <AndroidFocusFlow
                studentProfile={studentProfile}
                onSessionComplete={handleSessionComplete}
                onSessionInterrupted={(secs, strikes) => {
                  onSessionInterrupted(secs, strikes);
                  setFocusPhase('scanning');
                  resetTag();
                }}
                onStrikeLogged={onStrikeLogged}
                isActiveSession={isActiveSession}
                setIsActiveSession={setIsActiveSession}
                onMotionStrike={onMotionStrike}
                endSessionTrigger={endSessionTrigger}
              />
            )}

            {focusPhase === 'logging' && pendingSessionData && (
              <PostStudyLog 
                studentProfile={studentProfile}
                pendingPoints={pendingSessionData.pointsEarned}
                onLogComplete={handleLogComplete}
              />
            )}
          </div>

          {/* SCREEN 2: APP BLOCK SHIELD */}
          <div className={`space-y-3 ${activeTab === 'shield' ? 'block' : 'hidden'}`}>
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
          </div>

          {/* SCREEN 3: LEADERBOARD PEERS */}
          <div className={`space-y-3 ${activeTab === 'leaderboard' ? 'block' : 'hidden'}`}>
            <div className="text-center py-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400">Classmates</h3>
              <p className="text-sm font-bold text-stone-800">Focus Leaderboard</p>
            </div>

            <Leaderboard
              entries={leaderboard}
              currentUserUsername={studentProfile.username}
            />
          </div>

          {/* SCREEN 4: METRICS & ACCOUNT */}
          <div className={`space-y-4 text-left ${activeTab === 'metrics' ? 'block' : 'hidden'}`}>
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

            {/* Account Info Card */}
            <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Account</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">{studentProfile.username}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{studentProfile.email}</div>
                </div>
              </div>
              {parentProfile && (
                <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-xl px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5 text-stone-700" />
                  <span className="text-[10px] font-mono font-bold text-stone-700">Linked to: {parentProfile.username}</span>
                </div>
              )}
              <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
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
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Session History</span>
              
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 no-scrollbar text-[10px] font-mono">
                {focusHistory.length === 0 ? (
                  <div className="text-stone-400 text-center py-2">No focus sessions recorded yet.</div>
                ) : (
                  [...focusHistory].reverse().slice(0, 5).map((session) => (
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

            {/* Study Squads */}
            <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Study Squads</span>
              <SquadView
                studentProfile={studentProfile}
                onProfileUpdate={onProfileUpdate}
              />
            </div>

            {/* Flex Card — always visible, streak gate inside */}
            <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Your Flex Card</span>
              </div>
              <FlexCard
                studentProfile={studentProfile}
                focusHistory={focusHistory}
                distractionBlockCount={distractionBlockCount}
              />
            </div>

          </div>

        </div>
      </div>

      {/* 3. Bottom Tab Bar — All tabs always accessible */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#FAF8F5]/95 border-t border-stone-200/80 backdrop-blur-md flex justify-around items-center z-20 px-3 pb-2 shrink-0">
        
        {/* Tab 1: Focus */}
        <button
          onClick={() => setActiveTab('focus')}
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
          onClick={() => setActiveTab('shield')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'shield' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {activeTab === 'shield' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Shield className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-widest">Shield</span>
        </button>

        {/* Tab 3: Leaderboard */}
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'leaderboard' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {activeTab === 'leaderboard' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Trophy className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-widest">Peers</span>
        </button>

        {/* Tab 4: Metrics/Account */}
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'metrics' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {activeTab === 'metrics' && (
            <motion.div
              layoutId="active-nav-pill"
              className="absolute inset-0 bg-stone-100 rounded-xl -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Activity className="w-4 h-4" />
          <span className="text-[8px] font-mono uppercase tracking-widest">Me</span>
        </button>

      </div>

    </div>
  );
}
