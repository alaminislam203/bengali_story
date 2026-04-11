import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  authorBadges?: string[];
  authorPoints?: number;
  featuredImage?: string;
  categoryId?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'pending';
  publishedAt?: any;
  createdAt: any;
  updatedAt: any;
  viewCount: number;
  likeCount: number;
  shareCount?: number;
  isPinned?: boolean;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: string;
  badges?: string[];
  points?: number;
  donationLink?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
  status: 'pending' | 'approved' | 'spam';
  parentId?: string;
  likeCount?: number;
  likedBy?: string[];
}

export function usePosts(options: { 
  status?: 'published' | 'draft' | 'pending', 
  limitCount?: number,
  categoryId?: string,
  authorId?: string
} = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options.categoryId) {
      q = query(q, where('categoryId', '==', options.categoryId));
    }
    if (options.authorId) {
      q = query(q, where('authorId', '==', options.authorId));
    }
    if (options.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [options.status, options.limitCount, options.categoryId, options.authorId]);

  return { posts, loading };
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, 'comments'), 
      where('postId', '==', postId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  return { comments, loading };
}

export function usePopularPosts(limitCount: number = 5) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching popular posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { posts, loading };
}

export interface Setting {
  id: string;
  siteName?: string;
  siteDescription?: string;
  adHeader?: string;
  adSidebar?: string;
  adFooter?: string;
  adInPost?: string;
  antiAdBlockEnabled?: boolean;
  antiAdBlockMessage?: string;
  primaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  noticeText?: string;
  noticeEnabled?: boolean;
  updatedAt?: any;
}

export function useSettings() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) {
        setSettings({ id: doc.id, ...doc.data() } as Setting);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  updatedAt?: any;
}

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Page[];
      setPages(pagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { pages, loading };
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: any;
}

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'newsletter'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscriber[];
      setSubscribers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { subscribers, loading };
}

export function useAllComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { comments, loading };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { categories, loading };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tags'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];
      setTags(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { tags, loading };
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: any;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: any;
}

export function useBookmarks(userId?: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bookmark[];
      setBookmarks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { bookmarks, loading };
}


export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { messages, loading };
}

export function useNewsletterTemplates() {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'newsletter_templates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsletterTemplate[];
      setTemplates(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching newsletter templates:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { templates, loading };
}

export function useAllUsers() {
  const [users, setUsers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'public_profiles'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      })) as any[];
      setUsers(data as PublicProfile[]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading };
}

export interface PushSubscription {
  id: string;
  token: string;
  userId: string;
  createdAt: any;
}

export function usePushSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'push_subscriptions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PushSubscription[];
      setSubscriptions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching push subscriptions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { subscriptions, loading };
}
