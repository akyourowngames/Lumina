import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, Badge } from '../components/UI';
import { ProjectChat } from '../components/ProjectChat';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase';
import { Project } from '../types';
import { MessageSquare, Search, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react';

export const Messages = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Projects that the user is involved in
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const projectsRef = firestore.collection('projects');
        let q;
        
        // Fetch projects where user is owner OR freelancer
        if (user.role === 'client') {
            q = projectsRef.where('ownerId', '==', user.id);
        } else {
            // Freelancer sees assigned projects
            q = projectsRef.where('freelancerId', '==', user.id);
        }

        const snapshot = await q.get();
        const fetchedProjects = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            } as Project;
        });
        
        // Sort by most recent update
        fetchedProjects.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        setProjects(fetchedProjects);
        
        // Auto select first project on desktop
        if (window.innerWidth >= 768 && fetchedProjects.length > 0 && !selectedProject) {
            setSelectedProject(fetchedProjects[0]);
        }
      } catch (error) {
        console.error("Error loading chat projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [user]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20 h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Messages</h1>
            <Badge color="blue">{projects.length} Active</Badge>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 relative overflow-hidden rounded-2xl">
            {/* Sidebar List */}
            <div className={`
                md:col-span-4 lg:col-span-3 flex flex-col gap-4 min-h-0 h-full
                ${selectedProject ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="relative shrink-0">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-primary"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading ? (
                         [1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />)
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No projects found.</div>
                    ) : (
                        filteredProjects.map(project => (
                            <motion.div
                                key={project.id}
                                layoutId={project.id}
                                onClick={() => setSelectedProject(project)}
                                className={`
                                    p-4 rounded-xl cursor-pointer transition-all border
                                    ${selectedProject?.id === project.id 
                                        ? 'bg-white dark:bg-white/10 border-primary shadow-lg scale-[1.02]' 
                                        : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm truncate pr-2 ${selectedProject?.id === project.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                        {project.title}
                                    </h3>
                                    {selectedProject?.id === project.id && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{project.client}</p>
                                <div className="flex items-center justify-between">
                                    <Badge color="purple">{project.status}</Badge>
                                    <ChevronRight size={14} className="text-gray-400" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                md:col-span-8 lg:col-span-9 h-full flex flex-col min-h-0
                ${selectedProject ? 'flex' : 'hidden md:flex'}
            `}>
                <AnimatePresence mode="wait">
                    {selectedProject ? (
                        <motion.div 
                            key={selectedProject.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="md:hidden mb-4 flex items-center gap-2">
                                <button 
                                    onClick={() => setSelectedProject(null)}
                                    className="p-2 bg-white dark:bg-white/5 rounded-lg text-slate-900 dark:text-white"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <span className="font-bold text-slate-900 dark:text-white">Back to Projects</span>
                            </div>
                            <ProjectChat project={selectedProject} />
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-100/50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                            <div className="p-6 bg-white dark:bg-white/5 rounded-full mb-4 shadow-sm">
                                <MessageSquare size={48} className="text-slate-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select a Project</h3>
                            <p className="text-slate-500 max-w-sm mt-2">
                                Choose a project from the sidebar to start messaging with the {user?.role === 'admin' ? 'client' : 'freelancer'}.
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};