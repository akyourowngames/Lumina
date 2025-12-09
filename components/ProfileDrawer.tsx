import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Loader2, CheckCircle, X, MapPin, Briefcase as BriefcaseIcon, ImageIcon, Globe, Github, Linkedin, Send, MessageSquare, ArrowRight, AlertCircle, Lock, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { firestore } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { User, PortfolioItem } from '../types';
import { Badge, Button } from './UI';
import { db } from '../services/mockDb';

interface ProfileDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<User>;
}

const drawerVariants: Variants = {
    hidden: { x: "100%", opacity: 0.5 },
    visible: { 
        x: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 }
    },
    exit: { 
        x: "100%", 
        opacity: 0,
        transition: { type: "spring", stiffness: 350, damping: 35 }
    }
};

const contentContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

export const ProfileDrawer = ({ userId, isOpen, onClose, initialData }: ProfileDrawerProps) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [portfolioPreview, setPortfolioPreview] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRestricted, setIsRestricted] = useState(false);
    const { user: currentUser } = useAuth();

    // --- Data Logic ---
    useEffect(() => {
        // Reset state only when opening with new user
        if (isOpen && userId) {
            setLoading(true);
            setIsRestricted(false);
            setProfile(null); // Clear previous profile instantly
            
            // Optimistic set from initial data to prevent flash
            if (initialData) {
                 setProfile({ 
                    id: userId, 
                    role: 'client', 
                    name: initialData.name || 'User', 
                    email: '', 
                    avatar: initialData.avatar || '',
                    ...initialData 
                 } as User);
            }

            const fetchData = async () => {
                let userData: User | null = null;
                try {
                    const userDoc = await firestore.collection('users').doc(userId).get();
                    if (!userDoc.exists) {
                         const mockUser = db.getUsers().find(u => u.id === userId);
                         if (mockUser) {
                             userData = mockUser;
                         } else {
                             if (initialData) {
                                userData = { 
                                    id: userId, 
                                    role: 'client', 
                                    name: initialData.name || 'User', 
                                    email: '', 
                                    avatar: initialData.avatar || '',
                                    ...initialData 
                                } as User;
                                setIsRestricted(true);
                             } else {
                                setProfile(null);
                                setLoading(false);
                                return;
                             }
                         }
                    } else {
                        userData = userDoc.data() as User;
                    }
                    
                    setProfile(userData);

                    const isClientOnly = userData?.profileRole === 'client' || (userData?.role === 'client' && !userData?.profileRole);
                    if (!isClientOnly && !isRestricted) {
                        try {
                            const pfSnap = await firestore.collection('users').doc(userId).collection('portfolio')
                                .orderBy('createdAt', 'desc')
                                .limit(3)
                                .get();
                            
                            const items = pfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioItem[];
                            setPortfolioPreview(items);
                        } catch (e: any) {
                            console.warn("Could not fetch portfolio (likely restricted):", e.code);
                            setPortfolioPreview([]);
                        }
                    } else {
                        setPortfolioPreview([]);
                    }

                } catch (e: any) {
                    console.warn("Profile fetch restricted:", e.code);
                    setIsRestricted(true);
                    
                    const mockUser = db.getUsers().find(u => u.id === userId);
                    if (mockUser) {
                         setProfile(mockUser);
                    } else {
                        setProfile({
                            id: userId,
                            name: initialData?.name || 'Private User',
                            role: initialData?.role || 'client',
                            email: initialData?.email || '',
                            avatar: initialData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                            bio: 'This user profile is private.',
                            company: initialData?.company || 'Hidden',
                            available: initialData?.available ?? true,
                            ...initialData
                        } as User);
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, userId]); // Removed initialData from dep array to avoid re-fetch on minor prop updates

    // --- Effects & Helpers ---
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const isClientOnly = profile ? (profile.profileRole === 'client' || (profile.role === 'client' && !profile.profileRole)) : true;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose} 
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9998]"
                    />
                    
                    {/* Drawer Panel */}
                    <motion.div 
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[500px] md:w-[550px] bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-[9999] flex flex-col overflow-hidden font-sans"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

                        {loading && !profile ? (
                            <div className="h-full flex items-center justify-center flex-col gap-4">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <span className="text-gray-400 text-sm animate-pulse">Loading profile...</span>
                            </div>
                        ) : profile ? (
                            <>
                                {/* --- Header (Sticky) --- */}
                                <div className="relative shrink-0 p-6 sm:p-8 pb-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-md z-20 flex flex-col gap-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-5 items-center">
                                            {/* Avatar */}
                                            <motion.div 
                                                className="relative group cursor-default"
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 ring-4 ring-transparent group-hover:ring-primary/20 transition-all duration-500 shadow-xl relative z-10">
                                                    <img 
                                                        src={profile.avatar} 
                                                        alt={profile.name} 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`; }}
                                                    />
                                                </div>
                                                {/* Status Indicator */}
                                                {!isRestricted && (
                                                    <motion.div 
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.4, type: "spring" }}
                                                        className={`absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${profile.available !== false ? 'bg-green-500' : 'bg-red-500'}`} 
                                                        title={profile.available !== false ? "Available" : "Busy"}
                                                    >
                                                        {profile.available !== false ? <CheckCircle size={10} className="text-white"/> : <X size={10} className="text-white"/>}
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                            
                                            <motion.div 
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="space-y-1.5 relative z-10"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-2xl font-bold font-display text-white tracking-tight">
                                                        {profile.name}
                                                    </h2>
                                                    {isRestricted && <Lock size={14} className="text-white/30" />}
                                                </div>
                                                
                                                {profile.headline && (
                                                    <p className="text-sm text-gray-400 font-medium line-clamp-1 max-w-[240px]">{profile.headline}</p>
                                                )}

                                                <div className="flex gap-2 items-center pt-1">
                                                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                        isClientOnly 
                                                        ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' 
                                                        : 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                                                    }`}>
                                                        {isClientOnly ? 'Client' : 'Freelancer'}
                                                    </div>
                                                    
                                                    {!isRestricted && profile.available !== false && (
                                                        <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/20 text-green-400 bg-green-500/10 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                            {isClientOnly ? 'Hiring' : 'Available'}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                        
                                        <motion.button 
                                            whileHover={{ rotate: 90, scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={onClose} 
                                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <X size={20} />
                                        </motion.button>
                                    </div>
                                    
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex flex-wrap gap-4 text-xs text-gray-500"
                                    >
                                        {profile.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-gray-600" /> {profile.location}
                                            </div>
                                        )}
                                        {profile.company && (
                                            <div className="flex items-center gap-1.5">
                                                <BriefcaseIcon size={14} className="text-gray-600" /> {profile.company}
                                            </div>
                                        )}
                                        {profile.website && (
                                            <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                                <Globe size={14} className="text-gray-600" /> Website
                                            </a>
                                        )}
                                    </motion.div>
                                </div>

                                {/* --- Body (Scrollable) --- */}
                                <motion.div 
                                    variants={contentContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar relative z-10"
                                >
                                    
                                    {isRestricted && (
                                        <motion.div 
                                            variants={itemVariants}
                                            className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3"
                                        >
                                            <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-500 shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-bold text-yellow-500">Limited Access</h4>
                                                <p className="text-xs text-yellow-500/80 mt-0.5">You don't have permission to view full details for this user.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* About Section */}
                                    <motion.section variants={itemVariants}>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Star size={12} className="text-primary" /> About
                                        </h3>
                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {profile.bio || "No bio provided."}
                                        </p>
                                    </motion.section>

                                    {/* Skills Section */}
                                    {!isClientOnly && !isRestricted && profile.skills && profile.skills.length > 0 && (
                                        <motion.section variants={itemVariants}>
                                            <div className="flex justify-between items-end mb-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Skills</h3>
                                                {profile.hourlyRate && (
                                                    <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10">
                                                        ${profile.hourlyRate}/hr
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map(skill => (
                                                    <motion.span 
                                                        key={skill}
                                                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                        className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-gray-300 border border-white/5 cursor-default transition-colors"
                                                    >
                                                        {skill}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </motion.section>
                                    )}

                                    {/* Portfolio Section */}
                                    {!isClientOnly && !isRestricted && (
                                        <motion.section variants={itemVariants}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Work</h3>
                                                {portfolioPreview.length > 0 && (
                                                     <Link to={`/u/${profile.id}`} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                                         View All <ArrowRight size={12} />
                                                     </Link>
                                                )}
                                            </div>
                                            
                                            <div className="grid gap-4">
                                                {portfolioPreview.length === 0 ? (
                                                    <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                                        <p className="text-xs text-gray-500">No projects to display.</p>
                                                    </div>
                                                ) : (
                                                    portfolioPreview.map((item, idx) => (
                                                        <motion.div 
                                                            key={item.id}
                                                            variants={itemVariants}
                                                            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                                                            className="group relative flex gap-4 p-3 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                                            <div className="w-20 h-16 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-white/5 relative z-10">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={20} /></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                                                                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{item.title}</h4>
                                                                <p className="text-xs text-gray-500 truncate mb-2">{item.role || 'Project'}</p>
                                                                <div className="flex gap-1">
                                                                    {(Array.isArray(item.technologies) ? item.technologies : []).slice(0, 2).map((t, i) => (
                                                                        <span key={i} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{t}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.section>
                                    )}

                                    {/* Connect Section */}
                                    {!isRestricted && (
                                        <motion.section variants={itemVariants} className="pb-8">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Connect</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { href: profile.website, icon: <Globe size={16} />, label: "Website" },
                                                    { href: profile.github, icon: <Github size={16} />, label: "GitHub" },
                                                    { href: profile.linkedin, icon: <Linkedin size={16} />, label: "LinkedIn" },
                                                    { href: profile.email ? `mailto:${profile.email}` : null, icon: <Send size={16} />, label: "Email" }
                                                ].map((link, i) => (
                                                    link.href ? (
                                                        <motion.a 
                                                            key={i}
                                                            href={link.href} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors group"
                                                        >
                                                            <span className="text-gray-500 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
                                                                {link.icon}
                                                            </span>
                                                            {link.label}
                                                        </motion.a>
                                                    ) : null
                                                ))}
                                            </div>
                                        </motion.section>
                                    )}
                                </motion.div>

                                {/* --- Footer (Sticky) --- */}
                                <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl relative z-20 shrink-0">
                                    <div className="grid grid-cols-2 gap-4">
                                        {currentUser?.id !== profile.id && !isRestricted && (
                                            <Link to="/messages" className="w-full">
                                                <Button variant="secondary" className="w-full justify-center bg-white/5 hover:bg-white/10 border-white/5 text-white">
                                                    <MessageSquare size={16} /> Chat
                                                </Button>
                                            </Link>
                                        )}
                                        <Link to={`/u/${profile.id}`} className={currentUser?.id !== profile.id && !isRestricted ? "w-full" : "col-span-2 w-full"}>
                                            <Button className="w-full justify-center bg-gradient-to-r from-primary to-secondary hover:opacity-90 border-0">
                                                View Full Profile <ExternalLink size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <AlertCircle size={32} className="text-gray-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Profile Unavailable</h3>
                                <p className="text-gray-500 mt-2 text-sm max-w-[200px]">The user profile could not be found or has been removed.</p>
                                <Button variant="ghost" onClick={onClose} className="mt-6 text-gray-400 hover:text-white">
                                    Close Drawer
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};