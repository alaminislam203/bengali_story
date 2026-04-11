import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      home: "Home",
      blog: "Blog",
      about: "About",
      contact: "Contact",
      dashboard: "Dashboard",
      profile: "Profile",
      login: "Login",
      logout: "Logout",
      readMore: "Read More",
      latestPosts: "Latest Posts",
      featuredPosts: "Featured Posts",
      search: "Search...",
      subscribe: "Subscribe",
      subscribeText: "Get the latest posts delivered right to your inbox.",
      emailPlaceholder: "Enter your email",
      noPosts: "No posts found.",
      views: "views",
      likes: "likes",
      comments: "Comments",
      reply: "Reply",
      postComment: "Post Comment",
      writeComment: "Write a comment...",
      savePost: "Save Post",
      listen: "Listen",
      share: "Share",
      adminDashboard: "Admin Dashboard",
      settings: "Settings",
      analytics: "Analytics",
      pages: "Pages",
      categories: "Categories",
      tags: "Tags",
      subscribers: "Subscribers",
      messages: "Messages",
      savedPosts: "Saved Posts",
      editProfile: "Edit Profile",
      language: "Language",
    }
  },
  bn: {
    translation: {
      home: "হোম",
      blog: "ব্লগ",
      about: "আমাদের সম্পর্কে",
      contact: "যোগাযোগ",
      dashboard: "ড্যাশবোর্ড",
      profile: "প্রোফাইল",
      login: "লগইন",
      logout: "লগআউট",
      readMore: "আরও পড়ুন",
      latestPosts: "সর্বশেষ পোস্ট",
      featuredPosts: "নির্বাচিত পোস্ট",
      search: "খুঁজুন...",
      subscribe: "সাবস্ক্রাইব",
      subscribeText: "আপনার ইনবক্সে সর্বশেষ পোস্ট পেতে সাবস্ক্রাইব করুন।",
      emailPlaceholder: "আপনার ইমেইল দিন",
      noPosts: "কোনো পোস্ট পাওয়া যায়নি।",
      views: "বার দেখা হয়েছে",
      likes: "লাইক",
      comments: "মতামত",
      reply: "উত্তর দিন",
      postComment: "মতামত দিন",
      writeComment: "একটি মতামত লিখুন...",
      savePost: "পোস্ট সেভ করুন",
      listen: "শুনুন",
      share: "শেয়ার করুন",
      adminDashboard: "অ্যাডমিন ড্যাশবোর্ড",
      settings: "সেটিংস",
      analytics: "অ্যানালিটিক্স",
      pages: "পেজসমূহ",
      categories: "ক্যাটাগরি",
      tags: "ট্যাগ",
      subscribers: "সাবস্ক্রাইবার",
      messages: "মেসেজ",
      savedPosts: "সেভ করা পোস্ট",
      editProfile: "প্রোফাইল এডিট করুন",
      language: "ভাষা",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'bn', // Default to Bengali
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
