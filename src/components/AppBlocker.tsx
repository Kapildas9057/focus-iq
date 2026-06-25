/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Smartphone, Youtube, Instagram, MessageCircle, 
  Video, EyeOff, Eye, AlertTriangle, AlertCircle
} from 'lucide-react';
import { BlockedApp } from '../types';

interface AppBlockerProps {
  blockedApps: BlockedApp[];
  setBlockedApps: (apps: BlockedApp[]) => void;
  isSessionActive: boolean;
  onDistractionAttempt: (appName: string) => void;
}

export default function AppBlocker({
  blockedApps,
  setBlockedApps,
  isSessionActive,
  onDistractionAttempt
}: AppBlockerProps) {
  const [activeTab, setActiveTab] = useState<'applist' | 'simulator'>('applist');
  const [simulatedScreen, setSimulatedScreen] = useState<'home' | 'blocked'>('home');
  const [blockedAppName, setBlockedAppName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Toggle blocking state of an app
  const toggleBlockApp = (id: string) => {
    const updated = blockedApps.map(app => {
      if (app.id === id) {
        return { ...app, isBlocked: !app.isBlocked };
      }
      return app;
    });
    setBlockedApps(updated);
  };

  // Simulated clicking on an app inside the smartphone container
  const handleSimulatedAppClick = (app: BlockedApp) => {
    if (app.isBlocked && isSessionActive) {
      setBlockedAppName(app.name);
      setSimulatedScreen('blocked');
      onDistractionAttempt(app.name);
    } else {
      setFeedbackMsg(`Launching ${app.name}... (Allowed: Session is inactive or app is unblocked)`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Icon mapper helper
  const getAppIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Video': return <Video className={className} />;
      case 'Instagram': return <Instagram className={className} />;
      case 'Youtube': return <Youtube className={className} />;
      case 'MessageCircle': return <MessageCircle className={className} />;
      default: return <Smartphone className={className} />;
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
        <h2 id="blocker-title" className="text-sm font-bold tracking-tight text-stone-950 flex items-center gap-1.5 font-display">
          <Shield className="w-4.5 h-4.5 text-stone-700" />
          Shield Controller
        </h2>
        
        {/* Sub-tabs */}
        <div className="bg-stone-100 rounded-xl p-1 flex gap-1 border border-stone-200/40">
          <button
            onClick={() => setActiveTab('applist')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'applist'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Distraction App
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'applist' ? (
          <motion.div
            key="applist"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Define which applications are locked while your focus timer is active. 
              The application shielding service monitors activity to protect your block.
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none pr-0.5">
              {blockedApps.map((app) => (
                <div 
                  key={app.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    app.isBlocked 
                      ? 'bg-red-50/45 border-red-200/50' 
                      : 'bg-[#FAF9F5] border-stone-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg border ${
                      app.isBlocked ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-stone-200 text-stone-600'
                    }`}>
                      {getAppIcon(app.icon, 'w-4 h-4')}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-stone-800">{app.name}</div>
                      <div className="text-[9px] text-stone-400 font-mono">{app.packageName}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBlockApp(app.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                      app.isBlocked
                        ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                        : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                    }`}
                  >
                    {app.isBlocked ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Blocked
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Allowed
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col items-center"
          >
            <p className="text-[11px] text-stone-500 mb-3 text-center max-w-sm leading-relaxed">
              Launch an app on this simulated phone screen to test active redirection and blocking.
            </p>

            {/* Simulated Smartphone */}
            <div className="w-56 h-[340px] bg-white border-4 border-stone-300 rounded-[24px] relative shadow-md flex flex-col overflow-hidden">
              {/* Notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-stone-200 rounded-b-lg z-20" />

              {/* Screen Area */}
              <div className="flex-1 p-3 pt-6 bg-stone-50 relative flex flex-col justify-between select-none">
                
                {simulatedScreen === 'home' ? (
                  <>
                    {/* Status Header */}
                    <div className="flex justify-between items-center text-[8px] font-mono text-stone-400 mb-2">
                      <span>12:00 PM</span>
                      <span>100%</span>
                    </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-3 gap-y-4 gap-x-1 text-center mt-2">
                      {blockedApps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => handleSimulatedAppClick(app)}
                          className="flex flex-col items-center relative cursor-pointer group"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                            app.id === 'tiktok' ? 'bg-black border-black text-white' :
                            app.id === 'instagram' ? 'bg-stone-900 border-stone-900 text-white' :
                            app.id === 'youtube' ? 'bg-red-600 border-red-600 text-white' :
                            app.id === 'reddit' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-stone-200 border-stone-300 text-stone-700'
                          }`}>
                            {getAppIcon(app.icon, 'w-4 h-4')}
                            {app.isBlocked && isSessionActive && (
                              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] p-0.5 rounded-full border border-white">
                                <AlertTriangle className="w-2 h-2" />
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-stone-500 mt-1 truncate max-w-full">
                            {app.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    {feedbackMsg && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-stone-200 text-stone-600 p-1.5 rounded-lg text-[9px] font-mono leading-normal shadow-3xs"
                      >
                        {feedbackMsg}
                      </motion.div>
                    )}

                    <div className="text-center mt-2">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-mono border ${
                        isSessionActive 
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-100 text-stone-400 border-stone-200'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${isSessionActive ? 'bg-white animate-pulse' : 'bg-stone-300'}`} />
                        {isSessionActive ? 'Focus Block Active' : 'Device Shield Idle'}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Redirection Shield Screen */
                  <motion.div 
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 flex flex-col justify-between text-center py-2"
                  >
                    <div />
                    <div className="flex flex-col items-center px-1">
                      <div className="w-10 h-10 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mb-2.5">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                        Screen Locked
                      </h3>
                      <p className="text-[10px] text-stone-500 leading-normal">
                        <strong>{blockedAppName}</strong> is currently blocked by your parent\'s FocusLoop rules.
                      </p>
                    </div>

                    <button
                      onClick={() => setSimulatedScreen('home')}
                      className="bg-stone-900 hover:bg-stone-800 text-white text-[9px] font-mono font-bold uppercase tracking-wider py-1.5 px-4 rounded-lg self-center shadow-3xs cursor-pointer"
                    >
                      Return
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Bottom capsule pill */}
              <div className="h-4 flex items-center justify-center bg-stone-100 border-t border-stone-200/50">
                <button 
                  onClick={() => setSimulatedScreen('home')}
                  className="w-12 h-1 bg-stone-300 rounded-full" 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
