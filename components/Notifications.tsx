import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, MessageSquare, Briefcase, FileText, 
  Settings, AlertCircle, CheckCircle2, ChevronRight, X, Volume2, VolumeX
} from 'lucide-react';
import { AppNotification } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from './UI';

// --- Helper: Time Formatting ---
const formatTimeAgo = (date: any) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return d.toLocaleDateString();
};

// --- Helper: Icon & Color Mapping ---
const getNotificationStyle = (type: AppNotification['type']) => {
  switch (type) {
    case 'message':
      return { icon: <MessageSquare size={16} />, color: 'bg-blue-500/10 text-blue-500' };
    case 'project':
    case 'application':
      return { icon: <Briefcase size={16} />, color: 'bg-purple-500/10 text-purple-500' };
    case 'invoice':
      return { icon: <FileText size={16} />, color: 'bg-green-500/10 text-green-500' };
    case 'alert':
      return { icon: <AlertCircle size={16} />, color: 'bg-red-500/10 text-red-500' };
    case 'success':
      return { icon: <CheckCircle2 size={16} />, color: 'bg-teal-500/10 text-teal-500' };
    default:
      return { icon: <Settings size={16} />, color: 'bg-slate-500/10 text-slate-500' };
  }
};

interface NotificationItemProps {
  notification: AppNotification;
  onClose?: () => void;
  fullWidth?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose, fullWidth }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const style = getNotificationStyle(notification.type);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling if nested
    markAsRead(notification.id);
    if (onClose) onClose();

    // Priority: Explicit Link -> Type Based Routing
    if (notification.link) {
        navigate(notification.link);
        return;
    }
    
    if (notification.type === 'message') {
      navigate('/messages'); 
    } else if (notification.type === 'project' || notification.type === 'application') {
      navigate('/projects');
    } else if (notification.type === 'invoice') {
      navigate('/invoices');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNotification(notification.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
      className={`
        relative p-3 sm:p-4 rounded-xl cursor-pointer group transition-all duration-200
        ${notification.isRead 
          ? 'bg-transparent opacity-70 hover:opacity-100' 
          : 'bg-white dark:bg-white/5 shadow-sm border border-slate-200 dark:border-white/10'
        }
        ${fullWidth ? 'mb-2' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex gap-3 sm:gap-4 items-start">
        {/* Avatar or Icon */}
        <div className="shrink-0 relative">
            {notification.sender?.avatar ? (
                <img 
                    src={notification.sender.avatar} 
                    alt={notification.sender.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
                />
            ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.color}`}>
                    {style.icon}
                </div>
            )}
            
            {/* Type Badge on Avatar */}
            {notification.sender?.avatar && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${style.color} bg-white dark:bg-slate-900`}>
                    {style.icon}
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`text-sm font-semibold truncate ${notification.isRead ? 'text-slate-600 dark:text-gray-400' : 'text-slate-900 dark:text-white'}`}>
              {notification.title}
            </h4>
            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 ml-2">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
          <p className={`text-xs leading-relaxed line-clamp-2 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-slate-600 dark:text-gray-300'}`}>
            {notification.body}
          </p>
        </div>

        {/* Unread Indicator & Delete (Hover) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {!notification.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
            )}
            <button 
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 text-gray-400 hover:text-red-500 transition-all"
                title="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
      </div>
    </motion.div>
  );
};

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead, isLoading, isSoundEnabled, toggleSound } = useNotifications();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, transformOrigin: "top right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 top-full mt-4 w-[380px] max-w-[90vw] bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[600px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Inbox</h3>
                {unreadCount > 0 && <Badge color="blue">{unreadCount} New</Badge>}
              </div>
              <div className="flex gap-2 items-center">
                <button 
                    onClick={toggleSound}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                    {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
              {isLoading ? (
                <div className="p-10 flex flex-col items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs text-gray-500">Loading updates...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Bell size={24} />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-medium">All caught up!</h4>
                  <p className="text-gray-500 text-xs max-w-[200px]">
                    You don't have any notifications at the moment.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 8).map(item => (
                  <NotificationItem 
                    key={item.id} 
                    notification={item} 
                    onClose={onClose}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-center">
              <button 
                onClick={() => {
                  navigate('/notifications');
                  onClose();
                }}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 w-full py-2 uppercase tracking-wide"
              >
                View Full History <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};