import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper, Input, Modal, EmptyState } from '../components/UI';
import { Briefcase, ChevronRight, X, Calendar, DollarSign, Plus, Loader2, Send, CheckCircle, AlertCircle, MapPin, Globe, Github, Linkedin, ExternalLink, Image as ImageIcon, Briefcase as BriefcaseIcon, User as UserIcon, MessageSquare, ArrowRight, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, Application, User, PortfolioItem } from '../types';
import { useToast } from '../context/ToastContext';
import { firestore, timestamp } from '../services/firebase';
import { createNotification } from '../services/notifications';
import { Link, useLocation } from 'react-router-dom';
import { ProfileDrawer } from '../components/ProfileDrawer';

// --- Helper: Determine Counterparty ID ---
const getCounterpartyId = (project: Project, application: Application | null, currentUserId?: string): string | null => {
    const ownerId = project.ownerId || project.clientId;
    
    if (application) {
        // Context: Application List
        // If I am the owner, I want to see the freelancer
        if (currentUserId === ownerId) return application.freelancerId;
        // If I am the freelancer (viewing my own app), I want to see the owner
        return ownerId;
    }

    // Context: Project Card
    if (currentUserId === ownerId) {
        // I am the owner (Client). 
        // If assigned/hired, show the freelancer. 
        // If requested (open), return NULL so we don't show the client's own profile.
        return project.freelancerId || null;
    }

    // Context: Project Card (I am a freelancer or public)
    // Always show the Client (Owner)
    return ownerId;
};

// --- Subcomponent: Project Card ---
const ProjectCard = ({ project, userRole, currentUserId, onClick, onViewProfile, onApply }: any) => {
    const [displayUser, setDisplayUser] = useState<User | null>(null);
    const targetProfileId = getCounterpartyId(project, null, currentUserId);

    useEffect(() => {
        if (targetProfileId) {
            firestore.collection('users').doc(targetProfileId).get()
                .then(doc => {
                    if(doc.exists) setDisplayUser(doc.data() as User);
                })
                .catch(err => {
                    // Ignore permission errors here, displayUser stays null, card shows default
                });
        } else {
            setDisplayUser(null);
        }
    }, [targetProfileId]);

    const isAvailable = displayUser?.available !== false;
    // Determine if we are showing the owner (Client) or the Freelancer
    const ownerId = project.ownerId || project.clientId;
    const isTargetOwner = targetProfileId === ownerId;

    const nameDisplay = displayUser?.name || (isTargetOwner ? project.client : 'User');
    const headlineDisplay = displayUser?.headline;

    // Construct a partial user object to pass up
    const profileData = displayUser || { 
        id: targetProfileId || 'unknown', 
        name: nameDisplay, 
        role: isTargetOwner ? 'client' : 'freelancer' 
    };

    return (
        <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all duration-300 relative cursor-pointer" onClick={onClick}>
            <div className="flex items-start gap-4 w-full sm:w-auto relative z-10">
                <div className={`p-3 rounded-xl shrink-0 ${
                    project.status === 'Assigned' || project.status === 'In Progress' || project.status === 'Hired' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                    project.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                    project.status === 'Requested' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                }`}>
                    <Briefcase size={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-slate-900 dark:text-white truncate pr-2">{project.title}</h3>
                    
                    <div className="flex items-center gap-2 mt-1.5">
                        {targetProfileId ? (
                            <>
                                <div 
                                    className="relative group/avatar cursor-pointer hover:scale-105 transition-transform" 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onViewProfile(targetProfileId, profileData); 
                                    }}
                                    title={isTargetOwner ? "View Client Profile" : "View Freelancer Profile"}
                                >
                                    <img 
                                        src={displayUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${nameDisplay}`} 
                                        alt="User" 
                                        className="w-5 h-5 rounded-full border border-slate-200 dark:border-white/20 object-cover" 
                                    />
                                    {displayUser && !isAvailable && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" title="Busy" />}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
                                     <span className="font-medium text-slate-700 dark:text-gray-300">{nameDisplay}</span>
                                     {headlineDisplay && <span className="hidden sm:inline text-slate-400">• {headlineDisplay}</span>}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 opacity-70">
                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                    <UserIcon size={12} className="text-slate-500 dark:text-gray-400" />
                                </div>
                                <span className="text-sm text-slate-500 dark:text-gray-400 italic">
                                    {project.status === 'Requested' ? 'Open for proposals' : 'Unassigned'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end relative z-10 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/5 mt-2 sm:mt-0">
                <span className="font-mono text-lg font-bold hidden sm:block text-slate-900 dark:text-white whitespace-nowrap">{project.budget}</span>
                
                {/* Mobile Budget display */}
                <span className="font-mono text-lg font-bold sm:hidden text-slate-900 dark:text-white whitespace-nowrap">{project.budget}</span>

                <Badge color={
                    project.status === 'Assigned' || project.status === 'In Progress' || project.status === 'Hired' ? 'blue' : 
                    project.status === 'Completed' ? 'green' : 
                    project.status === 'Requested' ? 'purple' : 'yellow'
                }>
                    {project.status === 'Requested' ? 'Open' : project.status}
                </Badge>
                
                {userRole === 'admin' && project.status === 'Requested' && onApply && (
                    <div className="relative z-20">
                        <Button 
                            variant="primary" 
                            className="text-xs h-9 px-4 shadow-md hover:shadow-primary/30" 
                            onClick={(e) => { 
                                e.stopPropagation();
                                e.preventDefault(); 
                                onApply(project); 
                            }}
                        >
                            Apply
                        </Button>
                    </div>
                )}

                <ChevronRight className="text-slate-400 dark:text-gray-600 group-hover:text-primary transition-colors shrink-0" />
            </div>
        </GlassCard>
    );
};

// --- Subcomponent: Application Item ---
const ApplicationItem = ({ app, project, currentUserId, onHire, onViewProfile, isHiring }: any) => {
    const [freelancer, setFreelancer] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Logic: If I am client, I see freelancer. If I am freelancer, I see client.
    const targetProfileId = getCounterpartyId(project, app, currentUserId);

    useEffect(() => {
        if(targetProfileId) {
            firestore.collection('users').doc(targetProfileId).get()
                .then(doc => {
                    if(doc.exists) setFreelancer(doc.data() as User);
                })
                .catch(err => {
                    // Ignore errors
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [targetProfileId]);

    const profileData = freelancer || { id: targetProfileId || 'unknown', name: app.freelancerName, role: 'freelancer' };

    return (
        <div className="p-5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between gap-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="flex gap-4">
                <div className="shrink-0 cursor-pointer" onClick={() => targetProfileId && onViewProfile(targetProfileId, profileData)}>
                    {loading ? (
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                    ) : (
                        <div className="relative group/avatar">
                            <img src={freelancer?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${app.freelancerName}`} alt={app.freelancerName} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 group-hover/avatar:border-primary transition-colors" />
                            {freelancer?.available && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" title="Available" />}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <button onClick={() => targetProfileId && onViewProfile(targetProfileId, profileData)} className="font-bold text-lg text-slate-900 dark:text-white hover:text-primary transition-colors text-left">
                            {app.freelancerName}
                        </button>
                        {freelancer?.headline && (
                            <span className="text-sm text-slate-500 dark:text-gray-400 border-l border-slate-300 dark:border-white/20 pl-2 ml-1">{freelancer.headline}</span>
                        )}
                    </div>
                    
                    {freelancer?.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {freelancer.skills.slice(0, 5).map((skill: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5">{skill}</span>
                            ))}
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-lg mb-3 border border-slate-100 dark:border-white/5">
                        <p className="text-sm text-slate-700 dark:text-gray-300 italic">"{app.message}"</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><DollarSign size={12}/> Bid: <span className="font-bold text-slate-900 dark:text-white">{app.price}</span></span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(app.createdAt).toLocaleDateString()}</span>
                        {freelancer && targetProfileId && (
                            <button onClick={() => onViewProfile(targetProfileId, profileData)} className="flex items-center gap-1 text-primary hover:underline">
                                <BriefcaseIcon size={12} /> View Profile & Portfolio
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="self-start sm:self-center flex flex-row sm:flex-col gap-2 shrink-0">
                {app.status === 'accepted' && <Badge color="green">Hired</Badge>}
                {app.status === 'rejected' && <Badge color="red">Rejected</Badge>}

                {project.status === 'Requested' && app.status === 'applied' && (
                    <Button 
                        variant="primary" 
                        className="text-xs h-9 w-full shadow-md"
                        onClick={() => onHire(app)}
                        isLoading={isHiring}
                        disabled={isHiring}
                    >
                        Hire Applicant
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
  const location = useLocation();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [freelancerViewMode, setFreelancerViewMode] = useState<'browse' | 'mine'>('browse');

  // --- Unified Profile View State ---
  const [profileDrawerUser, setProfileDrawerUser] = useState<{id: string, initialData?: Partial<User>} | null>(null);

  useEffect(() => {
    if (selectedProject) setDisplayProject(selectedProject);
  }, [selectedProject]);
  
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

  // Create Project State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: '',
    dueDate: ''
  });
  
  // Target Freelancer (for Direct Hire)
  const [targetFreelancer, setTargetFreelancer] = useState<User | null>(null);

  // Listen for navigation state with hire intent
  useEffect(() => {
      if (location.state && location.state.hireFreelancer) {
          setTargetFreelancer(location.state.hireFreelancer);
          setIsCreateModalOpen(true);
      } else {
          setTargetFreelancer(null);
      }
  }, [location.state]);

  useEffect(() => {
    if (projectToApply) setDisplayProjectToApply(projectToApply);
  }, [projectToApply]);

  // Handler for Profile Viewing
  const handleViewProfile = (id: string, initialData?: Partial<User>) => {
      setProfileDrawerUser({ id, initialData });
  };

  // 1. READ: Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const projectsRef = firestore.collection('projects');
        let q;

        if (user.role === 'admin') {
            // Freelancer View
            if (freelancerViewMode === 'mine') {
                 q = projectsRef.where('freelancerId', '==', user.id);
            } else {
                 // Browse Open Projects
                 q = projectsRef.where('status', '==', 'Requested');
            }
        } else {
            // Client View - My Projects
            q = projectsRef.where('ownerId', '==', user.id);
        }
        
        const snapshot = await q.get();
        const fetchedProjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Project[];
        
        // Client side sort
        fetchedProjects.sort((a, b) => {
             const dateA = new Date(a.createdAt).getTime();
             const dateB = new Date(b.createdAt).getTime();
             return dateB - dateA;
        });

        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user, freelancerViewMode, isCreateModalOpen]); // Reload when modal closes (project added) or view mode changes

  // 2. FILTERING LOGIC
  const filteredProjects = projects.filter(project => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
          project.title.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query)) ||
          (project.client && project.client.toLowerCase().includes(query)) ||
          (project.tags && project.tags.some(tag => tag.toLowerCase().includes(query)));

      let matchesStatus = true;
      if (statusFilter === 'Open') {
          matchesStatus = project.status === 'Requested';
      } else if (statusFilter === 'Active') {
          matchesStatus = ['In Progress', 'Assigned', 'Hired', 'Pending'].includes(project.status);
      } else if (statusFilter === 'Completed') {
          matchesStatus = ['Completed', 'Submitted'].includes(project.status);
      }

      return matchesSearch && matchesStatus;
  });

  // 3. CREATE: New Project (or Direct Hire)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        const projectData: any = {
            title: newProject.title,
            description: newProject.description,
            budget: newProject.budget,
            dueDate: newProject.dueDate,
            tags: [],
            ownerId: user.id,
            client: user.company || user.name, // Display name
            clientId: user.id,
            progress: 0,
            createdAt: new Date().toISOString(), // Use string for UI compatibility
            updatedAt: new Date().toISOString()
        };

        if (targetFreelancer) {
            projectData.freelancerId = targetFreelancer.id;
            projectData.status = 'Assigned'; // Direct Hire
        } else {
            projectData.status = 'Requested'; // Open for proposals
        }

        // Add to firestore
        await firestore.collection('projects').add({
            ...projectData,
            createdAt: timestamp(),
            updatedAt: timestamp()
        });

        // Notifications
        if (targetFreelancer) {
             createNotification(
                 targetFreelancer.id,
                 'project',
                 `Direct Hire Offer: ${projectData.title}`,
                 `${user.name} has assigned you to a new project.`,
                 '/projects',
                 { name: user.name, avatar: user.avatar }
             );
        }

        showToast("Project created successfully!", "success");
        setIsCreateModalOpen(false);
        setNewProject({ title: '', description: '', budget: '', dueDate: '' });
        setTargetFreelancer(null);
    } catch (error) {
        console.error(error);
        showToast("Failed to create project.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  // 4. APPLY: Fetch Apps & Status
  useEffect(() => {
    const fetchApplications = async () => {
        if (selectedProject && user?.id === selectedProject.ownerId) {
            // I am Owner: Fetch all apps for this project
            setLoadingApps(true);
            try {
                const snapshot = await firestore.collection('projects').doc(selectedProject.id).collection('applications').get();
                const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[];
                setApplications(apps);
            } catch (e) { console.error(e); }
            setLoadingApps(false);
        }
    };
    fetchApplications();
  }, [selectedProject, user?.id]);

  // Check if current freelancer already applied
  useEffect(() => {
    const checkApplied = async () => {
        if (displayProjectToApply && user?.role === 'admin') {
             setCheckingApplication(true);
             try {
                 const q = firestore.collection('projects').doc(displayProjectToApply.id)
                    .collection('applications')
                    .where('freelancerId', '==', user.id);
                 const snap = await q.get();
                 setHasApplied(!snap.empty);
             } catch(e) { console.error(e); }
             setCheckingApplication(false);
        }
    };
    checkApplied();
  }, [displayProjectToApply, user?.id]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayProjectToApply) return;
    setIsApplying(true);

    try {
        const appData = {
            projectId: displayProjectToApply.id,
            freelancerId: user.id,
            freelancerName: user.name,
            message: applyForm.message,
            price: applyForm.price,
            status: 'applied',
            createdAt: new Date().toISOString()
        };

        await firestore.collection('projects').doc(displayProjectToApply.id).collection('applications').add({
            ...appData,
            createdAt: timestamp()
        });
        
        // Notify Client
        createNotification(
            displayProjectToApply.ownerId || displayProjectToApply.clientId,
            'application',
            `New Application: ${displayProjectToApply.title}`,
            `${user.name} applied for your project.`,
            '/projects',
            { name: user.name, avatar: user.avatar }
        );

        showToast("Application submitted!", "success");
        setIsApplyModalOpen(false);
        setApplyForm({ message: '', price: '' });
        setHasApplied(true);
    } catch (e) {
        showToast("Failed to apply", "error");
    } finally {
        setIsApplying(false);
    }
  };

  // 5. HIRE: Accept Application
  const handleHire = async (app: Application) => {
      if (!selectedProject) return;
      setHiringAppId(app.id);

      try {
          const projectRef = firestore.collection('projects').doc(selectedProject.id);
          
          // 1. Update Project
          await projectRef.update({
              status: 'Assigned',
              freelancerId: app.freelancerId,
              updatedAt: timestamp()
          });

          // 2. Update This Application
          await projectRef.collection('applications').doc(app.id).update({ status: 'accepted' });

          // 3. Reject Others (Optional but good practice)
          // For simplicity we skip batch rejecting others in this demo

          // 4. Notify Freelancer
          createNotification(
              app.freelancerId,
              'project',
              `You've been hired!`,
              `Application accepted for ${selectedProject.title}`,
              '/projects',
              { name: user?.name || 'Client', avatar: user?.avatar }
          );

          showToast(`${app.freelancerName} hired successfully!`, "success");
          
          // Refresh local state
          setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));
          setSelectedProject(prev => prev ? { ...prev, status: 'Assigned', freelancerId: app.freelancerId } : null);
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: 'Assigned', freelancerId: app.freelancerId } : p));

      } catch (e) {
          showToast("Error hiring freelancer", "error");
      } finally {
          setHiringAppId(null);
      }
  };

  const openApplyModal = (project: Project) => {
      setProjectToApply(project);
      setHasApplied(false); // Reset temporarily until check completes
      setIsApplyModalOpen(true);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                {user?.role === 'admin' ? 'Find Work' : 'Projects'}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
                {user?.role === 'admin' ? 'Browse open projects or manage your active jobs.' : 'Manage your projects and hire talent.'}
            </p>
          </div>
          
          {user?.role !== 'admin' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={18} /> Create Project
              </Button>
          )}
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:flex-1">
                <Input 
                    placeholder="Search projects by title, client, or tag..." 
                    icon={<Search size={18} />} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
                 {/* Status Filter */}
                 <div className="relative">
                     <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer w-full md:w-40"
                     >
                         <option value="All">All Status</option>
                         <option value="Open">Open</option>
                         <option value="Active">Active</option>
                         <option value="Completed">Completed</option>
                     </select>
                     <Filter size={14} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
                 </div>

                 {/* Admin View Mode Toggle */}
                 {user?.role === 'admin' && (
                      <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex shrink-0 border border-slate-200 dark:border-white/10">
                          <button 
                            onClick={() => setFreelancerViewMode('browse')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${freelancerViewMode === 'browse' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                              Browse
                          </button>
                          <button 
                            onClick={() => setFreelancerViewMode('mine')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${freelancerViewMode === 'mine' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-gray-500 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                              My Jobs
                          </button>
                      </div>
                 )}
            </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : filteredProjects.length === 0 ? (
             <EmptyState 
                 title={projects.length === 0 ? "No projects found" : "No matching projects"} 
                 description={
                     projects.length === 0 
                     ? (user?.role === 'admin' && freelancerViewMode === 'browse' ? "There are no open projects at the moment." : "You haven't created any projects yet.")
                     : "Try adjusting your search or filters to find what you're looking for."
                 }
                 action={
                    projects.length > 0 && (
                        <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}>
                           Clear Filters
                        </Button>
                    )
                 }
             />
          ) : (
            filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProjectCard 
                    project={project} 
                    userRole={user?.role}
                    currentUserId={user?.id}
                    onClick={() => setSelectedProject(project)}
                    onViewProfile={handleViewProfile}
                    onApply={openApplyModal}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* --- Create Project Modal --- */}
        <Modal 
            isOpen={isCreateModalOpen} 
            onClose={() => { setIsCreateModalOpen(false); setTargetFreelancer(null); }}
            title={targetFreelancer ? `Hire ${targetFreelancer.name}` : "Create New Project"}
        >
            <div className="p-6">
                {targetFreelancer && (
                    <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-4">
                         <img src={targetFreelancer.avatar} className="w-12 h-12 rounded-full border border-white/20" alt="" />
                         <div>
                             <h4 className="font-bold text-slate-900 dark:text-white">Direct Hire Offer</h4>
                             <p className="text-xs text-slate-600 dark:text-gray-300">You are creating a project assigned to {targetFreelancer.name}.</p>
                         </div>
                    </div>
                )}

                <form onSubmit={handleCreateProject} className="space-y-4">
                    <Input label="Project Title" placeholder="e.g. Website Redesign" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Budget" placeholder="$5,000" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} required icon={<DollarSign size={16} />} />
                        <Input label="Due Date" type="date" value={newProject.dueDate} onChange={e => setNewProject({...newProject, dueDate: e.target.value})} required />
                    </div>
                    <Input textarea label="Description" placeholder="Project details..." value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} required />
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isSubmitting}>
                            {targetFreelancer ? 'Send Offer' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>

        {/* --- Apply Modal --- */}
        <Modal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            title={`Apply for: ${displayProjectToApply?.title}`}
        >
            <div className="p-6">
                {checkingApplication ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : hasApplied ? (
                    <div className="text-center py-8">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Applied!</h3>
                        <p className="text-slate-500 mb-6">You have already submitted a proposal for this project.</p>
                        <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Close</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitApplication} className="space-y-4">
                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-sm text-slate-600 dark:text-gray-300 mb-4">
                            <span className="font-bold block mb-1">Client's Budget:</span> 
                            {displayProjectToApply?.budget}
                        </div>
                        <Input label="Your Price" placeholder="$..." value={applyForm.price} onChange={e => setApplyForm({...applyForm, price: e.target.value})} required />
                        <Input textarea rows={4} label="Cover Letter" placeholder="Why are you a good fit?" value={applyForm.message} onChange={e => setApplyForm({...applyForm, message: e.target.value})} required />
                        
                        <div className="flex justify-end pt-4">
                            <Button type="submit" isLoading={isApplying}>Submit Proposal</Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>

        {/* --- Project Details / Management Modal --- */}
        <Modal
            isOpen={!!selectedProject && !isCreateModalOpen && !isApplyModalOpen}
            onClose={() => setSelectedProject(null)}
            title={displayProject?.title}
            maxWidth="max-w-4xl"
        >
            {displayProject && (
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Left: Details */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Description</h3>
                                <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{displayProject.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Budget</h4>
                                    <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{displayProject.budget}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Due Date</h4>
                                    <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{displayProject.dueDate}</p>
                                </div>
                            </div>

                            {/* Status Specific Actions */}
                            {displayProject.status === 'Requested' && user?.role === 'admin' && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex justify-between items-center">
                                    <div className="text-sm text-slate-700 dark:text-gray-200 font-medium">Interested in this project?</div>
                                    <Button onClick={() => openApplyModal(displayProject)}>Apply Now</Button>
                                </div>
                            )}

                            {/* Chat Link if Active */}
                            {(displayProject.status === 'Assigned' || displayProject.status === 'In Progress') && (
                                <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <MessageSquare className="text-primary" />
                                         <div>
                                             <h4 className="font-bold text-sm text-slate-900 dark:text-white">Project Workspace</h4>
                                             <p className="text-xs text-gray-500">Chat and share files with the {user?.role === 'admin' ? 'client' : 'freelancer'}.</p>
                                         </div>
                                     </div>
                                     <Link to="/messages">
                                         <Button variant="secondary" className="h-9 text-xs">Go to Messages</Button>
                                     </Link>
                                </div>
                            )}
                        </div>

                        {/* Right: Applications (Client Only & Status Requested) */}
                        {user?.role !== 'admin' && (
                            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 pt-6 md:pt-0 md:pl-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    {displayProject.status === 'Requested' ? 'Applications' : 'Assigned Freelancer'}
                                </h3>
                                
                                {displayProject.status === 'Requested' ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {loadingApps ? (
                                            <div className="text-center py-4"><Loader2 className="animate-spin inline text-primary" /></div>
                                        ) : applications.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                No applications yet.
                                            </div>
                                        ) : (
                                            applications.map(app => (
                                                <ApplicationItem 
                                                    key={app.id}
                                                    app={app} 
                                                    project={displayProject} 
                                                    currentUserId={user?.id}
                                                    onHire={handleHire}
                                                    onViewProfile={handleViewProfile}
                                                    isHiring={hiringAppId === app.id}
                                                />
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    // Show Assigned Freelancer Card
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                         <div className="flex items-center gap-4 mb-4">
                                             <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                                 <UserIcon size={24} className="text-gray-400" />
                                                 {/* In real app, fetch freelancer avatar here or store in project */}
                                             </div>
                                             <div>
                                                 <div className="text-xs uppercase text-gray-500 font-bold">Freelancer</div>
                                                 <div className="font-bold text-slate-900 dark:text-white">
                                                     {/* In real app, fetch name */}
                                                     {displayProject.freelancerId ? 'Assigned User' : 'Unknown'}
                                                 </div>
                                             </div>
                                         </div>
                                         <Button variant="outline" className="w-full justify-center" onClick={() => handleViewProfile(displayProject.freelancerId || '')}>
                                             View Profile
                                         </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>

        {/* Global Profile Drawer */}
        <ProfileDrawer 
            isOpen={!!profileDrawerUser}
            userId={profileDrawerUser?.id || null}
            initialData={profileDrawerUser?.initialData}
            onClose={() => setProfileDrawerUser(null)}
        />
      </div>
    </PageWrapper>
  );
};
