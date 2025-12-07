import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper } from '../components/UI';
import { ExternalLink, Github, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const projects = [
  {
    id: 1,
    title: "FinTech Dashboard",
    description: "A real-time financial analytics dashboard handling millions of data points with WebSocket integration.",
    tags: ["React", "D3.js", "Node.js"],
    image: "https://picsum.photos/800/600?random=1",
    category: "Web App"
  },
  {
    id: 2,
    title: "E-Commerce Drift",
    description: "Headless Shopify storefront with 3D product visualization using Three.js.",
    tags: ["Next.js", "Shopify", "Three.js"],
    image: "https://picsum.photos/800/600?random=2",
    category: "E-Commerce"
  },
  {
    id: 3,
    title: "HealthAI Mobile",
    description: "Cross-platform mobile app for tracking patient vitals with on-device ML processing.",
    tags: ["React Native", "TensorFlow", "Firebase"],
    image: "https://picsum.photos/800/600?random=3",
    category: "Mobile"
  },
  {
    id: 4,
    title: "Crypto Exchange",
    description: "High-frequency trading platform with sub-millisecond latency.",
    tags: ["Rust", "WebAssembly", "React"],
    image: "https://picsum.photos/800/600?random=4",
    category: "Web App"
  }
];

export const Portfolio = () => {
  const { user } = useAuth();
  const profileRole = user?.profileRole || (user?.role === 'admin' ? 'freelancer' : 'client');
  const isClientOnly = profileRole === 'client';

  // Access Guard for Client-Only users
  if (user && isClientOnly) {
      return (
          <PageWrapper>
              <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Lock size={32} className="text-slate-400" />
                  </div>
                  <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Portfolio is for freelancers</h1>
                  <p className="text-slate-500 dark:text-gray-400 max-w-md mb-8">
                      Switch your role to "Freelancer" or "Both" in your profile settings to add and manage portfolio items.
                  </p>
                  <Link to="/profile">
                      <Button>
                          <User size={18} /> Go to Profile Settings
                      </Button>
                  </Link>
              </div>
          </PageWrapper>
      );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900 dark:text-white">Selected Works</h1>
          <p className="text-slate-600 dark:text-gray-400 text-lg">
            A collection of projects where design meets engineering. 
            Focusing on performance, accessibility, and user delight.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Custom Card with refined hover effects */}
              <motion.div
                className={`
                  bg-white/80 dark:bg-glass backdrop-blur-xl 
                  border border-slate-200 dark:border-glassBorder 
                  rounded-2xl relative overflow-hidden group 
                  shadow-lg dark:shadow-none
                  p-0 h-full flex flex-col cursor-pointer
                `}
                whileHover="hover"
                initial="initial"
                variants={{
                  initial: { scale: 1, rotate: 0 },
                  hover: { scale: 1.02, rotate: 1 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Background Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                {/* Border Glow on Hover */}
                <div className="absolute inset-0 rounded-2xl border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none box-border" />
                
                {/* Top Highlight Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-500 pointer-events-none" />
                
                <div className="relative h-64 overflow-hidden rounded-t-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60" />
                  <motion.img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                    variants={{
                      initial: { scale: 1 },
                      hover: { scale: 1.1 }
                    }}
                    transition={{ duration: 0.7 }}
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <Badge color="blue">{project.category}</Badge>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow relative z-20 -mt-12">
                  <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 dark:border-white/10 flex-grow shadow-xl transition-colors group-hover:border-primary/30">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white group-hover:text-primary transition-colors">{project.title}</h3>
                        <div className="flex gap-2">
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-700 dark:text-gray-300"><Github size={18} /></a>
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-700 dark:text-gray-300"><ExternalLink size={18} /></a>
                        </div>
                      </div>
                      <motion.p 
                        className="text-slate-600 dark:text-gray-400 mb-6 leading-relaxed"
                        variants={{
                          initial: { opacity: 0.7 },
                          hover: { opacity: 1 }
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {project.description}
                      </motion.p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {project.tags.map(tag => (
                            <span key={tag} className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                              {tag}
                            </span>
                        ))}
                      </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <GlassCard className="inline-block px-10 py-10">
              <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Have a project in mind?</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-6">I'm currently available for Q4 2024.</p>
              <Button className="mx-auto">Start a Conversation</Button>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
};