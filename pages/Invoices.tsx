import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper } from '../components/UI';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Invoice } from '../types';

const mockInvoices: Invoice[] = [
  { 
    id: '1', invoiceNumber: 'INV-001', client: 'Acme Corp', amount: '$4,500', 
    status: 'Paid', date: 'Oct 01, 2024', dueDate: 'Oct 15, 2024',
    items: [{ description: 'Web Design', amount: '$4,500' }]
  },
  { 
    id: '2', invoiceNumber: 'INV-002', client: 'Stark Ind', amount: '$12,000', 
    status: 'Pending', date: 'Oct 20, 2024', dueDate: 'Nov 03, 2024',
    items: [{ description: 'Dev Milestone 1', amount: '$12,000' }]
  },
  { 
    id: '3', invoiceNumber: 'INV-003', client: 'Wayne Ent', amount: '$2,800', 
    status: 'Overdue', date: 'Sep 15, 2024', dueDate: 'Sep 30, 2024',
    items: [{ description: 'SEO Audit', amount: '$2,800' }]
  },
];

export const Invoices = () => {
  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Invoices</h1>
            <p className="text-slate-600 dark:text-gray-400">Manage payments and billing history.</p>
          </div>
          <Button>+ Create Invoice</Button>
        </div>

        <div className="grid gap-4">
          {mockInvoices.map((invoice, i) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-6 w-full md:w-auto">
                   <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-white transition-colors">
                      <FileText size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{invoice.invoiceNumber}</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm">{invoice.client} • Issued {invoice.date}</p>
                   </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right">
                      <p className="font-mono font-bold text-xl text-slate-900 dark:text-white">{invoice.amount}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-500">Due {invoice.dueDate}</p>
                   </div>
                   
                   <Badge color={
                      invoice.status === 'Paid' ? 'green' : 
                      invoice.status === 'Pending' ? 'yellow' : 'red'
                   }>
                      <span className="flex items-center gap-1">
                        {invoice.status === 'Paid' && <CheckCircle size={12} />}
                        {invoice.status === 'Pending' && <Clock size={12} />}
                        {invoice.status === 'Overdue' && <AlertCircle size={12} />}
                        {invoice.status}
                      </span>
                   </Badge>

                   <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 dark:text-gray-400 hover:text-primary dark:hover:text-white">
                      <Download size={20} />
                   </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};