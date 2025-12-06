import React from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard = ({ children, className = '', hoverEffect = true, onClick, ...props }: GlassCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl 
        border border-slate-200 dark:border-white/10 
        rounded-2xl p-6 relative overflow-hidden group 
        shadow-lg dark:shadow-none
        text-slate-900 dark:text-gray-100
        ${className}
      `}
      {...props}
    >
      {/* Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none box-border" />
      
      {/* Top Highlight Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-500 pointer-events-none" />

      {/* Children rendered directly to respect flex container styles on the parent */}
      {children}
    </motion.div>
  );
};

export interface ButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  className?: string;
  loaderSize?: number;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
}

export const Button = ({ children, variant = 'primary', className = '', isLoading, loaderSize = 20, disabled, ...props }: ButtonProps) => {
  const baseClasses = "relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/50 border border-transparent",
    secondary: "bg-slate-100 dark:bg-white text-slate-900 hover:bg-slate-200 dark:hover:bg-gray-100 border border-transparent",
    outline: "border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white bg-transparent",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white",
    danger: "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/50 hover:bg-red-500/20"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
        {children}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin text-current" size={loaderSize} />
        </div>
      )}
    </motion.button>
  );
};

export interface BadgeProps {
  children?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

export const Badge = ({ children, color = 'blue' }: BadgeProps) => {
  const colors = {
    blue: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
    green: 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/30',
    red: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30',
    purple: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
    yellow: 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border-yellow-500/30',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  const words = text.split(" ");

  const container: any = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: any = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

export const PageWrapper = ({ children }: { children?: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export type InputProps = React.ComponentProps<'input'> & {
  label?: string;
  icon?: React.ReactNode;
  textarea?: boolean;
  rows?: number;
};

export const Input = ({ label, icon, className = '', textarea = false, ...props }: InputProps) => {
  const baseInputStyles = `w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600`;

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        {textarea ? (
          <textarea 
            className={baseInputStyles}
            rows={props.rows || 4}
            {...(props as any)}
          />
        ) : (
          <input 
            className={baseInputStyles}
            {...props}
          />
        )}
        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
      </div>
    </div>
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  maxWidth?: string;
  hideHeader?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, className = '', maxWidth = 'max-w-lg', hideHeader = false }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${className}`}
          >
             {/* Header */}
             {!hideHeader && (
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <div className="text-xl font-bold font-display dark:text-white text-slate-900">{title}</div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>
             )}
             
             {/* Body */}
             <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                {children}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};