import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        subject,
        message,
        status: 'unread',
        createdAt: serverTimestamp()
      });

      toast.success("আপনার বার্তা সফলভাবে পাঠানো হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।");
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto p-6 border rounded-xl bg-card shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">আপনার নাম</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="আপনার নাম লিখুন" 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">ইমেইল ঠিকানা</Label>
        <Input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="your@email.com" 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">বিষয় (ঐচ্ছিক)</Label>
        <Input 
          id="subject" 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="বার্তার বিষয়" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">আপনার বার্তা</Label>
        <Textarea 
          id="message" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="আপনার বার্তা এখানে লিখুন..." 
          className="min-h-[150px]"
          required 
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "পাঠানো হচ্ছে..." : (
          <>
            <Send className="mr-2 h-4 w-4" /> বার্তা পাঠান
          </>
        )}
      </Button>
    </form>
  );
}
