import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, collection, addDoc, deleteDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { useBookmarks, usePosts, useCategories, Post, PublicProfile } from '../lib/hooks';
import { Bookmark, User, PenTool, Award, Star, FileText, Edit, Trash2, Eye, Image as ImageIcon, Calendar, Sparkles, X, Plus, BadgeCheck } from 'lucide-react';
import { formatDate, slugify, joditConfig, cn, getBadgeByPoints } from '../lib/utils';
import JoditEditor from 'jodit-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { suggestTags, moderateContent } from '../lib/gemini';

export default function Profile({ onNavigate }: { onNavigate?: (page: string, slug?: string) => void }) {
  const { user, profile } = useAuth();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks(user?.uid);
  const { posts: userPosts, loading: postsLoading } = usePosts({ authorId: user?.uid });
  const { categories } = useCategories();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [donationLink, setDonationLink] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Post Submission State
  const editor = useRef(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 's') {
          e.preventDefault();
          const writeTab = document.querySelector('[value="write"][data-state="active"]');
          if (writeTab || isEditDialogOpen) {
            if (isEditDialogOpen) {
              handleUpdatePost(new Event('submit') as any);
            } else {
              handlePostSubmit(new Event('submit') as any);
            }
          }
        }
        if (e.key === 'p') {
          e.preventDefault();
          const writeTab = document.querySelector('[value="write"][data-state="active"]');
          if (writeTab || isEditDialogOpen) {
            setIsPreviewOpen(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditDialogOpen, postTitle, postContent, postExcerpt, featuredImage, categoryId, postTags]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setPhotoURL(profile.photoURL || '');
      setDonationLink(profile.donationLink || '');
      setFacebookUrl(profile.facebookUrl || '');
      setTwitterUrl(profile.twitterUrl || '');
      setInstagramUrl(profile.instagramUrl || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      if (bookmarks.length === 0) {
        setBookmarkedPosts([]);
        return;
      }
      
      try {
        const postsData: Post[] = [];
        for (const bookmark of bookmarks) {
          const postDoc = await getDoc(doc(db, 'posts', bookmark.postId));
          if (postDoc.exists()) {
            postsData.push({ id: postDoc.id, ...postDoc.data() } as Post);
          }
        }
        setBookmarkedPosts(postsData);
      } catch (error) {
        console.error("Error fetching bookmarked posts:", error);
      }
    };

    fetchBookmarkedPosts();
  }, [bookmarks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        photoURL,
        donationLink,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        updatedAt: serverTimestamp(),
      });

      // Update public profile
      const publicProfileRef = doc(db, 'public_profiles', user.uid);
      const publicProfileDoc = await getDoc(publicProfileRef);
      if (publicProfileDoc.exists()) {
        await updateDoc(publicProfileRef, {
          displayName,
          bio,
          photoURL,
          donationLink,
          facebookUrl,
          twitterUrl,
          instagramUrl,
        });
      } else {
        await setDoc(publicProfileRef, {
          uid: user.uid,
          displayName,
          bio,
          photoURL,
          donationLink,
          facebookUrl,
          twitterUrl,
          instagramUrl,
          role: profile?.role || 'reader',
          points: profile?.points || 0,
          badges: profile?.badges || [],
        });
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!postTitle || !postContent) {
      toast.error("Please add a title and content first.");
      return;
    }

    setIsSuggestingTags(true);
    try {
      const tags = await suggestTags(postTitle, postContent);
      setSuggestedTags(tags);
      if (tags.length === 0) {
        toast.info("No tags suggested. Try adding more content.");
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
      toast.error("Failed to suggest tags.");
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const addTag = (tag: string) => {
    if (!postTags.includes(tag)) {
      setPostTags([...postTags, tag]);
    }
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

  const removeTag = (tag: string) => {
    setPostTags(postTags.filter(t => t !== tag));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmittingPost(true);
    try {
      // Moderate content before submission
      const moderation = await moderateContent(postTitle + " " + postContent);
      if (!moderation.safe) {
        toast.error(`Content flagged as ${moderation.category}. Please revise.`);
        setSubmittingPost(false);
        return;
      }

      const slug = slugify(postTitle) + '-' + Math.random().toString(36).substr(2, 5);
      
      await addDoc(collection(db, 'posts'), {
        title: postTitle,
        slug,
        content: postContent,
        excerpt: postExcerpt,
        featuredImage,
        categoryId,
        tags: postTags,
        authorId: user.uid,
        authorName: profile?.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorPoints: profile?.points || 0,
        authorBadges: profile?.badges || [],
        authorIsVerified: profile?.isVerified || false,
        status: 'pending', // Requires admin approval
        viewCount: 0,
        likeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Post submitted successfully! It will be published after admin approval.");
      setPostTitle('');
      setPostContent('');
      setPostExcerpt('');
      setFeaturedImage('');
      setCategoryId('');
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("Failed to submit post.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostExcerpt(post.excerpt);
    setFeaturedImage(post.featuredImage || '');
    setCategoryId(post.categoryId || '');
    setPostTags(post.tags || []);
    setSuggestedTags([]);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingPost) return;

    setSubmittingPost(true);
    try {
      // Moderate content before update
      const moderation = await moderateContent(postTitle + " " + postContent);
      if (!moderation.safe) {
        toast.error(`Content flagged as ${moderation.category}. Please revise.`);
        setSubmittingPost(false);
        return;
      }

      await updateDoc(doc(db, 'posts', editingPost.id), {
        title: postTitle,
        content: postContent,
        excerpt: postExcerpt,
        featuredImage,
        categoryId,
        tags: postTags,
        updatedAt: serverTimestamp(),
        status: 'pending', // Reset to pending after edit
      });

      toast.success("Post updated and submitted for review!");
      setIsEditDialogOpen(false);
      setEditingPost(null);
      setPostTitle('');
      setPostContent('');
      setPostExcerpt('');
      setFeaturedImage('');
      setCategoryId('');
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post.");
    } finally {
      setSubmittingPost(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Please Sign In</h2>
        <p className="text-muted-foreground mt-2">You need to be signed in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12 space-y-12">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-muted/20 bg-muted/5 shadow-2xl shadow-primary/5"
      >
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-center md:items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={photoURL} />
            <AvatarFallback className="text-4xl font-bold bg-primary/5 text-primary">
              {displayName?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{displayName || 'User'}</h1>
                {profile?.isVerified && (
                  <div className="relative group/badge">
                    <BadgeCheck className="h-6 w-6 text-blue-500 fill-blue-500/10 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Verified User
                    </div>
                  </div>
                )}
              </div>
              <Badge className={cn("text-[10px] px-2 py-0.5 h-6 border-none text-white", getBadgeByPoints(profile?.points || 0).color)}>
                {getBadgeByPoints(profile?.points || 0).name}
              </Badge>
              {profile?.role === 'admin' && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none">Admin</Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-xl line-clamp-2">{bio || 'No bio yet.'}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center px-6 py-2 bg-background/50 backdrop-blur-md rounded-2xl border border-muted/20">
              <span className="text-2xl font-bold text-primary">{profile?.points || 0}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Points</span>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-8">
        <div className="flex justify-center overflow-x-auto no-scrollbar pb-2">
          <TabsList className="h-14 p-1.5 bg-muted/30 rounded-full border border-muted/20 shrink-0">
            <TabsTrigger value="profile" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 mr-2" /> My Stories
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Award className="h-4 w-4 mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bookmark className="h-4 w-4 mr-2" /> Reading List
            </TabsTrigger>
            <TabsTrigger value="write" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <PenTool className="h-4 w-4 mr-2" /> Write
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={photoURL} />
                  <AvatarFallback className="text-2xl">{displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">User Profile</CardTitle>
                  <CardDescription>Manage your public profile information.</CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {profile?.points || 0} Points
                    </div>
                    <div className="flex gap-1">
                      {profile?.badges?.map((badge: string) => (
                        <Badge key={badge} variant="secondary" className="text-[10px] h-5">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Your Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoURL">Profile Picture URL</Label>
                  <Input 
                    id="photoURL" 
                    value={photoURL} 
                    onChange={(e) => setPhotoURL(e.target.value)} 
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donationLink">Donation Link (e.g. Buy Me a Coffee)</Label>
                  <Input 
                    id="donationLink" 
                    value={donationLink} 
                    onChange={(e) => setDonationLink(e.target.value)} 
                    placeholder="https://buymeacoffee.com/yourname"
                  />
                  <p className="text-xs text-muted-foreground">This will be displayed at the end of your posts.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input 
                      id="facebookUrl" 
                      value={facebookUrl} 
                      onChange={(e) => setFacebookUrl(e.target.value)} 
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter URL</Label>
                    <Input 
                      id="twitterUrl" 
                      value={twitterUrl} 
                      onChange={(e) => setTwitterUrl(e.target.value)} 
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram URL</Label>
                    <Input 
                      id="instagramUrl" 
                      value={instagramUrl} 
                      onChange={(e) => setInstagramUrl(e.target.value)} 
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tell us about yourself..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="posts">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Posts</CardTitle>
              <CardDescription>Manage your stories and check their status.</CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <p>Loading your posts...</p>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 
                            className="font-semibold hover:text-primary cursor-pointer transition-colors"
                            onClick={() => onNavigate && onNavigate('post', post.slug)}
                          >
                            {post.title}
                          </h3>
                          <Badge variant={post.status === 'published' ? 'default' : post.status === 'pending' ? 'secondary' : 'outline'}>
                            {post.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(post.createdAt?.toDate())}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.viewCount || 0}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {post.likeCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status !== 'published' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditPost(post)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this draft?")) {
                                  try {
                                    await deleteDoc(doc(db, 'posts', post.id));
                                    toast.success("Post deleted successfully!");
                                  } catch (error) {
                                    toast.error("Failed to delete post.");
                                  }
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onNavigate && onNavigate('post', post.slug)} title="View">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">You haven't written any posts yet.</p>
                  <Button variant="link" onClick={() => {
                    const writeTab = document.querySelector('[value="write"]') as HTMLElement;
                    writeTab?.click();
                  }}>
                    Start Writing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="stats">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary fill-current" />
                  {profile?.points || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Keep writing to earn more!</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/20 border-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Posts Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-secondary" />
                  {userPosts.filter(p => p.status === 'published').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your contribution to the community.</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <Eye className="h-6 w-6 text-accent" />
                  {userPosts.reduce((acc, p) => acc + (p.viewCount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">People reading your stories.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Badges & Achievements</CardTitle>
              <CardDescription>Special recognition you've earned.</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.badges && profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {profile.badges.map((badge: string) => (
                    <motion.div 
                      key={badge} 
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center gap-2 p-4 border rounded-xl bg-muted/30"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-center">{badge}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-lg">
                  <Award className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No badges earned yet. Keep active to unlock them!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
              <CardDescription>Your journey to becoming a top contributor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Level: {Math.floor((profile?.points || 0) / 100) + 1}</span>
                  <span className="font-medium">{profile?.points || 0} / { (Math.floor((profile?.points || 0) / 100) + 1) * 100 } XP</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${(profile?.points || 0) % 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Earn 100 points to reach the next level! You get points for writing posts and getting likes.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
      <TabsContent value="bookmarks">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reading List</CardTitle>
              <CardDescription>Posts you have saved for later reading.</CardDescription>
            </CardHeader>
            <CardContent>
              {bookmarksLoading ? (
                <p>Loading bookmarks...</p>
              ) : bookmarkedPosts.length > 0 ? (
                <div className="space-y-4">
                  {bookmarkedPosts.map(post => (
                    <div key={post.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <h3 
                          className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors"
                          onClick={() => onNavigate && onNavigate('post', post.slug)}
                        >
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          By {post.authorName} • {formatDate(post.createdAt?.toDate())}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onNavigate && onNavigate('post', post.slug)}>
                        Read
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">You haven't saved any posts yet.</p>
                  <Button variant="link" onClick={() => onNavigate && onNavigate('blog')}>
                    Explore Blog
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="write">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Write a Post</CardTitle>
              <CardDescription>Share your story with the community. Posts require admin approval before being published.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePostSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="postTitle">Title</Label>
                  <Input 
                    id="postTitle" 
                    value={postTitle} 
                    onChange={(e) => setPostTitle(e.target.value)} 
                    placeholder="Enter post title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postExcerpt">Excerpt</Label>
                  <Textarea 
                    id="postExcerpt" 
                    value={postExcerpt} 
                    onChange={(e) => setPostExcerpt(e.target.value)} 
                    placeholder="A short summary of your post"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input 
                      id="featuredImage" 
                      value={featuredImage} 
                      onChange={(e) => setFeaturedImage(e.target.value)} 
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select 
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSuggestTags}
                      disabled={isSuggestingTags}
                      className="gap-2 text-xs h-8 rounded-full border-primary/20 hover:bg-primary/5"
                    >
                      <Sparkles className={cn("h-3 w-3 text-primary", isSuggestingTags && "animate-pulse")} />
                      {isSuggestingTags ? 'Suggesting...' : 'Suggest Tags'}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl border bg-muted/10">
                    {postTags.length > 0 ? (
                      postTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1 py-1 rounded-lg bg-background border-primary/10">
                          {tag}
                          <button 
                            type="button" 
                            onClick={() => removeTag(tag)}
                            className="hover:bg-destructive/10 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No tags added yet.</span>
                    )}
                  </div>

                  <AnimatePresence>
                    {suggestedTags.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">AI Suggested Tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags.map(tag => (
                            <Button
                              key={tag}
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addTag(tag)}
                              className="h-7 px-3 text-xs rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10 gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postContent">Content</Label>
                  <JoditEditor
                    ref={editor}
                    value={postContent}
                    config={{
                      ...joditConfig,
                      placeholder: 'Write your post content here...'
                    }}
                    onBlur={newContent => setPostContent(newContent)}
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={submittingPost} className="flex-1">
                    {submittingPost ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPreviewOpen(true)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
            <DialogDescription>This is how your post will look to readers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {featuredImage && (
              <img 
                src={featuredImage} 
                alt={postTitle} 
                className="w-full h-64 object-cover rounded-xl" 
                referrerPolicy="no-referrer"
              />
            )}
            <h1 className="text-4xl font-bold tracking-tight">{postTitle || 'Untitled Post'}</h1>
            <div className="flex flex-wrap gap-2">
              {postTags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: postContent }} />
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your post details. It will be re-submitted for review.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePost} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input 
                id="editTitle" 
                value={postTitle} 
                onChange={(e) => setPostTitle(e.target.value)} 
                placeholder="Enter post title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExcerpt">Excerpt</Label>
              <Textarea 
                id="editExcerpt" 
                value={postExcerpt} 
                onChange={(e) => setPostExcerpt(e.target.value)} 
                placeholder="A short summary of your post"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editFeaturedImage">Featured Image URL</Label>
                <Input 
                  id="editFeaturedImage" 
                  value={featuredImage} 
                  onChange={(e) => setFeaturedImage(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category</Label>
                <select 
                  id="editCategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tags</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSuggestTags}
                  disabled={isSuggestingTags}
                  className="gap-2 text-xs h-8 rounded-full border-primary/20 hover:bg-primary/5"
                >
                  <Sparkles className={cn("h-3 w-3 text-primary", isSuggestingTags && "animate-pulse")} />
                  {isSuggestingTags ? 'Suggesting...' : 'Suggest Tags'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl border bg-muted/10">
                {postTags.length > 0 ? (
                  postTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 py-1 rounded-lg bg-background border-primary/10">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="hover:bg-destructive/10 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No tags added yet.</span>
                )}
              </div>

              <AnimatePresence>
                {suggestedTags.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">AI Suggested Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addTag(tag)}
                          className="h-7 px-3 text-xs rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10 gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editContent">Content</Label>
              <JoditEditor
                value={postContent}
                config={{
                  ...joditConfig,
                  placeholder: 'Write your post content here...'
                }}
                onBlur={newContent => setPostContent(newContent)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingPost}>
                {submittingPost ? 'Updating...' : 'Update & Submit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
