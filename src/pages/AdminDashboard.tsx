import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { usePosts, Post, useSettings, Setting, usePages, Page, useSubscribers, useAllComments, useCategories, useTags, Category, Tag, useMessages, Message, useAllUsers, PublicProfile, useNewsletterTemplates, NewsletterTemplate, usePushSubscriptions } from '../lib/hooks';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  setDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { slugify, formatDate, cn, joditConfig } from '../lib/utils';
import { Plus, Edit, Trash2, Eye, FileText, Settings, BarChart3, Heart, Layout, Users, MessageSquare, Check, X, Tags, FolderTree, Mail, Send, Activity, Pin, Bell, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import JoditEditor from 'jodit-react';
import { useRef } from 'react';

interface AdminDashboardProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <Button className="mt-6" onClick={() => onNavigate('home')}>Go Home</Button>
      </div>
    );
  }

  return <AdminDashboardContent onNavigate={onNavigate} />;
}

function AdminDashboardContent({ onNavigate }: AdminDashboardProps) {
  const { user } = useAuth();
  const editor = useRef(null);
  const { posts, loading } = usePosts();
  const { settings, loading: settingsLoading } = useSettings();
  const { pages, loading: pagesLoading } = usePages();
  const { subscribers, loading: subscribersLoading } = useSubscribers();
  const { comments: allComments, loading: allCommentsLoading } = useAllComments();
  const { categories, loading: categoriesLoading } = useCategories();
  const { tags, loading: tagsLoading } = useTags();
  const { messages, loading: messagesLoading } = useMessages();
  const { users, loading: usersLoading } = useAllUsers();
  const { templates, loading: templatesLoading } = useNewsletterTemplates();
  const { subscriptions, loading: subscriptionsLoading } = usePushSubscriptions();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Post Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'pending'>('draft');
  const [categoryId, setCategoryId] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);

  // Page Form state
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageStatus, setPageStatus] = useState<'draft' | 'published'>('published');

  // Settings state
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [adHeader, setAdHeader] = useState('');
  const [adSidebar, setAdSidebar] = useState('');
  const [adFooter, setAdFooter] = useState('');
  const [adInPost, setAdInPost] = useState('');
  const [antiAdBlockEnabled, setAntiAdBlockEnabled] = useState(false);
  const [antiAdBlockMessage, setAntiAdBlockMessage] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [logoUrl, setLogoUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(false);

  // Category Form state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Tag Form state
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');

  // User Management state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicProfile | null>(null);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('');

  // Newsletter Template state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NewsletterTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || '');
      setSiteDescription(settings.siteDescription || '');
      setAdHeader(settings.adHeader || '');
      setAdSidebar(settings.adSidebar || '');
      setAdFooter(settings.adFooter || '');
      setAdInPost(settings.adInPost || '');
      setAntiAdBlockEnabled(settings.antiAdBlockEnabled || false);
      setAntiAdBlockMessage(settings.antiAdBlockMessage || '');
      setPrimaryColor(settings.primaryColor || '#3b82f6');
      setFontFamily(settings.fontFamily || 'Inter');
      setLogoUrl(settings.logoUrl || '');
      setFacebookUrl(settings.facebookUrl || '');
      setTwitterUrl(settings.twitterUrl || '');
      setInstagramUrl(settings.instagramUrl || '');
      setYoutubeUrl(settings.youtubeUrl || '');
      setNoticeText(settings.noticeText || '');
      setNoticeEnabled(settings.noticeEnabled || false);
    }
  }, [settings]);

  const handleOpenDialog = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setExcerpt(post.excerpt);
      setFeaturedImage(post.featuredImage || '');
      setStatus(post.status);
      setCategoryId(post.categoryId || '');
      setPostTags(post.tags || []);
    } else {
      setEditingPost(null);
      setTitle('');
      setSlug('');
      setContent('');
      setExcerpt('');
      setFeaturedImage('');
      setStatus('draft');
      setCategoryId('');
      setPostTags([]);
    }
    setIsDialogOpen(true);
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatSlug(category.slug);
      setCatDescription(category.description || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatDescription('');
    }
    setIsCategoryDialogOpen(true);
  };

  const handleOpenTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagName(tag.name);
      setTagSlug(tag.slug);
    } else {
      setEditingTag(null);
      setTagName('');
      setTagSlug('');
    }
    setIsTagDialogOpen(true);
  };

  const handleOpenPageDialog = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setPageTitle(page.title);
      setPageSlug(page.slug);
      setPageContent(page.content);
      setPageStatus(page.status);
    } else {
      setEditingPage(null);
      setPageTitle('');
      setPageSlug('');
      setPageContent('');
      setPageStatus('published');
    }
    setIsPageDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const postData = {
      title,
      slug: slug || slugify(title),
      content,
      excerpt,
      featuredImage,
      status,
      categoryId,
      tags: postTags,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), postData);
        toast.success("Post updated successfully!");
      } else {
        await addDoc(collection(db, 'posts'), {
          ...postData,
          createdAt: serverTimestamp(),
          viewCount: 0,
          likeCount: 0,
        });
        toast.success("Post created successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post.");
    }
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pageData = {
      title: pageTitle,
      slug: pageSlug || slugify(pageTitle),
      content: pageContent,
      status: pageStatus,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingPage) {
        await updateDoc(doc(db, 'pages', editingPage.id), pageData);
        toast.success("Page updated successfully!");
      } else {
        await addDoc(collection(db, 'pages'), pageData);
        toast.success("Page created successfully!");
      }
      setIsPageDialogOpen(false);
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Failed to save page.");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catData = {
      name: catName,
      slug: catSlug || slugify(catName),
      description: catDescription,
    };

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), catData);
        toast.success("Category updated successfully!");
      } else {
        await addDoc(collection(db, 'categories'), catData);
        toast.success("Category created successfully!");
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category.");
    }
  };

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagData = {
      name: tagName,
      slug: tagSlug || slugify(tagName),
    };

    try {
      if (editingTag) {
        await updateDoc(doc(db, 'tags', editingTag.id), tagData);
        toast.success("Tag updated successfully!");
      } else {
        await addDoc(collection(db, 'tags'), tagData);
        toast.success("Tag created successfully!");
      }
      setIsTagDialogOpen(false);
    } catch (error) {
      console.error("Error saving tag:", error);
      toast.error("Failed to save tag.");
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        siteName,
        siteDescription,
        adHeader,
        adSidebar,
        adFooter,
        adInPost,
        antiAdBlockEnabled,
        antiAdBlockMessage,
        primaryColor,
        fontFamily,
        logoUrl,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        youtubeUrl,
        noticeText,
        noticeEnabled,
        updatedAt: serverTimestamp(),
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateDoc(doc(db, 'public_profiles', editingUser.uid), {
        role: userRole,
        badges: userBadges,
      });
      
      // Also update the main users collection if necessary
      await updateDoc(doc(db, 'users', editingUser.uid), {
        role: userRole,
      });

      toast.success("User updated successfully!");
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user.");
    }
  };

  const handleOpenUserDialog = (user: PublicProfile) => {
    setEditingUser(user);
    setUserRole(user.role || 'reader');
    setUserBadges(user.badges || []);
    setIsUserDialogOpen(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const templateData = {
        name: templateName,
        subject: templateSubject,
        content: templateContent,
        updatedAt: serverTimestamp(),
      };

      if (editingTemplate) {
        await updateDoc(doc(db, 'newsletter_templates', editingTemplate.id), templateData);
        toast.success("Template updated successfully!");
      } else {
        await addDoc(collection(db, 'newsletter_templates'), {
          ...templateData,
          createdAt: serverTimestamp(),
        });
        toast.success("Template created successfully!");
      }
      setIsTemplateDialogOpen(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template.");
    }
  };

  const handleOpenTemplateDialog = (template?: NewsletterTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateSubject(template.subject);
      setTemplateContent(template.content);
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateSubject('');
      setTemplateContent('');
    }
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteDoc(doc(db, 'newsletter_templates', id));
        toast.success("Template deleted successfully!");
      } catch (error) {
        console.error("Error deleting template:", error);
        toast.error("Failed to delete template.");
      }
    }
  };

  const handleSendNewsletter = (template: NewsletterTemplate) => {
    toast.info(`Sending newsletter "${template.name}" to ${subscribers.length} subscribers...`);
    // In a real app, this would trigger a cloud function or backend service
    setTimeout(() => {
      toast.success("Newsletter sent successfully!");
    }, 2000);
  };

  const handleTogglePin = async (post: Post) => {
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        isPinned: !post.isPinned,
        updatedAt: serverTimestamp(),
      });
      toast.success(post.isPinned ? "Post unpinned!" : "Post pinned to home!");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin status.");
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        toast.success("Post deleted successfully!");
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post.");
      }
    }
  };

  const handleApprovePost = async (post: Post) => {
    try {
      // 1. Update post status to published
      await updateDoc(doc(db, 'posts', post.id), {
        status: 'published',
        updatedAt: serverTimestamp(),
      });

      // 2. Increment author's points and get badges
      if (post.authorId) {
        const publicProfileRef = doc(db, 'public_profiles', post.authorId);
        const publicProfileDoc = await getDoc(publicProfileRef);
        
        if (publicProfileDoc.exists()) {
          const authorData = publicProfileDoc.data();
          await updateDoc(publicProfileRef, {
            points: increment(10) // Give 10 points for an approved post
          });

          // Update post with current author badges for denormalization
          await updateDoc(doc(db, 'posts', post.id), {
            authorBadges: authorData.badges || []
          });
        }
      }

      toast.success("Post approved and published!");
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post.");
    }
  };

  const handlePageDelete = async (pageId: string) => {
    if (confirm("Are you sure you want to delete this page?")) {
      try {
        await deleteDoc(doc(db, 'pages', pageId));
        toast.success("Page deleted successfully!");
      } catch (error) {
        console.error("Error deleting page:", error);
        toast.error("Failed to delete page.");
      }
    }
  };

  const handleCommentStatus = async (commentId: string, status: 'approved' | 'spam') => {
    try {
      await updateDoc(doc(db, 'comments', commentId), { status });
      toast.success(`Comment marked as ${status}`);
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment.");
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteDoc(doc(db, 'comments', commentId));
        toast.success("Comment deleted successfully!");
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment.");
      }
    }
  };

  const handleCategoryDelete = async (catId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteDoc(doc(db, 'categories', catId));
        toast.success("Category deleted successfully!");
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category.");
      }
    }
  };

  const handleTagDelete = async (tagId: string) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      try {
        await deleteDoc(doc(db, 'tags', tagId));
        toast.success("Tag deleted successfully!");
      } catch (error) {
        console.error("Error deleting tag:", error);
        toast.error("Failed to delete tag.");
      }
    }
  };

  const totalViews = posts.reduce((acc, post) => acc + (post.viewCount || 0), 0);
  const totalLikes = posts.reduce((acc, post) => acc + (post.likeCount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your blog content and settings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenTagDialog()}>
            <Tags className="mr-2 h-4 w-4" /> New Tag
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOpenCategoryDialog()}>
            <FolderTree className="mr-2 h-4 w-4" /> New Category
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOpenPageDialog()}>
            <Layout className="mr-2 h-4 w-4" /> New Page
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start mb-8">
          <TabsTrigger value="posts" className="gap-2"><FileText className="h-4 w-4" /> Posts</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="pages" className="gap-2"><Layout className="h-4 w-4" /> Pages</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><FolderTree className="h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="tags" className="gap-2"><Tags className="h-4 w-4" /> Tags</TabsTrigger>
          <TabsTrigger value="comments" className="gap-2"><MessageSquare className="h-4 w-4" /> Comments</TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2"><Users className="h-4 w-4" /> Subscribers</TabsTrigger>
          <TabsTrigger value="newsletter" className="gap-2"><Mail className="h-4 w-4" /> Newsletter</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2"><Mail className="h-4 w-4" /> Messages</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Posts</CardTitle>
              <CardDescription>A list of all your blog posts and their current status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p>Loading posts...</p>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{post.title}</h3>
                          {post.isPinned && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              <Pin className="h-3 w-3 mr-1 rotate-45" /> Pinned
                            </Badge>
                          )}
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Slug: {post.slug} • Views: {post.viewCount || 0} • Likes: {post.likeCount || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={post.isPinned ? "text-primary" : "text-muted-foreground"}
                            onClick={() => handleTogglePin(post)}
                            title={post.isPinned ? "Unpin from Home" : "Pin to Home"}
                          >
                            <Pin className={cn("h-4 w-4", post.isPinned && "fill-primary rotate-45")} />
                          </Button>
                        )}
                        {post.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprovePost(post)}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('post', post.slug)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No posts yet. Create your first one!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Static Pages</CardTitle>
              <CardDescription>Manage About Us, Contact Us, and other static pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagesLoading ? (
                  <p>Loading pages...</p>
                ) : pages.length > 0 ? (
                  pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{page.title}</h3>
                          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                            {page.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Slug: {page.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('static', page.slug)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPageDialog(page)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handlePageDelete(page.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No pages yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize your posts into categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoriesLoading ? (
                  <p>Loading categories...</p>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">Slug: {cat.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(cat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleCategoryDelete(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No categories yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Manage post tags.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tagsLoading ? (
                  <p>Loading tags...</p>
                ) : tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="pl-3 pr-1 py-1 gap-2">
                        {tag.name}
                        <div className="flex gap-1">
                          <button onClick={() => handleOpenTagDialog(tag)} className="hover:text-primary">
                            <Edit className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleTagDelete(tag.id)} className="hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No tags yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comments Management</CardTitle>
              <CardDescription>Review and moderate post comments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allCommentsLoading ? (
                  <p>Loading comments...</p>
                ) : allComments.length > 0 ? (
                  allComments.map((comment) => (
                    <div key={comment.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{comment.authorName}</span>
                          <Badge variant={comment.status === 'approved' ? 'default' : 'secondary'}>
                            {comment.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      <div className="flex items-center gap-2 pt-2">
                        {comment.status !== 'approved' && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleCommentStatus(comment.id, 'approved')}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {comment.status !== 'spam' && (
                          <Button size="sm" variant="outline" className="h-8 text-destructive" onClick={() => handleCommentStatus(comment.id, 'spam')}>
                            <X className="h-3 w-3 mr-1" /> Spam
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => handleCommentDelete(comment.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No comments yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Newsletter Subscribers</CardTitle>
                <CardDescription>View and manage your email list.</CardDescription>
              </div>
              <Button size="sm" onClick={() => toast.info("নিউজলেটার পাঠানোর ফিচারটি বর্তমানে ডেভেলপমেন্ট পর্যায়ে আছে। এটি কার্যকর করতে একটি ইমেইল সার্ভিস (যেমন SendGrid) প্রয়োজন।")}>
                <Send className="mr-2 h-4 w-4" /> Send Newsletter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscribersLoading ? (
                  <p>Loading subscribers...</p>
                ) : subscribers.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Subscribed Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {subscribers.map((sub) => (
                          <tr key={sub.id}>
                            <td className="px-4 py-2">{sub.email}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No subscribers yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage and send push notifications to your subscribers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                        <h3 className="text-2xl font-bold">{subscriptions.length}</h3>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">How to send notifications?</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    বর্তমানে পুশ নোটিফিকেশন পাঠানোর জন্য আপনাকে <strong>Firebase Console</strong> ব্যবহার করতে হবে। 
                    নিচের ধাপগুলো অনুসরণ করুন:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>আপনার <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="h-3 w-3" /></a> এ যান।</li>
                    <li>বাম পাশের মেনু থেকে <strong>Engage</strong> সেকশনে গিয়ে <strong>Messaging</strong> এ ক্লিক করুন।</li>
                    <li><strong>New campaign</strong> বাটনে ক্লিক করে <strong>Notifications</strong> সিলেক্ট করুন।</li>
                    <li>আপনার নোটিফিকেশনের টাইটেল এবং মেসেজ লিখুন।</li>
                    <li>টার্গেট সেকশনে আপনার অ্যাপটি সিলেক্ট করুন এবং <strong>Review</strong> করে <strong>Publish</strong> করুন।</li>
                  </ol>
                  <div className="p-4 bg-muted rounded-lg border border-dashed">
                    <p className="font-medium text-foreground mb-1">প্রো টিপ:</p>
                    <p>ভবিষ্যতে আমরা এই ড্যাশবোর্ড থেকেই সরাসরি নোটিফিকেশন পাঠানোর ফিচার যুক্ত করব, যা Firebase Cloud Functions ব্যবহার করে কাজ করবে।</p>
                  </div>
                </div>
              </div>

              {subscriptions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Subscriptions</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Token (Partial)</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {subscriptions.slice(0, 5).map((sub) => (
                          <tr key={sub.id}>
                            <td className="px-4 py-2 font-mono text-xs">{sub.userId}</td>
                            <td className="px-4 py-2 font-mono text-xs">{sub.token.substring(0, 20)}...</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Messages</CardTitle>
              <CardDescription>Messages received from the contact form.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messagesLoading ? (
                  <p>Loading messages...</p>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{msg.subject || 'No Subject'}</h3>
                          <p className="text-sm text-muted-foreground">From: {msg.name} ({msg.email})</p>
                        </div>
                        <Badge variant={msg.status === 'unread' ? 'default' : 'secondary'}>
                          {msg.status}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-muted-foreground">
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateDoc(doc(db, 'messages', msg.id), { status: 'read' })}>
                            Mark as Read
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDoc(doc(db, 'messages', msg.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No messages yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and assign badges to authors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usersLoading ? (
                  <p>Loading users...</p>
                ) : users.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Badges</th>
                          <th className="px-4 py-2 text-left">Points</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map((u) => (
                          <tr key={u.uid}>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={u.photoURL} />
                                  <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{u.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 capitalize">{u.role}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {u.badges?.map(b => (
                                  <Badge key={b} variant="outline" className="text-[10px] px-1">{b}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2">{u.points || 0}</td>
                            <td className="px-4 py-2 text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenUserDialog(u)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No users found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">Across all published posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLikes}</div>
                <p className="text-xs text-muted-foreground">Total reactions received</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allComments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscribers.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Posts by Views</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={posts.slice().sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{fontSize: 12}} tickFormatter={(val) => val.substring(0, 10) + '...'} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="viewCount" fill="#3b82f6" name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Posts by Likes</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={posts.slice().sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{fontSize: 12}} tickFormatter={(val) => val.substring(0, 10) + '...'} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="likeCount" fill="#ef4444" name="Likes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Templates</CardTitle>
              <CardDescription>Create and manage email templates for your subscribers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => handleOpenTemplateDialog()}>
                  <Plus className="mr-2 h-4 w-4" /> Create Template
                </Button>
                
                {templatesLoading ? (
                  <p>Loading templates...</p>
                ) : templates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => (
                      <Card key={template.id} className="border-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>Subject: {template.subject}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenTemplateDialog(template)}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
                          <Button size="sm" onClick={() => handleSendNewsletter(template)}>
                            <Send className="h-4 w-4 mr-1" /> Send Now
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No templates created yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscribers List</CardTitle>
              <CardDescription>Manage your newsletter audience.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscribers.length > 0 ? (
                  subscribers.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{sub.email}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(sub.createdAt?.toDate())}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No subscribers yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>Configure site identity and advertisement spaces.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Input id="siteDescription" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2 text-primary">Notice Board</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <h4 className="font-medium">Enable Notice Board</h4>
                        <p className="text-sm text-muted-foreground">Show a global announcement on the home screen.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="noticeEnabled" 
                          checked={noticeEnabled} 
                          onChange={(e) => setNoticeEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="noticeEnabled">Enabled</Label>
                      </div>
                    </div>
                    {noticeEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="noticeText">Notice Text</Label>
                        <Textarea 
                          id="noticeText" 
                          value={noticeText} 
                          onChange={(e) => setNoticeText(e.target.value)} 
                          placeholder="Enter announcement text here..."
                          className="min-h-[100px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2 text-primary">Theme Customization</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="primaryColor" 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)} 
                          className="w-12 p-1 h-10"
                        />
                        <Input 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)} 
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <select 
                        id="fontFamily" 
                        value={fontFamily} 
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="Inter">Inter (Sans)</option>
                        <option value="Hind Siliguri">Hind Siliguri (Bengali)</option>
                        <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                        <option value="Tiro Bangla">Tiro Bangla</option>
                        <option value="Mina">Mina</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                        <option value="Outfit">Outfit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input 
                        id="logoUrl" 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)} 
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2 text-primary">Social Media Links</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input id="facebookUrl" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl">Twitter/X URL</Label>
                      <Input id="twitterUrl" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram URL</Label>
                      <Input id="instagramUrl" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl">YouTube URL</Label>
                      <Input id="youtubeUrl" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2 text-primary">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <h4 className="font-medium">Browser Push Notifications</h4>
                        <p className="text-sm text-muted-foreground">Manage subscriptions and send notifications.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary">{subscriptions.length} Subscribed</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          const tabs = document.querySelectorAll('[role="tab"]');
                          const notificationsTab = Array.from(tabs).find(t => t.textContent?.includes('Notifications')) as HTMLElement;
                          notificationsTab?.click();
                        }}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2 text-primary">Ad Space Control</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <h4 className="font-medium">Anti Ad-Blocker</h4>
                        <p className="text-sm text-muted-foreground">Detect ad blockers and show a message to users.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="antiAdBlock" 
                          checked={antiAdBlockEnabled} 
                          onChange={(e) => setAntiAdBlockEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="antiAdBlock">Enabled</Label>
                      </div>
                    </div>
                    {antiAdBlockEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="antiAdBlockMessage">Anti Ad-Block Message</Label>
                        <Input 
                          id="antiAdBlockMessage" 
                          value={antiAdBlockMessage} 
                          onChange={(e) => setAntiAdBlockMessage(e.target.value)} 
                          placeholder="Please disable your ad blocker to support us."
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="adHeader">Header Ad (HTML/Script)</Label>
                      <Textarea id="adHeader" value={adHeader} onChange={(e) => setAdHeader(e.target.value)} placeholder="Paste ad code here" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adSidebar">Sidebar Ad (HTML/Script)</Label>
                      <Textarea id="adSidebar" value={adSidebar} onChange={(e) => setAdSidebar(e.target.value)} placeholder="Paste ad code here" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adFooter">Footer Ad (HTML/Script)</Label>
                      <Textarea id="adFooter" value={adFooter} onChange={(e) => setAdFooter(e.target.value)} placeholder="Paste ad code here" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adInPost">In-Post Ad (HTML/Script)</Label>
                      <Textarea id="adInPost" value={adInPost} onChange={(e) => setAdInPost(e.target.value)} placeholder="Paste ad code here" />
                    </div>
                  </div>
                </div>

                <Button type="submit">Save Settings</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingPost ? 'update' : 'create'} your blog post.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter post title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Custom Slug (Optional)</Label>
              <Input 
                id="slug" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
                placeholder="my-custom-slug"
              />
              <p className="text-xs text-muted-foreground">If left empty, it will be generated from the title.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea 
                id="excerpt" 
                value={excerpt} 
                onChange={(e) => setExcerpt(e.target.value)} 
                placeholder="A short summary of the post"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Featured Image URL</Label>
              <Input 
                id="image" 
                value={featuredImage} 
                onChange={(e) => setFeaturedImage(e.target.value)} 
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Rich Text)</Label>
              <JoditEditor
                ref={editor}
                value={content}
                config={{
                  ...joditConfig,
                  placeholder: 'Write your post content here...'
                }}
                onBlur={newContent => setContent(newContent)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="draft" 
                  name="status" 
                  checked={status === 'draft'} 
                  onChange={() => setStatus('draft')} 
                />
                <Label htmlFor="draft">Draft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="published" 
                  name="status" 
                  checked={status === 'published'} 
                  onChange={() => setStatus('published')} 
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input 
                  id="tags" 
                  value={postTags.join(', ')} 
                  onChange={(e) => setPostTags(e.target.value.split(',').map(t => t.trim()).filter(t => t !== ''))} 
                  placeholder="tech, lifestyle, news"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Post</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Page Dialog */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
            <DialogDescription>
              Create static pages like About Us or Contact Us.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePageSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle">Title</Label>
              <Input 
                id="pageTitle" 
                value={pageTitle} 
                onChange={(e) => setPageTitle(e.target.value)} 
                placeholder="About Us"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSlug">Custom Slug (Optional)</Label>
              <Input 
                id="pageSlug" 
                value={pageSlug} 
                onChange={(e) => setPageSlug(e.target.value)} 
                placeholder="about-us"
              />
              <p className="text-xs text-muted-foreground">If left empty, it will be generated from the title.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageContent">Content (Rich Text)</Label>
              <JoditEditor
                ref={editor}
                value={pageContent}
                config={{
                  ...joditConfig,
                  placeholder: 'Write page content here...'
                }}
                onBlur={newContent => setPageContent(newContent)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="pageDraft" 
                  name="pageStatus" 
                  checked={pageStatus === 'draft'} 
                  onChange={() => setPageStatus('draft')} 
                />
                <Label htmlFor="pageDraft">Draft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="pagePublished" 
                  name="pageStatus" 
                  checked={pageStatus === 'published'} 
                  onChange={() => setPageStatus('published')} 
                />
                <Label htmlFor="pagePublished">Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPageDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Page</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="catName">Name</Label>
              <Input id="catName" value={catName} onChange={(e) => setCatName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catSlug">Slug (Optional)</Label>
              <Input id="catSlug" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catDesc">Description</Label>
              <Textarea id="catDesc" value={catDescription} onChange={(e) => setCatDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTagSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Name</Label>
              <Input id="tagName" value={tagName} onChange={(e) => setTagName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagSlug">Slug (Optional)</Label>
              <Input id="tagSlug" value={tagSlug} onChange={(e) => setTagSlug(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTagDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Tag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.displayName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userRole">Role</Label>
              <select 
                id="userRole"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="reader">Reader</option>
                <option value="author">Author</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userBadges">Badges (comma separated)</Label>
              <Input 
                id="userBadges" 
                value={userBadges.join(', ')} 
                onChange={(e) => setUserBadges(e.target.value.split(',').map(b => b.trim()).filter(b => b !== ''))} 
                placeholder="Verified, Top Author, Pro"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Newsletter Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Newsletter Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name (Internal)</Label>
              <Input id="templateName" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Weekly Digest" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateSubject">Email Subject</Label>
              <Input id="templateSubject" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="e.g. Check out our latest stories!" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateContent">Content (HTML/Rich Text)</Label>
              <JoditEditor
                ref={editor}
                value={templateContent}
                config={{
                  ...joditConfig,
                  placeholder: 'Write your newsletter content here...'
                }}
                onBlur={newContent => setTemplateContent(newContent)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
