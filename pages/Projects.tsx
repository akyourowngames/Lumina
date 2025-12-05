import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper, Input } from '../components/UI';
import { Briefcase, CheckCircle, Clock, ChevronRight, X, Calendar, DollarSign, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/mockDb';
import { Project } from '../types';
import { useToast } from '../context/ToastContext';

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { showToast } = useToast();
  
  // Create Project State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: '',
    dueDate: ''
  });

  useEffect(() => {
    // Load projects
    const allProjects = db.getProjects();
    if (user?.role === 'admin') {
      // Freelancer sees all requests and active projects
      setProjects(allProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      // Client sees only their projects
      setProjects(allProjects.filter(p => p.clientId === user?.id));
    }
  }, [user, isCreateModalOpen]); // Reload when modal closes (after submit)

  const handleAcceptProject = (project: Project) => {
    const updatedProject: Project = { ...project, status: 'In Progress' };
    db.updateProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === project.id ? updatedProject : p));
    setSelectedProject(null);
    showToast(`Project "${project.title}" accepted!`, 'success');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const project: Project = {
      id: `proj-${Math.random().toString(36).substr(2, 9)}`,
      title: newProject.title,
      description: newProject.description,
      client: user.company || user.name,
      clientId: user.id,
      status: 'Requested',
      progress: 0,
      dueDate: newProject.dueDate,
      budget: newProject.budget,
      tags: [],
      createdAt: new Date().toISOString()
    };

    db.createProject(project);
    setIsCreateModalOpen(false);
    showToast("Request submitted successfully!", 'success');
    setNewProject({ title: '', description: '', budget: '', dueDate: '' });
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {user?.role === 'admin' ? 'Proposals' : 'My Projects'}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              {user?.role === 'admin' 
                ? 'Review and manage incoming project proposals.' 
                : 'Track your projects and submit new requests.'}
            </p>
          </div>
          {user?.role === 'client' && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} /> New Request
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {projects.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <Briefcase size={48} className="mx-auto mb-4 text-slate-400 dark:text-gray-400" />
              <p className="text-xl text-slate-600 dark:text-gray-400">No projects found.</p>
              {user?.role === 'client' && (
                 <p className="text-sm text-slate-500 dark:text-gray-500 mt-2">Submit a request to get started!</p>
              )}
            </div>
          )}

          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer"
            >
              <GlassCard className="p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                      project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' : 
                      project.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 
                      project.status === 'Requested' ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-slate-900 dark:text-white">{project.title}</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm">
                      {user?.role === 'admin' ? `Client: ${project.client}` : `Due: ${project.dueDate}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono text-xl font-bold hidden sm:block text-slate-900 dark:text-white">{project.budget}</span>
                  <Badge color={
                    project.status === 'In Progress' ? 'blue' : 
                    project.status === 'Completed' ? 'green' : 
                    project.status === 'Requested' ? 'purple' : 'yellow'
                  }>
                      {project.status === 'Requested' && user?.role === 'admin' ? 'Proposal' : project.status}
                  </Badge>
                  <ChevronRight className="text-slate-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Modal View for Project Details */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProject(null)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div
                layoutId={`project-${selectedProject.id}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
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
                    <X />
                  </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-gray-300">
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
                         <p className="font-mono text-slate-900 dark:text-white">{selectedProject.dueDate}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-2 text-green-500 mb-1">
                            <DollarSign size={18} />
                            <span className="font-bold">Budget</span>
                         </div>
                         <p className="font-mono text-slate-900 dark:text-white">{selectedProject.budget}</p>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-xs font-mono text-slate-600 dark:text-gray-300">
                            {tag}
                         </span>
                      ))}
                   </div>
                </div>

                {/* Footer Actions */}
                {user?.role === 'admin' && selectedProject.status === 'Requested' && (
                  <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-end gap-4">
                     <Button variant="outline" onClick={() => setSelectedProject(null)}>Decline</Button>
                     <Button onClick={() => handleAcceptProject(selectedProject)}>
                        Accept Proposal
                     </Button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Request Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold font-display dark:text-white text-slate-900">New Project Request</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} className="dark:text-white text-slate-900" />
                  </button>
                </div>

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
                    <Button type="submit" className="w-full">Submit Request</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};