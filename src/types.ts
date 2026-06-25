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
