import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { useBookmarks, usePosts, useCategories, Post, PublicProfile } from '../lib/hooks';
import { Bookmark, User, PenTool, Award, Star, FileText, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatDate, slugify, joditConfig, cn } from '../lib/utils';
import JoditEditor from 'jodit-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';

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
  const [loading, setLoading] = useState(false);

  // Post Submission State
  const editor = useRef(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setPhotoURL(profile.photoURL || '');
      setDonationLink(profile.donationLink || '');
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
        });
      } else {
        await setDoc(publicProfileRef, {
          uid: user.uid,
          displayName,
          bio,
          photoURL,
          donationLink,
          role: profile?.role || 'reader',
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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmittingPost(true);
    try {
      const slug = slugify(postTitle) + '-' + Math.random().toString(36).substr(2, 5);
      
      await addDoc(collection(db, 'posts'), {
        title: postTitle,
        slug,
        content: postContent,
        excerpt: postExcerpt,
        featuredImage,
        categoryId,
        authorId: user.uid,
        authorName: profile?.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorPoints: profile?.points || 0,
        authorBadges: profile?.badges || [],
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
    setIsEditDialogOpen(true);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingPost) return;

    setSubmittingPost(true);
    try {
      await updateDoc(doc(db, 'posts', editingPost.id), {
        title: postTitle,
        content: postContent,
        excerpt: postExcerpt,
        featuredImage,
        categoryId,
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
    <div className="container max-w-4xl py-12">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-[800px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> My Posts
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" /> Reading List
          </TabsTrigger>
          <TabsTrigger value="write" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" /> Write Post
          </TabsTrigger>
        </TabsList>

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
                        <p className="text-xs text-muted-foreground">
                          {formatDate(post.createdAt?.toDate())} • {post.viewCount || 0} views
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status !== 'published' && (
                          <Button variant="ghost" size="icon" onClick={() => handleEditPost(post)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onNavigate && onNavigate('post', post.slug)}>
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
                <Button type="submit" disabled={submittingPost}>
                  {submittingPost ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
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
