/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, getDocFromServer, collection, 
  setDoc, getDoc, getDocs, updateDoc, addDoc, query, where, orderBy, limit, deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

// Test Connection on startup as required by Firestore integration skill
async function testConnection() {
  try {
    // Attempting a server read to verify connectivity as per skill guideline
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    } else {
      console.warn("Firestore test call handled:", error.message);
    }
  }
}

testConnection();

export { db, auth };

// Firebase synchronization helpers for FocusLoop
export async function syncUserProfile(uid: string, profile: any) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, profile, { merge: true });
  } catch (e) {
    console.error("Failed to sync user profile with Firebase:", e);
  }
}

export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Failed to fetch user profile from Firebase:", e);
    return null;
  }
}

export async function getStudentProfileByCode(code: string) {
  try {
    const q = query(collection(db, 'pairingCodes'), where('code', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
    return null;
  } catch (e) {
    console.error("Failed to verify pairing code in Firebase:", e);
    return null;
  }
}

export async function createFirebasePairingCode(code: string, parentId: string) {
  try {
    const codeRef = doc(db, 'pairingCodes', code);
    await setDoc(codeRef, {
      code,
      parentId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attemptsCount: 0
    });
  } catch (e) {
    console.error("Failed to store pairing code in Firebase:", e);
  }
}

export async function deleteFirebasePairingCode(code: string) {
  try {
    const codeRef = doc(db, 'pairingCodes', code);
    await deleteDoc(codeRef);
  } catch (e) {
    console.error("Failed to delete pairing code in Firebase:", e);
  }
}

export async function saveFocusSessionFirebase(session: any) {
  try {
    const sessionRef = doc(db, 'focusSessions', session.id);
    await setDoc(sessionRef, session);
  } catch (e) {
    console.error("Failed to save focus session to Firebase:", e);
  }
}

export async function getFocusHistoryFirebase(studentId: string) {
  try {
    const q = query(
      collection(db, 'focusSessions'), 
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const sessions: any[] = [];
    snap.forEach((docSnap) => {
      sessions.push(docSnap.data());
    });
    // Sort client-side by createdAt desc
    sessions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    return sessions.slice(0, 20);
  } catch (e) {
    console.error("Failed to fetch focus sessions from Firebase:", e);
    return [];
  }
}

export async function logDistractionAttemptFirebase(attempt: any) {
  try {
    const attemptRef = doc(db, 'distractionAttempts', attempt.id);
    await setDoc(attemptRef, attempt);
  } catch (e) {
    console.error("Failed to save distraction attempt to Firebase:", e);
  }
}

export async function getDistractionAttemptsFirebase(studentId: string) {
  try {
    const q = query(
      collection(db, 'distractionAttempts'),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const attempts: any[] = [];
    snap.forEach((docSnap) => {
      attempts.push(docSnap.data());
    });
    // Sort client-side by timestamp desc
    attempts.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });
    return attempts.slice(0, 20);
  } catch (e) {
    console.error("Failed to fetch distraction attempts from Firebase:", e);
    return [];
  }
}

export async function syncBlockedAppsFirebase(userId: string, app: any) {
  try {
    const appRef = doc(db, 'users', userId, 'blockedApps', app.id);
    await setDoc(appRef, app, { merge: true });
  } catch (e) {
    console.error("Failed to sync blocked app state to Firebase:", e);
  }
}

export async function getBlockedAppsFirebase(userId: string) {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'blockedApps'));
    const apps: any[] = [];
    snap.forEach((docSnap) => {
      apps.push(docSnap.data());
    });
    return apps;
  } catch (e) {
    console.error("Failed to fetch blocked apps from Firebase:", e);
    return [];
  }
}

export async function getLeaderboardFirebase() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    const snap = await getDocs(q);
    const leaders: any[] = [];
    snap.forEach((docSnap) => {
      leaders.push(docSnap.data());
    });
    // Sort client-side by points desc
    leaders.sort((a, b) => (b.points || 0) - (a.points || 0));
    return leaders.slice(0, 10);
  } catch (e) {
    console.error("Failed to query leaderboard from Firebase:", e);
    return [];
  }
}

export async function getUserByEmail(email: string) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
    return null;
  } catch (e) {
    console.error("Failed to query user by email from Firebase:", e);
    return null;
  }
}

// ─── Squad Functions ─────────────────────────────────────────────────────────

/** Generates a 6-char alphanumeric sync code */
function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createSquad(name: string, creatorUid: string): Promise<string | null> {
  try {
    const syncCode = generateSyncCode();
    const squadRef = doc(collection(db, 'squads'));
    const squad = {
      id: squadRef.id,
      name,
      syncCode,
      createdBy: creatorUid,
      createdAt: new Date().toISOString(),
      memberIds: [creatorUid],
    };
    await setDoc(squadRef, squad);
    // Store squadId on the user's profile
    await updateDoc(doc(db, 'users', creatorUid), { squadId: squadRef.id });
    return squadRef.id;
  } catch (e) {
    console.error("Failed to create squad in Firebase:", e);
    return null;
  }
}

export async function getSquad(squadId: string) {
  try {
    const snap = await getDoc(doc(db, 'squads', squadId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Failed to get squad from Firebase:", e);
    return null;
  }
}

export async function joinSquadByCode(syncCode: string, uid: string): Promise<{ squadId: string } | null> {
  try {
    const q = query(collection(db, 'squads'), where('syncCode', '==', syncCode.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const squadDoc = snap.docs[0];
    const squadId = squadDoc.id;
    const memberIds: string[] = squadDoc.data().memberIds || [];
    if (!memberIds.includes(uid)) {
      memberIds.push(uid);
      await updateDoc(doc(db, 'squads', squadId), { memberIds });
    }
    await updateDoc(doc(db, 'users', uid), { squadId });
    return { squadId };
  } catch (e) {
    console.error("Failed to join squad by code in Firebase:", e);
    return null;
  }
}

export async function getSquadMembers(memberIds: string[]): Promise<any[]> {
  if (memberIds.length === 0) return [];
  try {
    const members: any[] = [];
    // Firestore 'in' query supports max 10 items
    const chunks = [];
    for (let i = 0; i < memberIds.length; i += 10) {
      chunks.push(memberIds.slice(i, i + 10));
    }
    for (const chunk of chunks) {
      const q = query(collection(db, 'users'), where('uid', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((d) => members.push(d.data()));
    }
    members.sort((a, b) => (b.points || 0) - (a.points || 0));
    return members.map((m, i) => ({ ...m, rank: i + 1 }));
  } catch (e) {
    console.error("Failed to fetch squad members from Firebase:", e);
    return [];
  }
}

export async function sendSquadInvite(
  squadId: string,
  squadName: string,
  inviterUid: string,
  inviterUsername: string,
  inviteeEmail: string
): Promise<boolean> {
  try {
    const inviteRef = doc(collection(db, 'squadInvites'));
    await setDoc(inviteRef, {
      id: inviteRef.id,
      squadId,
      squadName,
      inviterUid,
      inviterUsername,
      inviteeEmail: inviteeEmail.toLowerCase().trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error("Failed to send squad invite in Firebase:", e);
    return false;
  }
}

export async function getPendingInvites(email: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'squadInvites'),
      where('inviteeEmail', '==', email.toLowerCase().trim()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Failed to fetch pending squad invites from Firebase:", e);
    return [];
  }
}

export async function respondToSquadInvite(
  inviteId: string,
  uid: string,
  accept: boolean
): Promise<boolean> {
  try {
    const inviteRef = doc(db, 'squadInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) return false;

    const invite = inviteSnap.data();
    await updateDoc(inviteRef, { status: accept ? 'accepted' : 'declined' });

    if (accept && invite.squadId) {
      const result = await joinSquadByCode('', uid); // We don't need code; join directly
      // Direct join without code
      const squadRef = doc(db, 'squads', invite.squadId);
      const squadSnap = await getDoc(squadRef);
      if (squadSnap.exists()) {
        const memberIds: string[] = squadSnap.data().memberIds || [];
        if (!memberIds.includes(uid)) {
          memberIds.push(uid);
          await updateDoc(squadRef, { memberIds });
        }
        await updateDoc(doc(db, 'users', uid), { squadId: invite.squadId });
      }
    }
    return true;
  } catch (e) {
    console.error("Failed to respond to squad invite in Firebase:", e);
    return false;
  }
}
