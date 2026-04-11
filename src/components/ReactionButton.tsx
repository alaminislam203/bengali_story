import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/firebase';
import { 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReactionButtonProps {
  postId: string;
  initialLikeCount: number;
}

export default function ReactionButton({ postId, initialLikeCount }: ReactionButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [guestId, setGuestId] = useState<string>('');

  useEffect(() => {
    // Generate or retrieve guest ID
    let storedGuestId = localStorage.getItem('guest_id');
    if (!storedGuestId) {
      storedGuestId = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);
  }, []);

  useEffect(() => {
    const userId = user ? user.uid : guestId;
    if (!userId) return;

    const reactionId = `${userId}_${postId}`;
    const unsubscribe = onSnapshot(doc(db, 'reactions', reactionId), (doc) => {
      setLiked(doc.exists());
    });

    return () => unsubscribe();
  }, [user, guestId, postId]);

  // Also sync like count from post document
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'posts', postId), (doc) => {
      if (doc.exists()) {
        setLikeCount(doc.data().likeCount || 0);
      }
    });
    return () => unsubscribe();
  }, [postId]);

  const toggleLike = async () => {
    const userId = user ? user.uid : guestId;
    if (!userId) return;

    const reactionId = `${userId}_${postId}`;
    const postRef = doc(db, 'posts', postId);
    const reactionRef = doc(db, 'reactions', reactionId);

    try {
      if (liked) {
        await deleteDoc(reactionRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
        await setDoc(reactionRef, {
          postId,
          userId: userId,
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, { likeCount: increment(1) });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLike}
      className={cn(
        "gap-2 transition-all",
        liked && "bg-red-50 text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span>{likeCount}</span>
    </Button>
  );
}
