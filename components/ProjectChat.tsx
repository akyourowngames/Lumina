import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Loader2, Lock, AlertCircle, Paperclip, File as FileIcon, Image as ImageIcon, Download, Check, CheckCheck, FileText, FileArchive, FileVideo, FileAudio, Mic, StopCircle, Play, Pause, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestore, timestamp } from '../services/firebase';
import { supabase } from '../services/supabaseClient';
import { Button, Input } from './UI';
import { Project } from '../types';
import { useToast } from '../context/ToastContext';

interface ProjectChatProps {
  project: Project;
}

interface Message {
  id: string;
  type?: 'text' | 'file' | 'audio';
  text?: string;
  fileUrl?: string;
  audioUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  duration?: number;
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
  lastSeenByOwner?: string | null;
  lastSeenByFreelancer?: string | null;
}

// Sub-component for the Seen Status Icon
const SeenStatus = ({ isSeen, className = "" }: { isSeen: boolean, className?: string }) => {
  return (
    <span className={`inline-flex ml-1 ${className}`} title={isSeen ? "Seen" : "Delivered"}>
      {isSeen ? <CheckCheck size={14} /> : <Check size={14} />}
    </span>
  );
};

// Helper for formatting last seen
const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return '';
    let date;
    
    // Handle Firestore Timestamp
    if (timestamp?.toDate) {
        date = timestamp.toDate();
    } 
    // Handle Date object
    else if (timestamp instanceof Date) {
        date = timestamp;
    }
    // Handle ISO string or timestamp number
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return '';
    }

    if (isNaN(date.getTime())) return '';
    
    const diff = (new Date().getTime() - date.getTime()) / 1000 / 60; // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
};

// Custom Audio Player Component
const AudioMessage = ({ src, duration: initialDuration, isMe }: { src: string, duration?: number, isMe: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // If metadata loads and we don't have a duration from props, update it
        const onLoadedMetadata = () => {
            if (!initialDuration && audio.duration !== Infinity && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const onTimeUpdate = () => {
             setCurrentTime(audio.currentTime);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, [initialDuration]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent message bubble click
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!audioRef.current || !duration) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.min(Math.max(x / width, 0), 1);
        
        const newTime = percentage * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Styling configuration
    // Inner bubble style (Glass effect for sender, Card for receiver)
    const containerClass = isMe 
        ? "bg-white/10 border border-white/20" 
        : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10";
    
    // Icon background styling
    const iconBg = isMe 
        ? "bg-white/20 text-white" 
        : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300";

    const textPrimary = isMe ? "text-white" : "text-slate-900 dark:text-white";
    // Small semi-bold white opacity 80% for duration
    const textSecondary = isMe ? "text-white/80" : "text-slate-500 dark:text-gray-400";
    
    // Progress bar colors
    const trackColor = isMe ? "bg-white/30" : "bg-slate-200 dark:bg-white/10";
    const progressFill = isMe ? "bg-white" : "bg-purple-500";

    return (
        <div className={`flex items-start gap-[10px] p-3 rounded-xl min-w-[240px] transition-all duration-300 ${containerClass}`}>
            {/* Mic Icon (Left) */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                <Mic size={20} />
            </div>

            {/* Content (Right) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-1">
                {/* Row 1: Play + Progress */}
                <div className="flex items-center gap-3 mb-1.5">
                    <button 
                        onClick={togglePlay}
                        className={`transition-transform active:scale-95 focus:outline-none ${textPrimary} hover:opacity-80`}
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>

                    {/* Progress Bar (h-1 = 4px) */}
                    <div 
                        className={`relative h-1 flex-1 rounded-full overflow-hidden cursor-pointer group ${trackColor}`}
                        onClick={handleSeek}
                    >
                        <motion.div 
                            className={`absolute top-0 left-0 h-full rounded-full ${progressFill}`}
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                            transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                        />
                    </div>
                </div>
                
                {/* Row 2: Duration (Below, Right Aligned) */}
                <div className={`flex justify-end text-[10px] font-semibold ${textSecondary}`}>
                     {formatTime(isPlaying ? currentTime : duration || 0)}
                </div>
            </div>
            
            <audio ref={audioRef} src={src} className="hidden" />
        </div>
    );
};

export const ProjectChat: React.FC<ProjectChatProps> = ({ project }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserData, setOtherUserData] = useState<any>(null);

  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Scroll Refs & State
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  // Ref for isAtBottom to use inside useEffect without dependencies issues
  const isAtBottomRef = useRef(true); 

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs for cleanup accessibility in useEffect
  const chatRoomRef = useRef<ChatRoom | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => { chatRoomRef.current = chatRoom; }, [chatRoom]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Helper: Scroll to Bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  };

  // Helper: Handle Scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if within 40px of bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 40;
    
    setIsAtBottom(isNearBottom);
    isAtBottomRef.current = isNearBottom;

    if (isNearBottom) {
      setHasNewMessages(false);
    }
  };

  // 1. Initialize or Fetch Chat Room
  useEffect(() => {
    if (!user || !project) return;

    setLoading(true);
    
    // Direct reference to the chat document located at /chats/{projectId}
    const chatDocRef = firestore.collection('chats').doc(project.id);

    const unsubscribe = chatDocRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
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

  // Force re-render every minute to update "last seen" text
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Listen for Other User Presence
  useEffect(() => {
    if (!user) return;

    let targetId: string | null = null;

    // 1. Try to determine other user from ChatRoom (most accurate source of truth)
    if (chatRoom) {
        if (user.id === chatRoom.ownerId) {
            targetId = chatRoom.freelancerId;
        } else if (user.id === chatRoom.freelancerId) {
            targetId = chatRoom.ownerId;
        }
    } 
    // 2. Fallback to Project (if chatRoom not loaded yet or doesn't exist)
    else if (project) {
        const ownerId = project.ownerId || project.clientId;
        if (user.id === ownerId) {
            // If I am the owner, look for freelancer
            targetId = project.freelancerId || null;
        } else {
            // If I am not the owner, the other person IS the owner
            targetId = ownerId;
        }
    }

    if (!targetId) {
        setOtherUserData(null);
        return;
    }

    const unsub = firestore.collection('users').doc(targetId).onSnapshot(doc => {
        if (doc.exists) {
            setOtherUserData(doc.data());
        } else {
            setOtherUserData(null);
        }
    }, err => {
        console.error("Error fetching presence:", err);
    });

    return () => unsub();
  }, [user, project, chatRoom]);

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
                    firestore.collection('chats').doc(currentChat.id).update({ [field]: false })
                        .catch(err => {
                            if (err.code !== 'permission-denied') console.error("Unmount cleanup failed:", err.code);
                        });
                }
            }
        }
        // Cleanup recording stream if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
    const messagesRef = firestore.collection('chats').doc(chatRoom.id).collection('messages');
    const q = messagesRef.orderBy('timestamp', 'asc').limit(100);

    const unsubscribe = q.onSnapshot((snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      // Note: Auto-scroll logic moved to separate useEffect on [messages]
    }, (err) => {
        console.error("Snapshot error:", err);
        if (err.code === 'permission-denied') {
            setError("Access denied to messages.");
        }
    });

    return () => unsubscribe();
  }, [chatRoom?.id]);

  // 3. Update "Seen" Status
  useEffect(() => {
    if (!chatRoom || !user || messages.length === 0) return;

    // Determine my role
    let myRole: 'owner' | 'freelancer' | null = null;
    if (user.id === chatRoom.ownerId) myRole = 'owner';
    else if (user.id === chatRoom.freelancerId) myRole = 'freelancer';

    if (!myRole) return;

    // Get the last message ID
    const lastMessage = messages[messages.length - 1];
    
    // Field to update
    const fieldName = myRole === 'owner' ? 'lastSeenByOwner' : 'lastSeenByFreelancer';
    const currentSeenId = myRole === 'owner' ? chatRoom.lastSeenByOwner : chatRoom.lastSeenByFreelancer;

    // Only update if it's different to prevent loops
    if (currentSeenId !== lastMessage.id) {
        firestore.collection('chats').doc(chatRoom.id).update({
            [fieldName]: lastMessage.id
        }).catch(err => {
            // Ignore permission errors or offline errors usually
            console.error("Failed to update seen status", err);
        });
    }
  }, [chatRoom, user, messages]);

  // 4. Auto-Scroll Logic for New Messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const isOwnMessage = lastMsg?.senderId === user?.id;

    // Scroll if we are already at bottom OR if we just sent the message
    if (isAtBottomRef.current || isOwnMessage) {
        scrollToBottom();
    } else {
        setHasNewMessages(true);
    }
  }, [messages, user?.id]);

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
        await firestore.collection('chats').doc(chatRoom.id).update({
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

        const chatDocRef = firestore.collection('chats').doc(project.id);
        
        let docExists = false;
        try {
            const chatSnap = await chatDocRef.get();
            docExists = chatSnap.exists;
        } catch (readErr: any) {
            if (readErr.code === 'permission-denied') {
                docExists = false;
            } else {
                throw readErr;
            }
        }

        if (docExists) {
            await chatDocRef.update({ active: true });
        } else {
            const participants = [chatOwnerId, chatFreelancerId].filter(Boolean);
            const newChatData = {
                projectId: project.id,
                ownerId: chatOwnerId, 
                freelancerId: chatFreelancerId || '', 
                active: true,
                createdAt: timestamp(),
                closedAt: null,
                participants: participants,
                ownerTyping: false,
                freelancerTyping: false
            };
            await chatDocRef.set(newChatData);
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

  // --- Voice Message Logic ---

  const getAudioDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(blob);
        audio.src = url;
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            if (audio.duration === Infinity) {
                 // Hack for Chrome/WebM bug
                 audio.currentTime = 1e101;
                 audio.ontimeupdate = function () {
                      this.ontimeupdate = null;
                      resolve(audio.duration);
                      audio.currentTime = 0;
                 }
            } else {
                resolve(audio.duration);
            }
        };
        audio.onerror = () => resolve(0);
    });
  };

  const handleAudioUpload = async () => {
    if (!user || !chatRoomRef.current || audioChunksRef.current.length === 0) return;
    const currentChat = chatRoomRef.current;

    setIsUploading(true);
    try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = await getAudioDuration(audioBlob);
        
        const fileName = `voice-message-${Date.now()}.webm`;
        const filePath = `chat-attachments/${currentChat.id}/${fileName}`;

        // Upload
        const { error: uploadError } = await supabase.storage
            .from('File')
            .upload(filePath, audioBlob);

        if (uploadError) throw uploadError;

        // Get URL
        const { data: { publicUrl } } = supabase.storage
            .from('File')
            .getPublicUrl(filePath);

        // Save Message
        const messagesRef = firestore.collection('chats').doc(currentChat.id).collection('messages');
        await messagesRef.add({
            type: 'audio',
            audioUrl: publicUrl,
            fileName: fileName,
            duration: Math.round(duration) || 0,
            senderId: user.id,
            senderRole: user.role,
            ownerId: currentChat.ownerId || '',
            freelancerId: currentChat.freelancerId || '',
            projectId: currentChat.projectId,
            timestamp: timestamp()
        });

    } catch (error: any) {
        console.error("Audio upload failed:", error);
        showToast("Failed to send voice message.", "error");
    } finally {
        setIsUploading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Audio recording not supported.", "error");
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            handleAudioUpload();
            stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic error:", err);
        showToast("Microphone access denied.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatRoom) return;

    setIsUploading(true);
    try {
        // 1. Upload File to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${chatRoom.id}/${fileName}`;

        // Using "File" bucket as requested
        const { data, error: uploadError } = await supabase.storage
            .from('File')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('File')
            .getPublicUrl(filePath);

        // 3. Save Message to Firestore
        const messagesRef = firestore.collection('chats').doc(chatRoom.id).collection('messages');
        await messagesRef.add({
            type: 'file',
            fileUrl: publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            senderId: user.id,
            senderRole: user.role,
            ownerId: chatRoom.ownerId || '',
            freelancerId: chatRoom.freelancerId || '',
            projectId: chatRoom.projectId,
            timestamp: timestamp()
        });
        
    } catch (error: any) {
        console.error("File upload failed:", error);
        // Better error message formatting
        const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        showToast(`Failed to upload file: ${errorMessage}`, "error");
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
      const messagesRef = firestore.collection('chats').doc(chatRoom.id).collection('messages');
      
      await messagesRef.add({
        type: 'text',
        text,
        senderId: user.id,
        senderRole: user.role,
        ownerId: chatRoom.ownerId || '',
        freelancerId: chatRoom.freelancerId || '',
        projectId: chatRoom.projectId,
        timestamp: timestamp()
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
  let otherLastSeenId: string | null = null;

  if (chatRoom && user) {
    let role = null;
    if (user.id === chatRoom.ownerId) role = 'owner';
    else if (user.id === chatRoom.freelancerId) role = 'freelancer';

    if (role === 'owner') {
        isOtherTyping = !!chatRoom.freelancerTyping;
        otherLabel = "Freelancer"; 
        otherLastSeenId = chatRoom.lastSeenByFreelancer || null;
    } else if (role === 'freelancer') {
        isOtherTyping = !!chatRoom.ownerTyping;
        otherLabel = "Client";
        otherLastSeenId = chatRoom.lastSeenByOwner || null;
    }
  }

  // Calculate the index of the message the other user last saw
  // This logic works because 'messages' is sorted by timestamp asc
  const otherSeenIndex = messages.findIndex(m => m.id === otherLastSeenId);

  const renderFileContent = (msg: Message, isMe: boolean) => {
    const { fileType, fileName, fileSize, fileUrl } = msg;

    const innerCardClass = isMe 
        ? "bg-white/10 border border-white/20 hover:bg-white/20" 
        : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10";
    
    const textClass = isMe ? "text-white" : "text-slate-900 dark:text-white";
    const subTextClass = isMe ? "text-indigo-100" : "text-slate-500 dark:text-gray-400";

    // 1. Image
    if (fileType?.startsWith('image/')) {
        return (
            <div className="relative group">
                <img 
                    src={fileUrl} 
                    alt={fileName} 
                    className="rounded-xl max-h-[300px] w-auto object-cover" 
                />
                 <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg pointer-events-none">
                    <ImageIcon size={12} className="text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Image</span>
                </div>
                <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
                >
                    <Download className="text-white" size={24} />
                </a>
            </div>
        );
    }

    // Common structure for non-image files
    let icon = <FileIcon size={24} className={isMe ? "text-white" : "text-slate-400"} />;
    let badgeText = "File";
    let badgeColorClass = isMe 
        ? "bg-white/20 text-white" 
        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";

    if (fileType === 'application/pdf') {
        icon = <FileText size={24} className={isMe ? "text-white" : "text-red-500"} />;
        badgeText = "PDF File";
        if (!isMe) badgeColorClass = "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300";
    } else if (fileType === 'application/zip' || fileType === 'application/x-zip-compressed') {
        icon = <FileArchive size={24} className={isMe ? "text-white" : "text-yellow-500"} />;
        badgeText = "ZIP Archive";
        if (!isMe) badgeColorClass = "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300";
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        icon = <FileText size={24} className={isMe ? "text-white" : "text-blue-500"} />;
        badgeText = "Document";
        if (!isMe) badgeColorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300";
    } else if (fileType?.startsWith('video/')) {
        icon = <FileVideo size={24} className={isMe ? "text-white" : "text-purple-500"} />;
        badgeText = "Video";
        if (!isMe) badgeColorClass = "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300";
    } else if (fileType?.startsWith('audio/')) {
        icon = <FileAudio size={24} className={isMe ? "text-white" : "text-pink-500"} />;
        badgeText = "Audio";
        if (!isMe) badgeColorClass = "bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300";
    } else if (fileType === 'text/plain') {
        icon = <FileText size={24} className={isMe ? "text-white" : "text-slate-500"} />;
        badgeText = "Text";
        if (!isMe) badgeColorClass = "bg-slate-200 dark:bg-slate-600/20 text-slate-600 dark:text-slate-300";
    }

    return (
        <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${innerCardClass} min-w-[220px]`}>
            <div className={`p-2.5 rounded-lg shrink-0 ${isMe ? 'bg-white/10' : 'bg-white dark:bg-white/5'}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeColorClass}`}>
                        {badgeText}
                    </span>
                </div>
                <p className={`text-sm font-medium truncate ${textClass}`}>{fileName}</p>
                <p className={`text-xs ${subTextClass}`}>{formatFileSize(fileSize)}</p>
            </div>
            <a 
                href={fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className={`p-2 rounded-full hover:bg-black/10 transition-colors ${textClass}`}
                title="Download"
            >
                <Download size={18} />
            </a>
        </div>
    );
  };

  const renderAudioContent = (msg: Message, isMe: boolean) => {
    return <AudioMessage src={msg.audioUrl || ''} duration={msg.duration} isMe={isMe} />;
  };

  // Determine Online Status
  let statusText = "Offline";
  let isOnline = false;

  if (otherUserData) {
      // Logic: A user is considered online if: isOnline === true OR lastSeen is within the past 60 seconds.
      const lastSeenDate = otherUserData.lastSeen?.toDate ? otherUserData.lastSeen.toDate() : new Date(otherUserData.lastSeen || 0);
      const diffSeconds = (new Date().getTime() - lastSeenDate.getTime()) / 1000;
      
      // If isOnline is true OR heartbeat was recent
      if (otherUserData.isOnline || diffSeconds < 60) {
          isOnline = true;
          statusText = "Online";
      } else {
          statusText = `Last seen ${formatLastSeen(otherUserData.lastSeen)}`;
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
                {/* Presence Indicator */}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-gray-400">
                        {isOnline ? 'Online' : statusText}
                    </span>
                </div>
            </div>
            {/* Keeping the active indicator as requested */}
            <div className={`w-2 h-2 rounded-full ${chatRoom.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>

        {/* Messages Area */}
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 pt-24 pb-4 space-y-4 custom-scrollbar"
        >
            {messages.length === 0 && (
                <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Say hello!</div>
            )}
            
            {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.id;
                const isFile = msg.type === 'file';
                const isAudio = msg.type === 'audio';
                const isImage = isFile && msg.fileType?.startsWith('image/');
                
                // Logic: A message is seen if the other user's "last seen message" 
                // is this message OR any message that came AFTER this one.
                const isSeen = otherSeenIndex >= index;

                return (
                    <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm ${
                            isMe 
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 rounded-tl-none'
                        } ${isFile || isAudio ? 'p-1' : 'px-4 py-3'}`}>
                            
                            {/* Render based on type */}
                            {isAudio ? (
                                renderAudioContent(msg, isMe)
                            ) : isFile ? (
                                renderFileContent(msg, isMe)
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )}
                            
                            {/* Footer: Timestamp & Seen Status */}
                            {!isImage && (
                                <div className={`flex items-center justify-end gap-1 mt-1 mr-1 ${isMe ? 'opacity-80' : 'opacity-60'}`}>
                                    <span className={`text-[10px] ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {msg.timestamp?.seconds 
                                            ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                            : 'Sending...'}
                                    </span>
                                    {isMe && (
                                        <SeenStatus isSeen={isSeen} className="text-indigo-100" />
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
            
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
        </div>
        
        {/* New Messages Indicator */}
        <AnimatePresence>
            {hasNewMessages && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
                >
                    <button 
                        onClick={scrollToBottom}
                        className="bg-primary text-white px-4 py-2 rounded-full shadow-xl text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        New messages <ArrowDown size={14} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

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
                    disabled={isUploading || isRecording}
                    title="Attach file"
                >
                    {isUploading ? (
                        <Loader2 className="animate-spin text-primary" size={20} />
                    ) : (
                        <Paperclip size={20} className="text-slate-500 dark:text-gray-400" />
                    )}
                </Button>

                <Button 
                    type="button" 
                    variant={isRecording ? 'danger' : 'secondary'} 
                    className={`px-3 rounded-xl border-transparent ${isRecording ? 'animate-pulse' : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isUploading}
                    title={isRecording ? "Stop Recording" : "Record Audio"}
                >
                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} className="text-slate-500 dark:text-gray-400" />}
                </Button>

                <input
                    className="flex-1 bg-slate-100 dark:bg-white/5 border-0 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                    value={newMessage}
                    onChange={handleInputChange}
                    disabled={isRecording}
                />
                <Button type="submit" disabled={!newMessage.trim() || isRecording} className="px-4 rounded-xl">
                    <Send size={18} />
                </Button>
            </form>
        </div>
    </div>
  );
};