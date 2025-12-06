import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, PageWrapper, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Building2, MapPin, Phone, Camera, Save, Link as LinkIcon } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    bio: '',
    phone: '',
    location: '',
    avatar: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
  };

  if (!user) return null;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold font-display mb-2 text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-slate-600 dark:text-gray-400 mb-8">Manage your account information and preferences.</p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar - Avatar & Role */}
          <div className="md:col-span-1">
            <GlassCard className="text-center sticky top-24">
              <div className="relative inline-block mb-4 group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 dark:border-white/10 mx-auto bg-slate-100 dark:bg-slate-800">
                  <img src={formData.avatar || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                {/* Clicking camera focuses the avatar input */}
                <button 
                  type="button"
                  onClick={() => document.getElementById('avatar-input')?.focus()}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/80 transition-colors shadow-lg cursor-pointer"
                >
                  <Camera size={16} className="text-white" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium text-xs mb-6">{user.role}</p>
              
              <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-gray-400 text-left px-2">
                 <div className="flex items-center gap-2">
                    <Mail size={14} /> {user.email}
                 </div>
                 {user.location && (
                   <div className="flex items-center gap-2">
                      <MapPin size={14} /> {user.location}
                   </div>
                 )}
              </div>
            </GlassCard>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2">
            <GlassCard>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white">Personal Details</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                      label="Full Name"
                      icon={<UserIcon size={18} />}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                   />
                   <Input 
                      label="Email Address"
                      icon={<Mail size={18} />}
                      name="email"
                      value={formData.email}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                   />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                      label="Company"
                      icon={<Building2 size={18} />}
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                   />
                   <Input 
                      label="Phone Number"
                      icon={<Phone size={18} />}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                   />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                      label="Location"
                      icon={<MapPin size={18} />}
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                   />
                   <Input 
                      id="avatar-input"
                      label="Avatar URL"
                      icon={<LinkIcon size={18} />}
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://..."
                   />
                </div>

                <div>
                   <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">Bio</label>
                   <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 resize-none"
                      placeholder="Tell us a little about yourself..."
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