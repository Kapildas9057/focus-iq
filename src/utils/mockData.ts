/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeaderboardEntry, BlockedApp } from '../types';

export const ANONYMOUS_ADJECTIVES = [
  'Focus', 'Zen', 'Calm', 'Mindful', 'Silent', 'Deep', 'Stellar', 
  'Active', 'Steady', 'Bright', 'Swift', 'Patient', 'Quiet', 'Serene'
];

export const ANONYMOUS_ANIMALS = [
  'Falcon', 'Zebra', 'Llama', 'Badger', 'Panda', 'Koala', 'Fox', 
  'Owl', 'Beaver', 'Otter', 'Eagle', 'Cheetah', 'Leopard', 'Turtle'
];

export function generateAnonymousUsername(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const animal = ANONYMOUS_ANIMALS[Math.floor(Math.random() * ANONYMOUS_ANIMALS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${animal}${num}`;
}

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { uid: 'mock_1', username: 'DeepBeaver883', points: 3450, streak: 12, rank: 1 },
  { uid: 'mock_2', username: 'MindfulOtter412', points: 2980, streak: 8, rank: 2 },
  { uid: 'mock_3', username: 'SilentPanda102', points: 2600, streak: 6, rank: 3 },
  { uid: 'mock_4', username: 'CalmFalcon552', points: 2420, streak: 5, rank: 4 },
  { uid: 'mock_5', username: 'SteadyFox321', points: 1980, streak: 4, rank: 5 },
  { uid: 'mock_6', username: 'ZenLlama991', points: 1540, streak: 3, rank: 6 },
  { uid: 'mock_7', username: 'ActiveOwl204', points: 1200, streak: 2, rank: 7 },
  { uid: 'mock_8', username: 'StellarKoala617', points: 950, streak: 1, rank: 8 },
];

export const DEFAULT_BLOCKED_APPS: BlockedApp[] = [
  { id: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: 'Video', isBlocked: true },
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', icon: 'Instagram', isBlocked: true },
  { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube', icon: 'Youtube', isBlocked: true },
  { id: 'twitter', name: 'Twitter / X', packageName: 'com.twitter.android', icon: 'Twitter', isBlocked: false },
  { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage', icon: 'MessageCircle', isBlocked: true },
];
