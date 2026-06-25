/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, ShieldAlert, Award } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserUsername: string;
}

export default function Leaderboard({ entries, currentUserUsername }: LeaderboardProps) {
  // Sort entries descending by points
  const sorted = [...entries].sort((a, b) => b.points - a.points);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-800">
            <Trophy className="w-3 h-3 text-stone-800" />
          </div>
        );
      case 2:
        return (
          <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
            <Medal className="w-3 h-3 text-stone-600" />
          </div>
        );
      case 3:
        return (
          <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500">
            <Medal className="w-3 h-3 text-stone-500" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 text-stone-400 font-mono text-[10px] font-bold flex items-center justify-center">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-4.5 shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
        <h2 id="leaderboard-title" className="text-sm font-bold text-stone-950 flex items-center gap-1.5 font-display">
          <Award className="w-4.5 h-4.5 text-stone-700" />
          Weekly Leaderboard
        </h2>
        <span className="text-[8px] font-mono bg-stone-100 text-stone-600 py-0.5 px-2 rounded-full border border-stone-200 font-bold">
          ENDS IN 3D
        </span>
      </div>

      <p className="text-[11px] text-stone-500 mb-3 leading-relaxed text-left">
        Study rankings are updated in real-time. Keep up your daily streak to earn bonus multipliers.
      </p>

      {/* Leaderboard list */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
        {sorted.map((user, index) => {
          const isMe = user.username === currentUserUsername;
          const currentRank = index + 1;
          
          return (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isMe
                  ? 'bg-stone-100 border-stone-300'
                  : 'bg-white border-stone-200/60 hover:border-stone-300'
              }`}
            >
              {/* Left Rank and Username */}
              <div className="flex items-center gap-2">
                {getRankBadge(currentRank)}
                
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold truncate max-w-[120px] ${
                      isMe ? 'text-stone-950' : 'text-stone-700'
                    }`}>
                      {user.username}
                    </span>
                    {isMe && (
                      <span className="text-[7px] font-bold font-mono uppercase bg-stone-900 text-white px-1 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-stone-400 font-mono">
                    <Star className="w-2.5 h-2.5 text-stone-400 fill-stone-300" />
                    <span>{user.streak} day streak</span>
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="text-xs font-bold text-stone-800 font-mono">
                  {user.points.toLocaleString()}
                </div>
                <div className="text-[7px] text-stone-400 uppercase tracking-wider font-mono">
                  PTS
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Privacy note */}
      <div className="flex gap-2 items-start bg-stone-50 rounded-xl border border-stone-200/55 p-2.5 mt-3 text-left">
        <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
        <p className="text-[9px] text-stone-500 leading-normal">
          Profiles are secure and encrypted. Student records use fully randomized usernames to ensure privacy.
        </p>
      </div>
    </div>
  );
}
