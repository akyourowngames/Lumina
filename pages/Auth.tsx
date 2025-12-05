import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, AnimatedText, PageWrapper } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Briefcase, ArrowRight } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'admin' | 'client'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    navigate('/dashboard');
  };

  return (
    <PageWrapper>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Info */}
          <div className="hidden md:block space-y-6">
            <AnimatedText 
              text={isLogin ? "Welcome Back to Lumina." : "Join the Future of Work."} 
              className="text-4xl font-display font-bold leading-tight"
            />
            <p className="text-gray-400 text-lg">
              Manage projects, track payments, and sign proposals in one unified workspace.
              {role === 'admin' ? " Built for high-performance freelancers." : " Experience a transparent client portal."}
            </p>
            
            <div className="flex gap-4 mt-8">
              <div 
                onClick={() => setRole('client')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${role === 'client' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
              >
                <User className={`mb-2 ${role === 'client' ? 'text-primary' : 'text-gray-400'}`} />
                <h3 className="font-bold text-sm">Client Portal</h3>
                <p className="text-xs text-gray-400 mt-1">View projects & invoices</p>
              </div>
              <div 
                onClick={() => setRole('admin')}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${role === 'admin' ? 'bg-secondary/20 border-secondary' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
              >
                <Briefcase className={`mb-2 ${role === 'admin' ? 'text-secondary' : 'text-gray-400'}`} />
                <h3 className="font-bold text-sm">Freelancer</h3>
                <p className="text-xs text-gray-400 mt-1">Manage business</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <GlassCard className="w-full">
              <div className="text-center mb-8 md:hidden">
                <h2 className="text-2xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <div className="flex justify-center gap-4 mt-4">
                  <button 
                    onClick={() => setRole('client')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${role === 'client' ? 'bg-primary/20 text-primary' : 'text-gray-400'}`}
                  >
                    Client
                  </button>
                  <button 
                    onClick={() => setRole('admin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${role === 'admin' ? 'bg-secondary/20 text-secondary' : 'text-gray-400'}`}
                  >
                    Freelancer
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>

                <Button className="w-full mt-6" type="submit">
                  {isLogin ? 'Log In' : 'Create Account'} <ArrowRight size={18} />
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary hover:text-white font-medium transition-colors"
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};