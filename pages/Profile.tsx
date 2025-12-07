import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, PageWrapper, Input, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { User, Mail, MapPin, Camera, Save, Link as LinkIcon, DollarSign, Briefcase, Star, Layout } from 'lucide-react';
import { firestore } from '../services/firebase';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '', // Read only
    headline: '',
    bio: '',
    location: '',
    avatar: '',
    hourlyRate: '',
    skills: '', // Comma separated string for input
    profileRole: 'both' as 'client' | 'freelancer' | 'both',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : '',
        skills: user.skills ? user.skills.join(', ') : '',
        profileRole: user.profileRole || (user.role === 'admin' ? 'freelancer' : 'client'),
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role: 'client' | 'freelancer' | 'both') => {
    setFormData(prev => ({ ...prev, profileRole: role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const rateNumber = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;

    const updatedData = {
        name: formData.name,
        headline: formData.headline,
        bio: formData.bio,
        location: formData.location,
        avatar: formData.avatar,
        hourlyRate: rateNumber || 0,
        skills: skillsArray,
        profileRole: formData.profileRole
    };

    // Update using AuthContext (which updates Firestore /users/{uid})
    await updateProfile(updatedData);
    setIsSaving(false);
  };

  if (!user) return null;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold font-display mb-2 text-slate-900 dark:text-white">Profile</h1>
        <p className="text-slate-600 dark:text-gray-400 mb-8">Manage your public presence and settings.</p>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* LEFT: Preview Card */}
          <div className="md:col-span-4 lg:col-span-4">
            <GlassCard className="sticky top-24 text-center p-8">
               <div className="relative inline-block mb-6">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-white/10 mx-auto shadow-xl bg-slate-200 dark:bg-slate-800">
                    <img 
                      src={formData.avatar || user.avatar} 
                      alt={formData.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` }}
                    />
                 </div>
                 <div className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900">
                    <Star size={14} fill="currentColor" />
                 </div>
               </div>

               <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{formData.name || 'Your Name'}</h2>
               <p className="text-primary font-medium text-sm mb-4">{formData.headline || 'Add a headline'}</p>

               <div className="flex justify-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      formData.profileRole === 'freelancer' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                      formData.profileRole === 'client' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                      {formData.profileRole === 'both' ? 'Client & Freelancer' : formData.profileRole}
                  </span>
               </div>

               {formData.hourlyRate && (
                   <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <DollarSign size={16} className="text-green-500" />
                      <span className="font-mono font-bold text-slate-700 dark:text-gray-200">${formData.hourlyRate}/hr</span>
                   </div>
               )}

               <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {formData.skills.split(',').filter(s => s.trim()).length > 0 ? (
                      formData.skills.split(',').slice(0, 5).map((skill, i) => (
                          <span key={i} className="text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 px-2 py-1 rounded border border-slate-200 dark:border-white/5">
                              {skill.trim()}
                          </span>
                      ))
                  ) : (
                      <span className="text-xs text-slate-400 italic">No skills listed</span>
                  )}
               </div>

               <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400 justify-center mb-2">
                     <Mail size={14} /> {user.email}
                  </div>
                  {formData.location && (
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400 justify-center">
                        <MapPin size={14} /> {formData.location}
                    </div>
                  )}
               </div>
            </GlassCard>
          </div>

          {/* RIGHT: Edit Form */}
          <div className="md:col-span-8 lg:col-span-8">
            <GlassCard>
               <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                  <Layout size={20} className="text-primary" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Profile</h3>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                     <Input 
                        label="Display Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                     />
                     <Input 
                        label="Professional Headline"
                        name="headline"
                        value={formData.headline}
                        onChange={handleChange}
                        placeholder="e.g. Senior React Developer"
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-2 ml-1">I am a...</label>
                     <div className="grid grid-cols-3 gap-4">
                        {(['client', 'freelancer', 'both'] as const).map((role) => (
                            <div 
                                key={role}
                                onClick={() => handleRoleSelect(role)}
                                className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                                    formData.profileRole === role 
                                    ? 'bg-primary/10 border-primary text-primary font-bold' 
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="capitalize">{role}</span>
                            </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <Input 
                        label="Hourly Rate ($/hr)"
                        name="hourlyRate"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        icon={<DollarSign size={16} />}
                     />
                     <Input 
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. New York, USA"
                        icon={<MapPin size={16} />}
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Skills (comma separated)</label>
                     <Input 
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="React, TypeScript, Node.js, UI/UX..."
                        icon={<Star size={16} />}
                     />
                  </div>

                  <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Avatar URL</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                            <Input 
                                name="avatar"
                                value={formData.avatar}
                                onChange={handleChange}
                                placeholder="https://..."
                                icon={<LinkIcon size={16} />}
                            />
                        </div>
                        {/* Optional: Add Upload button here later if backend storage implemented for avatars */}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">Paste a direct image link. We support any public URL.</p>
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Bio</label>
                     <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 resize-none"
                        placeholder="Tell us about your experience and what you're looking for..."
                     />
                  </div>

                  <div className="pt-4 flex justify-end">
                     <Button type="submit" isLoading={isSaving} className="w-full md:w-auto">
                        <Save size={18} /> Save Changes
                     </Button>
                  </div>
               </form>
            </GlassCard>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
};