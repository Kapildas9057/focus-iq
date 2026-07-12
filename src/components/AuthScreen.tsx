import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Smartphone, Mail, User, ArrowRight, Zap, CheckCircle, Users, BookOpen, Brain, MapPin
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { auth, getUserProfile, syncUserProfile } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

const googleProvider = new GoogleAuthProvider();

// Study challenges shown on the profile-enrichment screen
const STUDY_CHALLENGES = [
  { id: 'retention', icon: Brain, label: "I study but don't retain", color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'distraction', icon: Smartphone, label: 'I get distracted easily', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'direction', icon: MapPin, label: "I don't know where to start", color: 'text-amber-600 bg-amber-50 border-amber-200' },
] as const;

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [grade, setGrade] = useState<string>('Class 10');
  const [board, setBoard] = useState<string>('CBSE');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2-screen Google onboarding state
  // 'auth' = main login/register screen; 'profile' = board/class/challenge for NEW Google users
  const [onboardingStep, setOnboardingStep] = useState<'auth' | 'profile'>('auth');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<UserProfile | null>(null);
  const [studyChallenge, setStudyChallenge] = useState<string | null>(null);

  // ---- GOOGLE SIGN-IN ----
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let existingUser = await getUserProfile(user.uid);
      if (existingUser) {
        // Returning user — check role and proceed
        if (existingUser.role !== role) {
          setErrorMsg(`This Google account is registered as a "${existingUser.role}". Please select the correct role above.`);
          setGoogleLoading(false);
          return;
        }
        onAuthSuccess(existingUser as UserProfile);
      } else {
        // NEW Google user — build a provisional profile and show enrichment screen
        const provisionalProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          role: role,
          username: user.displayName || user.email?.split('@')[0] || 'User',
          points: 0,
          streak: 0,
          dailyGoalMinutes: role === 'student' ? 45 : 0,
          grade: role === 'student' ? 'Class 10' : undefined,
          board: role === 'student' ? 'CBSE' : undefined,
        };

        if (role === 'student') {
          // Show profile enrichment screen
          setPendingGoogleProfile(provisionalProfile);
          setGoogleLoading(false);
          setOnboardingStep('profile');
          return;
        } else {
          // Parents skip the enrichment screen
          await syncUserProfile(user.uid, provisionalProfile);
          onAuthSuccess(provisionalProfile);
        }
      }
      setGoogleLoading(false);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg('Sign-in was blocked. Please try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in was cancelled.');
      } else {
        setErrorMsg(error.message || 'Google sign-in failed. Please try again.');
      }
      setGoogleLoading(false);
    }
  };

  // ---- PROFILE ENRICHMENT SUBMIT (new Google users) ----
  const handleProfileComplete = async () => {
    if (!pendingGoogleProfile) return;
    setGoogleLoading(true);

    const finalProfile: UserProfile = {
      ...pendingGoogleProfile,
      grade,
      board,
      studyChallenge: studyChallenge as any || undefined,
    };

    try {
      // Persist grade/board immediately — don't wait for anything else
      await syncUserProfile(finalProfile.uid, finalProfile);
      onAuthSuccess(finalProfile);
    } catch (e) {
      console.error('Profile save error:', e);
      // Still proceed — data will sync on next load
      onAuthSuccess(finalProfile);
    }
    setGoogleLoading(false);
  };

  // ---- EMAIL/PASSWORD SUBMIT ----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    if (!isLogin && !username) {
      setErrorMsg('Please choose a username.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const emailLower = email.toLowerCase().trim();

    try {
      if (isLogin) {
        // ---- LOGIN FLOW ----
        let firebaseUser: any = null;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          firebaseUser = userCredential.user;
        } catch (authErr: any) {
          if (
            authErr.code === 'auth/invalid-credential' ||
            authErr.code === 'auth/wrong-password' ||
            authErr.code === 'auth/user-not-found' ||
            authErr.code === 'auth/invalid-email'
          ) {
            setErrorMsg('Invalid email or password. Please try again.');
            return;
          }
          throw authErr;
        }

        // Enforce email verification
        if (firebaseUser && !firebaseUser.emailVerified) {
          try {
            await sendEmailVerification(firebaseUser);
          } catch (_) {
            // ignore resend errors
          }
          setErrorMsg('Your email is not verified yet. We resent the verification link — please check your inbox, then log in again.');
          return;
        }

        // Fetch Firestore profile
        const existingUser = await getUserProfile(firebaseUser.uid);
        if (!existingUser) {
          setErrorMsg('Account profile not found. Please register again.');
          return;
        }
        if (existingUser.role !== role) {
          setErrorMsg(`This account is registered as a "${existingUser.role}". Please select the correct role above.`);
          return;
        }
        onAuthSuccess(existingUser as UserProfile);

      } else {
        // ---- REGISTER FLOW ----
        let firebaseUser: any = null;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
          firebaseUser = userCredential.user;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            setErrorMsg('An account with this email already exists. Please log in instead.');
            return;
          } else if (authErr.code === 'auth/weak-password') {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
          } else if (authErr.code === 'auth/invalid-email') {
            setErrorMsg('Please enter a valid email address.');
            return;
          }
          throw authErr;
        }

        // Send verification email (non-blocking)
        sendEmailVerification(firebaseUser).catch((verifyErr: any) => {
          console.warn('Could not send verification email:', verifyErr.message);
        });

        // Save profile to Firestore
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: emailLower,
          role: role,
          username: username.trim(),
          points: 0,
          streak: 0,
          dailyGoalMinutes: role === 'student' ? 45 : 0,
          grade: role === 'student' ? grade : undefined,
          board: role === 'student' ? board : undefined,
        };
        await syncUserProfile(firebaseUser.uid, newUser);

        setErrorMsg('Registration successful! Please verify your email then log in.');
        setIsLogin(true);
        setPassword('');
      }

    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMsg('Too many attempts. Please wait a moment before trying again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/password sign-in is not enabled. Please contact the app administrator.');
      } else {
        setErrorMsg(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── SCREEN 2: Profile enrichment for new Google users ────────────────────
  if (onboardingStep === 'profile') {
    return (
      <div className="min-h-screen bg-[#F8F6F2] text-stone-800 flex flex-col items-center justify-center p-5 relative">
        <div className="w-full max-w-sm relative z-10">

          {/* Brand hint */}
          <div className="mb-7 text-center">
            <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-stone-900">
              Almost there
            </h1>
            <p className="text-xs text-stone-500 mt-1">Tell us a little about your studies</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">

            {/* Board + Class side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Class</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                >
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
            </div>

            {/* Study challenge — optional, skippable */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-bold">
                  Biggest study challenge?
                </label>
                <span className="text-[9px] text-stone-400 font-mono">Optional</span>
              </div>
              <div className="space-y-2">
                {STUDY_CHALLENGES.map(({ id, icon: Icon, label, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStudyChallenge(studyChallenge === id ? null : id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      studyChallenge === id
                        ? color + ' shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={handleProfileComplete}
              disabled={googleLoading}
              className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.98] disabled:opacity-55 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all font-mono uppercase tracking-widest cursor-pointer shadow-sm"
            >
              {googleLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Start Studying
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Skip challenge */}
            <button
              type="button"
              onClick={() => { setStudyChallenge(null); handleProfileComplete(); }}
              className="w-full text-center text-[10px] text-stone-400 font-mono hover:text-stone-600 transition-colors py-1 cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN 1: Main auth screen ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-stone-800 flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-display font-black tracking-tight text-stone-900 uppercase">
            FOCUSLOOP
          </h1>
          <p className="text-[10px] text-stone-400 font-mono tracking-wider uppercase mt-1">
            Focus Study Companion for Students
          </p>
        </div>

        {/* Auth Minimal Card */}
        <div className="w-full bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          
          {/* Custom Tabs */}
          <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl border border-stone-200/60 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                isLogin 
                  ? 'bg-stone-900 text-white shadow-3xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                !isLogin 
                  ? 'bg-stone-900 text-white shadow-3xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="text-left">
              <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block mb-2 font-bold">
                Choose App Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-mono font-bold uppercase cursor-pointer ${
                    role === 'student'
                      ? 'bg-stone-900 border-stone-900 text-white shadow-3xs'
                      : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-mono font-bold uppercase cursor-pointer ${
                    role === 'parent'
                      ? 'bg-stone-900 border-stone-900 text-white shadow-3xs'
                      : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Parent
                </button>
              </div>
            </div>

            {/* Error / Success Message */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border rounded-xl p-3 text-[11px] font-mono tracking-wide text-center ${
                    errorMsg.startsWith('Registration successful')
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {errorMsg.startsWith('Registration successful') ? '✅' : '⚠️'} {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full bg-white hover:bg-stone-50 active:scale-[0.98] disabled:opacity-55 text-stone-700 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all font-sans cursor-pointer border border-stone-200 shadow-sm"
            >
              {googleLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200"></div>
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-stone-200"></div>
            </div>

            {/* Input Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">
                Password
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
                />
              </div>
            </div>

            {/* Input Username (Only for Register) */}
            {!isLogin && (
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. FocusFalcon"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Input Grade and Board (Only for Student Register) */}
            {!isLogin && role === 'student' && (
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 transition-all font-sans"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.98] disabled:opacity-55 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all font-mono uppercase tracking-widest cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  {isLogin ? 'Log In' : 'Register Account'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-5 border-t border-stone-100 pt-4 flex gap-2 items-start text-left">
            <Shield className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-stone-400 leading-normal font-sans">
              Parent-student linkage is secure and private. Statistics are shared in real-time under zero-knowledge credentials.
            </p>
          </div>
        </div>

        {/* Short footer details */}
        <div className="mt-5 grid grid-cols-3 gap-2 w-full text-center">
          <div className="bg-white border border-stone-200/60 rounded-xl p-2.5 shadow-3xs">
            <Zap className="w-3.5 h-3.5 text-stone-700 mx-auto mb-1" />
            <div className="text-[8px] font-mono uppercase font-bold text-stone-600">Secure Sync</div>
          </div>
          <div className="bg-white border border-stone-200/60 rounded-xl p-2.5 shadow-3xs">
            <Smartphone className="w-3.5 h-3.5 text-stone-700 mx-auto mb-1" />
            <div className="text-[8px] font-mono uppercase font-bold text-stone-600">Native Feel</div>
          </div>
          <div className="bg-white border border-stone-200/60 rounded-xl p-2.5 shadow-3xs">
            <CheckCircle className="w-3.5 h-3.5 text-stone-700 mx-auto mb-1" />
            <div className="text-[8px] font-mono uppercase font-bold text-stone-600">Privacy First</div>
          </div>
        </div>
      </div>
    </div>
  );
}
