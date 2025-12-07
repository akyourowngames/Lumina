import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper } from '../components/UI';
import { User, PortfolioItem } from '../types';
import { firestore } from '../services/firebase';
import { 
    MapPin, Mail, Briefcase, Star, Globe, Github, 
    Linkedin, Twitter, DollarSign, CheckCircle, 
    XCircle, Calendar, MessageSquare, Loader2, ArrowLeft,
    ImageIcon, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // 1. Fetch User Data
            const userDoc = await firestore.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data() as User;
                setProfile(userData);
                
                // Determine if we should fetch portfolio (Freelancer or Both)
                // Default fallback logic matching other pages: admin = freelancer, client = client
                const profileRole = userData.profileRole || (userData.role === 'admin' ? 'freelancer' : 'client');
                const isClientOnly = profileRole === 'client';

                if (!isClientOnly) {
                    // 2. Fetch Portfolio (Subcollection)
                    const pfSnap = await firestore.collection('users').doc(userId).collection('portfolio').orderBy('createdAt', 'desc').get();
                    const items = pfSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as PortfolioItem[];
                    setPortfolio(items);
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
      return (
          <div className="h-screen flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={40} />
          </div>
      );
  }

  if (!profile) {
      return (
          <PageWrapper>
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <h1 className="text-2xl font-bold mb-4 dark:text-white">User not found</h1>
                  <p className="text-gray-500 mb-8">The profile you are looking for does not exist or has been removed.</p>
                  <Link to="/">
                      <Button variant="outline"><ArrowLeft size={16} /> Return Home</Button>
                  </Link>
              </div>
          </PageWrapper>
      );
  }

  // Determine Role Logic for UI
  const profileRole = profile.profileRole || (profile.role === 'admin' ? 'freelancer' : 'client');
  const isClientOnly = profileRole === 'client';
  const isFreelancer = !isClientOnly;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
         {/* Top Actions */}
         <div className="mb-8 flex justify-between items-center">
             <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-2">
                 <ArrowLeft size={16} /> Back to Dashboard
             </Link>
             {currentUser?.id === profile.id && (
                 <Link to="/profile">
                     <Button variant="outline" className="text-sm">Edit My Profile</Button>
                 </Link>
             )}
         </div>

         <div className="grid lg:grid-cols-12 gap-8">
             {/* Left Column: Info Card */}
             <div className="lg:col-span-4 space-y-6">
                 <GlassCard className="p-8 text-center sticky top-24">
                     <div className="relative inline-block mb-6">
                         <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-slate-100 dark:border-white/10 mx-auto shadow-2xl bg-slate-200 dark:bg-slate-800">
                             <img 
                                src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`} 
                                alt={profile.name} 
                                className="w-full h-full object-cover"
                             />
                         </div>
                         <div className={`absolute bottom-2 right-2 p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-lg ${profile.available !== false ? 'bg-green-500' : 'bg-red-500'}`} title={profile.available !== false ? "Available" : "Busy"} />
                     </div>

                     <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">{profile.name}</h1>
                     {profile.headline && (
                         <p className="text-lg text-primary font-medium mb-4">{profile.headline}</p>
                     )}

                     {/* Role Badges */}
                     <div className="flex flex-wrap justify-center gap-2 mb-6">
                         {isFreelancer && <Badge color="purple">Freelancer</Badge>}
                         {isClientOnly && <Badge color="blue">Client</Badge>}
                         {profile.hourlyRate && isFreelancer && (
                             <Badge color="green" className="flex items-center gap-1">
                                 <DollarSign size={12} /> {profile.hourlyRate}/hr
                             </Badge>
                         )}
                     </div>

                     {/* Availability */}
                     <div className="mb-8 py-3 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 inline-flex items-center gap-2">
                         {profile.available !== false ? (
                             <>
                                <CheckCircle size={18} className="text-green-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Available for work</span>
                             </>
                         ) : (
                             <>
                                <XCircle size={18} className="text-red-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Currently busy</span>
                             </>
                         )}
                     </div>

                     {/* Actions */}
                     <div className="grid gap-3">
                         <Button className="w-full justify-center">
                             <MessageSquare size={18} /> Contact Me
                         </Button>
                         <Button variant="outline" className="w-full justify-center">
                             <Calendar size={18} /> Schedule Call
                         </Button>
                     </div>

                     {/* Divider */}
                     <div className="h-px bg-slate-200 dark:bg-white/10 my-8" />

                     {/* Meta Info */}
                     <div className="space-y-4 text-left">
                         {profile.location && (
                             <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                 <MapPin size={18} className="shrink-0 text-slate-400" />
                                 <span>{profile.location}</span>
                             </div>
                         )}
                         <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                             <Mail size={18} className="shrink-0 text-slate-400" />
                             <span>{profile.email}</span> {/* Probably hide this in real app */}
                         </div>
                         {profile.company && (
                             <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                 <Briefcase size={18} className="shrink-0 text-slate-400" />
                                 <span>{profile.company}</span>
                             </div>
                         )}
                         <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                             <Calendar size={18} className="shrink-0 text-slate-400" />
                             <span>Member since {new Date(profile.id).getFullYear()}</span>
                         </div>
                     </div>

                     {/* Socials */}
                     <div className="flex justify-center gap-4 mt-8">
                         {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Globe size={20} /></a>}
                         {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Github size={20} /></a>}
                         {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Linkedin size={20} /></a>}
                         {profile.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary transition-colors"><Twitter size={20} /></a>}
                     </div>
                 </GlassCard>
             </div>

             {/* Right Column: Content */}
             <div className="lg:col-span-8 space-y-8">
                 
                 {/* Bio */}
                 <GlassCard className="p-8">
                     <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                         <Star className="text-yellow-500" size={20} /> About Me
                     </h2>
                     <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                         {profile.bio || "This user hasn't added a bio yet."}
                     </p>
                 </GlassCard>

                 {/* Skills - Only show if Freelancer/Both */}
                 {isFreelancer && profile.skills && profile.skills.length > 0 && (
                     <GlassCard className="p-8">
                         <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-6">Skills & Expertise</h2>
                         <div className="flex flex-wrap gap-2">
                             {profile.skills.map(skill => (
                                 <React.Fragment key={skill}>
                                     <Badge color="gray" className="px-4 py-2 text-sm bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10">
                                         {skill}
                                     </Badge>
                                 </React.Fragment>
                             ))}
                         </div>
                     </GlassCard>
                 )}

                 {/* Portfolio - Only show if Freelancer/Both */}
                 {isFreelancer && (
                     <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Portfolio</h2>
                            <span className="text-sm text-gray-500">{portfolio.length} Projects</span>
                         </div>
                         
                         {portfolio.length === 0 ? (
                             <GlassCard className="p-12 text-center opacity-75">
                                 <Briefcase size={40} className="mx-auto mb-4 text-slate-300 dark:text-gray-600" />
                                 <p className="text-slate-500">No portfolio items to display.</p>
                             </GlassCard>
                         ) : (
                             <div className="grid md:grid-cols-2 gap-6">
                                 {portfolio.map((item, i) => {
                                     // Safe check for technologies
                                     const techStack = Array.isArray(item.technologies) ? item.technologies : [];
                                     
                                     return (
                                     <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                     >
                                        <GlassCard className="h-full flex flex-col p-0 overflow-hidden group hover:border-primary/50 cursor-pointer">
                                            <div className="relative h-48 overflow-hidden bg-slate-900">
                                                {item.imageUrl ? (
                                                    <img 
                                                        src={item.imageUrl} 
                                                        alt={item.title} 
                                                        className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                        <ImageIcon size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60 z-20" />
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.title}</h3>
                                                        {item.role && <p className="text-xs text-primary">{item.role}</p>}
                                                    </div>
                                                </div>
                                                <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{item.description}</p>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {techStack.slice(0, 3).map(t => (
                                                        <span key={t} className="text-[10px] bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-600 dark:text-gray-300">{t}</span>
                                                    ))}
                                                </div>

                                                <div className="mt-auto flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
                                                    {item.githubUrl && <a href={item.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><Github size={16} /></a>}
                                                    {item.liveUrl && <a href={item.liveUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><ExternalLink size={16} /></a>}
                                                </div>
                                            </div>
                                        </GlassCard>
                                     </motion.div>
                                 )})}
                             </div>
                         )}
                     </div>
                 )}
             </div>
         </div>
      </div>
    </PageWrapper>
  );
};