/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Flame, Trophy, Smartphone, Users, LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  points: number;
  streak: number;
  username: string;
  isLinked: boolean;
  onSignOut?: () => void;
}

export default function Navbar({
  currentRole,
  setCurrentRole,
  points,
  streak,
  onSignOut
}: NavbarProps) {
  return (
    <nav className="bg-[#FAF8F5] border-b border-stone-200/85 px-4 py-3 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-left">
          <span className="text-lg font-display font-black tracking-tight text-stone-900 flex items-center gap-1.5 uppercase">
            FOCUSLOOP
            <span className="text-[8px] bg-stone-900 text-white border border-stone-900 rounded-full px-2 py-0.5 uppercase tracking-widest font-mono font-black shrink-0">
              V1.2
            </span>
          </span>
        </div>

        {/* ROLE SELECTOR */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Toggle Button Group */}
          <div className="bg-stone-100 rounded-xl p-1 flex gap-1 border border-stone-200/50">
            <button
              onClick={() => setCurrentRole('student')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                currentRole === 'student'
                  ? 'bg-stone-900 text-white shadow-3xs'
                  : 'text-stone-500 hover:text-stone-850'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              Student View
            </button>
            <button
              onClick={() => setCurrentRole('parent')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                currentRole === 'parent'
                  ? 'bg-stone-900 text-white shadow-3xs'
                  : 'text-stone-500 hover:text-stone-850'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              Parent View
            </button>
          </div>

          {/* Quick stats (Student Only) */}
          {currentRole === 'student' && (
            <div className="hidden md:flex items-center gap-3 bg-white rounded-xl px-3 py-1.5 border border-stone-200 text-xs font-mono font-bold">
              <div className="flex items-center gap-1 text-stone-850">
                <Trophy className="w-4 h-4 shrink-0 text-stone-700" />
                <span>{points.toLocaleString()} PTS</span>
              </div>
              <div className="w-px h-3.5 bg-stone-200" />
              <div className="flex items-center gap-1 text-stone-850">
                <Flame className="w-4 h-4 shrink-0 text-stone-750" />
                <span>{streak}D STREAK</span>
              </div>
            </div>
          )}

          {/* Log Out button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-500 hover:text-red-600 hover:border-red-200 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-mono font-bold uppercase"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}
