import React, { InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const GlassCard = ({ children, className = '', hoverEffect = true, onClick }: { children: React.ReactNode; className?: string; hoverEffect?: boolean; onClick?: () => void }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverEffect ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-glass backdrop-blur-xl border border-glassBorder rounded-2xl p-6 relative overflow-hidden group ${className}`}
    >
      {/* Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none box-border" />
      
      {/* Top Highlight Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-500" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button = ({ children, variant = 'primary', className = '', isLoading, ...props }: ButtonProps) => {
  const baseClasses = "relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/50 border border-transparent",
    secondary: "bg-white text-dark hover:bg-gray-100 border border-transparent",
    outline: "border border-white/20 hover:bg-white/5 text-white bg-transparent",
    ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white",
    danger: "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
        {children}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="animate-spin text-current" size={20} />
        </div>
      )}
    </motion.button>
  );
};

export const Badge = ({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow' }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const AnimatedText = ({ text, className = '' }: { text: string; className?: string }) => {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
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

export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, icon, className = '', ...props }: InputProps) => {
  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600`}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
      </div>
    </div>
  );
};