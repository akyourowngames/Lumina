import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, PageWrapper } from '../components/UI';
import { FileText, Download, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useToast } from '../context/ToastContext';

export const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      try {
        const ref = collection(firestore, "users", user.id, "invoices");
        // Removed orderBy to prevent filtering
        const q = query(ref); 
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                invoiceNumber: d.invoiceNumber || d.invoicenumber || `INV-${doc.id.substring(0,4)}`,
                client: d.client || d.name || 'Unknown',
                amount: d.amount || '$0.00',
                status: d.status || 'Pending',
                date: d.date || d.createdat || d.createdAt || new Date().toISOString().split('T')[0],
                dueDate: d.dueDate || d.duedate || '',
                items: d.items || []
            } as Invoice;
        });
        
        // Sort in JS
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">Invoices</h1>
            <p className="text-slate-600 dark:text-gray-400">Manage payments and billing history.</p>
          </div>
          {/* Note: Create Invoice functionality would go here similar to Projects page */}
          <Button disabled={true} title="Feature coming soon">+ Create Invoice</Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
             </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <FileText size={48} className="mx-auto mb-4 text-slate-400 dark:text-gray-400" />
              <p className="text-xl text-slate-600 dark:text-gray-400">No invoices found.</p>
            </div>
          ) : (
            invoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                     <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-white transition-colors shrink-0">
                        <FileText size={24} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{invoice.invoiceNumber}</h3>
                        <p className="text-slate-500 dark:text-gray-400 text-sm truncate">{invoice.client} • Issued {invoice.date}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                     <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-xl text-slate-900 dark:text-white">{invoice.amount}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-500">Due {invoice.dueDate}</p>
                     </div>
                     
                     <div className="shrink-0">
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
                     </div>

                     <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 dark:text-gray-400 hover:text-primary dark:hover:text-white shrink-0">
                        <Download size={20} />
                     </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
};