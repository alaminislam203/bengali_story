import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission() {
  if (!messaging) return null;
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        // Check if token already exists
        const q = query(collection(db, 'push_subscriptions'), where('token', '==', token));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Save token to push_subscriptions
          await addDoc(collection(db, 'push_subscriptions'), {
            token,
            userId: auth.currentUser?.uid || 'guest',
            createdAt: serverTimestamp()
          });
        }
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
}

export function onMessageListener(callback: (payload: any) => void) {
  if (!messaging) return;
  return onMessage(messaging, callback);
}
