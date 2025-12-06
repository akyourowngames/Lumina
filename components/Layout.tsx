import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard, FileText, Home, Sparkles, LogIn, LogOut, CreditCard, User, Sun, Moon, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './UI';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, text, isActive }) => (
  <Link to={to} className="relative group">
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive ? 'text-slate-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}>
      {icon}
      <span>{text}</span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-slate-200 dark:bg-white/10 rounded-lg -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </div>
  </Link>
);

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const publicLinks = [
    { to: '/', text: 'Home', icon: <Home size={18} /> },
    { to: '/portfolio', text: 'Portfolio', icon: <Sparkles size={18} /> },
  ];

  const protectedLinks = [
    { to: '/dashboard', text: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/projects', text: user?.role === 'admin' ? 'Proposals' : 'Projects', icon: <Briefcase size={18} /> },
    { to: '/invoices', text: 'Invoices', icon: <CreditCard size={18} /> },
  ];

  const links = user ? [...publicLinks, ...protectedLinks] : publicLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-300">
      {/* Background Blobs - Adjusted opacity for light mode */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/10 dark:bg-secondary/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white text-lg">L</span>
            </div>
            <span className="text-slate-900 dark:text-white">Lumina</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                icon={link.icon} 
                text={link.text} 
                isActive={location.pathname === link.to} 
              />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-white/10">
                 <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors group">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 group-hover:border-primary transition-colors object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-950"></div>
                    </div>
                    <span className="font-medium">{user.name}</span>
                 </Link>
                 <button onClick={handleLogout} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                    <LogOut size={20} />
                 </button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="primary" className="py-2 px-4 text-sm">
                  <LogIn size={16} /> Login
                </Button>
              </Link>
            )}
          </div>

          <button 
            className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 p-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.text}
                </Link>
              ))}
              <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
              
              <button 
                onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 w-full text-left"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              {user ? (
                <>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} /> Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-red-500 dark:text-red-400 w-full text-left"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Login</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-24 min-h-screen">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-slate-200 dark:border-white/10 mt-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              © 2024 Lumina. Built for high-performance freelancers.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};