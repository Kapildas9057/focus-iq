/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Award, Shield, Smartphone, Key, Info, Check, 
  HelpCircle, AlertTriangle, Play, RefreshCw, Sparkles, AlertCircle 
} from 'lucide-react';

import { UserRole, UserProfile, FocusSession, BlockedApp, DistractionAttempt, LeaderboardEntry } from './types';
import { generateAnonymousUsername, INITIAL_LEADERBOARD, DEFAULT_BLOCKED_APPS } from './utils/mockData';
import { 
  syncUserProfile, 
  getUserProfile, 
  createFirebasePairingCode, 
  deleteFirebasePairingCode, 
  saveFocusSessionFirebase, 
  getFocusHistoryFirebase, 
  logDistractionAttemptFirebase, 
  getDistractionAttemptsFirebase, 
  syncBlockedAppsFirebase, 
  getBlockedAppsFirebase, 
  getLeaderboardFirebase,
  getStudentProfileByCode,
  getUserByEmail
} from './utils/firebase';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import AuthScreen from './components/AuthScreen';

export default function App() {
  // --- Persistent Local State Engine ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('focusloop_is_authenticated') === 'true';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [studentProfile, setStudentProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('focusloop_student_profile');
    if (saved) return JSON.parse(saved);
    return {
      uid: 'student_1',
      email: 'student@focusloop.app',
      role: 'student',
      username: generateAnonymousUsername(),
      points: 1250,
      streak: 4,
      dailyGoalMinutes: 45,
    };
  });

  const [parentProfile, setParentProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('focusloop_parent_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [focusHistory, setFocusHistory] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('focusloop_focus_history');
    if (saved) return JSON.parse(saved);
    // Seed with two mock sessions to look populated
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
    return [
      {
        id: 'sess_seed_1',
        studentId: 'student_1',
        durationMinutes: 25,
        elapsedSeconds: 25 * 60,
        status: 'completed',
        strikes: 0,
        pointsEarned: 250,
        createdAt: yesterday.toISOString(),
      },
      {
        id: 'sess_seed_2',
        studentId: 'student_1',
        durationMinutes: 15,
        elapsedSeconds: 15 * 60,
        status: 'completed',
        strikes: 1,
        pointsEarned: 135, // 150 - 15 penalty
        createdAt: now.toISOString(),
      }
    ];
  });

  const [distractionAttempts, setDistractionAttempts] = useState<DistractionAttempt[]>(() => {
    const saved = localStorage.getItem('focusloop_distraction_attempts');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>(() => {
    const saved = localStorage.getItem('focusloop_blocked_apps');
    if (saved) return JSON.parse(saved);
    return DEFAULT_BLOCKED_APPS;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('focusloop_leaderboard');
    if (saved) return JSON.parse(saved);
    return INITIAL_LEADERBOARD;
  });

  // --- Pairing & Lockout Engine State ---
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeExpirySeconds, setCodeExpirySeconds] = useState<number>(0);
  const [failedPairingAttempts, setFailedPairingAttempts] = useState<number>(0);
  const [isPairingLocked, setIsPairingLocked] = useState<boolean>(false);
  const [lockoutExpirySeconds, setLockoutExpirySeconds] = useState<number>(0);

  const [isActiveSession, setIsActiveSession] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState<boolean>(false);

  // Expiry / Lockout Timer Tick Effects
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pairingCode && codeExpirySeconds > 0) {
      interval = setInterval(() => {
        setCodeExpirySeconds((prev) => {
          if (prev <= 1) {
            setPairingCode(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pairingCode, codeExpirySeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPairingLocked && lockoutExpirySeconds > 0) {
      interval = setInterval(() => {
        setLockoutExpirySeconds((prev) => {
          if (prev <= 1) {
            setIsPairingLocked(false);
            setFailedPairingAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPairingLocked, lockoutExpirySeconds]);

  // Track if Firebase initial synchronization is complete
  const isInitialized = useRef(false);

  // Load initial data from Firebase on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadFirebaseData() {
      try {
        // 1. Student profile
        const storedStudent = await getUserProfile(studentProfile.uid);
        if (storedStudent) {
          setStudentProfile(storedStudent as UserProfile);
        } else {
          // Seed to Firebase
          await syncUserProfile(studentProfile.uid, studentProfile);
        }

        // 2. Parent profile (if student profile has linkedParentId)
        const currentStudent = storedStudent || studentProfile;
        if (currentStudent.linkedParentId) {
          const storedParent = await getUserProfile(currentStudent.linkedParentId);
          if (storedParent) {
            setParentProfile(storedParent as UserProfile);
          }
        }

        // 3. Blocked apps
        const firebaseBlocked = await getBlockedAppsFirebase(studentProfile.uid);
        if (firebaseBlocked && firebaseBlocked.length > 0) {
          setBlockedApps(firebaseBlocked);
        } else {
          // Seed defaults
          for (const app of blockedApps) {
            await syncBlockedAppsFirebase(studentProfile.uid, app);
          }
        }

        // 4. Focus sessions
        const firebaseHistory = await getFocusHistoryFirebase(studentProfile.uid);
        if (firebaseHistory && firebaseHistory.length > 0) {
          setFocusHistory(firebaseHistory);
        } else {
          // Seed history
          for (const sess of focusHistory) {
            await saveFocusSessionFirebase(sess);
          }
        }

        // 5. Distraction attempts
        const firebaseAttempts = await getDistractionAttemptsFirebase(studentProfile.uid);
        if (firebaseAttempts && firebaseAttempts.length > 0) {
          setDistractionAttempts(firebaseAttempts);
        }

        // 6. Leaderboard
        const firebaseLeaders = await getLeaderboardFirebase();
        if (firebaseLeaders && firebaseLeaders.length > 0) {
          const merged: LeaderboardEntry[] = firebaseLeaders.map((u, idx) => ({
            uid: u.uid,
            username: u.username,
            points: u.points,
            streak: u.streak,
            rank: idx + 1,
            isCurrentUser: u.uid === studentProfile.uid
          }));
          setLeaderboard(merged);
        } else {
          // Seed leaderboard users
          for (const leader of INITIAL_LEADERBOARD) {
            await syncUserProfile(leader.uid, {
              uid: leader.uid,
              email: `${leader.username.toLowerCase()}@focusloop.app`,
              role: 'student',
              username: leader.username,
              points: leader.points,
              streak: leader.streak,
              dailyGoalMinutes: 45
            });
          }
        }
      } catch (err) {
        console.error("Failed to load or seed Firebase database state:", err);
      } finally {
        isInitialized.current = true;
      }
    }
    loadFirebaseData();
  }, [isAuthenticated]);

  // Synchronize localStorage and Firebase database state
  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('focusloop_student_profile', JSON.stringify(studentProfile));
    if (isInitialized.current) {
      syncUserProfile(studentProfile.uid, studentProfile);
    }
  }, [studentProfile, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (parentProfile) {
      localStorage.setItem('focusloop_parent_profile', JSON.stringify(parentProfile));
      if (isInitialized.current) {
        syncUserProfile(parentProfile.uid, parentProfile);
      }
    } else {
      localStorage.removeItem('focusloop_parent_profile');
    }
  }, [parentProfile, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('focusloop_focus_history', JSON.stringify(focusHistory));
  }, [focusHistory, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('focusloop_distraction_attempts', JSON.stringify(distractionAttempts));
  }, [distractionAttempts, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('focusloop_blocked_apps', JSON.stringify(blockedApps));
    if (isInitialized.current) {
      // Sync blocked app states to Firestore subcollection
      blockedApps.forEach((app) => {
        syncBlockedAppsFirebase(studentProfile.uid, app);
      });
    }
  }, [blockedApps, studentProfile.uid, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem('focusloop_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard, isAuthenticated]);

  // Sync Leaderboard entry when student points change
  useEffect(() => {
    const isStudentOnLeaderboard = leaderboard.some(u => u.username === studentProfile.username);
    let updatedLeaderboard: LeaderboardEntry[];

    if (isStudentOnLeaderboard) {
      updatedLeaderboard = leaderboard.map(u => {
        if (u.username === studentProfile.username) {
          return { ...u, points: studentProfile.points, streak: studentProfile.streak };
        }
        return u;
      });
    } else {
      updatedLeaderboard = [
        ...leaderboard,
        {
          uid: studentProfile.uid,
          username: studentProfile.username,
          points: studentProfile.points,
          streak: studentProfile.streak,
          rank: 99,
          isCurrentUser: true,
        }
      ];
    }

    // Recalculate ranks based on points
    const sorted = [...updatedLeaderboard].sort((a, b) => b.points - a.points);
    const ranked = sorted.map((user, idx) => ({ ...user, rank: idx + 1 }));
    
    // Only update if something actually changed to avoid infinite loop
    const hasChanged = JSON.stringify(ranked) !== JSON.stringify(leaderboard);
    if (hasChanged) {
      setLeaderboard(ranked);
    }
  }, [studentProfile, leaderboard]);

  // --- Custom Cloud Authentication Sync Handlers ---
  const handleAuthSuccess = async (profile: UserProfile) => {
    setIsAuthenticated(true);
    localStorage.setItem('focusloop_is_authenticated', 'true');
    
    if (profile.role === 'student') {
      setStudentProfile(profile);
      setCurrentRole('student');
      localStorage.setItem('focusloop_student_profile', JSON.stringify(profile));
      
      // Fetch associated details from Firestore
      const firebaseBlocked = await getBlockedAppsFirebase(profile.uid);
      if (firebaseBlocked && firebaseBlocked.length > 0) {
        setBlockedApps(firebaseBlocked);
      }
      const firebaseHistory = await getFocusHistoryFirebase(profile.uid);
      if (firebaseHistory && firebaseHistory.length > 0) {
        setFocusHistory(firebaseHistory);
      }
      const firebaseAttempts = await getDistractionAttemptsFirebase(profile.uid);
      if (firebaseAttempts && firebaseAttempts.length > 0) {
        setDistractionAttempts(firebaseAttempts);
      }
      
      if (profile.linkedParentId) {
        const storedParent = await getUserProfile(profile.linkedParentId);
        if (storedParent) {
          setParentProfile(storedParent as UserProfile);
        }
      } else {
        setParentProfile(null);
      }
    } else {
      setParentProfile(profile);
      setCurrentRole('parent');
      localStorage.setItem('focusloop_parent_profile', JSON.stringify(profile));
      
      if (profile.linkedStudentId) {
        const storedStudent = await getUserProfile(profile.linkedStudentId);
        if (storedStudent) {
          setStudentProfile(storedStudent as UserProfile);
          
          const firebaseBlocked = await getBlockedAppsFirebase(profile.linkedStudentId);
          if (firebaseBlocked && firebaseBlocked.length > 0) {
            setBlockedApps(firebaseBlocked);
          }
          const firebaseHistory = await getFocusHistoryFirebase(profile.linkedStudentId);
          if (firebaseHistory && firebaseHistory.length > 0) {
            setFocusHistory(firebaseHistory);
          }
          const firebaseAttempts = await getDistractionAttemptsFirebase(profile.linkedStudentId);
          if (firebaseAttempts && firebaseAttempts.length > 0) {
            setDistractionAttempts(firebaseAttempts);
          }
        }
      }
    }
    triggerNotification(`👋 Connected as ${profile.username}! Real-time Firestore active.`);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('focusloop_is_authenticated');
    localStorage.removeItem('focusloop_student_profile');
    localStorage.removeItem('focusloop_parent_profile');
    localStorage.removeItem('focusloop_focus_history');
    localStorage.removeItem('focusloop_distraction_attempts');
    setParentProfile(null);
    setStudentProfile({
      uid: 'student_1',
      email: 'student@focusloop.app',
      role: 'student',
      username: generateAnonymousUsername(),
      points: 1250,
      streak: 4,
      dailyGoalMinutes: 45,
    });
    setFocusHistory([]);
    setDistractionAttempts([]);
    triggerNotification('🔒 Logged out of active cloud database.');
  };

  // Notification Toast Helper
  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 4000);
  };

  // --- Session Completions, Interruptions and Strike Logic ---
  const handleSessionComplete = (durationMinutes: number, strikes: number, pointsEarned: number) => {
    const newSession: FocusSession = {
      id: `sess_${Date.now()}`,
      studentId: studentProfile.uid,
      durationMinutes,
      elapsedSeconds: durationMinutes * 60,
      status: 'completed',
      strikes,
      pointsEarned,
      createdAt: new Date().toISOString()
    };

    saveFocusSessionFirebase(newSession);

    const nextHistory = [...focusHistory, newSession];
    setFocusHistory(nextHistory);

    // Calculate goals and bonuses
    const todayMinutes = nextHistory
      .filter(s => {
        const todayStr = new Date().toDateString();
        const sessionStr = new Date(s.createdAt).toDateString();
        return s.status === 'completed' && todayStr === sessionStr;
      })
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    const prevTodayMinutes = todayMinutes - durationMinutes;
    let bonus = 0;

    // Trigger daily goal bonus once
    if (prevTodayMinutes < studentProfile.dailyGoalMinutes && todayMinutes >= studentProfile.dailyGoalMinutes) {
      bonus = 500;
      triggerNotification('🎉 Daily Focus Goal Met! +500 PTS Bonus Transferred!');
    } else {
      triggerNotification(`🎯 Session Complete! +${pointsEarned} points successfully added.`);
    }

    setStudentProfile(prev => ({
      ...prev,
      points: prev.points + pointsEarned + bonus,
      streak: prev.streak + (prevTodayMinutes === 0 ? 1 : 0) // Increment streak on first session of the day
    }));
  };

  const handleSessionInterrupted = (elapsedSeconds: number, strikes: number) => {
    const durationMinutes = Math.floor(elapsedSeconds / 60);
    const newSession: FocusSession = {
      id: `sess_${Date.now()}`,
      studentId: studentProfile.uid,
      durationMinutes,
      elapsedSeconds,
      status: 'interrupted',
      strikes,
      pointsEarned: 0,
      createdAt: new Date().toISOString()
    };

    saveFocusSessionFirebase(newSession);

    setFocusHistory(prev => [...prev, newSession]);
    triggerNotification('⚠️ Session Interrupted: 3 Strikes reached. Focus block canceled.');
  };

  const handleStrikeLogged = (totalStrikes: number) => {
    triggerNotification(`⚠️ Warning: Incident detected! Strike #${totalStrikes} logged.`);
  };

  // Log distraction attempt on App Blocker simulator
  const handleDistractionAttempt = (appName: string) => {
    const newAttempt: DistractionAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: studentProfile.uid,
      appName,
      timestamp: new Date().toISOString()
    };
    
    logDistractionAttemptFirebase(newAttempt);

    setDistractionAttempts(prev => [...prev, newAttempt]);
    triggerNotification(`🛑 Intercepted: Redirect shielded from ${appName}! Log sent to parent.`);
  };

  // --- Pairing & Generating Codes ---
  const handleGeneratePairingCode = () => {
    // Generate simple 6 digit string
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPairingCode(code);
    setCodeExpirySeconds(600); // 10 minutes
    createFirebasePairingCode(code, 'parent_1');
    triggerNotification('🔐 Verification Key Generated! Awaiting Student connection.');
  };

  const handleVerifyPairingCode = async (codeInput: string): Promise<boolean> => {
    if (isPairingLocked) return false;

    // Check Firebase pairing code
    const fbCode = await getStudentProfileByCode(codeInput);
    if (fbCode) {
      const parentId = fbCode.parentId || 'parent_1';
      const parentUser: UserProfile = {
        uid: parentId,
        email: 'parent@focusloop.app',
        role: 'parent',
        username: 'ParentGuardian',
        points: 0,
        streak: 0,
        dailyGoalMinutes: 0,
        linkedStudentId: studentProfile.uid
      };

      setParentProfile(parentUser);
      setStudentProfile(prev => ({ ...prev, linkedParentId: parentId }));
      setPairingCode(null);
      setFailedPairingAttempts(0);

      // Save linkage relation to Firebase
      await syncUserProfile(studentProfile.uid, { ...studentProfile, linkedParentId: parentId });
      await syncUserProfile(parentId, parentUser);
      await deleteFirebasePairingCode(codeInput);

      triggerNotification('🚀 Secure Link Connected! Parent dashboard fully synced.');
      return true;
    } else {
      // Failed attempts tracking
      const nextFailures = failedPairingAttempts + 1;
      setFailedPairingAttempts(nextFailures);
      if (nextFailures >= 5) {
        setIsPairingLocked(true);
        setLockoutExpirySeconds(900); // 15 mins
      }
      return false;
    }
  };

  const formatLockoutRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const [deviceTime, setDeviceTime] = useState<string>('12:00 PM');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDeviceTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateShake = () => {
    if (!isActiveSession) {
      triggerNotification('💡 Motion sensors are idle. Start a Focus session to log physical displacement strikes!');
      return;
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    
    // Deduct points for the strike penalty
    setStudentProfile(prev => ({
      ...prev,
      points: Math.max(0, prev.points - 50)
    }));
    triggerNotification('🚨 Shake Detected! FocusLoop 3D Accelerometer logged a movement strike. Penalty: -50 PTS.');
  };

  const handleSimulateAppLaunch = (appName: string) => {
    if (!isActiveSession) {
      triggerNotification(`📱 Launched ${appName} simulator successfully (Allowed: focus timer is inactive).`);
      return;
    }
    handleDistractionAttempt(appName);
    triggerNotification(`🛑 Shield Protected: Intercepted background app redirect to ${appName}!`);
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-[#F5F3EE] text-stone-850 flex flex-col items-center justify-center relative overflow-hidden select-none font-sans">
      
      {/* Background Decorative Ambient Radial Grid */}
      <div className="hidden md:block absolute inset-0 bg-[radial-gradient(#e5e1da_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      {/* Main Sandbox Layout Container */}
      <div className="w-full h-full md:w-auto md:h-auto flex flex-col items-center justify-center p-0 md:p-4 relative z-10 md:space-y-3">
        
        {/* Subtle, elegant developer controller tip */}
        <div className="hidden md:flex text-[9px] text-stone-400 font-mono tracking-widest items-center gap-1.5 bg-white/70 border border-stone-200/80 px-4 py-1.5 rounded-full shadow-3xs uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-pulse" />
          <span>💡 Tap status bar / notch to open sensor control panel</span>
        </div>

        {/* RIGHT PANEL: ANDROID DEVICE WRAPPER */}
        <div className="relative shrink-0 select-none w-full h-full md:w-auto md:h-auto flex flex-col">
          <motion.div
            id="android-phone-frame"
            animate={isShaking ? {
              x: [0, -8, 8, -6, 6, -4, 4, 0],
              y: [0, 4, -4, 3, -3, 2, -2, 0],
              rotate: [0, -1, 1, -0.5, 0.5, 0]
            } : {}}
            transition={{ duration: 0.4 }}
            className="w-full h-full md:w-[365px] md:h-[720px] rounded-none md:rounded-[48px] border-0 md:border-[10px] border-stone-900 bg-white md:shadow-xl relative overflow-hidden flex flex-col md:ring-1 md:ring-stone-200"
          >
            {/* Physical Side Buttons */}
            <div className="hidden md:block absolute top-[140px] -right-[11px] w-[3px] h-[35px] bg-stone-300 rounded-l-md" />
            <div className="hidden md:block absolute top-[190px] -right-[11px] w-[3px] h-[65px] bg-stone-300 rounded-l-md" />

            {/* Android Notch */}
            <div 
              onClick={() => setIsControlCenterOpen(prev => !prev)}
              className="hidden md:flex absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-950 rounded-full z-40 items-center justify-center px-3 border border-white/10 cursor-pointer hover:scale-[1.05] active:scale-[0.98] transition-all"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              <div className="w-6 h-0.5 bg-stone-800 rounded-full mx-1.5" />
              <div className="w-1 h-1 rounded-full bg-stone-800" />
            </div>

            {/* Status Bar */}
            <div 
              onClick={() => setIsControlCenterOpen(prev => !prev)}
              className="h-10 md:h-9 bg-[#FAF8F5] flex items-center justify-between px-4 md:px-5 text-[9px] font-mono font-bold text-stone-500 select-none pt-4 md:pt-2.5 relative z-35 shrink-0 border-b border-stone-100 cursor-pointer hover:bg-stone-100/60 active:bg-stone-200/50 transition-all"
            >
              <span>{deviceTime}</span>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-stone-400 animate-pulse" />
                <span className="text-[7px] text-stone-400 font-mono tracking-wider uppercase font-bold">System Tray</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] bg-stone-200 text-stone-700 px-1 py-0.1 rounded font-bold font-mono">5G</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* System Control Center Dropdown Shade */}
            <AnimatePresence>
              {isControlCenterOpen && (
                <motion.div
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="absolute inset-x-0 top-9 bg-[#FAF8F5]/98 backdrop-blur-md border-b border-stone-200 shadow-lg z-40 p-4 space-y-3.5 flex flex-col text-left select-none text-stone-850"
                >
                  <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-stone-900 flex items-center justify-center shrink-0">
                        <Smartphone className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold">System Controller</span>
                    </div>
                    <button 
                      onClick={() => setIsControlCenterOpen(false)}
                      className="text-[8px] font-mono font-bold bg-stone-200 hover:bg-stone-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  {/* Active Role switching */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-stone-400 font-mono uppercase tracking-wider font-extrabold block">Profile View Mode</span>
                    <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          setCurrentRole('student');
                          setIsControlCenterOpen(false);
                          triggerNotification('📱 Switched to Student device view.');
                        }}
                        className={`py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                          currentRole === 'student'
                            ? 'bg-stone-900 text-white shadow-3xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        onClick={() => {
                          setCurrentRole('parent');
                          setIsControlCenterOpen(false);
                          triggerNotification('👥 Switched to Parent guardian view.');
                        }}
                        className={`py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                          currentRole === 'parent'
                            ? 'bg-stone-900 text-white shadow-3xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Parent
                      </button>
                    </div>
                  </div>

                  {/* Sensor triggers */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-stone-400 font-mono uppercase tracking-wider font-extrabold block">Hardware Triggers</span>
                    <button
                      onClick={() => {
                        handleSimulateShake();
                        setIsControlCenterOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-850 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-3xs flex items-center justify-between"
                    >
                      <span>📳 Simulate Lift / Tilt</span>
                      <span className="text-[8px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded uppercase font-black tracking-widest">G-Sensor</span>
                    </button>
                  </div>

                  {/* Launch distracting App overlay */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] text-stone-400 font-mono uppercase tracking-wider font-extrabold">Test Background Shield</span>
                      <span className="text-[7px] bg-red-100 text-red-700 font-bold px-1 rounded uppercase">Blocking</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['TikTok', 'Instagram', 'YouTube'].map((app) => (
                        <button
                          key={app}
                          onClick={() => {
                            handleSimulateAppLaunch(app);
                            setIsControlCenterOpen(false);
                          }}
                          className="py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-[9px] font-mono font-bold hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer shadow-3xs text-center"
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account detail & Sign Out */}
                  <div className="flex justify-between items-center pt-2 border-t border-stone-150 text-[8px] font-mono text-stone-400">
                    <span>ID: {studentProfile.username}</span>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsControlCenterOpen(false);
                      }}
                      className="px-2 py-1 bg-stone-200 hover:bg-red-100 hover:text-red-700 text-stone-700 font-bold uppercase rounded cursor-pointer transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Screen Scroll Container (Strict No-Scroll Viewport) */}
            <div className="flex-1 overflow-hidden relative bg-white">
              <AnimatePresence mode="wait">
                {currentRole === 'student' ? (
                  <motion.div
                    key="student-sim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col"
                  >
                    <StudentDashboard 
                      studentProfile={studentProfile}
                      parentProfile={parentProfile}
                      focusHistory={focusHistory}
                      onSessionComplete={handleSessionComplete}
                      onSessionInterrupted={handleSessionInterrupted}
                      onStrikeLogged={handleStrikeLogged}
                      isActiveSession={isActiveSession}
                      setIsActiveSession={setIsActiveSession}
                      onVerifyPairingCode={handleVerifyPairingCode}
                      isPairingLocked={isPairingLocked}
                      lockoutRemainingTime={formatLockoutRemaining(lockoutExpirySeconds)}
                      blockedApps={blockedApps}
                      setBlockedApps={setBlockedApps}
                      leaderboard={leaderboard}
                      onDistractionAttempt={handleDistractionAttempt}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="parent-sim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full overflow-y-auto pb-10 px-4 pt-3 scrollbar-none text-left"
                  >
                    <ParentDashboard 
                      parentProfile={parentProfile}
                      studentProfile={parentProfile ? studentProfile : null}
                      focusHistory={focusHistory}
                      distractionAttempts={distractionAttempts}
                      pairingCode={pairingCode}
                      onGenerateCode={handleGeneratePairingCode}
                      codeExpirySeconds={codeExpirySeconds}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Gesture Bar */}
            <div className="hidden md:flex h-4 bg-white items-center justify-center relative z-30 shrink-0 pb-1.5 border-t border-stone-100">
              <div className="w-14 h-1 bg-stone-300 rounded-full" />
            </div>
          </motion.div>
        </div>

      </div>

      {/* Global Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
          >
            <div className="bg-stone-900 border border-stone-850 text-white px-4 py-3 rounded-2xl shadow-lg flex items-start gap-2.5">
              <div className="text-xs font-semibold leading-normal">{showNotification}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
