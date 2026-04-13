import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/auth-context';

interface ShareButtonsProps {
  postId: string;
  title: string;
  url: string;
}

export default function ShareButtons({ postId, title, url }: ShareButtonsProps) {
  const { user } = useAuth();

  const trackShare = async () => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        shareCount: increment(1)
      });

      // Award points for sharing (3 points)
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const publicProfileRef = doc(db, 'public_profiles', user.uid);
        
        await updateDoc(userRef, {
          points: increment(3),
          updatedAt: serverTimestamp()
        });
        
        await updateDoc(publicProfileRef, {
          points: increment(3)
        });
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        trackShare();
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    trackShare();
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    trackShare();
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    trackShare();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">Share:</span>
      <Button variant="outline" size="icon" className="rounded-full" onClick={shareToTwitter} title="Share on Twitter">
        <Twitter className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full" onClick={shareToFacebook} title="Share on Facebook">
        <Facebook className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full" onClick={copyToClipboard} title="Copy Link">
        <LinkIcon className="h-4 w-4" />
      </Button>
      {navigator.share && (
        <Button variant="default" size="icon" className="rounded-full" onClick={handleNativeShare} title="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
