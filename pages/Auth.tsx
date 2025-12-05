import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, AnimatedText, PageWrapper, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Briefcase, ArrowRight, Building2 } from 'lucide-react';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'admin' | 'client'>('client');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let success = false;
    
    if (isLogin) {
      success = await login(formData.email, role, formData.password);
    } else {
      success = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        company: formData.company
      });
    }

    if (success) {
      navigate('/dashboard');
    }
    
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    const success = await loginWithGoogle(role);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
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
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 w-1/2 ${role === 'client' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
              >
                <User className={`mb-2 ${role === 'client' ? 'text-primary' : 'text-gray-400'}`} />
                <h3 className="font-bold text-sm">Client Portal</h3>
                <p className="text-xs text-gray-400 mt-1">View projects & invoices</p>
              </div>
              <div 
                onClick={() => setRole('admin')}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 w-1/2 ${role === 'admin' ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
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
                <h2 className="text-2xl font-bold mb-2 dark:text-white text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
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

              <div className="mb-6">
                <Button 
                   type="button" 
                   variant="secondary" 
                   className="w-full bg-white dark:bg-white/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                   onClick={handleGoogleSignIn}
                >
                  <GoogleIcon /> Sign in with Google
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or continue with</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <Input 
                        icon={<User size={20} />}
                        placeholder="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                      />
                      <Input 
                        icon={<Building2 size={20} />}
                        placeholder="Company Name (Optional)"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Input 
                  icon={<Mail size={20} />}
                  type="email"
                  placeholder="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <Input 
                  icon={<Lock size={20} />}
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <Button className="w-full mt-6" type="submit" isLoading={isSubmitting}>
                  {isLogin ? 'Log In' : 'Create Account'} <ArrowRight size={18} />
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setFormData({name: '', email: '', password: '', company: ''}); }}
                    className="text-primary hover:text-white font-medium transition-colors underline decoration-transparent hover:decoration-primary"
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