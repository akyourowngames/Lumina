import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { Proposals } from './pages/Proposals';
import { Auth } from './pages/Auth';
import { Invoices } from './pages/Invoices';
import { AuthProvider } from './context/AuthContext';

// Component to scroll top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/portfolio" element={<Portfolio />} />
            {/* Protected Routes would ideally have a wrapper, but simplistic here */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/invoices" element={<Invoices />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;