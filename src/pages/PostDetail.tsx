import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, useSettings, useCategories, useBookmarks } from '../lib/hooks';
import { useAuth } from '../lib/auth-context';
import { formatDate, calculateReadingTime, cn, getBadgeByPoints } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Eye, ArrowRight, Clock, FolderTree, Tags, Bookmark, BookmarkCheck, CheckCircle, Award, Share2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import ReactionButton from '../components/ReactionButton';
import CommentSection from '../components/CommentSection';
import ShareButtons from '../components/ShareButtons';
import AdSpace from '../components/AdSpace';
import TextToSpeech from '../components/TextToSpeech';
import AITextToSpeech from '../components/AITextToSpeech';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface PostDetailProps {
  slug: string;
  onNavigate: (page: string, slug?: string) => void;
}

export default function PostDetail({ slug, onNavigate }: PostDetailProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { categories } = useCategories();
  const { bookmarks } = useBookmarks(user?.uid);
  const [post, setPost] = useState<Post | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const isBookmarked = post ? bookmarks.some(b => b.postId === post.id) : false;
  const bookmarkDocId = post ? bookmarks.find(b => b.postId === post.id)?.id : null;

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to save posts.");
      return;
    }
    if (!post) return;

    setIsBookmarking(true);
    try {
      if (isBookmarked && bookmarkDocId) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkDocId));
        toast.success("Post removed from bookmarks.");
      } else {
        await addDoc(collection(db, 'bookmarks'), {
          userId: user.uid,
          postId: post.id,
          createdAt: new Date()
        });
        toast.success("Post saved to bookmarks!");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark.");
    } finally {
      setIsBookmarking(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'posts'), 
          where('slug', '==', slug), 
          where('status', '==', 'published'),
          limit(1)
        );
        let querySnapshot = await getDocs(q);
        
        // If not found, try without status filter (for admins/authors previewing drafts)
        if (querySnapshot.empty) {
          try {
            const draftQ = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
            querySnapshot = await getDocs(draftQ);
          } catch (e) {
            // Ignore permission errors for guests trying to read drafts
          }
        }
        
        if (!querySnapshot.empty) {
          const postDoc = querySnapshot.docs[0];
          const postData = { id: postDoc.id, ...(postDoc.data() as any) } as Post;
          setPost(postData);
          
          // Increment view count
          try {
            const postRef = doc(db, 'posts', postDoc.id);
            await updateDoc(postRef, {
              viewCount: increment(1)
            });
          } catch (e) {
            console.error("Error updating view count:", e);
          }

          // Fetch author profile
          try {
            const authorDoc = await getDocs(query(collection(db, 'public_profiles'), where('uid', '==', postData.authorId), limit(1)));
            if (!authorDoc.empty) {
              setAuthorProfile(authorDoc.docs[0].data());
            }
          } catch (e) {
            console.error("Error fetching author profile:", e);
          }

          // Fetch related posts (same category)
          try {
            let relatedQ;
            if (postData.categoryId) {
              relatedQ = query(
                collection(db, 'posts'), 
                where('status', '==', 'published'),
                where('categoryId', '==', postData.categoryId),
                where('slug', '!=', slug),
                limit(3)
              );
            } else {
              relatedQ = query(
                collection(db, 'posts'), 
                where('status', '==', 'published'),
                where('slug', '!=', slug),
                limit(3)
              );
            }
            const relatedSnapshot = await getDocs(relatedQ);
            setRelatedPosts(relatedSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Post)));
          } catch (e) {
            console.error("Error fetching related posts:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <Button onClick={() => onNavigate('blog')}>Back to Blog</Button>
      </div>
    );
  }

  const authorBadge = getBadgeByPoints(authorProfile?.points || 0);

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-muted/30">
        <div 
          className="h-full bg-primary transition-all duration-150 ease-out" 
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <Helmet>
        <title>{post.title} | {settings?.siteName || 'কুড়ানোগল্প.পাতা.বাংলা'}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featuredImage && <meta property="og:image" content={post.featuredImage} />}
        <meta property="article:published_time" content={post.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()} />
        <meta property="article:author" content={post.authorName} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.featuredImage && <meta name="twitter:image" content={post.featuredImage} />}
      </Helmet>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onNavigate('blog')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Button>

      <header className="space-y-6">
        <div className="space-y-2">
          {post.categoryId && (
            <Badge variant="secondary" className="mb-2">
              <FolderTree className="mr-1 h-3 w-3" />
              {categories.find(c => c.id === post.categoryId)?.name || 'Uncategorized'}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {post.title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between border-y py-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-semibold hover:text-primary cursor-pointer transition-colors"
                  onClick={() => onNavigate('author', post.authorId)}
                >
                  {post.authorName}
                </span>
                {authorProfile?.role === 'admin' && (
                  <span title="Admin">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                  </span>
                )}
                <div className="flex gap-1">
                  <Badge className={cn("text-[10px] px-1 py-0 h-4 border-none text-white", authorBadge.color)}>
                    {authorBadge.name}
                  </Badge>
                  {authorProfile?.badges?.map((badge: string) => (
                    <Badge key={badge} variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(post.createdAt?.toDate())}</span>
                <span className="mx-1">•</span>
                <Eye className="h-3 w-3" />
                <span>{post.viewCount || 0} views</span>
                <span className="mx-1">•</span>
                <Share2 className="h-3 w-3" />
                <span>{post.shareCount || 0} shares</span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3" />
                <span>{calculateReadingTime(post.content)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReactionButton postId={post.id} initialLikeCount={post.likeCount || 0} />
            <Button variant="outline" size="icon" onClick={handleBookmark} disabled={isBookmarking} title={isBookmarked ? "Remove Bookmark" : "Save Post"}>
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {post.featuredImage && (
          <div className="aspect-video overflow-hidden rounded-xl border">
            <img 
              src={post.featuredImage} 
              alt={post.title}
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <TextToSpeech text={post.content} />
        <AITextToSpeech text={post.content} />
      </div>

      <div 
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
      />

      <div className="py-6 border-t mt-8">
        <ShareButtons postId={post.id} title={post.title} url={window.location.href} />
      </div>

      <AdSpace slot="adInPost" className="my-12 flex justify-center border-y py-8" />

      <footer className="pt-12 border-t space-y-12">
        {relatedPosts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Related Posts</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Card key={rp.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('post', rp.slug)}>
                  {rp.featuredImage && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img src={rp.featuredImage} alt={rp.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="bg-muted/50 p-6 rounded-xl flex items-center gap-6">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={() => onNavigate('author', post.authorId)}>
            <AvatarImage src={authorProfile?.photoURL} />
            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 
                className="font-bold text-lg hover:text-primary cursor-pointer transition-colors"
                onClick={() => onNavigate('author', post.authorId)}
              >
                About {post.authorName}
              </h3>
              <div className="flex gap-1">
                <Badge className={cn("text-[10px] px-1 h-4 border-none text-white", authorBadge.color)}>
                  {authorBadge.name}
                </Badge>
                {authorProfile?.badges?.map((badge: string) => (
                  <Badge key={badge} variant="outline" className="text-[10px] px-1">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {authorProfile?.bio || `Author at QalbeTalks. Sharing insights on technology and design.`}
            </p>
            {authorProfile?.donationLink && (
              <div className="pt-2">
                <a 
                  href={authorProfile.donationLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Support the Author
                </a>
              </div>
            )}
          </div>
        </div>

        <CommentSection postId={post.id} />
      </footer>
    </article>
  );
}
