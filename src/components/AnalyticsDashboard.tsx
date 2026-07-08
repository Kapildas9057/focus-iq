import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Lock,
  Zap,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight,
  Sparkles,
  Star,
  Activity,
  Crown,
  Target
} from 'lucide-react';

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const subjects = [
  { name: 'Physics', pct: 45, color: '#22d3ee', glow: '0 0 12px #22d3ee88' },
  { name: 'Mathematics', pct: 35, color: '#a78bfa', glow: '0 0 12px #a78bfa88' },
  { name: 'Chemistry', pct: 20, color: '#34d399', glow: '0 0 12px #34d39988' },
];

const topicFeed = [
  { label: 'Deep Work: Logarithms', hours: 2, tag: 'deep-work', icon: '🧮' },
  { label: 'Mastered: 1D Elastic Collisions', hours: 1.5, tag: 'mastered', icon: '⚡' },
  { label: 'Review: Optics & Angle of Incidence', hours: 1, tag: 'review', icon: '🔬' },
];

const tagStyles: Record<string, string> = {
  'deep-work': 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  mastered: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  review: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
};

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const weekActivity = [6, 8, 5, 9, 7, 10, 7]; // hours per day

/* ─────────────────────────────────────────────
   DONUT CHART (pure SVG)
───────────────────────────────────────────── */
function DonutChart() {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = subjects.map((s) => {
    const dash = (s.pct / 100) * circumference;
    const gap = circumference - dash;
    const slice = { ...s, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-lg -rotate-90">
        {/* bg track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="14" />
        {slices.map((s, i) => (
          <motion.circle
            key={s.name}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${s.dash} ${s.gap}` }}
            transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
            style={{ filter: s.glow }}
          />
        ))}
      </svg>
      {/* center label */}
      <div className="absolute flex flex-col items-center">
        <span className="text-xs text-slate-400 font-medium">Focus</span>
        <span className="text-lg font-bold text-white" style={{ textShadow: '0 0 10px #22d3ee' }}>
          3h 30m
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WEEK BAR CHART
───────────────────────────────────────────── */
function WeekChart() {
  const max = Math.max(...weekActivity);
  return (
    <div className="flex items-end gap-2 h-20 w-full">
      {weekActivity.map((h, i) => {
        const heightPct = (h / max) * 100;
        const isToday = i === 5;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-md relative overflow-hidden"
              style={{
                height: `${heightPct}%`,
                background: isToday
                  ? 'linear-gradient(180deg,#22d3ee,#0891b2)'
                  : 'linear-gradient(180deg,#334155,#1e293b)',
                boxShadow: isToday ? '0 0 10px #22d3ee66' : 'none',
                minHeight: 6,
              }}
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: isToday ? '#22d3ee' : '#475569' }}
            >
              {weekDays[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FOCUS SCORE RING
───────────────────────────────────────────── */
function FocusRing({ score }: { score: number }) {
  const r = 68;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg width="192" height="192" viewBox="0 0 192 192" className="-rotate-90 absolute">
        <circle cx="96" cy="96" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <motion.circle
          cx="96"
          cy="96"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px #22d3ee)' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col items-center z-10">
        <motion.span
          className="text-5xl font-black text-white tabular-nums"
          style={{ textShadow: '0 0 20px #22d3ee' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STREAK FLAME ANIMATION
───────────────────────────────────────────── */
function FlameIcon({ size = 28 }: { size?: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Flame size={size} style={{ color: '#f97316', filter: 'drop-shadow(0 0 6px #f97316)' }} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   NFC PULSE BADGE  (brand design language echo)
───────────────────────────────────────────── */
function NFCBadge({ initials }: { initials: string }) {
  return (
    <div className="relative w-12 h-12 shrink-0">
      {/* Outer pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/40"
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/20"
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
      />
      {/* Avatar circle — no padding, perfectly circular */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white z-10 relative"
        style={{
          background: 'linear-gradient(135deg,#22d3ee,#6366f1)',
          boxShadow: '0 0 16px #22d3ee55, inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {initials}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function AnalyticsDashboard() {
  const [tier, setTier] = useState<'free' | 'premium'>('free');

  return (
    <div
      className="min-h-screen w-full text-white overflow-x-hidden pb-20"
      style={{
        background: 'radial-gradient(ellipse at 20% 0%, #0a1628 0%, #060d1a 50%, #020509 100%)',
      }}
    >
      {/* ── Top ambient glow ── */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] opacity-20 blur-3xl rounded-full"
        style={{ background: 'radial-gradient(#22d3ee, transparent 70%)' }}
      />

      <div className="relative max-w-md mx-auto px-4">

        {/* ── Header ── */}
        <div className="pt-10 pb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <NFCBadge initials="AK" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Focus Loop
              </p>
              <h1 className="text-base font-bold text-white leading-tight">Arjun Kumar</h1>
            </div>
          </div>

          {/* Tier pill */}
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background:
                tier === 'premium'
                  ? 'linear-gradient(90deg,#f59e0b22,#f59e0b44)'
                  : '#0f172a',
              border: tier === 'premium' ? '1px solid #f59e0b66' : '1px solid #1e293b',
              color: tier === 'premium' ? '#fbbf24' : '#64748b',
            }}
          >
            {tier === 'premium' ? <Crown size={11} /> : <Star size={11} />}
            <span>{tier}</span>
          </div>
        </div>

        {/* ── Tier Toggle ── */}
        <div
          className="flex items-center p-1 rounded-2xl mb-8"
          style={{
            background: '#0a1220',
            border: '1px solid #1e2d42',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {(['free', 'premium'] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTier(t)}
              className="relative flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize tracking-wide transition-colors z-10"
              style={{ color: tier === t ? '#fff' : '#475569' }}
              whileTap={{ scale: 0.97 }}
            >
              {tier === t && (
                <motion.div
                  layoutId="tierSlider"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      t === 'premium'
                        ? 'linear-gradient(135deg,#f59e0b22,#6366f133)'
                        : 'linear-gradient(135deg,#22d3ee22,#6366f133)',
                    border:
                      t === 'premium' ? '1px solid #f59e0b44' : '1px solid #22d3ee44',
                    boxShadow:
                      t === 'premium'
                        ? '0 0 16px #f59e0b22'
                        : '0 0 16px #22d3ee22',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-1.5">
                {t === 'premium' ? <Crown size={13} /> : <Zap size={13} />}
                {t} {t === 'premium' ? 'Tier' : 'Tier'}
              </span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════
              FREE TIER VIEW
          ══════════════════════════════════════════════ */}
          {tier === 'free' && (
            <motion.div
              key="free"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {/* Focus Score Hero */}
              <div
                className="rounded-3xl p-6 mb-4 text-center"
                style={{
                  background:
                    'linear-gradient(135deg,#0c1f36 0%,#0a1628 50%,#0f172a 100%)',
                  border: '1px solid #1e3a5f',
                  boxShadow: '0 0 40px #22d3ee0d',
                }}
              >
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold mb-1">
                  Today's
                </p>
                <h2 className="text-lg font-bold text-slate-300 mb-4">Focus Score</h2>
                <FocusRing score={87} />
                <div className="mt-5 flex items-center justify-center gap-6">
                  {[
                    { label: 'Sessions', value: '6' },
                    { label: 'Deep Work', value: '4h 20m' },
                    { label: 'Breaks', value: '3' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center">
                      <span className="text-base font-bold text-white">{stat.value}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFC Tap CTA */}
              <div
                className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(90deg,#0a2218,#071a12)',
                  border: '1px solid #14532d55',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#14532d44', border: '1px solid #16a34a44' }}
                >
                  <Activity size={16} style={{ color: '#4ade80' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-400">NFC Tap Detected</p>
                  <p className="text-[11px] text-slate-500 truncate">Last session started 2h ago · Keychain #A7</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#4ade80',
                    boxShadow: '0 0 6px #4ade80',
                  }}
                />
              </div>

              {/* Paywall Blur Section */}
              <div className="relative rounded-3xl overflow-hidden">
                {/* Blurred ghost cards */}
                <div
                  className="blur-[6px] grayscale-[0.8] pointer-events-none select-none transition-all duration-500 opacity-60"
                  aria-hidden="true"
                >
                  {/* Ghost Streak */}
                  <div
                    className="rounded-2xl p-5 mb-3"
                    style={{ background: '#0c1f36', border: '1px solid #1e3a5f' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Flame size={20} className="text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Current Streak</p>
                        <p className="text-2xl font-black text-white">14-Day 🔥</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-1.5 rounded-full"
                          style={{ background: i < 14 ? '#f97316' : '#1e293b' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Ghost Subject Breakdown */}
                  <div
                    className="rounded-2xl p-5 mb-3"
                    style={{ background: '#0c1f36', border: '1px solid #1e3a5f' }}
                  >
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Subject Breakdown
                    </p>
                    {subjects.map((s) => (
                      <div key={s.name} className="mb-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{s.name}</span>
                          <span>{s.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${s.pct}%`, background: s.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ghost Topic Feed */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: '#0c1f36', border: '1px solid #1e3a5f' }}
                  >
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Topic Mastery
                    </p>
                    {topicFeed.map((t) => (
                      <div key={t.label} className="flex items-center gap-3 mb-3">
                        <span className="text-xl">{t.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-300">{t.label}</p>
                          <p className="text-[10px] text-slate-500">{t.hours}h today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gradient fade overlay to hide the bottom slightly more */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(2,5,9,0) 0%, rgba(2,5,9,0.8) 60%, rgba(2,5,9,1) 100%)',
                  }}
                />

                {/* CTA button positioned over the blur */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center px-6 z-10 mt-10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTier('premium')}
                    className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 relative overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg,#f59e0b,#d97706,#b45309)',
                      boxShadow:
                        '0 4px 30px #f59e0b44, inset 0 1px 0 rgba(255,255,255,0.2)',
                      color: '#fff',
                    }}
                  >
                    {/* shimmer */}
                    <motion.div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, white, transparent)',
                        skewX: -15,
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    />
                    <Lock size={16} />
                    <span>Unlock Your Deep Work Data</span>
                    <Sparkles size={14} />
                  </motion.button>
                  <p className="text-[11px] text-slate-400 mt-4 bg-slate-900/60 backdrop-blur px-3 py-1 rounded-full border border-slate-800">
                    Upgrade to Premium · 7-day free trial
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              PREMIUM TIER VIEW
          ══════════════════════════════════════════════ */}
          {tier === 'premium' && (
            <motion.div
              key="premium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {/* ── Focus Score + Badge ── */}
              <div
                className="rounded-3xl p-6 mb-4 text-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg,#0c1f36 0%,#0a1628 50%,#0f172a 100%)',
                  border: '1px solid #1e3a5f',
                  boxShadow: '0 0 40px #22d3ee0d',
                }}
              >
                {/* Premium badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: '#f59e0b1a', border: '1px solid #f59e0b55', color: '#fbbf24' }}>
                  <Crown size={10} /> Premium
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold mb-1">
                  Today's
                </p>
                <h2 className="text-lg font-bold text-slate-300 mb-4">Focus Score</h2>
                <FocusRing score={87} />
                <div className="mt-5 flex items-center justify-center gap-6">
                  {[
                    { label: 'Sessions', value: '6' },
                    { label: 'Deep Work', value: '4h 20m' },
                    { label: 'Breaks', value: '3' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center">
                      <span className="text-base font-bold text-white">{stat.value}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── NFC Tap Status ── */}
              <div
                className="rounded-2xl p-4 mb-4 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(90deg,#0a2218,#071a12)',
                  border: '1px solid #14532d55',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#14532d44', border: '1px solid #16a34a44' }}
                >
                  <Activity size={16} style={{ color: '#4ade80' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-400">NFC Tap Detected</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Last session started 2h ago · Keychain #A7
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}
                />
              </div>

              {/* ── Row: Streak + Hours ── */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Streak */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background:
                      'linear-gradient(135deg,#1a0d00,#130800)',
                    border: '1px solid #7c2d1255',
                    boxShadow: '0 0 20px #f9731610',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-orange-400/70 uppercase tracking-wider font-semibold">
                      Streak
                    </p>
                    <FlameIcon size={18} />
                  </div>
                  <motion.p
                    className="text-3xl font-black text-white"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    14
                  </motion.p>
                  <p className="text-xs text-orange-400/70 font-medium">days</p>
                  {/* mini streak dots */}
                  <div className="flex gap-0.5 mt-3">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 h-1 rounded-full"
                        style={{ background: '#f97316', boxShadow: '0 0 3px #f97316' }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hours studied */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background:
                      'linear-gradient(135deg,#0c1a2e,#07101e)',
                    border: '1px solid #1e3a5f55',
                    boxShadow: '0 0 20px #22d3ee08',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-cyan-400/70 uppercase tracking-wider font-semibold">
                      This Week
                    </p>
                    <Clock size={14} style={{ color: '#22d3ee99' }} />
                  </div>
                  <motion.p
                    className="text-3xl font-black"
                    style={{ color: '#22d3ee', textShadow: '0 0 12px #22d3ee66' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    42.5
                  </motion.p>
                  <p className="text-xs text-cyan-400/70 font-medium">hours studied</p>
                  <div className="mt-3 flex items-center gap-1">
                    <TrendingUp size={11} style={{ color: '#4ade80' }} />
                    <span className="text-[10px] text-emerald-400 font-semibold">+8% vs last week</span>
                  </div>
                </div>
              </div>

              {/* ── Week Activity Bar Chart ── */}
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg,#0c1a2e,#07101e)',
                  border: '1px solid #1e3a5f55',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-white">Weekly Activity</p>
                    <p className="text-[10px] text-slate-500">Hours per day</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: '#22d3ee15', border: '1px solid #22d3ee30' }}>
                    <Activity size={11} style={{ color: '#22d3ee' }} />
                    <span className="text-[10px] text-cyan-400 font-semibold">Live</span>
                  </div>
                </div>
                <WeekChart />
              </div>

              {/* ── Subject Breakdown ── */}
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg,#0c1a2e,#07101e)',
                  border: '1px solid #1e3a5f55',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-white">Subject Breakdown</p>
                    <p className="text-[10px] text-slate-500">Today's time distribution</p>
                  </div>
                  <BookOpen size={16} style={{ color: '#94a3b8' }} />
                </div>

                <div className="flex items-center gap-6">
                  <DonutChart />
                  <div className="flex-1 space-y-3">
                    {subjects.map((s, i) => (
                      <motion.div
                        key={s.name}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: s.color, boxShadow: s.glow }}
                            />
                            <span className="text-[11px] font-medium text-slate-300">
                              {s.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-white">{s.pct}%</span>
                        </div>
                        <div
                          className="w-full rounded-full h-1.5"
                          style={{ background: '#1e293b' }}
                        >
                          <motion.div
                            className="h-1.5 rounded-full"
                            style={{ background: s.color, boxShadow: s.glow }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Topic Mastery Feed ── */}
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg,#0c1a2e,#07101e)',
                  border: '1px solid #1e3a5f55',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-white">Topic Mastery Feed</p>
                    <p className="text-[10px] text-slate-500">Recent conquered topics</p>
                  </div>
                  <Target size={16} style={{ color: '#94a3b8' }} />
                </div>

                <div className="space-y-3">
                  {topicFeed.map((topic, i) => (
                    <motion.div
                      key={topic.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: '#07101e',
                        border: '1px solid #1e293b',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                      >
                        {topic.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {topic.label}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tagStyles[topic.tag]}`}
                          >
                            {topic.tag.replace('-', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {topic.hours}h
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: '#22d3ee', textShadow: '0 0 8px #22d3ee55' }}
                        >
                          {topic.hours}h
                        </span>
                        <ChevronRight size={12} className="text-slate-600" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Achievements Teaser ── */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background:
                    'linear-gradient(135deg,#130d1e,#0d0716)',
                  border: '1px solid #4c1d9522',
                  boxShadow: '0 0 20px #7c3aed10',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">Achievements</p>
                  <Award size={16} style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex gap-2">
                  {[
                    { icon: '🔥', label: '14-Day Streak', unlocked: true },
                    { icon: '⚡', label: '100 Sessions', unlocked: true },
                    { icon: '🧠', label: 'Deep Worker', unlocked: true },
                    { icon: '🏆', label: 'Rank Top 10', unlocked: false },
                    { icon: '💎', label: '30-Day Grind', unlocked: false },
                  ].map((a, i) => (
                    <motion.div
                      key={a.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{
                          background: a.unlocked ? '#1e1b4b' : '#0f172a',
                          border: a.unlocked ? '1px solid #6366f144' : '1px solid #1e293b',
                          boxShadow: a.unlocked ? '0 0 10px #6366f133' : 'none',
                          filter: a.unlocked ? 'none' : 'grayscale(1) opacity(0.35)',
                        }}
                      >
                        {a.icon}
                      </div>
                      <span className="text-[8px] text-center text-slate-500 leading-tight w-full truncate">
                        {a.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
