import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { GlassCard, Badge, Button, PageWrapper, Input, Modal, AnimatedCounter, EmptyState } from '../components/UI';
import { Clock, CheckCircle2, DollarSign, TrendingUp, Users, FileText, Bell, Plus, X, MessageSquare, Loader2, CheckSquare } from 'lucide-react';
import { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { firestore, timestamp } from '../services/firebase';
import { useToast } from '../context/ToastContext';

// Mock chart data (Dashboard charts usually aggregate data which requires more complex backend logic)
const data = [
  { name: 'Jan', amt: 2400 },
  { name: 'Feb', amt: 1398 },
  { name: 'Mar', amt: 9800 },
  { name: 'Apr', amt: 3908 },
  { name: 'May', amt: 4800 },
  { name: 'Jun', amt: 3800 },
];

const clientData = [
  { name: 'Week 1', progress: 20 },
  { name: 'Week 2', progress: 45 },
  { name: 'Week 3', progress: 60 },
  { name: 'Week 4', progress: 75 },
];

interface StatData {
  label: string;
  val: string;
  icon: React.ReactNode;
  change?: string;
  link?: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch Tasks
  useEffect(() => {
    const fetchTasks = async () => {
        if (!user) return;
        setIsLoadingTasks(true);
        try {
            const tasksRef = firestore.collection('users').doc(user.id).collection('tasks');
            const snapshot = await tasksRef.limit(10).get();
            
            const fetchedTasks = snapshot.docs.map(d => {
                const data = d.data();
                return { 
                    id: d.id, 
                    title: data.title || 'Untitled',
                    status: data.status || 'Todo',
                    priority: data.priority || 'Medium',
                    assignee: data.assignee || 'Unassigned',
                    // Handle missing or string timestamps
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || data.createdat || new Date().toISOString())
                } as unknown as Task & { createdAt: string };
            });

            // Client side sort
            fetchedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setTasks(fetchedTasks.slice(0, 5));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingTasks(false);
        }
    };
    fetchTasks();
  }, [user, isTaskModalOpen]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle) return;

    setIsAddingTask(true);
    try {
        await firestore.collection('users').doc(user.id).collection('tasks').add({
            title: newTaskTitle,
            status: 'Todo',
            priority: 'Medium',
            assignee: user.name,
            createdAt: timestamp()
        });
        showToast("Task added!", "success");
        setIsTaskModalOpen(false);
        setNewTaskTitle('');
    } catch (e) {
        showToast("Failed to add task", "error");
    } finally {
        setIsAddingTask(false);
    }
  };

  const adminStats: StatData[] = [
    { label: "Total Revenue", val: "$12,450", icon: <DollarSign className="text-green-500 dark:text-green-400" />, change: "+12%" },
    { label: "Active Projects", val: "3", icon: <BriefcaseIcon className="text-blue-500 dark:text-blue-400" />, change: "+1", link: '/projects' },
    { label: "Pending Invoices", val: "2", icon: <Clock className="text-yellow-500 dark:text-yellow-400" />, change: "$4.5k", link: '/invoices' },
    { label: "Messages", val: "5", icon: <MessageSquare className="text-purple-500 dark:text-purple-400" />, link: '/messages' },
  ];

  const clientStats: StatData[] = [
    { label: "Project Status", val: "On Track", icon: <TrendingUp className="text-green-500 dark:text-green-400" />, link: '/projects' },
    { label: "Pending Tasks", val: tasks.filter(t => t.status !== 'Done').length.toString(), icon: <CheckCircle2 className="text-blue-500 dark:text-blue-400" /> },
    { label: "Next Invoice", val: "$2,500", icon: <FileText className="text-yellow-500 dark:text-yellow-400" />, link: '/invoices' },
    { label: "Unread Messages", val: "1", icon: <Bell className="text-purple-500 dark:text-purple-400" />, link: '/messages' },
  ];

  const stats = isAdmin ? adminStats : clientStats;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
             <motion.h1 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-3xl font-bold font-display text-slate-900 dark:text-white"
             >
               {isAdmin ? 'Admin Dashboard' : 'Client Portal'}
             </motion.h1>
             <p className="text-slate-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/messages">
               <Button variant="outline">
                 <MessageSquare size={18} />
                 <span className="hidden sm:inline">Messages</span>
               </Button>
            </Link>
            {!isAdmin && (
               <Link to="/projects">
                 <Button>View Projects</Button>
               </Link>
            )}
            {isAdmin && (
              <Button variant="secondary">Export Report</Button>
            )}
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => {
            const Content = (
              <GlassCard className={`p-6 h-full ${stat.link ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">{stat.label}</span>
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg">{stat.icon}</div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                      <AnimatedCounter value={stat.val} />
                  </div>
                  {isAdmin && stat.change && (
                    <span className="text-xs font-bold text-green-500 dark:text-green-400 mb-1 bg-green-500/10 dark:bg-green-400/10 px-1.5 py-0.5 rounded">{stat.change}</span>
                  )}
                </div>
              </GlassCard>
            );

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
              >
                {stat.link ? (
                  <Link to={stat.link}>{Content}</Link>
                ) : (
                  Content
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="h-full min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isAdmin ? 'Revenue Overview' : 'Project Progress'}</h2>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {isAdmin ? (
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} 
                      />
                      <Bar dataKey="amt" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  ) : (
                    <AreaChart data={clientData}>
                      <defs>
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                      <Area type="monotone" dataKey="progress" stroke="#8884d8" fillOpacity={1} fill="url(#colorProgress)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Side Panel (Tasks) */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Tasks</h2>
                 <button onClick={() => setIsTaskModalOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Plus size={18} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-3 min-h-[200px]">
                {isLoadingTasks ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : tasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <EmptyState 
                            icon={<CheckSquare size={32} />}
                            title="No Tasks"
                            description="You're all caught up!"
                        />
                    </div>
                ) : (
                    tasks.map((task, i) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-slate-700 dark:text-gray-200">{task.title}</span>
                          <Badge color={task.status === 'Done' ? 'green' : task.status === 'In Progress' ? 'blue' : 'purple'}>
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
                              {task.assignee?.charAt(0) || 'U'}
                            </div>
                            <span>{task.assignee}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded ${task.priority === 'High' ? 'text-red-500 dark:text-red-400 bg-red-500/10' : 'text-slate-400 dark:text-gray-400'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                 <Link to="/projects">
                   <Button variant="outline" className="w-full text-sm h-10">View All Projects</Button>
                 </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Add Task Modal */}
        <Modal 
            isOpen={isTaskModalOpen} 
            onClose={() => setIsTaskModalOpen(false)}
            title="Add Quick Task"
            maxWidth="max-w-sm"
        >
            <div className="p-6">
                <form onSubmit={handleAddTask} className="space-y-4">
                    <Input 
                        autoFocus
                        placeholder="Task Title" 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                        disabled={isAddingTask}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)} disabled={isAddingTask}>Cancel</Button>
                        <Button type="submit" isLoading={isAddingTask}>Add Task</Button>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </PageWrapper>
  );
};

// Helper icon
const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);