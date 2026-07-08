import { motion } from 'motion/react';
import { 
  Flame, 
  Crown, 
  Lock, 
  Instagram, 
  Share, 
  Activity, 
  ShieldAlert,
  Zap
} from 'lucide-react';

/* ─────────────────────────────────────────────
   MOCK DATA (STRICT MATCH)
───────────────────────────────────────────── */
const stats = {
  name: 'Kapil',
  deepWork: '34.5',
  growth: '+14%',
  streak: 21,
  blocks: 42,
  subjects: [
    { name: 'Physics (Mechanics & Optics)', pct: 40 },
    { name: 'Mathematics', pct: 35 }
  ]
};

const leaderboard = [
  { name: 'Kapil', hours: 34.5, rank: 1 },
  { name: 'Rishwant', hours: 28.2, rank: 2 },
  { name: 'Shashwa', hours: 19.0, rank: 3 }
];

/* ─────────────────────────────────────────────
   COMPONENT: FLEX CARD
───────────────────────────────────────────── */
export default function FlexCard() {
  return (
    <div className="min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center p-4 py-10 font-sans">
      
      {/* ── THE 9:16 CARD ── */}
      <div 
        className="relative w-full max-w-[360px] aspect-[9/16] rounded-[2rem] overflow-hidden flex flex-col"
        style={{
          background: '#09090b', // Deep obsidian
          boxShadow: '0 20px 60px -15px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Background glow effects (Electric Purple to Hyper-Pink) */}
        <div className="absolute top-[-15%] left-[-15%] w-1/2 h-1/2 bg-purple-600/40 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-2/3 h-2/3 bg-pink-600/30 rounded-full blur-[100px]" />
        
        {/* Grain overlay for aesthetic texture */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10 flex flex-col h-full p-6 text-white">
          
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {/* Glowing NFC Icon */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-pink-500/50 bg-purple-900/40 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-pink-400" />
                <Activity size={14} className="text-pink-400" />
              </div>
              <span className="text-[11px] font-black tracking-[0.2em] uppercase text-zinc-300">
                Focus Loop
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 backdrop-blur-sm">
              Week 12
            </span>
          </div>

          {/* ── HOOK / TITLE ── */}
          <div className="mb-6">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
              Locked In.
            </h1>
          </div>

          {/* ── MAIN FLEX (KAPIL'S STATS) ── */}
          <div className="flex-1 space-y-5">
            {/* Deep Work */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Deep Work</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight text-white">{stats.deepWork}</span>
                <span className="text-lg font-bold text-zinc-400">hrs</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Zap size={12} className="text-fuchsia-400" />
                <span className="text-xs font-bold text-fuchsia-400">{stats.growth} from last week</span>
              </div>
            </div>

            {/* Streak & Subjects */}
            <div className="grid grid-cols-2 gap-3">
              {/* Streak */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-zinc-900/50 border border-orange-500/30 backdrop-blur-md flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-[30px]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/80 mb-1">Streak</p>
                <div className="flex items-center gap-1.5">
                  <Flame size={20} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  <span className="text-3xl font-black tracking-tight text-white">{stats.streak}</span>
                </div>
                <span className="text-[10px] font-bold text-orange-400/60 mt-0.5">DAYS</span>
              </div>

              {/* Subjects */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Top Subjects</p>
                <div className="space-y-1.5">
                  {stats.subjects.map(sub => (
                    <div key={sub.name} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-zinc-300 truncate pr-2">{sub.name}</span>
                        <span className="text-white">{sub.pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.8)]" style={{ width: `${sub.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── THE SQUAD LEADERBOARD ── */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                The Squad <span className="flex-1 h-[1px] bg-zinc-800" />
              </p>
              <div className="space-y-2">
                {leaderboard.map((user) => (
                  <div 
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-xl backdrop-blur-md border ${
                      user.rank === 1 
                        ? 'bg-fuchsia-950/40 border-fuchsia-500/50 shadow-[0_0_20px_-5px_rgba(217,70,239,0.4)]' 
                        : 'bg-zinc-900/40 border-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black ${user.rank === 1 ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                        {user.rank}
                      </span>
                      <span className={`text-sm font-bold tracking-wide ${user.rank === 1 ? 'text-white' : 'text-zinc-300'}`}>
                        {user.name}
                      </span>
                      {user.rank === 1 && (
                        <Crown size={14} className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)] -ml-1" />
                      )}
                    </div>
                    <span className={`text-sm font-black tabular-nums ${user.rank === 1 ? 'text-fuchsia-400' : 'text-zinc-400'}`}>
                      {user.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── THE HARDWARE FLEX ── */}
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert size={14} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/80">Distractions Defeated</p>
              <p className="text-xs font-bold text-zinc-300">{stats.blocks} Phone Pick-Ups Blocked.</p>
            </div>
            <Lock size={16} className="text-zinc-600" />
          </div>

          {/* ── FOOTER / WATERMARK ── */}
          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
            <Activity size={10} className="text-white" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white">
              Generated by Focus Loop. Get the NFC Tag.
            </span>
          </div>

        </div>
      </div>

      {/* ── INTERACTIVE SHARE BUTTON ── */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-8 flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm tracking-wide text-white overflow-hidden relative group shadow-[0_10px_40px_-10px_rgba(236,72,153,0.5)]"
        style={{
          background: 'linear-gradient(135deg, #9333ea, #db2777)', // purple to pink
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 w-[200%] translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
        
        <Instagram size={20} className="relative z-10" />
        <span className="relative z-10 uppercase tracking-widest">Share to IG Story</span>
        <Share size={16} className="relative z-10 ml-1 opacity-70" />
      </motion.button>

      {/* Global shimmer keyframes (could be in standard css) */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
