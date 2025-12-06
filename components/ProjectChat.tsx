import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Loader2, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase';
import { 
  collection, query, where, getDocs, addDoc, setDoc, doc, getDoc, updateDoc,
  serverTimestamp, onSnapshot, orderBy, limit 
} from 'firebase/firestore';
import { Button, Input, GlassCard } from './UI';
import { Project } from '../types';

interface ProjectChatProps {
  project: Project;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderRole: string;
  ownerId: string;
  freelancerId: string;
  timestamp: any;
}

interface ChatRoom {
  id: string; // This is the projectId
  projectId: string;
  active: boolean;
  ownerId: string;
  freelancerId: string;
  participants: string[];
  createdAt: any;
  closedAt: any;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ project }) => {
  const { user } = useAuth();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize or Fetch Chat Room
  useEffect(() => {
    if (!user || !project) return;

    setLoading(true);
    
    // Direct reference to the chat document located at /chats/{projectId}
    const chatDocRef = doc(firestore, 'chats', project.id);

    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
            // Chat exists and we have permission
            setChatRoom({ id: docSnap.id, ...docSnap.data() } as ChatRoom);
            setError(null);
        } else {
            // Chat does not exist
            setChatRoom(null);
            setError(null);
        }
        setLoading(false);
    }, (err) => {
        // If we get permission-denied, it usually means the document doesn't exist yet,
        // so the security rule (checking resource.data.participants) fails implicitly.
        // We treat this as "Chat not created yet" -> Show creation UI.
        if (err.code === 'permission-denied') {
             setChatRoom(null);
             setError(null);
        } else {
             console.error("Error fetching chat room:", err);
             setError("Unable to load chat.");
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id, user]);

  // 2. Listen for Messages
  useEffect(() => {
    if (!chatRoom) {
        setMessages([]);
        return;
    }

    // Path: /chats/{projectId}/messages
    const messagesRef = collection(firestore, 'chats', chatRoom.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (err) => {
        console.error("Snapshot error:", err);
        if (err.code === 'permission-denied') {
            // This is a real error if chatRoom exists but messages are blocked
            setError("Access denied to messages.");
        }
    });

    return () => unsubscribe();
  }, [chatRoom?.id]);

  const handleStartChat = async () => {
    if (!user || !project) return;
    setSending(true);
    setError(null);
    try {
        const projectOwnerId = project.ownerId || project.clientId;
        const projectFreelancerId = project.freelancerId;

        if (!projectOwnerId) {
             setError("Cannot start chat: Owner information missing.");
             setSending(false);
             return;
        }

        let chatOwnerId = user.id;
        let chatFreelancerId = '';

        if (user.id === projectOwnerId) {
             // Current user is the Project Client
             chatFreelancerId = projectFreelancerId || '';
        } else {
             // Current user is the Freelancer (or other), so the "other" party is the Project Owner
             chatFreelancerId = projectOwnerId;
        }

        const chatDocRef = doc(firestore, 'chats', project.id);
        
        // Attempt to read first. If it fails due to permissions, it likely doesn't exist.
        let docExists = false;
        try {
            const chatSnap = await getDoc(chatDocRef);
            docExists = chatSnap.exists();
        } catch (readErr: any) {
            if (readErr.code === 'permission-denied') {
                // Document likely doesn't exist, so security rules blocked the read.
                // We proceed to create.
                docExists = false;
            } else {
                throw readErr;
            }
        }

        if (docExists) {
            // Chat exists, ensure it is active
            await updateDoc(chatDocRef, { active: true });
        } else {
            // Create new chat
            const participants = [chatOwnerId, chatFreelancerId].filter(Boolean);

            const newChatData = {
                projectId: project.id,
                ownerId: chatOwnerId, // Must be current user ID to pass 'allow create' rule
                freelancerId: chatFreelancerId, 
                active: true,
                createdAt: serverTimestamp(),
                closedAt: null,
                participants: participants
            };
            
            await setDoc(chatDocRef, newChatData);
        }
        
    } catch (e: any) {
        console.error("Error starting chat:", e);
        if (e.code === 'permission-denied') {
            setError("Permission denied: You cannot create this chat.");
        } else {
            setError("Failed to create chat room.");
        }
    } finally {
        setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatRoom) return;

    const text = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      // Path: /chats/{projectId}/messages
      const messagesRef = collection(firestore, 'chats', chatRoom.id, 'messages');
      
      await addDoc(messagesRef, {
        text,
        senderId: user.id,
        senderRole: user.role,
        ownerId: chatRoom.ownerId || '',
        freelancerId: chatRoom.freelancerId || '',
        projectId: chatRoom.projectId,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      setNewMessage(text); // Revert on fail
      if (error.code === 'permission-denied') {
        alert("Message failed to send: Permission denied.");
      } else {
        // Do not set global error to avoid blocking the view, just alert or log
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-red-500">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>{error}</p>
            <Button variant="ghost" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
    );
  }

  // State: No Chat Room Exists
  if (!chatRoom) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
            <UserIcon size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Start a Conversation</h3>
        <p className="text-slate-500 max-w-xs">
            Connect directly regarding <strong>{project.title}</strong>.
        </p>
        <Button onClick={handleStartChat} isLoading={sending}>
            Create Chat Room
        </Button>
      </div>
    );
  }

  // State: Chat Room exists but is archived
  if (chatRoom.active === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Lock size={48} className="text-slate-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat Archived</h3>
        <p className="text-slate-500">This conversation has been closed.</p>
      </div>
    );
  }

  // State: Active Chat
  return (
    <div className="flex flex-col h-[600px] md:h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/5">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-10 flex justify-between items-center">
            <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Project Chat</span>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{project.title}</h4>
            </div>
            <div className={`w-2 h-2 rounded-full ${chatRoom.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>

        {/* Messages Area */}
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 pt-20 pb-4 space-y-4 custom-scrollbar"
        >
            {messages.length === 0 && (
                <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Say hello!</div>
            )}
            
            {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                            isMe 
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-tl-none'
                        }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {msg.timestamp?.seconds 
                                    ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                    : 'Sending...'}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 z-10">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    className="flex-1 bg-slate-100 dark:bg-white/5 border-0 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" disabled={!newMessage.trim()} className="px-4 rounded-xl">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    </div>
  );
};