import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper, Input, Modal } from '../components/UI';
import { Briefcase, ChevronRight, X, Calendar, DollarSign, Plus, Loader2, Send, CheckCircle, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, Application } from '../types';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Freelancer specific view state
  const [freelancerViewMode, setFreelancerViewMode] = useState<'browse' | 'mine'>('browse');

  // Application State (For Clients viewing)
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Apply Modal State (For Freelancers applying)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ message: '', price: '' });
  const [projectToApply, setProjectToApply] = useState<Project | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Create Project State (For Clients)
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

        // Filtering Logic
        if (user.role === 'client') {
            // Clients see projects they own
            q = query(projectsRef, where("ownerId", "==", user.id));
        } else {
            // Freelancers (Admin)
            if (freelancerViewMode === 'mine') {
                // My Projects: Where I am the freelancer
                q = query(projectsRef, where("freelancerId", "==", user.id));
            } else {
                // Browse: Open projects
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
            // Robust timestamp handling
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
          } as Project;
        });

        // Client-side sort by newest first
        fetchedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setProjects(fetchedProjects);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        // Only show toast if it's NOT a permission error to avoid spamming the user on load
        if (error.code !== 'permission-denied') {
            showToast("Failed to load projects", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, isCreateModalOpen, freelancerViewMode]); // Re-fetch when view mode changes

  // 2. Fetch Applications (Real-time listener)
  useEffect(() => {
    // Only fetch if a project is selected and the user is a client
    if (!selectedProject || user?.role !== 'client') {
        setApplications([]); // Clear apps if condition not met
        return;
    }
    
    setLoadingApps(true);
    
    // Create query
    const appsRef = collection(firestore, "projects", selectedProject.id, "applications");
    const q = query(appsRef);

    // Use onSnapshot for real-time updates and better cache handling
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                // Handle various timestamp formats safely (Firestore Timestamp vs string vs null)
                createdAt: data.createdAt?.toDate 
                    ? data.createdAt.toDate().toISOString() 
                    : (data.createdAt || new Date().toISOString())
            };
        }) as Application[];
        
        // Client-side sort: Newest first
        apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setApplications(apps);
        setLoadingApps(false);
    }, (error) => {
        console.error("Error fetching applications:", error);
        if (error.code === 'permission-denied') {
           showToast("Access denied: You may not have permission to view applications.", "error");
        }
        setLoadingApps(false);
    });

    // Cleanup subscription on unmount or when dependency changes
    return () => unsubscribe();

  }, [selectedProject, user]);


  // 3. ACTIONS

  // Freelancer: Open Apply Modal and Check for Existing Application
  const openApplyModal = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToApply(project);
    setApplyForm({ message: '', price: project.budget }); // Pre-fill budget as suggested price
    setIsApplyModalOpen(true);
    setHasApplied(false);
    setCheckingApplication(true);

    if (user) {
        try {
            // Check if user has already applied to this project
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

  // Freelancer: Submit Application
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectToApply) return;
    
    // Double check logic in case UI was bypassed, though UI prevents button click
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
        setProjectToApply(null);
        setApplyForm({ message: '', price: '' });
    } catch (e) {
        console.error(e);
        showToast("Failed to apply.", "error");
    } finally {
        setIsApplying(false);
    }
  };

  // Client: Hire Freelancer
  const handleHireFreelancer = async (application: Application) => {
    if (!selectedProject) return;

    try {
        // 1. Update Project
        const projectRef = doc(firestore, "projects", selectedProject.id);
        await updateDoc(projectRef, {
            freelancerId: application.freelancerId,
            status: 'Assigned', // Changed from In Progress to Assigned per request
            updatedAt: serverTimestamp()
        });

        // 2. Update Application Status
        const appRef = doc(firestore, "projects", selectedProject.id, "applications", application.id);
        await updateDoc(appRef, {
            status: 'accepted'
        });

        // UI Update
        const updatedProject = { ...selectedProject, status: 'Assigned', freelancerId: application.freelancerId } as Project;
        
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
        setSelectedProject(updatedProject); // Update modal view
        
        // Update local applications list (Snapshot will also update this, but optimistic update is fine)
        setApplications(prev => prev.map(a => a.id === application.id ? { ...a, status: 'accepted' } : a));

        showToast(`Hired ${application.freelancerName}!`, "success");
    } catch (e) {
        console.error("Error hiring:", e);
        showToast("Failed to hire freelancer.", "error");
    }
  };

  // Client: Create Project
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
      // Trigger re-fetch naturally or update state manually if needed
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
                    
                    {/* Apply Button for Freelancers on Browse View */}
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
          title={null} // Custom header inside
          className="max-w-2xl"
        >
          {selectedProject && (
            <>
                {/* Custom Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white">
                        {selectedProject.client.charAt(0)}
                     </div>
                     <div>
                        <h2 className="text-xl font-bold dark:text-white text-slate-900">{selectedProject.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedProject.client}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-gray-400">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-gray-300">
                   <div className="mb-8">
                      <h3 className="font-bold text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                      <p className="leading-relaxed text-slate-700 dark:text-gray-300">{selectedProject.description || "No description provided."}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2 text-primary mb-1">
                            <Calendar size={18} />
                            <span className="font-bold">Due Date</span>
                         </div>
                         <p className="font-mono text-slate-900 dark:text-white">{selectedProject.dueDate || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2 text-green-500 mb-1">
                            <DollarSign size={18} />
                            <span className="font-bold">Budget</span>
                         </div>
                         <p className="font-mono text-slate-900 dark:text-white">{selectedProject.budget || 'N/A'}</p>
                      </div>
                   </div>

                   {/* Applications Section (For Clients) */}
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
                                           
                                           {selectedProject.status === 'Requested' && (
                                               <div className="self-start sm:self-center">
                                                   <Button 
                                                        variant="primary" 
                                                        className="text-xs py-2 h-auto"
                                                        onClick={() => handleHireFreelancer(app)}
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

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-end gap-4 sticky bottom-0 z-10">
                    <Button variant="secondary" onClick={() => setSelectedProject(null)}>Close</Button>
                    
                    {/* Freelancer Apply Button inside detail view if browsing */}
                    {user?.role === 'admin' && freelancerViewMode === 'browse' && selectedProject.status === 'Requested' && (
                        <Button onClick={(e) => openApplyModal(selectedProject, e)}>Apply Now</Button>
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
              {projectToApply && (
                <div className="mb-6">
                    <p className="text-sm text-gray-500">You are applying for:</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{projectToApply.title}</p>
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
                    placeholder={projectToApply?.budget}
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