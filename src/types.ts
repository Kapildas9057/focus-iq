/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  username: string; // Anonymous username (e.g., FocusFalcon, ZenZebra)
  points: number;
  streak: number;
  dailyGoalMinutes: number;
  linkedParentId?: string;
  linkedStudentId?: string;
  grade?: string; // e.g., 'Class 10'
  board?: string; // e.g., 'CBSE'
  /** Future personalization hook — collected at onboarding, not yet used */
  studyChallenge?: 'retention' | 'distraction' | 'direction';
  /** Squad this user belongs to */
  squadId?: string;
}

export interface FocusSession {
  id: string;
  studentId: string;
  durationMinutes: number;
  elapsedSeconds: number;
  status: 'active' | 'paused' | 'completed' | 'interrupted';
  strikes: number;
  pointsEarned: number;
  createdAt: string; // ISO String
  /** Quiz results logged immediately after session */
  quizScore?: number;
  quizAccuracy?: number;
  quizSubject?: string;
  quizChapter?: string;
}

export interface BlockedApp {
  id: string;
  name: string;
  packageName: string;
  icon: string; // lucide icon name
  isBlocked: boolean;
}

export interface DistractionAttempt {
  id: string;
  studentId: string;
  appName: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  uid: string;
  username: string;
  points: number;
  streak: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface PairingCode {
  code: string;
  parentId: string;
  expiresAt: string; // ISO string (10 min duration)
  attemptsCount: number;
}

// ─── Squads ──────────────────────────────────────────────────────────────────

export interface Squad {
  id: string;
  name: string;
  syncCode: string;   // Short 6-char alphanumeric join code
  createdBy: string;  // uid of creator
  createdAt: string;  // ISO string
  memberIds: string[]; // array of uids
}

export interface SquadMember {
  uid: string;
  username: string;
  streak: number;
  points: number;
  rank: number; // relative rank within squad (by points)
}

export interface SquadInvite {
  id: string;
  squadId: string;
  squadName: string;
  inviterUid: string;
  inviterUsername: string;
  inviteeEmail: string; // Gmail address that was invited
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
