/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import { UserRole, UserProfile, FocusSession, BlockedApp, DistractionAttempt, LeaderboardEntry } from './types';
import { generateAnonymousUsername } from './utils/mockData';
import { 
  auth,
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

// Clear all locally stored focusloop data once on app load (fresh state — Firebase is source of truth)
const FOCUSLOOP_KEYS = [
  'focusloop_focus_history',
  'focusloop_distraction_attempts',
  'focusloop_blocked_apps',
  'focusloop_leaderboard',
];
FOCUSLOOP_KEYS.forEach((key) => localStorage.removeItem(key));

export default function App() {
  // --- Authentication State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('focusloop_is_authenticated') === 'true';
  });
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // --- Firebase Auth Persistence: auto-login on app open ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is still signed in from a previous session
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && !isAuthenticated) {
          // Restore session silently
          setIsAuthenticated(true);
          localStorage.setItem('focusloop_is_authenticated', 'true');
          const userProfile = profile as UserProfile;
          setCurrentRole(userProfile.role);
          localStorage.setItem('focusloop_current_role', userProfile.role);
          if (userProfile.role === 'student') {
            setStudentProfile(userProfile);
            localStorage.setItem('focusloop_student_profile', JSON.stringify(userProfile));
          } else {
            setParentProfile(userProfile);
            localStorage.setItem('focusloop_parent_profile', JSON.stringify(userProfile));
          }
        }
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('focusloop_current_role');
    return (saved as UserRole) || 'student';
  });

  const [studentProfile, setStudentProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('focusloop_student_profile');
    if (saved) return JSON.parse(saved);
    // Clean default — no fake data
    return {
      uid: '',
      email: '',
      role: 'student',
      username: '',
      points: 0,
      streak: 0,
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
    return []; // Start empty — no seed sessions
  });

  const [distractionAttempts, setDistractionAttempts] = useState<DistractionAttempt[]>(() => {
    const saved = localStorage.getItem('focusloop_distraction_attempts');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>(() => {
    const saved = localStorage.getItem('focusloop_blocked_apps');
    if (saved) return JSON.parse(saved);
    return []; // Start empty — users add their own
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('focusloop_leaderboard');
    if (saved) return JSON.parse(saved);
    return []; // Start empty — populated from real Firestore users
  });

  // --- Pairing & Lockout Engine State ---
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeExpirySeconds, setCodeExpirySeconds] = useState<number>(0);
  const [failedPairingAttempts, setFailedPairingAttempts] = useState<number>(0);
  const [isPairingLocked, setIsPairingLocked] = useState<boolean>(false);
  const [lockoutExpirySeconds, setLockoutExpirySeconds] = useState<number>(0);

  const [isActiveSession, setIsActiveSession] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

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
    if (!isAuthenticated || !studentProfile.uid) return;
    async function loadFirebaseData() {
      try {
        // 1. Student profile
        const storedStudent = await getUserProfile(studentProfile.uid);
        if (storedStudent) {
          setStudentProfile(storedStudent as UserProfile);
        } else {
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

        // Parallelize independent data fetches
        const [
          firebaseBlocked,
          firebaseHistory,
          firebaseAttempts,
          firebaseLeaders
        ] = await Promise.all([
          getBlockedAppsFirebase(studentProfile.uid),
          getFocusHistoryFirebase(studentProfile.uid),
          getDistractionAttemptsFirebase(studentProfile.uid),
          getLeaderboardFirebase()
        ]);

        if (firebaseBlocked && firebaseBlocked.length > 0) {
          setBlockedApps(firebaseBlocked);
        }
        if (firebaseHistory && firebaseHistory.length > 0) {
          setFocusHistory(firebaseHistory);
        }
        if (firebaseAttempts && firebaseAttempts.length > 0) {
          setDistractionAttempts(firebaseAttempts);
        }
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
        }
      } catch (err) {
        console.error("Failed to load Firebase database state:", err);
      } finally {
        isInitialized.current = true;
      }
    }
    loadFirebaseData();
  }, [isAuthenticated]);

  // Synchronize localStorage and Firebase database state
  useEffect(() => {
    if (!isAuthenticated || !studentProfile.uid) return;
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
    if (!isAuthenticated || !studentProfile.uid) return;
    localStorage.setItem('focusloop_blocked_apps', JSON.stringify(blockedApps));
    if (isInitialized.current) {
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
    if (!studentProfile.uid) return;
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

  // --- Authentication Handlers ---
  const handleAuthSuccess = async (profile: UserProfile) => {
    setIsAuthenticated(true);
    localStorage.setItem('focusloop_is_authenticated', 'true');
    setCurrentRole(profile.role);
    localStorage.setItem('focusloop_current_role', profile.role);
    
    if (profile.role === 'student') {
      setStudentProfile(profile);
      localStorage.setItem('focusloop_student_profile', JSON.stringify(profile));
      
      // Fetch associated details from Firestore in parallel
      const [
        firebaseBlocked,
        firebaseHistory,
        firebaseAttempts,
        storedParent
      ] = await Promise.all([
        getBlockedAppsFirebase(profile.uid),
        getFocusHistoryFirebase(profile.uid),
        getDistractionAttemptsFirebase(profile.uid),
        profile.linkedParentId ? getUserProfile(profile.linkedParentId) : Promise.resolve(null)
      ]);

      if (firebaseBlocked && firebaseBlocked.length > 0) {
        setBlockedApps(firebaseBlocked);
      }
      if (firebaseHistory && firebaseHistory.length > 0) {
        setFocusHistory(firebaseHistory);
      }
      if (firebaseAttempts && firebaseAttempts.length > 0) {
        setDistractionAttempts(firebaseAttempts);
      }
      
      if (storedParent) {
        setParentProfile(storedParent as UserProfile);
      } else {
        setParentProfile(null);
      }
    } else {
      setParentProfile(profile);
      localStorage.setItem('focusloop_parent_profile', JSON.stringify(profile));
      
      if (profile.linkedStudentId) {
        const storedStudent = await getUserProfile(profile.linkedStudentId);
        if (storedStudent) {
          setStudentProfile(storedStudent as UserProfile);
          
          const [
            firebaseBlocked,
            firebaseHistory,
            firebaseAttempts
          ] = await Promise.all([
            getBlockedAppsFirebase(profile.linkedStudentId),
            getFocusHistoryFirebase(profile.linkedStudentId),
            getDistractionAttemptsFirebase(profile.linkedStudentId)
          ]);
          
          if (firebaseBlocked && firebaseBlocked.length > 0) {
            setBlockedApps(firebaseBlocked);
          }
          if (firebaseHistory && firebaseHistory.length > 0) {
            setFocusHistory(firebaseHistory);
          }
          if (firebaseAttempts && firebaseAttempts.length > 0) {
            setDistractionAttempts(firebaseAttempts);
          }
        }
      }
    }
    triggerNotification(`👋 Welcome, ${profile.username}! Connected to FocusLoop.`);
  };

  const handleSignOut = async () => {
    // Sign out from Firebase Auth so session is fully cleared
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign-out error:', e);
    }
    setIsAuthenticated(false);
    localStorage.removeItem('focusloop_is_authenticated');
    localStorage.removeItem('focusloop_student_profile');
    localStorage.removeItem('focusloop_parent_profile');
    localStorage.removeItem('focusloop_focus_history');
    localStorage.removeItem('focusloop_distraction_attempts');
    localStorage.removeItem('focusloop_blocked_apps');
    localStorage.removeItem('focusloop_leaderboard');
    localStorage.removeItem('focusloop_current_role');
    setParentProfile(null);
    setStudentProfile({
      uid: '',
      email: '',
      role: 'student',
      username: '',
      points: 0,
      streak: 0,
      dailyGoalMinutes: 45,
    });
    setFocusHistory([]);
    setDistractionAttempts([]);
    setBlockedApps([]);
    setLeaderboard([]);
    triggerNotification('🔒 Signed out successfully.');
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
      triggerNotification('🎉 Daily Focus Goal Met! +500 PTS Bonus!');
    } else {
      triggerNotification(`🎯 Session Complete! +${pointsEarned} points earned.`);
    }

    setStudentProfile(prev => ({
      ...prev,
      points: prev.points + pointsEarned + bonus,
      streak: prev.streak + (prevTodayMinutes === 0 ? 1 : 0)
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
    triggerNotification(`⚠️ Strike #${totalStrikes}: Phone movement detected!`);
  };

  // Log distraction attempt
  const handleDistractionAttempt = (appName: string) => {
    const newAttempt: DistractionAttempt = {
      id: `attempt_${Date.now()}`,
      studentId: studentProfile.uid,
      appName,
      timestamp: new Date().toISOString()
    };
    
    logDistractionAttemptFirebase(newAttempt);

    setDistractionAttempts(prev => [...prev, newAttempt]);
    triggerNotification(`🛑 Blocked: ${appName} attempt logged.`);
  };

  // --- Pairing & Generating Codes ---
  const handleGeneratePairingCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPairingCode(code);
    setCodeExpirySeconds(600); // 10 minutes
    const parentId = parentProfile?.uid || currentRole === 'parent' ? (parentProfile?.uid || studentProfile.uid) : 'pending';
    createFirebasePairingCode(code, parentId);
    triggerNotification('🔐 Sync code generated! Share with your student.');
  };

  const handleVerifyPairingCode = async (codeInput: string): Promise<boolean> => {
    if (isPairingLocked) return false;

    const fbCode = await getStudentProfileByCode(codeInput);
    if (fbCode) {
      const parentId = fbCode.parentId || fbCode.code;
      
      // Look up the parent user who generated this code
      const parentUser = await getUserProfile(parentId);
      
      if (parentUser) {
        setParentProfile(parentUser as UserProfile);
        setStudentProfile(prev => ({ ...prev, linkedParentId: parentId }));
        setPairingCode(null);
        setFailedPairingAttempts(0);

        // Save linkage relation to Firebase
        await syncUserProfile(studentProfile.uid, { ...studentProfile, linkedParentId: parentId });
        await syncUserProfile(parentId, { ...parentUser, linkedStudentId: studentProfile.uid });
        await deleteFirebasePairingCode(codeInput);

        triggerNotification('🚀 Linked! Parent can now see your focus data.');
        return true;
      }
    }
    
    // Failed attempts tracking
    const nextFailures = failedPairingAttempts + 1;
    setFailedPairingAttempts(nextFailures);
    if (nextFailures >= 5) {
      setIsPairingLocked(true);
      setLockoutExpirySeconds(900); // 15 mins
    }
    return false;
  };

  const formatLockoutRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // --- Motion Detection Strike Handler ---
  const handleMotionStrike = () => {
    if (!isActiveSession) return;
    
    // Deduct points for the strike penalty
    setStudentProfile(prev => ({
      ...prev,
      points: Math.max(0, prev.points - 50)
    }));
    triggerNotification('🚨 Phone movement detected! -50 PTS penalty.');
  };

  // --- Render ---
  // Show loading spinner while Firebase checks for a persisted session
  if (!authChecked) {
    return (
      <div className="h-screen w-screen bg-[#F8F6F2] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-stone-200 border-t-stone-700 animate-spin" />
        <p className="text-xs font-mono text-stone-400 uppercase tracking-wider">Loading FocusLoop...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-white text-stone-800 flex flex-col relative overflow-hidden select-none font-sans">
      
      {/* Main Content — Full Screen, No Phone Frame */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {currentRole === 'student' ? (
            <motion.div
              key="student-view"
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
                onMotionStrike={handleMotionStrike}
                onSignOut={handleSignOut}
              />
            </motion.div>
          ) : (
            <motion.div
              key="parent-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto pb-10 px-4 pt-3 scrollbar-none text-left bg-[#FAF8F5]"
            >
              <ParentDashboard 
                parentProfile={parentProfile}
                studentProfile={parentProfile ? studentProfile : null}
                focusHistory={focusHistory}
                distractionAttempts={distractionAttempts}
                pairingCode={pairingCode}
                onGenerateCode={handleGeneratePairingCode}
                codeExpirySeconds={codeExpirySeconds}
                onSignOut={handleSignOut}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="bg-stone-900 border border-stone-800 text-white px-4 py-3 rounded-2xl shadow-lg flex items-start gap-2.5">
              <div className="text-xs font-semibold leading-normal">{showNotification}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
