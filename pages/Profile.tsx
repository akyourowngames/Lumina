import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, PageWrapper, Input, Badge, Switch, ProgressBar, Modal } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { User, PortfolioItem } from '../types';
import { 
    Mail, MapPin, Camera, Save, Link as LinkIcon, DollarSign, Briefcase, Star, 
    Layout, Globe, Github, Linkedin, Twitter, AlertTriangle, Plus, Trash2, 
    ExternalLink, UploadCloud, X, Eye, Check, Loader2, Edit3, Image as ImageIcon
} from 'lucide-react';
import { firestore, timestamp } from '../services/firebase';
import { supabase } from '../services/supabaseClient'; 
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'portfolio' | 'settings'>('details');
  const [isSaving, setIsSaving] = useState(false);
  
  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form Data
  const [formData, setFormData] = useState<Partial<User>>({});
  const [skillInput, setSkillInput] = useState('');

  // Initial Data Load
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        hourlyRate: user.hourlyRate || 0,
        skills: user.skills || [],
        profileRole: user.profileRole || (user.role === 'admin' ? 'freelancer' : 'client'),
        available: user.available !== false, // default true
        website: user.website || '',
        github: user.github || '',
        twitter: user.twitter || '',
        linkedin: user.linkedin || '',
        company: user.company || ''
      });
      
      // Real-time listener for Portfolio
      const unsubscribe = firestore.collection('users').doc(user.id).collection('portfolio')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioItem[];
            setPortfolioItems(items);
        }, error => {
            console.error("Error listening to portfolio:", error);
        });

      return () => unsubscribe();
    }
  }, [user]);

  // --- Logic: Role Determination (Dynamic based on Form Data) ---
  const currentRole = formData.profileRole || (user?.role === 'admin' ? 'freelancer' : 'client');
  const isClientOnly = currentRole === 'client';
  
  // If user switches to Client Only while on Portfolio tab, switch back to Details
  useEffect(() => {
      if (isClientOnly && activeTab === 'portfolio') {
          setActiveTab('details');
      }
  }, [isClientOnly, activeTab]);

  // --- Logic: Completion Calculation ---
  const calculateCompletion = () => {
      let score = 0;
      // If client only, don't count skills/portfolio
      const fields = [
          formData.name, formData.headline, formData.bio, formData.location, 
          formData.avatar, 
          // Only count skills/portfolio if NOT client only
          !isClientOnly ? ((formData.skills?.length || 0) > 0) : true,
          !isClientOnly ? (portfolioItems.length > 0) : true
      ];
      const filled = fields.filter(Boolean).length;
      score = Math.round((filled / fields.length) * 100);
      return score;
  };

  const completion = calculateCompletion();

  // --- Logic: Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (val: boolean) => {
      setFormData(prev => ({ ...prev, available: val }));
  };

  const handleSave = async (e?: React.FormEvent) => {
      if(e) e.preventDefault();
      setIsSaving(true);
      const success = await updateProfile(formData);
      setIsSaving(false);
  };

  // --- Logic: Skills ---
  const addSkill = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && skillInput.trim()) {
          e.preventDefault();
          if (!formData.skills?.includes(skillInput.trim())) {
              setFormData(prev => ({
                  ...prev,
                  skills: [...(prev.skills || []), skillInput.trim()]
              }));
          }
          setSkillInput('');
      }
  };

  const removeSkill = (skill: string) => {
      setFormData(prev => ({
          ...prev,
          skills: prev.skills?.filter(s => s !== skill)
      }));
  };

  // --- Logic: Avatar Upload (Supabase - Keeping existing logic) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setIsUploadingAvatar(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadError } = await supabase.storage
              .from('File')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('File')
              .getPublicUrl(filePath);

          setFormData(prev => ({ ...prev, avatar: publicUrl }));
          await updateProfile({ avatar: publicUrl });
          showToast("Avatar updated!", "success");

      } catch (error: any) {
          console.error("Avatar upload error:", error);
          showToast("Failed to upload image", "error");
      } finally {
          setIsUploadingAvatar(false);
      }
  };

  // --- Sub-Components ---
  const TabButton = ({ id, label, icon }: any) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={`
            relative px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
            ${activeTab === id ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}
          `}
      >
          {icon}
          {label}
          {activeTab === id && (
              <motion.div 
                  layoutId="activeProfileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
          )}
      </button>
  );

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div className="w-full md:w-auto">
                <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Profile Settings</h1>
                <p className="text-slate-500 dark:text-gray-400">Manage your presence and portfolio.</p>
                
                {/* Completion Bar */}
                <div className="mt-6 max-w-md">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1">
                        <span className={completion === 100 ? "text-green-500" : "text-slate-500"}>
                            {completion === 100 ? "Profile Complete!" : "Profile Strength"}
                        </span>
                        <span className="text-slate-700 dark:text-white">{completion}%</span>
                    </div>
                    <ProgressBar progress={completion} />
                </div>
            </div>
            
            <Link to={`/u/${user?.id}`} target="_blank">
                <Button variant="outline">
                    <Eye size={18} /> View Public Profile
                </Button>
            </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Sidebar (Sticky) */}
            <div className="lg:col-span-4 space-y-6">
                <GlassCard className="p-8 text-center sticky top-24">
                    {/* Avatar Upload */}
                    <div className="relative inline-block mb-6 group">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 dark:border-white/10 mx-auto shadow-2xl bg-slate-200 dark:bg-slate-800 relative">
                            {isUploadingAvatar ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                    <Loader2 className="animate-spin text-white" size={32} />
                                </div>
                            ) : null}
                            <img 
                                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                                alt="Avatar" 
                                className="w-full h-full object-cover transition-opacity group-hover:opacity-75" 
                            />
                            <div 
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/30 z-10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="text-white" size={32} />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{formData.name || 'Your Name'}</h2>
                    <p className="text-gray-500 mb-6">{user?.email}</p>

                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                            <span className="text-sm font-medium pl-2">Available for work</span>
                            <Switch 
                                checked={!!formData.available} 
                                onChange={handleSwitchChange} 
                            />
                        </div>
                    </div>

                    {/* Preview Skills Logic */}
                    {!isClientOnly && formData.skills && formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {formData.skills.slice(0, 5).map(skill => (
                                <React.Fragment key={skill}>
                                    <Badge color="gray">{skill}</Badge>
                                </React.Fragment>
                            ))}
                            {formData.skills.length > 5 && (
                                <Badge color="gray">+{formData.skills.length - 5}</Badge>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-left">
                        <TabButtonMobile active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<Layout size={18} />} label="Details" />
                        {!isClientOnly && <TabButtonMobile active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} icon={<Briefcase size={18} />} label="Portfolio" />}
                        <TabButtonMobile active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<AlertTriangle size={18} />} label="Settings" />
                    </div>
                </GlassCard>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-8">
                {/* Desktop Tabs */}
                <div className="hidden lg:flex gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-1">
                    <TabButton id="details" label="Profile Details" icon={<Layout size={18} />} />
                    {!isClientOnly && <TabButton id="portfolio" label="Portfolio" icon={<Briefcase size={18} />} />}
                    <TabButton id="settings" label="Account Settings" icon={<AlertTriangle size={18} />} />
                </div>

                <AnimatePresence mode="wait">
                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <GlassCard>
                                <form onSubmit={handleSave} className="space-y-8">
                                    {/* Section 1: Basic Info */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Star size={20} className="text-primary" /> Basic Information
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Input label="Display Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" />
                                            <Input label="Professional Headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior Full Stack Dev" />
                                            <Input label="Location" name="location" value={formData.location} onChange={handleChange} icon={<MapPin size={18}/>} />
                                            <Input label="Company" name="company" value={formData.company} onChange={handleChange} icon={<Briefcase size={18}/>} />
                                        </div>
                                    </div>

                                    {/* Section 2: Role & Bio */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Role & Bio</h3>
                                        <div className="grid md:grid-cols-2 gap-6 mb-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-wide">Primary Role</label>
                                                <select 
                                                    name="profileRole"
                                                    value={formData.profileRole}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-primary outline-none"
                                                >
                                                    <option value="client">Client (Hiring)</option>
                                                    <option value="freelancer">Freelancer (Working)</option>
                                                    <option value="both">Both</option>
                                                </select>
                                                {formData.profileRole === 'client' && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Setting your role to "Client" will hide your Skills and Portfolio sections.
                                                    </p>
                                                )}
                                            </div>
                                            {!isClientOnly && (
                                                <Input label="Hourly Rate ($)" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={handleChange} icon={<DollarSign size={18}/>} />
                                            )}
                                        </div>
                                        <Input textarea label="Bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell your story..." />
                                    </div>

                                    {/* Section 3: Skills (Badges) - Only for Freelancers/Both */}
                                    {!isClientOnly && (
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Skills</h3>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {formData.skills?.map(skill => (
                                                        <React.Fragment key={skill}>
                                                            <Badge color="blue" className="pl-3 pr-1 py-1 flex items-center gap-2 bg-white dark:bg-white/10">
                                                                {skill}
                                                                <button type="button" onClick={() => removeSkill(skill)} className="p-0.5 hover:bg-red-500 hover:text-white rounded-full transition-colors"><X size={12}/></button>
                                                            </Badge>
                                                        </React.Fragment>
                                                    ))}
                                                    {(!formData.skills || formData.skills.length === 0) && (
                                                        <span className="text-sm text-gray-400 italic">No skills added yet. Type below.</span>
                                                    )}
                                                </div>
                                                <input 
                                                    className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-gray-500"
                                                    placeholder="Type a skill and press Enter..."
                                                    value={skillInput}
                                                    onChange={(e) => setSkillInput(e.target.value)}
                                                    onKeyDown={addSkill}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 4: Socials */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Social Links</h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Input label="Website" name="website" value={formData.website} onChange={handleChange} icon={<Globe size={18}/>} placeholder="https://" />
                                            <Input label="GitHub" name="github" value={formData.github} onChange={handleChange} icon={<Github size={18}/>} placeholder="https://github.com/" />
                                            <Input label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleChange} icon={<Linkedin size={18}/>} placeholder="https://linkedin.com/in/" />
                                            <Input label="Twitter" name="twitter" value={formData.twitter} onChange={handleChange} icon={<Twitter size={18}/>} placeholder="https://twitter.com/" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
                                        <Button type="submit" isLoading={isSaving} className="w-full md:w-auto">
                                            <Save size={18} /> Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* --- PORTFOLIO TAB --- */}
                    {activeTab === 'portfolio' && !isClientOnly && (
                        <motion.div 
                            key="portfolio"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <GlassCard>
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">Portfolio</h2>
                                        <p className="text-sm text-gray-500">Showcase your best work to clients.</p>
                                    </div>
                                    <Button onClick={() => { setEditingItem(null); setIsPortfolioModalOpen(true); }}>
                                        <Plus size={18} /> Add Project
                                    </Button>
                                </div>

                                {portfolioItems.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                                        <Briefcase size={40} className="mx-auto mb-4 text-slate-300 dark:text-gray-600" />
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Your portfolio is empty</h3>
                                        <p className="text-slate-500 mb-6">Add projects to demonstrate your skills and experience.</p>
                                        <Button onClick={() => { setEditingItem(null); setIsPortfolioModalOpen(true); }}>
                                            Add First Project
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {portfolioItems.map(item => {
                                            // Safe check for technologies
                                            const techStack = Array.isArray(item.technologies) ? item.technologies : [];
                                            
                                            return (
                                            <motion.div 
                                                key={item.id}
                                                layoutId={item.id}
                                                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col h-full hover:border-primary/50 transition-colors"
                                            >
                                                <div className="aspect-video relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <ImageIcon size={32} />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => { setSelectedItem(item); setIsViewModalOpen(true); }}
                                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setEditingItem(item); setIsPortfolioModalOpen(true); }}
                                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
                                                            title="Edit Project"
                                                        >
                                                            <Edit3 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className="font-bold text-slate-900 dark:text-white mb-0.5 truncate">{item.title}</h3>
                                                    {item.role && <p className="text-xs text-primary mb-2 font-medium">{item.role}</p>}
                                                    
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {techStack.slice(0,3).map((t, i) => (
                                                            <span key={i} className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-300">{t}</span>
                                                        ))}
                                                        {techStack.length > 3 && (
                                                            <span className="text-[10px] text-slate-400 px-1">+{techStack.length - 3}</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mt-auto flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
                                                        {item.githubUrl && <a href={item.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><Github size={16} /></a>}
                                                        {item.liveUrl && <a href={item.liveUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><ExternalLink size={16} /></a>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )})}
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* --- SETTINGS TAB --- */}
                    {activeTab === 'settings' && (
                        <motion.div 
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <GlassCard>
                                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-6">Account Settings</h2>
                                
                                <div className="space-y-8">
                                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Address</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-500">{user?.email}</p>
                                            <Badge color="green">Verified</Badge>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Password & Security</h3>
                                        <Button variant="outline">Change Password</Button>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20">
                                        <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                                        <p className="text-sm text-red-500/70 dark:text-red-400/70 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                        <Button variant="danger" onClick={() => { if(window.confirm('Are you sure?')) logout(); }}>Delete Account</Button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Add/Edit Portfolio Modal */}
        <PortfolioModal 
            isOpen={isPortfolioModalOpen} 
            onClose={() => setIsPortfolioModalOpen(false)}
            initialData={editingItem}
            userId={user?.id}
        />

        {/* View Details Modal */}
        <PortfolioDetailsModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            item={selectedItem}
        />

      </div>
    </PageWrapper>
  );
};

const TabButtonMobile = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${active ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'}`}
    >
        {icon} {label}
    </button>
);

// --- Subcomponent: Portfolio Modal (Add/Edit) ---
const PortfolioModal = ({ isOpen, onClose, initialData, userId }: any) => {
    const [data, setData] = useState<Partial<PortfolioItem>>({});
    const [techInput, setTechInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    // Reset or Populate form on open
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Ensure technologies is always an array to prevent .map crashes
                const safeTechnologies = Array.isArray(initialData.technologies) 
                    ? initialData.technologies 
                    : []; 
                
                setData({ ...initialData, technologies: safeTechnologies });
            } else {
                setData({ 
                    title: '', subtitle: '', role: '', description: '', 
                    technologies: [], liveUrl: '', githubUrl: '', imageUrl: '' 
                });
            }
        }
    }, [isOpen, initialData]);

    // Handle Image Upload to Supabase Storage
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setUploadingImage(true);
        try {
            const itemId = initialData?.id || firestore.collection('users').doc(userId).collection('portfolio').doc().id;
            
            const fileExt = file.name.split('.').pop();
            // Use Supabase-friendly path
            const fileName = `${userId}_${itemId}_${Date.now()}.${fileExt}`;
            const filePath = `portfolio/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('File')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('File')
                .getPublicUrl(filePath);
            
            setData(prev => ({ ...prev, imageUrl: publicUrl, id: itemId }));
            showToast("Image uploaded successfully", "success");
        } catch (e: any) {
            console.error("Supabase Storage Upload Error:", e);
            showToast("Failed to upload image", "error");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleTechKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && techInput.trim()) {
            e.preventDefault();
            const newTech = techInput.trim();
            // Safe check
            const currentTechs = Array.isArray(data.technologies) ? data.technologies : [];
            
            if (!currentTechs.includes(newTech)) {
                setData(prev => ({
                    ...prev,
                    technologies: [...currentTechs, newTech]
                }));
            }
            setTechInput('');
        }
    };

    const removeTech = (tech: string) => {
        setData(prev => ({
            ...prev,
            technologies: Array.isArray(prev.technologies) ? prev.technologies.filter(t => t !== tech) : []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setLoading(true);

        try {
            const collection = firestore.collection('users').doc(userId).collection('portfolio');
            
            const payload = {
                title: data.title || '',
                subtitle: data.subtitle || '',
                description: data.description || '',
                role: data.role || '',
                technologies: data.technologies || [],
                liveUrl: data.liveUrl || '',
                githubUrl: data.githubUrl || '',
                imageUrl: data.imageUrl || '',
                updatedAt: timestamp()
            };

            if (initialData?.id || data.id) {
                // Update existing (data.id might be set during image upload for new item)
                const docId = initialData?.id || data.id;
                // If it's a new item (no initialData) but has data.id, we use set with merge or just set
                if (docId) {
                   await collection.doc(docId).set({ ...payload, createdAt: initialData?.createdAt || timestamp() }, { merge: true });
                   showToast("Project updated successfully", "success");
                }
            } else {
                // Create new
                await collection.add({
                    ...payload,
                    createdAt: timestamp()
                });
                showToast("Project added successfully", "success");
            }
            onClose();
        } catch (e) {
            console.error(e);
            showToast("Failed to save project", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !userId || !window.confirm("Delete this project? This cannot be undone.")) return;
        setLoading(true);
        try {
            // Delete Firestore Doc
            await firestore.collection('users').doc(userId).collection('portfolio').doc(initialData.id).delete();
            
            // Note: Skipping explicit image deletion to keep things simple and avoid RLS issues for now.
            // In a production app, you'd delete the Supabase file here too.

            showToast("Project deleted", "success");
            onClose();
        } catch(e) {
            showToast("Failed to delete", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Project" : "Add Project"} maxWidth="max-w-3xl">
            <div className="p-6">
                <form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-6">
                    {/* Left Column - Image & Basic */}
                    <div className="md:col-span-5 space-y-4">
                        <div 
                            className="aspect-video bg-slate-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer overflow-hidden relative group"
                            onClick={() => !uploadingImage && fileRef.current?.click()}
                        >
                            {uploadingImage ? (
                                <Loader2 className="animate-spin text-primary" size={32} />
                            ) : data.imageUrl ? (
                                <>
                                    <img src={data.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">Change Cover</div>
                                </>
                            ) : (
                                <div className="text-center text-gray-400 p-4">
                                    <UploadCloud size={32} className="mx-auto mb-2" />
                                    <p className="text-sm">Upload Cover Image</p>
                                </div>
                            )}
                            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </div>
                        
                        <Input label="Role on Project" placeholder="e.g. Lead Developer" value={data.role || ''} onChange={e => setData({...data, role: e.target.value})} />
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-gray-300 ml-1 uppercase tracking-wide">Technologies</label>
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-3">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {Array.isArray(data.technologies) && data.technologies.map(tech => (
                                        <React.Fragment key={tech}>
                                            <Badge color="blue" className="pl-2 pr-1 py-0.5 flex items-center gap-1">
                                                {tech}
                                                <button type="button" onClick={() => removeTech(tech)} className="hover:text-red-500"><X size={12}/></button>
                                            </Badge>
                                        </React.Fragment>
                                    ))}
                                </div>
                                <input 
                                    className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-gray-500"
                                    placeholder="Type tech & Enter..."
                                    value={techInput}
                                    onChange={(e) => setTechInput(e.target.value)}
                                    onKeyDown={handleTechKeyDown}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="md:col-span-7 space-y-4">
                        <Input label="Project Title" placeholder="e.g. E-Commerce Platform" value={data.title || ''} onChange={e => setData({...data, title: e.target.value})} required />
                        <Input label="Subtitle (Optional)" placeholder="e.g. A high-performance web app" value={data.subtitle || ''} onChange={e => setData({...data, subtitle: e.target.value})} />
                        
                        <Input textarea rows={6} label="Description" placeholder="Describe the project, challenges, and outcome..." value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Live URL" icon={<Globe size={16} />} placeholder="https://" value={data.liveUrl || ''} onChange={e => setData({...data, liveUrl: e.target.value})} />
                            <Input label="GitHub URL" icon={<Github size={16} />} placeholder="https://" value={data.githubUrl || ''} onChange={e => setData({...data, githubUrl: e.target.value})} />
                        </div>
                    </div>

                    <div className="md:col-span-12 flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/10">
                        {initialData && (
                            <Button type="button" variant="danger" onClick={handleDelete} disabled={loading} className="px-4">
                                <Trash2 size={18} /> Delete
                            </Button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" isLoading={loading}>Save Project</Button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- Subcomponent: Portfolio Details Modal (Read-Only) ---
const PortfolioDetailsModal = ({ isOpen, onClose, item }: { isOpen: boolean, onClose: () => void, item: PortfolioItem | null }) => {
    if (!item) return null;

    // Safe check for technologies
    const techStack = Array.isArray(item.technologies) ? item.technologies : [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={null} maxWidth="max-w-4xl" hideHeader={true}>
            <div className="relative">
                {/* Close Button Overlay */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Hero Image */}
                <div className="w-full h-64 md:h-80 bg-slate-900 relative">
                     {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-90" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                             <ImageIcon size={64} />
                        </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                     
                     <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {item.role && <Badge color="blue">{item.role}</Badge>}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">{item.title}</h2>
                        {item.subtitle && <p className="text-xl text-gray-300 font-light">{item.subtitle}</p>}
                     </div>
                </div>

                {/* Content */}
                <div className="p-8 bg-white dark:bg-slate-950 grid md:grid-cols-12 gap-8">
                    <div className="md:col-span-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Star className="text-primary" size={20} /> About the Project
                        </h3>
                        <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                            {item.description}
                        </p>
                    </div>

                    <div className="md:col-span-4 space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                                {techStack.map(tech => (
                                    <span key={tech} className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-lg text-sm text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-white/5">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-1">Links</h4>
                            {item.liveUrl ? (
                                <a href={item.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                                    <Globe size={18} /> View Live Site
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-gray-400 cursor-not-allowed">
                                    <Globe size={18} /> Live Site Unavailable
                                </div>
                            )}
                            
                            {item.githubUrl ? (
                                <a href={item.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-medium">
                                    <Github size={18} /> View Source Code
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-gray-400 cursor-not-allowed">
                                    <Github size={18} /> Private Repository
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};