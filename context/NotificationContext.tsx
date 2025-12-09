import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { firestore } from '../services/firebase';
import { useAuth } from './AuthContext';
import { AppNotification } from '../types';

// Simple "Pop" sound (Base64 MP3)
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAnohs0IAAAAAACE5owAAAAAIFIxYwAAAAAIQm7AAAAAA//uQZAEAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZAQAABiM2YAIAAAACkZswAAAAAGIzZgAgAAAAKRmzAAAA//uQZAgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZAmAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZBEAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZBwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZCMAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZDEAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZDwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZEQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZFAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZFwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZGgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZHUAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZIIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZI4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZJoAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZKQAABiM2YAIAAAACkZswAAAAAGIzZgAgAAAAKRmzAAAA//uQZKwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZLAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZLwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZMQAABiM2YAIAAAACkZswAAAAAGIzZgAgAAAAKRmzAAAA//uQZNQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZOgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZPAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZPwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZQwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZRgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZSQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZSwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZTgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZUUAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZVAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZVsAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZWgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZXIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZYAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZYwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZZwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZaQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZawAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZbwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZcYAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZdQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZd4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZegAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZfQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZfwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZggAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZGwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZHgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZIIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZIsAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZJYAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZKIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZK4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZLYAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZMIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZMoAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZNQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZOAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZOwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZPgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZQIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZQwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZRwAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZScAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZTAAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZTsAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZUYAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZVIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZV4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZWoAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZXQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZX4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZYgAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZZIAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZZ4AAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZaoAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQZbQAAABAAAAAAAACAAAAAAAABAAAAAAAAAIAAAAAAAEA//uQzbQAAAAA0gAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD/";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  isLoading: boolean;
  latestNotification: AppNotification | null; // For Toasts
  clearLatestNotification: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  
  // Sound Preference
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
      const stored = localStorage.getItem('lumina_sound_enabled');
      return stored === null ? true : stored === 'true';
  });

  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
      audioRef.current.volume = 0.5;
  }, []);

  const toggleSound = () => {
      setIsSoundEnabled(prev => {
          const newState = !prev;
          localStorage.setItem('lumina_sound_enabled', String(newState));
          return newState;
      });
  };

  const playNotificationSound = () => {
      if (isSoundEnabled && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
      }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = firestore
      .collection('notifications')
      .where('userId', '==', user.id)
      .limit(100)
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate 
                ? doc.data().createdAt.toDate() 
                : new Date(doc.data().createdAt || Date.now())
          })) as AppNotification[];

          // Client-side Sort
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setNotifications(items);
          setIsLoading(false);

          // Handle New Notifications (Toast & Sound)
          if (!isFirstLoad.current) {
             const newItems: AppNotification[] = [];
             snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                   const data = change.doc.data();
                   // Convert timestamp for logic
                   const notifTime = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                   const now = new Date();
                   // Only notify if < 30s old to prevent blast on refresh
                   if (now.getTime() - notifTime.getTime() < 30000 && !data.isRead) {
                       newItems.push({ id: change.doc.id, ...data, createdAt: notifTime } as AppNotification);
                   }
                }
             });

             if (newItems.length > 0) {
                 playNotificationSound();
                 
                 // SMART BATCHING
                 if (newItems.length === 1) {
                     setLatestNotification(newItems[0]);
                 } else {
                     // Create a summary notification
                     const summary: AppNotification = {
                         id: 'summary-' + Date.now(),
                         userId: user.id,
                         type: 'alert',
                         title: `${newItems.length} New Notifications`,
                         body: 'You have multiple new updates to review.',
                         isRead: false,
                         createdAt: new Date(),
                         link: '/notifications',
                     };
                     setLatestNotification(summary);
                 }
             }
          }
          isFirstLoad.current = false;
        },
        (error) => {
          console.error("Notification listener error:", error);
          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await firestore.collection('notifications').doc(id).update({ isRead: true });
    } catch (e) {
      console.error("Error marking read:", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    const batch = firestore.batch();
    const unreadDocs = notifications.filter(n => !n.isRead);
    
    if (unreadDocs.length === 0) return;

    unreadDocs.forEach(notif => {
      const ref = firestore.collection('notifications').doc(notif.id);
      batch.update(ref, { isRead: true });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error("Batch update failed", e);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
        await firestore.collection('notifications').doc(id).delete();
    } catch (e) {
        console.error("Delete failed", e);
    }
  };

  const clearLatestNotification = () => setLatestNotification(null);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      deleteNotification,
      isLoading,
      latestNotification,
      clearLatestNotification,
      isSoundEnabled,
      toggleSound
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
