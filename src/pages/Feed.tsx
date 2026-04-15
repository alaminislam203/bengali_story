import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useFeed, useFeedComments } from '../lib/hooks';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, cn } from '../lib/utils';
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, BadgeCheck, MoreHorizontal, Bell, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface FeedProps {
  onNavigate: (page: string, slug?: string) => void;
}

function FeedCommentSection({ postId, authorId }: { postId: string; authorId: string }) {
  const { user, profile } = useAuth();
  const { comments, loading } = useFeedComments(postId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feed_comments'), {
        postId,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonymous',
        authorPhoto: profile?.photoURL || user.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'feed', postId), {
        commentCount: increment(1)
      });

      if (authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: authorId,
          fromUserId: user.uid,
          fromUserName: profile?.displayName || user.displayName || 'Someone',
          type: 'comment',
          message: `${profile?.displayName || user.displayName || 'Someone'} commented on your post.`,
          read: false,
          createdAt: serverTimestamp(),
          link: 'feed'
        });
      }

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'feed_comments', commentId));
      await updateDoc(doc(db, 'feed', postId), {
        commentCount: increment(-1)
      });
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="mt-4 space-y-4 pt-4 border-t border-muted/10">
      <div className="space-y-3">
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.authorPhoto} />
              <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/30 rounded-2xl px-4 py-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{comment.authorName}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(comment.createdAt?.toDate())}</span>
              </div>
              <p className="text-sm mt-0.5">{comment.content}</p>
              {(user?.uid === comment.authorId || user?.uid === authorId) && (
                <button 
                  onClick={() => deleteComment(comment.id)}
                  className="absolute -right-2 -top-2 bg-background shadow-sm border border-muted/20 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
            <AvatarFallback>{(profile?.displayName || user.displayName || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input 
              placeholder="Write a comment..." 
              className="rounded-full bg-muted/30 border-none h-8 pr-10 text-sm"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-primary"
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Feed({ onNavigate }: FeedProps) {
  const { user, profile } = useAuth();
  const { posts, loading } = useFeed();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feed'), {
        content: content.trim(),
        image: imageUrl.trim() || null,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonymous',
        authorPhoto: profile?.photoURL || user.photoURL || '',
        authorIsVerified: profile?.isVerified || false,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        likedBy: []
      });
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      toast.success('Post shared to feed!');
    } catch (error) {
      console.error('Error posting to feed:', error);
      toast.error('Failed to share post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, likedBy: string[]) => {
    if (!user) {
      toast.error('Please login to react.');
      return;
    }

    const isLiked = (likedBy || []).includes(user.uid);
    const postRef = doc(db, 'feed', postId);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likeCount: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likeCount: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        
        // Create notification for author
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: post.authorId,
            fromUserId: user.uid,
            fromUserName: profile?.displayName || user.displayName || 'Someone',
            type: 'like',
            message: `${profile?.displayName || user.displayName || 'Someone'} liked your post.`,
            read: false,
            createdAt: serverTimestamp(),
            link: 'feed'
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Community Feed</h1>
        <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => onNavigate('notifications')}>
          <Bell className="h-6 w-6" />
        </Button>
      </div>

      {user && (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
                  <AvatarFallback>{(profile?.displayName || user.displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <Textarea 
                    placeholder="What's on your mind?" 
                    className="min-h-[100px] resize-none border-none bg-transparent focus-visible:ring-0 text-lg p-0"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  {showImageInput && (
                    <div className="relative">
                      <Input 
                        placeholder="Paste image URL here..." 
                        className="rounded-xl bg-muted/20 border-none"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={() => {
                          setImageUrl('');
                          setShowImageInput(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-muted/20">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className={cn("rounded-full text-muted-foreground hover:text-primary", showImageInput && "text-primary bg-primary/5")}
                  onClick={() => setShowImageInput(!showImageInput)}
                >
                  <ImageIcon className="h-5 w-5 mr-2" /> Photo
                </Button>
                <Button type="submit" disabled={!content.trim() || isSubmitting} className="rounded-full px-6">
                  {isSubmitting ? 'Posting...' : 'Post'} <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : posts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm overflow-hidden group">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 cursor-pointer" onClick={() => onNavigate('author', post.authorId)}>
                        <AvatarImage src={post.authorPhoto} />
                        <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span 
                            className="font-bold hover:text-primary cursor-pointer transition-colors"
                            onClick={() => onNavigate('author', post.authorId)}
                          >
                            {post.authorName}
                          </span>
                          {post.authorIsVerified && (
                            <div className="relative group/badge">
                              <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/10 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Verified Author
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(post.createdAt?.toDate())}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.image && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-muted/20 bg-muted/5">
                        <img 
                          src={post.image} 
                          alt="Post content" 
                          className="w-full h-auto object-cover max-h-[500px]" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {expandedComments[post.id] && (
                      <FeedCommentSection postId={post.id} authorId={post.authorId} />
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-muted/10 flex justify-between">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors",
                          post.likedBy?.includes(user?.uid) && "text-red-500 bg-red-500/5"
                        )}
                        onClick={() => handleLike(post.id, post.likedBy || [])}
                      >
                        <Heart className={cn("h-5 w-5 mr-1.5", post.likedBy?.includes(user?.uid) && "fill-current")} />
                        {post.likeCount || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "rounded-full hover:bg-primary/10 hover:text-primary transition-colors",
                          expandedComments[post.id] && "text-primary bg-primary/5"
                        )}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle className="h-5 w-5 mr-1.5" />
                        {post.commentCount || 0}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                      <Share2 className="h-5 w-5 mr-1.5" /> Share
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted/30">
            <p className="text-muted-foreground text-lg">No posts yet. Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}

