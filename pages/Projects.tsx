import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper, Input, Modal } from '../components/UI';
import { Briefcase, ChevronRight, X, Calendar, DollarSign, Plus, Loader2, Send, CheckCircle, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, Application } from '../types';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, getDocs, updateDoc, doc, setDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Selection State (with persistence for animation)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

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
        const projectsRef = collection(firestore, "projects");
        let q;

        if (user.role === 'client') {
            q = query(projectsRef, where("ownerId", "==", user.id));
        } else {
            if (freelancerViewMode === 'mine') {
                q = query(projectsRef, where("freelancerId", "==", user.id));
            } else {
                q = query(projectsRef, where("status", "==", "Requested")); 
            }
        }

        const querySnapshot = await getDocs(q);
        
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
    
    const appsRef = collection(firestore, "projects", selectedProject.id, "applications");
    const q = query(appsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

  const openApplyModal = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToApply(project);
    setApplyForm({ message: '', price: project.budget });
    setIsApplyModalOpen(true);
    setHasApplied(false);
    setCheckingApplication(true);

    if (user) {
        try {
            const appsRef = collection(firestore, "projects", project.id, "applications");
            const q = query(appsRef, where("freelancerId", "==", user.id));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                setHasApplied(true);
            }
        } catch (e) {
            console.error("Error checking application status:", e);
        } finally {
            setCheckingApplication(false);
        }
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectToApply) return;
    
    if (hasApplied) {
        showToast("You have already applied to this project.", "error");
        return;
    }

    setIsApplying(true);
    try {
        const appsRef = collection(firestore, "projects", projectToApply.id, "applications");
        await addDoc(appsRef, {
            freelancerId: user.id,
            freelancerName: user.name,
            projectId: projectToApply.id,
            message: applyForm.message,
            price: applyForm.price,
            status: 'applied',
            createdAt: serverTimestamp()
        });
        
        showToast("Application submitted successfully!", "success");
        setIsApplyModalOpen(false);
        // Don't clear projectToApply immediately for animation persistence
    } catch (e) {
        console.error(e);
        showToast("Failed to apply.", "error");
    } finally {
        setIsApplying(false);
    }
  };

  const handleHireFreelancer = async (application: Application) => {
    if (!selectedProject) return;
    setHiringAppId(application.id);

    try {
        // 1. Update Project
        const projectRef = doc(firestore, "projects", selectedProject.id);
        await updateDoc(projectRef, {
            freelancerId: application.freelancerId,
            status: 'Assigned',
            updatedAt: serverTimestamp()
        });

        // 2. Update Application Status
        const appRef = doc(firestore, "projects", selectedProject.id, "applications", application.id);
        await updateDoc(appRef, {
            status: 'accepted'
        });

        // 3. Create or Initialize Chat Room
        // Path: /chats/{projectId}
        const chatRef = doc(firestore, "chats", selectedProject.id);
        const ownerId = selectedProject.ownerId || selectedProject.clientId;
        
        await setDoc(chatRef, {
            projectId: selectedProject.id,
            ownerId: ownerId,
            freelancerId: application.freelancerId,
            active: true,
            createdAt: serverTimestamp(),
            closedAt: null,
            participants: [ownerId, application.freelancerId].filter(Boolean)
        }, { merge: true }); // Merge to avoid overwriting existing messages/history if any

        // Update local state
        const updatedProject = { ...selectedProject, status: 'Assigned', freelancerId: application.freelancerId } as Project;
        
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
        setSelectedProject(updatedProject);
        setApplications(prev => prev.map(a => a.id === application.id ? { ...a, status: 'accepted' } : a));

        showToast(`Hired ${application.freelancerName}! Chat room created.`, "success");
    } catch (e) {
        console.error("Error hiring:", e);
        showToast("Failed to hire freelancer.", "error");
    } finally {
        setHiringAppId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const projectsRef = collection(firestore, "projects");
      
      await addDoc(projectsRef, {
        title: newProject.title,
        description: newProject.description,
        ownerId: user.id, 
        freelancerId: null,
        status: 'Requested',
        progress: 0,
        startDate: new Date().toISOString(),
        endDate: newProject.dueDate,
        budget: newProject.budget,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        client: user.company || user.name, 
        tags: [] 
      });

      setIsCreateModalOpen(false);
      showToast("Request submitted successfully!", 'success');
      setNewProject({ title: '', description: '', budget: '', dueDate: '' });
    } catch (error) {
      console.error("Error creating project:", error);
      showToast("Failed to create project", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {user?.role === 'admin' ? 'Job Board' : 'My Projects'}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              {user?.role === 'admin' 
                ? 'Find your next gig or manage active contracts.' 
                : 'Track your projects and manage candidates.'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {user?.role === 'admin' && (
                <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10 flex">
                    <button 
                        onClick={() => setFreelancerViewMode('browse')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${freelancerViewMode === 'browse' ? 'bg-primary text-white' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                        Browse Jobs
                    </button>
                    <button 
                        onClick={() => setFreelancerViewMode('mine')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${freelancerViewMode === 'mine' ? 'bg-primary text-white' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                        My Projects
                    </button>
                </div>
            )}
            
            {user?.role === 'client' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} /> New Request
                </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
             </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Briefcase size={48} className="mx-auto mb-4 text-slate-400 dark:text-gray-400" />
              <p className="text-xl text-slate-600 dark:text-gray-400">No projects found.</p>
              {user?.role === 'client' && (
                 <p className="text-sm text-slate-500 dark:text-gray-500 mt-2">Submit a request to get started!</p>
              )}
            </div>
          ) : (
            projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedProject(project)}
                className="cursor-pointer"
              >
                <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`p-3 rounded-xl shrink-0 ${
                        project.status === 'Assigned' || project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' : 
                        project.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 
                        project.status === 'Requested' ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <Briefcase size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-slate-900 dark:text-white truncate pr-2">{project.title}</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm truncate">
                        {user?.role === 'admin' ? `Client: ${project.client}` : `Due: ${project.dueDate}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-mono text-xl font-bold hidden sm:block text-slate-900 dark:text-white whitespace-nowrap">{project.budget}</span>
                    <Badge color={
                      project.status === 'Assigned' || project.status === 'In Progress' ? 'blue' : 
                      project.status === 'Completed' ? 'green' : 
                      project.status === 'Requested' ? 'purple' : 'yellow'
                    }>
                        {project.status === 'Requested' ? 'Open' : project.status}
                    </Badge>
                    
                    {user?.role === 'admin' && freelancerViewMode === 'browse' && project.status === 'Requested' && (
                        <Button 
                            variant="primary" 
                            className="text-xs py-2 px-4" 
                            onClick={(e) => openApplyModal(project, e)}
                        >
                            Apply
                        </Button>
                    )}

                    <ChevronRight className="text-slate-400 dark:text-gray-500 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal View for Project Details */}
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={null}
          className="max-w-2xl"
          hideHeader={true}
        >
          {displayProject && (
            <>
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white">
                        {displayProject.client.charAt(0)}
                     </div>
                     <div>
                        <h2 className="text-xl font-bold dark:text-white text-slate-900">{displayProject.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{displayProject.client}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-gray-400">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-gray-300">
                   <div className="mb-8">
                      <h3 className="font-bold text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                      <p className="leading-relaxed text-slate-700 dark:text-gray-300">{displayProject.description || "No description provided."}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2 text-primary mb-1">
                            <Calendar size={18} />
                            <span className="font-bold">Due Date</span>
                         </div>
                         <p className="font-mono text-slate-900 dark:text-white">{displayProject.dueDate || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2 text-green-500 mb-1">
                            <DollarSign size={18} />
                            <span className="font-bold">Budget</span>
                         </div>
                         <p className="font-mono text-slate-900 dark:text-white">{displayProject.budget || 'N/A'}</p>
                      </div>
                   </div>

                   {user?.role === 'client' && (
                       <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-8">
                           <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Applications ({applications.length})</h3>
                           
                           {loadingApps ? (
                               <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                           ) : applications.length === 0 ? (
                               <p className="text-gray-500 text-sm">No applications yet.</p>
                           ) : (
                               <div className="space-y-3">
                                   {applications.map(app => (
                                       <div key={app.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                                           <div>
                                               <div className="flex items-center gap-2 mb-1">
                                                   <span className="font-bold text-slate-900 dark:text-white">{app.freelancerName}</span>
                                                   {app.status === 'accepted' && <Badge color="green">Hired</Badge>}
                                               </div>
                                               <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{app.message}"</p>
                                               <p className="text-xs text-gray-400 mt-2">Bid: {app.price} • {new Date(app.createdAt).toLocaleDateString()}</p>
                                           </div>
                                           
                                           {displayProject.status === 'Requested' && (
                                               <div className="self-start sm:self-center">
                                                   <Button 
                                                        variant="primary" 
                                                        className="text-xs py-2 h-auto"
                                                        onClick={() => handleHireFreelancer(app)}
                                                        isLoading={hiringAppId === app.id}
                                                        loaderSize={16}
                                                   >
                                                       Hire
                                                   </Button>
                                               </div>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-end gap-4 sticky bottom-0 z-10">
                    <Button variant="secondary" onClick={() => setSelectedProject(null)}>Close</Button>
                    
                    {user?.role === 'admin' && freelancerViewMode === 'browse' && displayProject.status === 'Requested' && (
                        <Button onClick={(e) => openApplyModal(displayProject, e)}>Apply Now</Button>
                    )}
                </div>
            </>
          )}
        </Modal>

        {/* Apply Modal (Freelancer) */}
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Apply to Project"
          maxWidth="max-w-md"
        >
          <div className="p-6">
              {displayProjectToApply && (
                <div className="mb-6">
                    <p className="text-sm text-gray-500">You are applying for:</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{displayProjectToApply.title}</p>
                </div>
              )}

              {checkingApplication ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-sm text-gray-500">Checking eligibility...</p>
                  </div>
              ) : hasApplied ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                      <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-600 dark:text-yellow-400">
                          <AlertCircle size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Already Applied</h3>
                          <p className="text-gray-500 text-sm mt-2">You have already submitted a proposal for this project. You can only apply once.</p>
                      </div>
                      <Button variant="secondary" onClick={() => setIsApplyModalOpen(false)} className="mt-4">Close</Button>
                  </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <Input 
                    label="Your Bid Price" 
                    placeholder={displayProjectToApply?.budget}
                    value={applyForm.price}
                    onChange={(e) => setApplyForm({...applyForm, price: e.target.value})}
                    required
                  />
                  <Input 
                    label="Cover Message" 
                    placeholder="Why are you the best fit?"
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({...applyForm, message: e.target.value})}
                    textarea
                    required
                  />

                  <div className="pt-4">
                    <Button type="submit" className="w-full" isLoading={isApplying}>
                        <Send size={16} /> Submit Application
                    </Button>
                  </div>
                </form>
              )}
          </div>
        </Modal>

        {/* Create Request Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="New Project Request"
        >
          <div className="p-6">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
                <Input 
                    label="Project Title" 
                    placeholder="e.g. Mobile App Redesign"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    required
                />
                <Input 
                    label="Description & Scope" 
                    placeholder="Describe what you need..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    textarea
                    required
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                    label="Budget Range" 
                    placeholder="e.g. $5,000"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                    required
                    />
                    <Input 
                    label="Target Due Date" 
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                    required
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full" isLoading={isSubmitting}>Submit Request</Button>
                </div>
            </form>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  );
};