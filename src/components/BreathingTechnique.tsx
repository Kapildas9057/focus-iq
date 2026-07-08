import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Wind } from 'lucide-react';

interface BreathingTechniqueProps {
  onComplete: () => void;
}

export default function BreathingTechnique({ onComplete }: BreathingTechniqueProps) {
  useEffect(() => {
    // 15 seconds breathing
    const timer = setTimeout(onComplete, 15000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col items-center justify-center py-16 space-y-10"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-stone-800 tracking-tight">Prepare to Lock In</h2>
        <p className="text-xs font-mono text-stone-500 uppercase tracking-widest font-bold">Clear your mind</p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow / Inhale-Exhale Aura */}
        <motion.div
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: 4, // 2s inhale, 2s exhale
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-blue-500 rounded-full blur-2xl"
        />
        
        {/* Core bubble */}
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center justify-center z-10 border border-blue-300"
        >
          <Wind className="w-12 h-12 text-white/90 drop-shadow-md" />
        </motion.div>
      </div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-blue-600 font-mono text-sm tracking-[0.3em] uppercase font-black"
      >
        Inhale ... Exhale
      </motion.p>
    </motion.div>
  );
}
