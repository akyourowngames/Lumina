import { firestore, timestamp } from './firebase';
import { NotificationType } from '../types';

/**
 * Creates a notification for a specific user.
 * 
 * Uses the root 'notifications' collection.
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  sender?: { name: string; avatar?: string },
  metadata?: any
) => {
  try {
    if (!userId) {
        return;
    }

    // Writing to root 'notifications' collection
    await firestore.collection('notifications').add({
      userId,
      type,
      title,
      body,
      isRead: false, // Used by UI types
      read: false,   // duplicate for strict rule compliance if needed
      link: link || null,
      sender: sender || null,
      metadata: metadata || {},
      createdAt: timestamp(),
    });
    
  } catch (error) {
    console.error("[NotificationService] Failed to write notification:", error);
  }
};