import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Smartphone, Mail, User, ArrowRight, Zap, CheckCircle, Users
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { getUserByEmail, syncUserProfile } from '../utils/firebase';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!isLogin && !username) {
      setErrorMsg('Please choose a username.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const emailLower = email.toLowerCase().trim();
      const existingUser = await getUserByEmail(emailLower);

      if (isLogin) {
        if (!existingUser) {
          setErrorMsg('No account found with this email. Please register first.');
          setLoading(false);
          return;
        }
        if (existingUser.role !== role) {
          setErrorMsg(`This account is registered as a ${existingUser.role}. Please select the correct role above.`);
          setLoading(false);
          return;
        }

        onAuthSuccess(existingUser as UserProfile);
      } else {
        if (existingUser) {
          setErrorMsg('An account with this email already exists. Please log in instead.');
          setLoading(false);
          return;
        }

        const newUid = `${role}_${Date.now()}`;
        const newUser: UserProfile = {
          uid: newUid,
          email: emailLower,
          role: role,
          username: username.trim(),
          points: role === 'student' ? 1000 : 0,
          streak: role === 'student' ? 0 : 0,
          dailyGoalMinutes: role === 'student' ? 45 : 0,
        };

        await syncUserProfile(newUid, newUser);
        onAuthSuccess(newUser);
      }
    } catch (error: any) {
      console.error('Auth action failed:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-stone-800 flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-display font-black tracking-tight text-stone-900 uppercase">
            FOCUSLOOP
          </h1>
          <p className="text-[10px] text-stone-400 font-mono tracking-wider uppercase mt-1">
            Premium Study Block Companion
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

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[11px] font-mono tracking-wide text-center"
                >
                  ⚠️ {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
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
