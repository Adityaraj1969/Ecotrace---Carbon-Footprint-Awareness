import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const userRef = (uid) => doc(db, 'users', uid);

export async function getUserData(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveProfile(uid, profile) {
  await setDoc(userRef(uid), { profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveCarbon(uid, inputs, categoryCO2) {
  await setDoc(userRef(uid), {
    transport: inputs.transport,
    home:      inputs.home,
    food:      inputs.food,
    shopping:  inputs.shopping,
    categoryCO2,
    totalCO2:  categoryCO2.total,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveGoal(uid, targetKg, startCO2) {
  await setDoc(userRef(uid), {
    goal: { targetKg, startCO2, startDate: serverTimestamp() },
  }, { merge: true });
}

export async function logHabits(uid, dateStr, habits, co2Saved) {
  const logRef = doc(db, 'users', uid, 'habitLogs', dateStr);
  await setDoc(logRef, { habits, co2Saved, ts: serverTimestamp() });
}

export async function getHabitLog(uid, dateStr) {
  const snap = await getDoc(doc(db, 'users', uid, 'habitLogs', dateStr));
  return snap.exists() ? snap.data() : null;
}

export async function updateStreak(uid, streak, badges, lastDate) {
  await updateDoc(userRef(uid), {
    'habits.streak':   streak,
    'habits.badges':   badges,
    'habits.lastDate': lastDate,
  });
}
