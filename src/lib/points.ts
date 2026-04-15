import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type PointAction = 'post' | 'comment' | 'reaction' | 'share';

export async function awardPoints(userId: string, action: PointAction) {
  if (!userId) return;

  try {
    // Get points config from settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'main'));
    const pointsConfig = settingsDoc.exists() ? settingsDoc.data().pointsConfig : null;
    
    // Default values if not set
    const defaultPoints = {
      post: 10,
      comment: 2,
      reaction: 1,
      share: 5
    };

    const pointsToAdd = pointsConfig?.[action] ?? defaultPoints[action];

    if (pointsToAdd <= 0) return;

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(pointsToAdd)
    }).catch(async (err) => {
      // If document doesn't exist (shouldn't happen for logged in user but just in case)
      if (err.code === 'not-found') {
        await setDoc(userRef, { points: pointsToAdd }, { merge: true });
      }
    });

    // Update public profile
    const profileRef = doc(db, 'public_profiles', userId);
    await updateDoc(profileRef, {
      points: increment(pointsToAdd)
    }).catch(async (err) => {
      if (err.code === 'not-found') {
        await setDoc(profileRef, { points: pointsToAdd }, { merge: true });
      }
    });

    console.log(`Awarded ${pointsToAdd} points to user ${userId} for ${action}`);
  } catch (error) {
    console.error("Error awarding points:", error);
  }
}
