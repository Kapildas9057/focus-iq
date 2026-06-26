/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

/** Common distracting apps that students can add to their block list */
export const SUGGESTED_APPS = [
  { id: 'tiktok', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: 'Video' },
  { id: 'instagram', name: 'Instagram', packageName: 'com.instagram.android', icon: 'Instagram' },
  { id: 'youtube', name: 'YouTube', packageName: 'com.google.android.youtube', icon: 'Youtube' },
  { id: 'twitter', name: 'Twitter / X', packageName: 'com.twitter.android', icon: 'Twitter' },
  { id: 'reddit', name: 'Reddit', packageName: 'com.reddit.frontpage', icon: 'MessageCircle' },
  { id: 'snapchat', name: 'Snapchat', packageName: 'com.snapchat.android', icon: 'Camera' },
];
