import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Check if already subscribed
      const q = query(collection(db, 'newsletter'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.info("You are already subscribed!");
        setEmail('');
        return;
      }

      await addDoc(collection(db, 'newsletter'), {
        email,
        createdAt: serverTimestamp()
      });

      toast.success("Thank you for subscribing!");
      setEmail('');
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Newsletter</h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to get the latest stories and updates.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-background"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
