import React from 'react';
import { useAuth } from '../lib/auth-context';
import { useNotifications } from '../lib/hooks';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, cn } from '../lib/utils';
import { Heart, MessageCircle, Bell, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationsProps {
  onNavigate: (page: string, slug?: string) => void;
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const { user } = useAuth();
  const { notifications, loading } = useNotifications(user?.uid);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500 fill-current" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500 fill-current" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => notifications.filter(n => !n.read).forEach(n => markAsRead(n.id))}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4 flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Card 
              key={n.id} 
              className={cn(
                "border-none shadow-sm transition-colors cursor-pointer group",
                !n.read ? "bg-primary/5 border-l-4 border-l-primary" : "bg-card/50"
              )}
              onClick={() => {
                markAsRead(n.id);
                if (n.link) onNavigate(n.link);
              }}
            >
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{n.fromUserName?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-muted/20">
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-tight", !n.read ? "font-bold" : "text-muted-foreground")}>
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt?.toDate())}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted/30">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-lg">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
