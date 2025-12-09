import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import { MessageSquare, Briefcase, FileText, AlertCircle, CheckCircle2, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getIcon = (type: string) => {
    switch (type) {
        case 'message': return <MessageSquare size={20} className="text-blue-500" />;
        case 'project': return <Briefcase size={20} className="text-purple-500" />;
        case 'application': return <Briefcase size={20} className="text-purple-500" />;
        case 'invoice': return <FileText size={20} className="text-green-500" />;
        case 'success': return <CheckCircle2 size={20} className="text-teal-500" />;
        case 'alert': return <AlertCircle size={20} className="text-red-500" />;
        default: return <Settings size={20} className="text-slate-500" />;
    }
};

export const NotificationToaster = () => {
  const { latestNotification, clearLatestNotification, markAsRead } = useNotifications();
  const navigate = useNavigate();

  // Auto dismiss
  useEffect(() => {
    if (latestNotification) {
      const timer = setTimeout(() => {
        clearLatestNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatestNotification]);

  const handleClick = () => {
      if (!latestNotification) return;
      markAsRead(latestNotification.id);
      
      if (latestNotification.link) {
          navigate(latestNotification.link);
      }
      clearLatestNotification();
  };

  return (
    <div className="fixed top-24 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            key={latestNotification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="pointer-events-auto w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors relative group"
            onClick={handleClick}
          >
             <button 
                onClick={(e) => { e.stopPropagation(); clearLatestNotification(); }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
             >
                 <X size={14} />
             </button>

             <div className="flex gap-4">
                 <div className="shrink-0 relative">
                     {latestNotification.sender?.avatar ? (
                         <img src={latestNotification.sender.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                     ) : (
                         <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                             {getIcon(latestNotification.type)}
                         </div>
                     )}
                     
                     {latestNotification.sender?.avatar && (
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-white/10">
                             {/* Small icon overlay */}
                             {React.cloneElement(getIcon(latestNotification.type) as React.ReactElement<any>, { size: 10 })}
                         </div>
                     )}
                 </div>

                 <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-4">
                         {latestNotification.title}
                     </h4>
                     <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                         {latestNotification.body}
                     </p>
                     <span className="text-[10px] text-gray-400 mt-2 block font-medium">Just now</span>
                 </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};