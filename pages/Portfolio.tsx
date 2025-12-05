import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper } from '../components/UI';
import { ExternalLink, Github } from 'lucide-react';

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
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Selected Works</h1>
          <p className="text-gray-400 text-lg">
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
              <GlassCard 
                className="group p-0 h-full flex flex-col cursor-pointer" 
                hoverEffect={true}
              >
                <div className="relative h-64 overflow-hidden rounded-t-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60" />
                  <motion.img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <Badge color="blue">{project.category}</Badge>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow relative z-20 -mt-12">
                  <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex-grow shadow-xl transition-colors group-hover:border-primary/30">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold font-display group-hover:text-primary transition-colors">{project.title}</h3>
                        <div className="flex gap-2">
                            <a href="#" className="p-2 hover:bg-white/10 rounded-full transition-colors"><Github size={18} /></a>
                            <a href="#" className="p-2 hover:bg-white/10 rounded-full transition-colors"><ExternalLink size={18} /></a>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-6 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {project.tags.map(tag => (
                            <span key={tag} className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                              {tag}
                            </span>
                        ))}
                      </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <GlassCard className="inline-block px-10 py-10">
              <h3 className="text-2xl font-bold mb-4">Have a project in mind?</h3>
              <p className="text-gray-400 mb-6">I'm currently available for Q4 2024.</p>
              <Button className="mx-auto">Start a Conversation</Button>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
};