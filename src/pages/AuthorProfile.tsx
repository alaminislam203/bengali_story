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
import { ArrowLeft, Clock, ArrowRight, Award, FileText, Heart, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

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
    <div className="max-w-5xl mx-auto space-y-12">
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

      <Button variant="ghost" size="sm" onClick={() => onNavigate('blog')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Button>

      {/* Profile Header */}
      <section className="flex flex-col items-center text-center space-y-6 bg-muted/30 p-8 rounded-3xl border">
        <Avatar className="h-24 w-24 ring-4 ring-primary/10">
          <AvatarImage src={profile.photoURL} />
          <AvatarFallback className="text-2xl">{profile.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{profile.displayName}</h1>
            {profile.role === 'admin' && <Badge variant="default" className="bg-blue-500">Admin</Badge>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className={cn("text-xs px-2 py-0.5 border-none text-white", authorBadge.color)}>
              <Award className="mr-1 h-3 w-3" /> {authorBadge.name}
            </Badge>
            {profile.badges?.map(badge => (
              <Badge key={badge} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <p className="max-w-2xl text-muted-foreground">
          {profile.bio || "Sharing stories and insights with the community."}
        </p>

        <div className="grid grid-cols-3 gap-8 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xl font-bold">{posts.length}</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Posts</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xl font-bold">{totalViews}</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Views</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-xl font-bold">{totalLikes}</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Likes</p>
          </div>
        </div>
      </section>

      {/* Author's Posts */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-4">Stories by {profile.displayName}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{formatDate(post.createdAt?.toDate())}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>
                  </div>
                  <CardTitle 
                    className="line-clamp-2 group-hover:text-primary transition-colors cursor-pointer text-lg" 
                    onClick={() => onNavigate('post', post.slug)}
                  >
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold"
                    onClick={() => onNavigate('post', post.slug)}
                  >
                    Read Story <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              No stories published yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
