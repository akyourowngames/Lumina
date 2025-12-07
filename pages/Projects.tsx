import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper, Input, Modal } from '../components/UI';
import { Briefcase, ChevronRight, X, Calendar, DollarSign, Plus, Loader2, Send, CheckCircle, User as UserIcon, AlertCircle, MapPin, Globe, Github, Linkedin, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, Application, User, PortfolioItem } from '../types';
import { useToast } from '../context/ToastContext';
import { firestore, timestamp } from '../services/firebase';

// --- Subcomponent: Client Profile Drawer ---
const ClientProfileDrawer = ({ userId, isOpen, onClose }: { userId: string | null, isOpen: boolean, onClose: () => void }) => {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            firestore.collection('users').doc(userId).get()
                .then(doc => {
                    if (doc.exists) setProfile(doc.data() as User);
                })
                .catch(err => {
                    console.warn("Error fetching client profile:", err);
                    setProfile(null);
                })
                .finally(() => setLoading(false));
        } else {
            setProfile(null);
        }
    }, [isOpen, userId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl z-[70] overflow-y-auto"
                    >
                        <div className="p-6 relative">
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                            
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                            ) : profile ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-slate-100 dark:border-white/10 mb-4 bg-slate-200 dark:bg-slate-800">
                                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                                        {profile.headline && <p className="text-primary font-medium">{profile.headline}</p>}
                                        
                                        <div className="flex justify-center gap-2 mt-4">
                                            {profile.available === false ? (
                                                <Badge color="red">Not Hiring</Badge>
                                            ) : (
                                                <Badge color="green">Actively Hiring</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {profile.location && (
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                                <MapPin size={18} /> <span>{profile.location}</span>
                                            </div>
                                        )}
                                        {profile.website && (
                                            <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-gray-400 hover:text-primary transition-colors">
                                                <Globe size={18} /> <span>Website</span>
                                            </a>
                                        )}
                                        {profile.company && (
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-gray-400">
                                                <Briefcase size={18} /> <span>{profile.company}</span>
                                            </div>
                                        )}
                                    </div>

                                    {profile.bio && (
                                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">About</h4>
                                            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">{profile.bio}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">User profile unavailable.</p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Subcomponent: Freelancer Portfolio Drawer ---
const PortfolioDrawer = ({ userId, isOpen, onClose }: { userId: string | null, isOpen: boolean, onClose: () => void }) => {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    // Fetch Profile
                    const userDoc = await firestore.collection('users').doc(userId).get();
                    if(userDoc.exists) setProfile(userDoc.data() as User);

                    // Fetch Portfolio
                    const pfSnap = await firestore.collection('users').doc(userId).collection('portfolio').orderBy('createdAt', 'desc').get();
                    const items = pfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioItem[];
                    setPortfolio(items);
                } catch(e) { 
                    console.warn("Error loading portfolio:", e); 
                } finally { 
                    setLoading(false); 
                }
            };
            fetchData();
        } else {
            setPortfolio([]);
            setProfile(null);
        }
    }, [isOpen, userId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl z-[70] flex flex-col"
                    >
                         <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                {profile?.avatar && <img src={profile.avatar} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />}
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.name || 'Freelancer'}'s Portfolio</h2>
                                    <p className="text-xs text-gray-500">{portfolio.length} Projects</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                            ) : portfolio.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <Briefcase size={40} className="mx-auto mb-4 opacity-50" />
                                    No portfolio items to display.
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {portfolio.map(item => (
                                        <div key={item.id} className="bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-colors group">
                                            <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500"><ImageIcon size={24}/></div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {item.liveUrl && (
                                                        <a href={item.liveUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40"><ExternalLink size={18}/></a>
                                                    )}
                                                    {item.githubUrl && (
                                                        <a href={item.githubUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40"><Github size={18}/></a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.title}</h3>
                                                {item.technologies && Array.isArray(item.technologies) && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {item.technologies.slice(0,3).map((t,i) => (
                                                            <span key={i} className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-300">{t}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Subcomponent: Project Card ---
const ProjectCard = ({ project, userRole, onClick, onViewProfile, onApply }: any) => {
    const [client, setClient] = useState<User | null>(null);

    // Fetch owner data only if we don't have enough info on the project object
    useEffect(() => {
        if (project.ownerId) {
            firestore.collection('users').doc(project.ownerId).get()
                .then(doc => {
                    if(doc.exists) setClient(doc.data() as User);
                })
                .catch(err => {
                    console.warn("Could not fetch client info (permissions?):", err);
                });
        }
    }, [project.ownerId]);

    const isClientAvailable = client?.available !== false;

    return (
        <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/50 transition-colors relative" onClick={onClick}>
            <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className={`p-3 rounded-xl shrink-0 ${
                    project.status === 'Assigned' || project.status === 'In Progress' || project.status === 'Hired' ? 'bg-blue-500/20 text-blue-500' : 
                    project.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 
                    project.status === 'Requested' ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-500/20 text-gray-400'
                }`}>
                    <Briefcase size={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-slate-900 dark:text-white truncate pr-2">{project.title}</h3>
                    
                    {/* Enriched Client Info */}
                    <div className="flex items-center gap-2 mt-1">
                        {client && (
                            <div className="relative group/avatar cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(project.ownerId); }}>
                                <img src={client.avatar} alt="Client" className="w-5 h-5 rounded-full border border-slate-200 dark:border-white/20" />
                                {!isClientAvailable && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" title="Not Hiring" />}
                            </div>
                        )}
                        <div className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
                             <span>{project.client}</span>
                             {client?.headline && <span className="hidden sm:inline text-slate-400">• {client.headline}</span>}
                             {client?.location && <span className="hidden md:flex items-center gap-1 text-xs text-slate-400"><MapPin size={10} /> {client.location}</span>}
                        </div>
                         <button 
                            className="text-xs text-primary hover:underline ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); onViewProfile(project.ownerId); }}
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono text-xl font-bold hidden sm:block text-slate-900 dark:text-white whitespace-nowrap">{project.budget}</span>
                <Badge color={
                    project.status === 'Assigned' || project.status === 'In Progress' || project.status === 'Hired' ? 'blue' : 
                    project.status === 'Completed' ? 'green' : 
                    project.status === 'Requested' ? 'purple' : 'yellow'
                }>
                    {project.status === 'Requested' ? 'Open' : project.status}
                </Badge>
                
                {userRole === 'admin' && project.status === 'Requested' && onApply && (
                    <Button 
                        variant="primary" 
                        className="text-xs py-2 px-4 h-auto" 
                        onClick={(e) => { e.stopPropagation(); onApply(project); }}
                    >
                        Apply
                    </Button>
                )}

                <ChevronRight className="text-slate-400 dark:text-gray-500 group-hover:text-primary transition-colors shrink-0" />
            </div>
        </GlassCard>
    );
};

// --- Subcomponent: Application Item ---
const ApplicationItem = ({ app, projectStatus, onHire, onViewPortfolio }: any) => {
    const [freelancer, setFreelancer] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        firestore.collection('users').doc(app.freelancerId).get()
            .then(doc => {
                if(doc.exists) setFreelancer(doc.data() as User);
            })
            .catch(err => {
                console.warn("Could not fetch freelancer info (permissions?):", err);
            })
            .finally(() => setLoading(false));
    }, [app.freelancerId]);

    return (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between gap-4 transition-all hover:border-primary/30">
            <div className="flex gap-4">
                {/* Avatar Column */}
                <div className="shrink-0">
                    {loading ? (
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                    ) : (
                        <div className="relative">
                            <img src={freelancer?.avatar} alt={app.freelancerName} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-white/10" />
                            {freelancer?.available && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" title="Available" />}
                        </div>
                    )}
                </div>

                {/* Details Column */}
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">{app.freelancerName}</span>
                        {freelancer?.headline && (
                            <span className="text-sm text-slate-500 dark:text-gray-400 border-l border-slate-300 dark:border-white/20 pl-2 ml-1">{freelancer.headline}</span>
                        )}
                    </div>
                    
                    {/* Skills */}
                    {freelancer?.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {freelancer.skills.slice(0, 5).map((skill: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-300">{skill}</span>
                            ))}
                        </div>
                    )}

                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{app.message}"</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><DollarSign size={12}/> Bid: <span className="font-bold text-slate-900 dark:text-white">{app.price}</span></span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(app.createdAt).toLocaleDateString()}</span>
                        {freelancer && (
                            <button onClick={() => onViewPortfolio(app.freelancerId)} className="flex items-center gap-1 text-primary hover:underline">
                                <Briefcase size={12} /> View Portfolio
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Actions Column */}
            <div className="self-start sm:self-center flex flex-row sm:flex-col gap-2 shrink-0">
                {app.status === 'accepted' && <Badge color="green">Hired</Badge>}
                {app.status === 'rejected' && <Badge color="red">Rejected</Badge>}

                {projectStatus === 'Requested' && app.status === 'applied' && (
                    <Button 
                        variant="primary" 
                        className="text-xs py-2 h-auto w-full"
                        onClick={() => onHire(app)}
                    >
                        Hire
                    </Button>
                )}
            </div>
        </div>
    );
};

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Selection State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  // Drawer States
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [viewingPortfolioId, setViewingPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) setDisplayProject(selectedProject);
  }, [selectedProject]);
  
  // Freelancer specific view state
  const [freelancerViewMode, setFreelancerViewMode] = useState<'browse' | 'mine'>('browse');

  // Application State
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [hiringAppId, setHiringAppId] = useState<string | null>(null);

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [projectToApply, setProjectToApply] = useState<Project | null>(null);
  const [displayProjectToApply, setDisplayProjectToApply] = useState<Project | null>(null);
  const [applyForm, setApplyForm] = useState({ message: '', price: '' });
  const [isApplying, setIsApplying] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (projectToApply) setDisplayProjectToApply(projectToApply);
  }, [projectToApply]);

  // Create Project State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: '',
    dueDate: ''
  });

  // 1. READ: Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        const projectsRef = firestore.collection("projects");
        let q;

        if (user.role === 'client') {
            q = projectsRef.where("ownerId", "==", user.id);
        } else {
            if (freelancerViewMode === 'mine') {
                q = projectsRef.where("freelancerId", "==", user.id);
            } else {
                // Only show requested (open) projects in browse mode
                q = projectsRef.where("status", "==", "Requested"); 
            }
        }

        const querySnapshot = await q.get();
        
        const fetchedProjects: Project[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled Project',
            description: data.description || '',
            clientId: data.ownerId || data.clientId || user.id, 
            ownerId: data.ownerId,
            freelancerId: data.freelancerId,
            client: data.client || 'Unknown Client',
            status: data.status || 'Requested',
            progress: data.progress || 0,
            dueDate: data.endDate || data.dueDate || '',
            endDate: data.endDate,
            startDate: data.startDate,
            budget: data.budget || '',
            tags: data.tags || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
          } as Project;
        });

        fetchedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setProjects(fetchedProjects);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        if (error.code !== 'permission-denied') {
            showToast("Failed to load projects", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, isCreateModalOpen, freelancerViewMode]);

  // 2. Fetch Applications
  useEffect(() => {
    if (!selectedProject || user?.role !== 'client') {
        setApplications([]);
        return;
    }
    
    setLoadingApps(true);
    
    const appsRef = firestore.collection("projects").doc(selectedProject.id).collection("applications");
    
    const unsubscribe = appsRef.onSnapshot((snapshot) => {
        const apps = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate 
                    ? data.createdAt.toDate().toISOString() 
                    : (data.createdAt || new Date().toISOString())
            };
        }) as Application[];
        
        apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setApplications(apps);
        setLoadingApps(false);
    }, (error) => {
        console.error("Error fetching applications:", error);
        setLoadingApps(false);
    });

    return () => unsubscribe();

  }, [selectedProject, user]);


  // 3. ACTIONS

  const openApplyModal = async (project: Project) => {
    setProjectToApply(project);
    setApplyForm({ message: '', price: project.budget });
    setIsApplyModalOpen(true);
    setHasApplied(false);
    setCheckingApplication(true);

    if (user) {
        try {
            const appsRef