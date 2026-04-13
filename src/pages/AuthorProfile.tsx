import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, PublicProfile, useSettings } from '../lib/hooks';
import { formatDate, calculateReadingTime, cn, getBadgeByPoints } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Clock, ArrowRight, Award, FileText, Heart, Eye, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';

interface AuthorProfileProps {
  authorId: string;
  onNavigate: (page: string, slug?: string) => void;
}

export default function AuthorProfile({ authorId, onNavigate }: AuthorProfileProps) {
  const { settings } = useSettings();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      setLoading(true);
      try {
        // Fetch Profile
        const profileQ = query(collection(db, 'public_profiles'), where('uid', '==', authorId), limit(1));
        const profileSnapshot = await getDocs(profileQ);
        if (!profileSnapshot.empty) {
          setProfile(profileSnapshot.docs[0].data() as PublicProfile);
        }

        // Fetch Posts
        const postsQ = query(
          collection(db, 'posts'),
          where('authorId', '==', authorId),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(postsQ);
        setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Post)));
      } catch (error) {
        console.error("Error fetching author data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-4">Author not found</h2>
        <Button onClick={() => onNavigate('home')}>Go Home</Button>
      </div>
    );
  }

  const authorBadge = getBadgeByPoints(profile.points || 0);
  const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likeCount || 0), 0);

  return (
    <div className="container max-w-5xl py-12 space-y-12">
      <Helmet>
        <title>{profile.displayName} | Author Profile</title>
        <meta name="description" content={profile.bio || `Read stories by ${profile.displayName}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${profile.displayName} | Author Profile`} />
        <meta property="og:description" content={profile.bio || `Read stories by ${profile.displayName}`} />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`${profile.displayName} | Author Profile`} />
        <meta name="twitter:description" content={profile.bio || `Read stories by ${profile.displayName}`} />
        {profile.photoURL && <meta name="twitter:image" content={profile.photoURL} />}
      </Helmet>

      <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/5" onClick={() => onNavigate('blog')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Button>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-muted/20 bg-muted/5 shadow-2xl shadow-primary/5"
      >
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-center md:items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
              {profile.displayName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{profile.displayName}</h1>
                {profile.isVerified && (
                  <CheckCircle className="h-6 w-6 text-blue-500 fill-blue-500/10" />
                )}
              </div>
              <Badge className={cn("text-[10px] px-2 py-0.5 h-6 border-none text-white", authorBadge.color)}>
                {authorBadge.name}
              </Badge>
              {profile.role === 'admin' && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none">Admin</Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-xl line-clamp-2">{profile.bio || 'Sharing stories and insights with the community.'}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center px-6 py-2 bg-background/50 backdrop-blur-md rounded-2xl border border-muted/20">
              <span className="text-2xl font-bold text-primary">{profile.points || 0}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Points</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-none bg-primary/5 p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stories</p>
          </div>
        </Card>
        <Card className="rounded-3xl border-none bg-secondary/5 p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <Eye className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Views</p>
          </div>
        </Card>
        <Card className="rounded-3xl border-none bg-accent/5 p-6 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Heart className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Likes</p>
          </div>
        </Card>
      </div>

      {/* Author's Posts */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Stories by {profile.displayName}</h2>
          <div className="h-px flex-1 bg-muted/20 mx-6 hidden md:block" />
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.length > 0 ? (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onNavigate('post', post.slug)}
                className="group cursor-pointer space-y-4"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-[2rem] bg-muted/20 relative">
                  {post.featuredImage ? (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <FileText className="h-12 w-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none rounded-full px-3 py-1">
                      {formatDate(post.createdAt?.toDate())}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 px-2">
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {calculateReadingTime(post.content)} read</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.viewCount || 0} views</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
              <p className="text-muted-foreground">No stories published yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
