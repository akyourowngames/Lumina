import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Zap, Globe, Shield, CheckCircle } from 'lucide-react';
import { Button, GlassCard, AnimatedText } from '../components/UI';

export const Home = () => {
  const services = [
    {
      icon: <Globe className="w-8 h-8 text-blue-500 dark:text-blue-400" />,
      title: "Web Development",
      description: "Scalable, SEO-optimized web apps built with Next.js and React."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />,
      title: "MVP Launch",
      description: "From idea to market-ready product in 4 weeks or less."
    },
    {
      icon: <Code className="w-8 h-8 text-purple-500 dark:text-purple-400" />,
      title: "Backend Systems",
      description: "Robust APIs, database design, and cloud infrastructure."
    }
  ];

  return (
    <div className="px-6 overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto min-h-[80vh] flex flex-col justify-center items-center text-center pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-purple-600 dark:text-purple-300 mb-6 inline-block">
            Available for new projects →
          </span>
        </motion.div>

        <AnimatedText 
          text="Crafting Digital Experiences That Scale." 
          className="text-5xl md:text-7xl font-display font-bold mb-8 text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight justify-center drop-shadow-sm"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Full-stack developer specializing in modern web technologies. I help startups and businesses ship faster with cleaner code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button>View Portfolio</Button>
          <Button variant="outline">Schedule a Call</Button>
        </motion.div>

        {/* Tech Stack Strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 pt-10 border-t border-slate-200 dark:border-white/5 w-full"
        >
          <p className="text-sm text-slate-500 dark:text-gray-500 mb-6 font-medium tracking-widest uppercase">Trusted by innovative teams</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 text-slate-900 dark:text-white">
             {/* Simple text placeholders for logos */}
             <span className="text-xl font-display font-bold">Acme Corp</span>
             <span className="text-xl font-display font-bold">Stark Ind</span>
             <span className="text-xl font-display font-bold">Wayne Ent</span>
             <span className="text-xl font-display font-bold">Cyberdyne</span>
          </div>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-slate-900 dark:text-white">Services</h2>
          <p className="text-slate-600 dark:text-gray-400">Comprehensive solutions for your digital needs.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full flex flex-col items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-white/5">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{service.title}</h3>
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">{service.description}</p>
                <a href="#" className="mt-auto flex items-center gap-2 text-primary text-sm font-medium hover:gap-3 transition-all">
                  Learn more <ArrowRight size={16} />
                </a>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust/Process Section */}
      <section className="max-w-7xl mx-auto py-24 border-t border-slate-200 dark:border-white/10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
             <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-slate-900 dark:text-white">Built for speed and security.</h2>
             <div className="space-y-6">
                {[
                  "Secure payments via Razorpay & Stripe",
                  "Transparent project tracking via Kanban",
                  "Automated weekly progress reports",
                  "Full IP ownership transfer upon completion"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <CheckCircle className="text-green-500 dark:text-green-400 shrink-0" />
                    <span className="text-lg text-slate-600 dark:text-gray-300">{item}</span>
                  </div>
                ))}
             </div>
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur-3xl opacity-20" />
             <GlassCard className="relative z-10 border-l-4 border-l-primary">
                <div className="space-y-4">
                   <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/10">
                      <span className="text-sm text-slate-500 dark:text-gray-400">Current Status</span>
                      <span className="text-green-500 dark:text-green-400 text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"/> On Track
                      </span>
                   </div>
                   <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary" 
                      />
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-900 dark:text-white font-bold">Project Alpha</span>
                      <span className="text-slate-500 dark:text-gray-400">75% Complete</span>
                   </div>
                </div>
             </GlassCard>
          </motion.div>
        </div>
      </section>
    </div>
  );
};