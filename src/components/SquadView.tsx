import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Copy, CheckCircle, Mail, Plus, Trophy, Flame, ArrowRight, Loader
} from 'lucide-react';
import { UserProfile, Squad, SquadMember } from '../types';
import {
  createSquad, getSquad, joinSquadByCode, getSquadMembers, sendSquadInvite
} from '../utils/firebase';

interface SquadViewProps {
  studentProfile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

type SquadSubView = 'landing' | 'create' | 'join' | 'manage';

export default function SquadView({ studentProfile, onProfileUpdate }: SquadViewProps) {
  const [subView, setSubView] = useState<SquadSubView>(studentProfile.squadId ? 'manage' : 'landing');
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form
  const [squadName, setSquadName] = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  // Load squad if already in one
  useEffect(() => {
    if (studentProfile.squadId) {
      loadSquad(studentProfile.squadId);
    }
  }, [studentProfile.squadId]);

  const loadSquad = async (squadId: string) => {
    setLoading(true);
    try {
      const squadData = await getSquad(squadId) as Squad | null;
      if (squadData) {
        setSquad(squadData);
        const memberData = await getSquadMembers(squadData.memberIds || []);
        setMembers(memberData as SquadMember[]);
      }
    } catch (e) {
      setError('Failed to load squad. Please try again.');
    }
    setLoading(false);
  };

  const handleCreateSquad = async () => {
    if (!squadName.trim()) {
      setError('Please enter a squad name.');
      return;
    }
    setLoading(true);
    setError(null);
    const squadId = await createSquad(squadName.trim(), studentProfile.uid);
    if (squadId) {
      onProfileUpdate({ squadId });
      await loadSquad(squadId);
      setSubView('manage');
    } else {
      setError('Could not create squad. Please try again.');
    }
    setLoading(false);
  };

  const handleJoinSquad = async () => {
    if (joinCode.trim().length !== 6) {
      setError('Sync code must be 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await joinSquadByCode(joinCode.trim(), studentProfile.uid);
    if (result) {
      onProfileUpdate({ squadId: result.squadId });
      await loadSquad(result.squadId);
      setSubView('manage');
    } else {
      setError('Invalid sync code. Please double-check and try again.');
    }
    setLoading(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!squad) return;
    setLoading(true);
    setError(null);
    const ok = await sendSquadInvite(
      squad.id,
      squad.name,
      studentProfile.uid,
      studentProfile.username,
      inviteEmail.trim()
    );
    if (ok) {
      setInviteEmail('');
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } else {
      setError('Could not send invite. Please try again.');
    }
    setLoading(false);
  };

  const handleCopyCode = async () => {
    if (!squad?.syncCode) return;
    await navigator.clipboard.writeText(squad.syncCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── MANAGE VIEW (in a squad) ────────────────────────────────────────────
  if (subView === 'manage' && squad) {
    return (
      <div className="space-y-4">

        {/* Squad Header */}
        <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">{squad.name}</div>
              <div className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Sync Code */}
          <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-mono text-stone-400 uppercase tracking-wider mb-0.5">Squad Sync Code</div>
              <div className="text-base font-mono font-black text-stone-900 tracking-widest">{squad.syncCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer hover:bg-stone-200 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Squad Leaderboard */}
        <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-stone-700" />
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-bold">Squad Leaderboard</span>
          </div>
          {loading && members.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader className="w-4 h-4 text-stone-400 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-[11px] text-stone-400 text-center py-3">No members yet — share the sync code!</p>
          ) : (
            <div className="space-y-2">
              {members.map((member, i) => {
                const isMe = member.uid === studentProfile.uid;
                return (
                  <motion.div
                    key={member.uid}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      i === 0
                        ? 'bg-stone-900 border-stone-800 text-white'
                        : isMe
                        ? 'bg-stone-100 border-stone-300 text-stone-800'
                        : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[9px] font-mono font-black w-4 text-center ${i === 0 ? 'text-stone-400' : 'text-stone-400'}`}>
                        #{i + 1}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${
                        i === 0 ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {(member.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold">
                        {member.username}{isMe ? ' (You)' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <Flame className={`w-2.5 h-2.5 ${i === 0 ? 'text-orange-300' : 'text-orange-500'}`} />
                        <span className="text-[9px] font-mono font-bold">{member.streak}d</span>
                      </div>
                      <span className="text-[10px] font-mono font-black">{member.points}pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invite by email */}
        <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-stone-700" />
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-bold">Invite a Classmate</span>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="classmate@gmail.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
            />
            <button
              onClick={handleSendInvite}
              disabled={loading}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? <Loader className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
              Send
            </button>
          </div>
          <AnimatePresence>
            {inviteSent && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-mono text-green-700 font-bold"
              >
                <CheckCircle className="w-3 h-3" />
                Invite sent! They'll see it on next login.
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-mono text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── CREATE FORM ─────────────────────────────────────────────────────────
  if (subView === 'create') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSubView('landing'); setError(null); }}
          className="text-[10px] font-mono text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-900">Create a Squad</h3>
            <p className="text-[10px] text-stone-500 font-sans">Give your study group a name. A 6-char sync code is generated automatically.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Squad Name</label>
            <input
              type="text"
              placeholder="e.g. Physics Grinders"
              maxLength={32}
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-sans"
            />
          </div>
          {error && <p className="text-[10px] font-mono text-red-600">{error}</p>}
          <button
            onClick={handleCreateSquad}
            disabled={loading || !squadName.trim()}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create Squad
          </button>
        </div>
      </div>
    );
  }

  // ── JOIN FORM ───────────────────────────────────────────────────────────
  if (subView === 'join') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSubView('landing'); setError(null); }}
          className="text-[10px] font-mono text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-900">Join a Squad</h3>
            <p className="text-[10px] text-stone-500 font-sans">Enter the 6-character sync code your classmate shared.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">Sync Code</label>
            <input
              type="text"
              placeholder="e.g. ABC123"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900 font-mono font-black tracking-widest placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all text-center uppercase"
            />
          </div>
          {error && <p className="text-[10px] font-mono text-red-600">{error}</p>}
          <button
            onClick={handleJoinSquad}
            disabled={loading || joinCode.length !== 6}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Join Squad
          </button>
        </div>
      </div>
    );
  }

  // ── LANDING (no squad yet) ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Users className="w-7 h-7 text-stone-600" />
        </div>
        <h3 className="text-sm font-bold text-stone-900">Study Squads</h3>
        <p className="text-[11px] text-stone-500 mt-1 font-sans max-w-xs mx-auto">
          Compete and collaborate with classmates. Your squad's leaderboard appears on your Flex Card.
        </p>
      </div>

      <div className="space-y-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setSubView('create')}
          className="w-full flex items-center justify-between bg-stone-900 text-white px-5 py-4 rounded-2xl cursor-pointer hover:bg-stone-800 transition-all"
        >
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-wider">Create a Squad</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Be the squad leader — share the code</div>
          </div>
          <Plus className="w-4 h-4 text-stone-400" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setSubView('join')}
          className="w-full flex items-center justify-between bg-white border border-stone-200 text-stone-800 px-5 py-4 rounded-2xl cursor-pointer hover:bg-stone-50 transition-all"
        >
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-wider">Join a Squad</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Enter the 6-char sync code</div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
        </motion.button>
      </div>
    </div>
  );
}
