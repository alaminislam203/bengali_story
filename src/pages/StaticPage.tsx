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
            <title>যোগাযোগ | কুড়ানোগল্প.পাতা.বাংলা</title>
            <meta name="description" content="আমাদের সাথে যোগাযোগ করুন।" />
            <link rel="canonical" href={window.location.href} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="যোগাযোগ | কুড়ানোগল্প.পাতা.বাংলা" />
            <meta property="og:description" content="আমাদের সাথে যোগাযোগ করুন।" />
            <meta name="twitter:card" content="summary" />
          </Helmet>
          <h1 className="text-4xl font-bold mb-8 text-center">যোগাযোগ করুন</h1>
          <p className="text-center text-muted-foreground mb-12">
            আপনার কোনো প্রশ্ন বা মতামত থাকলে নিচের ফর্মটি পূরণ করে আমাদের জানান।
          </p>
          <ContactForm />
        </div>
      );
    }

    if (slug === 'about') {
      return (
        <div className="container max-w-4xl py-12">
          <Helmet>
            <title>আমাদের সম্পর্কে | কুড়ানোগল্প.পাতা.বাংলা</title>
            <meta name="description" content="কুড়ানোগল্প.পাতা.বাংলা সম্পর্কে জানুন।" />
            <link rel="canonical" href={window.location.href} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="আমাদের সম্পর্কে | কুড়ানোগল্প.পাতা.বাংলা" />
            <meta property="og:description" content="কুড়ানোগল্প.পাতা.বাংলা সম্পর্কে জানুন।" />
            <meta name="twitter:card" content="summary" />
          </Helmet>
          <h1 className="text-4xl font-bold mb-8">আমাদের সম্পর্কে</h1>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>আমাদের ব্লগে আপনাকে স্বাগতম! আমরা এখানে বিভিন্ন গল্প এবং অভিজ্ঞতা শেয়ার করি।</p>
            <p>আপনি যদি আপনার কোনো গল্প আমাদের সাথে শেয়ার করতে চান, তবে যোগাযোগ করতে পারেন।</p>
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
