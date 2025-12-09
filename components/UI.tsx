import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { motion, HTMLMotionProps, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Loader2, X, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';

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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={hoverEffect ? { 
        y: -2, 
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" 
      } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl 
        border border-slate-200 dark:border-white/5 
        rounded-2xl p-6 relative overflow-hidden group 
        shadow-sm dark:shadow-none
        text-slate-900 dark:text-gray-100
        ${className}
      `}
      {...props}
    >
      {/* Dynamic Gradient Spotlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Shimmer Effect Border */}
      <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
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

export const Button = ({ children, variant = 'primary', className = '', isLoading, loaderSize = 18, disabled, ...props }: ButtonProps) => {
  const baseClasses = "relative h-11 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden select-none active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 border border-transparent disabled:shadow-none",
    secondary: "bg-slate-100 dark:bg-white text-slate-900 hover:bg-slate-200 dark:hover:bg-gray-100 border border-transparent",
    outline: "border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white bg-transparent",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30"
  };

  return (
    <motion.button
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Shine Effect for Primary Buttons */}
      {variant === 'primary' && !disabled && !isLoading && (
        <motion.div
          className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
          initial={{ left: "-100%" }}
          whileHover={{ left: "200%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      )}

      <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity relative z-10`}>
        {children}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Loader2 className="animate-spin text-current" size={loaderSize} />
        </div>
      )}
    </motion.button>
  );
};

export interface BadgeProps {
  children?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gray';
  className?: string;
}

export const Badge = ({ children, color = 'blue', className = '' }: BadgeProps) => {
  const colors = {
    blue: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    green: 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-500/20',
    red: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/20',
    purple: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
    yellow: 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/20',
    gray: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]} ${className}`}>
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
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  };

  const child: any = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(5px)",
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
    initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -15, filter: "blur(5px)" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="w-full"
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
  const baseInputStyles = `w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 ${icon ? 'pl-11' : 'pl-4'} pr-4 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-white/20 text-sm font-medium`;

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-wide">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors duration-300">
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
      </div>
    </div>
  );
};

export const ProgressBar = ({ progress, className = "" }: { progress: number, className?: string }) => {
  return (
    <div className={`h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <motion.div 
        className="h-full bg-gradient-to-r from-primary to-secondary relative"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)', backgroundSize: '200% 100%' }} />
      </motion.div>
    </div>
  );
};

export const Switch = ({ checked, onChange, label }: { checked: boolean, onChange: (checked: boolean) => void, label?: string }) => {
    return (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange(!checked)}>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <motion.div 
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: checked ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
            {label && <span className="text-sm font-medium text-slate-700 dark:text-gray-300 select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>}
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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

// --- Standardized Empty State Component ---
export const EmptyState = ({ 
    icon = <FolderOpen size={40} />, 
    title = "No items found", 
    description = "There's nothing here yet.",
    action
}: { 
    icon?: React.ReactNode, 
    title?: string, 
    description?: string, 
    action?: React.ReactNode 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5"
        >
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-gray-500">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
                {description}
            </p>
            {action && <div>{action}</div>}
        </motion.div>
    );
};

// --- Animated Counter ---
export const AnimatedCounter = ({ value, prefix = "", suffix = "", className = "" }: { value: string | number, prefix?: string, suffix?: string, className?: string }) => {
    // Try to parse number from string (e.g. "$12,400" -> 12400)
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : value;
    const isNumber = !isNaN(numericValue);

    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    const display = useTransform(spring, (current) => {
        return Math.floor(current).toLocaleString(); 
    });

    useEffect(() => {
        if (isNumber) spring.set(numericValue);
    }, [numericValue, spring, isNumber]);

    if (!isNumber) {
        return (
            <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={className}
            >
                {prefix}{value}{suffix}
            </motion.span>
        );
    }

    return (
        <span className={`inline-flex ${className}`}>
            {prefix}
            <motion.span>{display}</motion.span>
            {suffix}
        </span>
    );
};

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
        if (this.props.fallback) return this.props.fallback;
        
        return (
            <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 text-center flex flex-col items-center justify-center min-h-[300px] m-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 mb-6 max-w-sm">
                    We encountered an unexpected error. Please try refreshing the page.
                </p>
                <Button 
                    variant="outline" 
                    onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                    className="gap-2"
                >
                    <RefreshCw size={16} /> Refresh Page
                </Button>
            </div>
        );
    }

    return this.props.children;
  }
}