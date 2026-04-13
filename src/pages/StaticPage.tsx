import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Page } from '../lib/hooks';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import ContactForm from '../components/ContactForm';
import DOMPurify from 'dompurify';

interface StaticPageProps {
  slug: string;
}

export default function StaticPage({ slug }: StaticPageProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'pages'),
          where('slug', '==', slug),
          where('status', '==', 'published'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setPage({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Page);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-12 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!page) {
    if (slug === 'contact') {
      return (
        <div className="container max-w-4xl py-12">
          <Helmet>
            <title>যোগাযোগ | গল্পগ্রাম</title>
            <meta name="description" content="গল্পগ্রামের সাথে যোগাযোগ করুন।" />
            <link rel="canonical" href={window.location.href} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="যোগাযোগ | গল্পগ্রাম" />
            <meta property="og:description" content="গল্পগ্রামের সাথে যোগাযোগ করুন।" />
            <meta name="twitter:card" content="summary" />
          </Helmet>
          <h1 className="text-4xl font-bold mb-8 text-center">যোগাযোগ করুন</h1>
          <p className="text-center text-muted-foreground mb-12">
            আপনার কোনো প্রশ্ন, মতামত বা পরামর্শ থাকলে নিচের ফর্মটি পূরণ করে আমাদের জানান। আমরা দ্রুত আপনার সাথে যোগাযোগ করব।
          </p>
          <ContactForm />
        </div>
      );
    }

    if (slug === 'about') {
      return (
        <div className="container max-w-4xl py-12">
          <Helmet>
            <title>আমাদের সম্পর্কে | গল্পগ্রাম</title>
            <meta name="description" content="গল্পগ্রাম সম্পর্কে জানুন - আপনার প্রিয় গল্পের ঠিকানা।" />
            <link rel="canonical" href={window.location.href} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="আমাদের সম্পর্কে | গল্পগ্রাম" />
            <meta property="og:description" content="গল্পগ্রাম সম্পর্কে জানুন - আপনার প্রিয় গল্পের ঠিকানা।" />
            <meta name="twitter:card" content="summary" />
          </Helmet>
          <h1 className="text-4xl font-bold mb-8">আমাদের সম্পর্কে</h1>
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <p className="text-xl text-primary font-medium">গল্পগ্রাম - যেখানে প্রতিটি শব্দের মাঝে লুকিয়ে থাকে একটি নতুন গল্প।</p>
            <p>
              গল্পগ্রাম একটি আধুনিক বাংলা ব্লগ প্ল্যাটফর্ম, যা তৈরি করা হয়েছে পাঠকদের জন্য একটি সুন্দর এবং নিরিবিলি পড়ার পরিবেশ নিশ্চিত করতে। আমরা বিশ্বাস করি, প্রতিটি মানুষের জীবনেই একটি গল্প আছে এবং সেই গল্পগুলো শেয়ার করার জন্য একটি নিরাপদ ও সুন্দর প্ল্যাটফর্ম প্রয়োজন।
            </p>
            <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <h3 className="text-lg font-bold text-primary mb-2">আমাদের লক্ষ্য</h3>
                <p className="text-sm text-muted-foreground">বাংলা ভাষায় মানসম্মত কন্টেন্ট তৈরি করা এবং নতুন লেখকদের উৎসাহিত করা।</p>
              </div>
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <h3 className="text-lg font-bold text-primary mb-2">আমাদের বৈশিষ্ট্য</h3>
                <p className="text-sm text-muted-foreground">AI নিরাপত্তা প্রহরী, ডার্ক মোড এবং দ্রুতগতির ইউজার ইন্টারফেস।</p>
              </div>
            </div>
            <p>
              আপনি যদি আপনার কোনো গল্প, অভিজ্ঞতা বা চিন্তা আমাদের সাথে শেয়ার করতে চান, তবে আপনি আমাদের এখানে লেখক হিসেবে যোগ দিতে পারেন। আমরা আপনার সৃজনশীলতাকে সম্মান করি।
            </p>
            <p>গল্পগ্রামের সাথে থাকার জন্য আপনাকে ধন্যবাদ।</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container max-w-4xl py-24 text-center">
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground mt-4">The page you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={`Read about ${page.title}.`} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={`Read about ${page.title}.`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div 
        className="prose prose-lg dark:prose-invert max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
      />
      {slug === 'contact' && (
        <div className="mt-12">
          <ContactForm />
        </div>
      )}
    </div>
  );
}
