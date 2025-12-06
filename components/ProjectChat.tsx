import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Loader2, Lock, AlertCircle, Paperclip, File as FileIcon, Image as ImageIcon, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestore, storage } from '../services/firebase';
import { 
  collection, query, getDocs, addDoc, setDoc, doc, getDoc, updateDoc,
  serverTimestamp, onSnapshot, orderBy, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button, Input } from './UI';
import { Project } from '../types';
import { useToast } from '../context/ToastContext';

interface ProjectChatProps {
  project: Project;
}

interface Message {
  id: string;
  type?: 'text' | 'file';
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
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
  ownerTyping?: boolean;
  freelancerTyping?: boolean;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ project }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for cleanup accessibility in useEffect
  const chatRoomRef = useRef<ChatRoom | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => { chatRoomRef.current = chatRoom; }, [chatRoom]);
  useEffect(() => { userRef.current = user; }, [user]);

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
        if (err.code === 'permission-denied') {
             setChatRoom(null);
             setError(null);
        } else {
             console.error("Error fetching chat room:", err);
             setError("Unable to load chat.");
        }
        setLoading(false);
    });

    return () => {
        unsubscribe();
    };
  }, [project.id, user]);

  // Cleanup on unmount (Reset typing status)
  useEffect(() => {
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            
            // Try to reset typing status on unmount using refs
            const currentChat = chatRoomRef.current;
            const currentUser = userRef.current;
            
            if (currentChat && currentUser) {
                let role = null;
                if (currentUser.id === currentChat.ownerId) role = 'owner';
                else if (currentUser.id === currentChat.freelancerId) role = 'freelancer';

                if (role) {
                    const field = role === 'owner' ? 'ownerTyping' : 'freelancerTyping';
                    updateDoc(doc(firestore, 'chats', currentChat.id), { [field]: false })
                        .catch(err => {
                            if (err.code !== 'permission-denied') console.error("Unmount cleanup failed:", err.code);
                        });
                }
            }
        }
    };
  }, []);

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
            setError("Access denied to messages.");
        }
    });

    return () => unsubscribe();
  }, [chatRoom?.id]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!chatRoom || !user) return;
    
    let role = null;
    if (user.id === chatRoom.ownerId) {
        role = 'owner';
    } else if (user.id === chatRoom.freelancerId) {
        role = 'freelancer';
    }
    
    // If not a participant, do nothing
    if (!role) return;

    // Determine field based on role
    const field = role === 'owner' ? 'ownerTyping' : 'freelancerTyping';

    try {
        await updateDoc(doc(firestore, 'chats', chatRoom.id), {
            [field]: isTyping
        });
    } catch (err: any) {
        if (err.code !== 'permission-denied') {
            console.error("Failed to update typing status:", err.code);
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);

    if (!user || !chatRoom) return;

    if (!typingTimeoutRef.current) {
        // Start typing
        updateTypingStatus(true);
    } else {
        // Reset timeout
        clearTimeout(typingTimeoutRef.current);
    }

    // Set debounce to stop typing
    typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
        typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleStartChat = async () => {
    if (!user || !project) return;
    setSending(true);
    setError(null);
    try {
        const projectOwnerId = project.ownerId || project.clientId;
        let chatOwnerId = projectOwnerId;
        let chatFreelancerId = project.freelancerId;

        // If current user is not the owner, they are the freelancer
        if (user.id !== projectOwnerId) {
             chatFreelancerId = user.id;
        }

        if (!chatOwnerId) {
             setError("Cannot start chat: Owner information missing.");
             setSending(false);
             return;
        }

        const chatDocRef = doc(firestore, 'chats', project.id);
        
        let docExists = false;
        try {
            const chatSnap = await getDoc(chatDocRef);
            docExists = chatSnap.exists();
        } catch (readErr: any) {
            if (readErr.code === 'permission-denied') {
                docExists = false;
            } else {
                throw readErr;
            }
        }

        if (docExists) {
            await updateDoc(chatDocRef, { active: true });
        } else {
            const participants = [chatOwnerId, chatFreelancerId].filter(Boolean);
            const newChatData = {
                projectId: project.id,
                ownerId: chatOwnerId, 
                freelancerId: chatFreelancerId || '', 
                active: true,
                createdAt: serverTimestamp(),
                closedAt: null,
                participants: participants,
                ownerTyping: false,
                freelancerTyping: false
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatRoom) return;

    setIsUploading(true);
    try {
        // 1. Upload File
        const uniqueName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `chat-attachments/${chatRoom.id}/${uniqueName}`);
        
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // 2. Save Message
        const messagesRef = collection(firestore, 'chats', chatRoom.id, 'messages');
        await addDoc(messagesRef, {
            type: 'file',
            fileUrl: downloadUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            senderId: user.id,
            senderRole: user.role,
            ownerId: chatRoom.ownerId || '',
            freelancerId: chatRoom.freelancerId || '',
            projectId: chatRoom.projectId,
            timestamp: serverTimestamp()
        });
        
    } catch (error) {
        console.error("File upload failed:", error);
        showToast("Failed to upload file. Please try again.", "error");
    } finally {
        setIsUploading(false);
        // Clear input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatRoom) return;

    const text = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    // Clear typing status immediately
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }
    await updateTypingStatus(false);

    try {
      const messagesRef = collection(firestore, 'chats', chatRoom.id, 'messages');
      
      await addDoc(messagesRef, {
        type: 'text',
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
        showToast("Message failed to send: Permission denied.", "error");
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Determine if the OTHER party is typing
  let isOtherTyping = false;
  let otherLabel = "User";

  if (chatRoom && user) {
    let role = null;
    if (user.id === chatRoom.ownerId) role = 'owner';
    else if (user.id === chatRoom.freelancerId) role = 'freelancer';

    if (role === 'owner') {
        isOtherTyping = !!chatRoom.freelancerTyping;
        otherLabel = "Freelancer"; 
    } else if (role === 'freelancer') {
        isOtherTyping = !!chatRoom.ownerTyping;
        otherLabel = "Client";
    }
  }

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

  if (chatRoom.active === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Lock size={48} className="text-slate-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat Archived</h3>
        <p className="text-slate-500">This conversation has been closed.</p>
      </div>
    );
  }

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
                const isFile = msg.type === 'file';
                const isImage = isFile && msg.fileType?.startsWith('image/');

                return (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl shadow-sm ${
                            isMe 
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-tl-none'
                        } ${isFile && isImage ? 'p-1' : 'px-4 py-3'}`}>
                            
                            {/* Render based on type */}
                            {isFile ? (
                                isImage ? (
                                    <div className="relative group">
                                        <img 
                                            src={msg.fileUrl} 
                                            alt={msg.fileName} 
                                            className="rounded-xl max-h-[300px] w-auto object-cover" 
                                        />
                                        <a 
                                            href={msg.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                                        >
                                            <Download className="text-white" size={24} />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                                            <FileIcon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                            <p className={`text-xs ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>{formatFileSize(msg.fileSize)}</p>
                                        </div>
                                        <a 
                                            href={msg.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className={`p-2 rounded-full hover:bg-black/10 transition-colors ${isMe ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                )
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )}
                            
                            {!isImage && (
                                <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    {msg.timestamp?.seconds 
                                        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                        : 'Sending...'}
                                </span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 z-10 relative">
            <AnimatePresence>
                {isOtherTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-8 left-4 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded-t-lg backdrop-blur-sm shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        {otherLabel} is typing...
                    </motion.div>
                )}
            </AnimatePresence>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                
                <Button 
                    type="button" 
                    variant="secondary" 
                    className="px-3 rounded-xl bg-slate-100 dark:bg-white/5 border-transparent hover:bg-slate-200 dark:hover:bg-white/10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Attach file"
                >
                    {isUploading ? (
                        <Loader2 className="animate-spin text-primary" size={20} />
                    ) : (
                        <Paperclip size={20} className="text-slate-500 dark:text-gray-400" />
                    )}
                </Button>

                <input
                    className="flex-1 bg-slate-100 dark:bg-white/5 border-0 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                />
                <Button type="submit" disabled={!newMessage.trim()} className="px-4 rounded-xl">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    </div>
  );
};