import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useComments, Comment } from '../lib/hooks';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { Heart, MessageCircle, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { moderateContent } from '../lib/gemini';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading } = useComments(postId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isGuarding, setIsGuarding] = useState(false);
  const [guestId, setGuestId] = useState<string>('');

  useEffect(() => {
    let storedGuestId = localStorage.getItem('guest_id');
    if (!storedGuestId) {
      storedGuestId = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', storedGuestId);
    }
    setGuestId(storedGuestId);
  }, []);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    const authorId = user ? user.uid : 'guest';
    const authorName = user ? (user.displayName || 'Anonymous') : 'Guest User';
    const authorPhoto = user ? (user.photoURL || '') : '';

    setSubmitting(true);
    setIsGuarding(true);
    
    try {
      // AI Security Guard Scan
      const moderation = await moderateContent(content);
      
      if (!moderation.safe) {
        // Log blocked attempt
        await addDoc(collection(db, 'security_logs'), {
          type: 'threat_blocked',
          content: content.substring(0, 100).trim() + (content.length > 100 ? '...' : ''),
          authorName,
          reason: moderation.reason,
          category: moderation.category,
          createdAt: serverTimestamp()
        });

        toast.error(`AI Guard: ${moderation.reason || 'Content flagged as unsafe.'}`, {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
          duration: 5000
        });
        setIsGuarding(false);
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'comments'), {
        postId,
        authorId,
        authorName,
        authorPhoto,
        content: content.trim(),
        createdAt: serverTimestamp(),
        status: 'approved',
        parentId: parentId || null,
        likeCount: 0,
        likedBy: [],
        aiVerified: true,
        aiConfidence: moderation.confidence
      });

      // Log successful moderation
      await addDoc(collection(db, 'security_logs'), {
        type: 'comment_approved',
        content: content.substring(0, 100).trim() + (content.length > 100 ? '...' : ''),
        authorName,
        confidence: moderation.confidence,
        createdAt: serverTimestamp()
      });
      
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      toast.success("AI Guard verified: Comment posted!", {
        icon: <ShieldCheck className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment.");
    } finally {
      setSubmitting(false);
      setIsGuarding(false);
    }
  };

  const handleLike = async (commentId: string, isLiked: boolean) => {
    const userId = user ? user.uid : guestId;
    if (!userId) return;
    
    try {
      const commentRef = doc(db, 'comments', commentId);
      if (isLiked) {
        await updateDoc(commentRef, {
          likeCount: increment(-1),
          likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(commentRef, {
          likeCount: increment(1),
          likedBy: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast.error("Failed to react.");
    }
  };

  // Organize comments into a tree
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const CommentNode = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const userId = user ? user.uid : guestId;
    const isLiked = (comment.likedBy || []).includes(userId);
    const replies = getReplies(comment.id);

    return (
      <div className={`flex gap-4 ${isReply ? 'mt-4 ml-8 md:ml-12' : ''}`}>
        <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
          <AvatarImage src={comment.authorPhoto} />
          <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt?.toDate())}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center gap-4 pt-1">
            <button 
              onClick={() => handleLike(comment.id, isLiked)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likeCount || 0}
            </button>
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 space-y-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting || !replyContent.trim()}>
                  Reply
                </Button>
              </div>
            </form>
          )}

          {/* Render Replies */}
          {replies.length > 0 && (
            <div className="space-y-4 pt-2">
              {replies.map(reply => (
                <CommentNode key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mt-12 pt-12 border-t">
      <h3 className="text-2xl font-bold">Comments ({comments.length})</h3>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <Button type="submit" disabled={submitting || !newComment.trim()} className="gap-2">
          {isGuarding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI Guard Scanning...
            </>
          ) : submitting ? (
            'Posting...'
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Post Comment
            </>
          )}
        </Button>
      </form>

      <div className="space-y-8 pt-4">
        {loading ? (
          <p>Loading comments...</p>
        ) : rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
