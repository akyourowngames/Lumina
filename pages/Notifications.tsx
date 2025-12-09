import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, Button, EmptyState } from '../components/UI';
import { NotificationItem } from '../components/Notifications';
import { useNotifications } from '../context/NotificationContext';
import { Check, BellOff, Filter, MessageSquare, Briefcase, Settings, Volume2, VolumeX, Bell } from 'lucide-react';
import { AppNotification } from '../types';

export const Notifications = () => {
  const { notifications, markAllAsRead, isLoading, isSoundEnabled, toggleSound } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'projects'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'messages') return n.type === 'message';
    if (filter === 'projects') return n.type === 'project' || n.type === 'application' || n.type === 'invoice';
    return true;
  });

  // Group by Date for display sections
  const dateGroups = filteredNotifications.reduce<Record<string, AppNotification[]>>((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let key = date.toLocaleDateString();
    
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {});

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Notifications</h1>
            <p className="text-slate-600 dark:text-gray-400">
                You have <span className="text-primary font-bold">{unreadCount}</span> unread updates.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-sm font-medium ${isSoundEnabled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 border-transparent text-gray-500'}`}
            >
                {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {isSoundEnabled ? 'Sound On' : 'Muted'}
            </button>
            <Button variant="secondary" onClick={() => markAllAsRead()} className="text-sm" disabled={unreadCount === 0}>
                <Check size={16} /> Mark All Read
            </Button>
          </div>
        </div>

        {/* Custom Tab Bar */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl mb-8 flex overflow-x-auto no-scrollbar">
            {[
                { id: 'all', label: 'All', icon: <Filter size={14} /> },
                { id: 'unread', label: 'Unread', icon: <Bell size={14} /> },
                { id: 'messages', label: 'Messages', icon: <MessageSquare size={14} /> },
                { id: 'projects', label: 'Projects', icon: <Briefcase size={14} /> },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${filter === tab.id 
                            ? 'bg-primary text-white shadow-md' 
                            : 'text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                        }
                    `}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        <div className="space-y-8 min-h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
               ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-20">
                <EmptyState 
                    icon={<BellOff size={32} />}
                    title="No notifications found"
                    description={filter === 'all' ? "You're all caught up! Check back later." : "No notifications match your current filter."}
                    action={filter !== 'all' ? <Button variant="ghost" onClick={() => setFilter('all')}>Clear Filters</Button> : null}
                />
            </div>
          ) : (
             <AnimatePresence mode='popLayout'>
                 {Object.entries(dateGroups).map(([dateLabel, items]) => (
                    <motion.div 
                        key={dateLabel}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest pl-1">{dateLabel}</h3>
                            <div className="h-px bg-slate-200 dark:bg-white/5 flex-1" />
                        </div>
                        
                        <div className="space-y-3">
                            {(items as AppNotification[]).map(notification => (
                                 <NotificationItem key={notification.id} notification={notification} fullWidth />
                            ))}
                        </div>
                    </motion.div>
                 ))}
             </AnimatePresence>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};