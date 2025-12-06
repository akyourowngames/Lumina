import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Button, Badge, Modal } from '../components/UI';
import { FileText, CheckCircle, Download, CreditCard, ChevronRight, X } from 'lucide-react';

const mockProposals = [
  { id: 1, title: 'E-Commerce Platform Redesign', client: 'Acme Corp', amount: '$12,500', status: 'Pending', date: 'Oct 24, 2024' },
  { id: 2, title: 'Mobile App Development', client: 'Stark Industries', amount: '$45,000', status: 'Signed', date: 'Oct 15, 2024' },
  { id: 3, title: 'SEO Audit & Optimization', client: 'Wayne Ent', amount: '$2,500', status: 'Rejected', date: 'Sep 30, 2024' },
];

export const Proposals = () => {
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Proposals</h1>
        <Button variant="outline" className="hidden sm:flex">+ Create New</Button>
      </div>

      <div className="grid gap-4">
        {mockProposals.map((proposal, i) => (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedProposal(proposal.id)}
            className="cursor-pointer"
          >
            <GlassCard className="p-6 flex items-center justify-between group hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                    proposal.status === 'Signed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                    proposal.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-slate-900 dark:text-white">{proposal.title}</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">for {proposal.client} • Created on {proposal.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">{proposal.amount}</span>
                <Badge color={proposal.status === 'Signed' ? 'green' : proposal.status === 'Pending' ? 'blue' : 'red'}>
                    {proposal.status}
                </Badge>
                <ChevronRight className="text-slate-400 dark:text-gray-500 group-hover:text-primary transition-colors" />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Modal View for Proposal Details */}
      <Modal
        isOpen={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
        title={selectedProposal ? `Proposal #${selectedProposal}` : ''}
        maxWidth="max-w-4xl"
      >
          {selectedProposal && (
            <>
              {/* Body */}
              <div className="p-8 bg-white dark:bg-slate-950">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Project Overview</h3>
                  <p className="text-slate-600 dark:text-gray-300 mb-8">
                    We are pleased to submit this proposal for the redesign of your core e-commerce platform. 
                    Our goal is to improve conversion rates by 25% through improved UX and faster load times via Next.js.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                     <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <h4 className="font-bold mb-2 text-primary">Deliverables</h4>
                        <ul className="list-disc list-inside text-slate-600 dark:text-gray-400 space-y-1">
                           <li>High-fidelity Figma designs</li>
                           <li>Next.js Frontend Architecture</li>
                           <li>Stripe Payment Integration</li>
                           <li>Admin Dashboard</li>
                        </ul>
                     </div>
                     <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                        <h4 className="font-bold mb-2 text-primary">Timeline</h4>
                        <ul className="list-disc list-inside text-slate-600 dark:text-gray-400 space-y-1">
                           <li>Week 1-2: Design & Discovery</li>
                           <li>Week 3-6: Development</li>
                           <li>Week 7: QA & Testing</li>
                           <li>Week 8: Launch</li>
                        </ul>
                     </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Investment</h3>
                  <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden mb-8">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-white/5">
                           <tr>
                              <th className="p-4 font-semibold text-slate-900 dark:text-white">Item</th>
                              <th className="p-4 font-semibold text-right text-slate-900 dark:text-white">Cost</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                           <tr>
                              <td className="p-4 text-slate-600 dark:text-gray-300">UX/UI Design</td>
                              <td className="p-4 text-right font-mono text-slate-900 dark:text-white">$3,500</td>
                           </tr>
                           <tr>
                              <td className="p-4 text-slate-600 dark:text-gray-300">Frontend Development</td>
                              <td className="p-4 text-right font-mono text-slate-900 dark:text-white">$7,000</td>
                           </tr>
                           <tr>
                              <td className="p-4 text-slate-600 dark:text-gray-300">Backend Integration</td>
                              <td className="p-4 text-right font-mono text-slate-900 dark:text-white">$2,000</td>
                           </tr>
                           <tr className="bg-primary/5">
                              <td className="p-4 font-bold text-slate-900 dark:text-white">Total</td>
                              <td className="p-4 text-right font-bold text-xl text-primary font-mono">$12,500</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-between items-center sticky bottom-0 z-10">
                 <Button variant="outline" className="text-sm">
                    <Download size={16} /> Download PDF
                 </Button>
                 <div className="flex gap-4">
                    <Button variant="secondary">Request Changes</Button>
                    <Button>
                       <CreditCard size={16} /> Accept & Pay Deposit
                    </Button>
                 </div>
              </div>
            </>
          )}
      </Modal>
    </div>
  );
};