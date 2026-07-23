import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CRMProvider } from './context/CRMContext';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/AuthPages';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CRMPage from './pages/CRMPage';
import LeadDetailsPage from './pages/LeadDetailsPage';
import TasksPage from './pages/TasksPage';
import AIAssistantPage from './pages/AIAssistantPage';
import WhatsAppGeneratorPage from './pages/WhatsAppGeneratorPage';
import SocialGeneratorPage from './pages/SocialGeneratorPage';
import CampaignRequestPage from './pages/CampaignRequestPage';
import ReportsPage from './pages/ReportsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import FloatingAIAssistant from './components/FloatingAIAssistant';

// Import Icons
import { 
  Sparkles, Users, Calendar, MessageSquare, Megaphone, 
  BarChart3, Settings, ShieldCheck, LogOut, Menu, X, Globe, User, CreditCard
} from 'lucide-react';

function AppContent() {
  const { user, onboarded, logout } = useApp();
  const { t, lang, toggleLanguage, isRTL } = useLanguage();
  const [page, setPage] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/lead/')) return 'leadDetails';
    return hash.substring(2) || 'landing';
  });
  const [selectedLeadId, setSelectedLeadId] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/lead/')) return hash.substring(7);
    return null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listen to hash changes (for back/forward browser buttons)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/landing';
      if (hash.startsWith('#/lead/')) {
        const id = hash.substring(7);
        setSelectedLeadId(id);
        setPage('leadDetails');
      } else {
        const p = hash.substring(2) || 'landing';
        setPage(p);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync React states to URL hash
  React.useEffect(() => {
    const noLayoutPages = ['landing', 'login', 'register', 'onboarding'];
    // If not logged in, force landing or auth page
    if (!user && !noLayoutPages.includes(page)) {
      window.location.hash = '/landing';
      return;
    }

    let targetHash = `/${page}`;
    if (page === 'leadDetails' && selectedLeadId) {
      targetHash = `/lead/${selectedLeadId}`;
    }

    if (window.location.hash !== `#${targetHash}`) {
      window.location.hash = targetHash;
    }
  }, [page, selectedLeadId, user]);

  // Render Page Content
  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage setPage={setPage} />;
      case 'login':
        return <AuthPages mode="login" setPage={setPage} />;
      case 'register':
        return <AuthPages mode="register" setPage={setPage} />;
      case 'onboarding':
        return <OnboardingPage setPage={setPage} />;
      case 'dashboard':
        return <DashboardPage setPage={setPage} setSelectedLeadId={setSelectedLeadId} />;
      case 'crm':
        return <CRMPage setPage={setPage} setSelectedLeadId={setSelectedLeadId} />;
      case 'leadDetails':
        return <LeadDetailsPage leadId={selectedLeadId} setPage={setPage} />;
      case 'tasks':
        return <TasksPage />;
      case 'aiAssistant':
        return <AIAssistantPage />;
      case 'whatsapp':
        return <WhatsAppGeneratorPage defaultLeadId={selectedLeadId} />;
      case 'socialCreator':
        return <SocialGeneratorPage />;
      case 'campaigns':
        return <CampaignRequestPage />;
      case 'reports':
        return <ReportsPage />;
      case 'subscriptions':
        return <SubscriptionPage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminPanelPage />;
      default:
        return <LandingPage setPage={setPage} />;
    }
  };

  // If user is not authenticated or still on landing/onboarding, render without layout
  const noLayoutPages = ['landing', 'login', 'register', 'onboarding'];
  if (!user || noLayoutPages.includes(page)) {
    return renderPage();
  }

  // Sidebar Menu Config
  const menuItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: <BarChart3 size={18} /> },
    { id: 'crm', label: t('navCRM'), icon: <Users size={18} /> },
    { id: 'tasks', label: t('navTasks'), icon: <Calendar size={18} /> },
    { id: 'aiAssistant', label: t('navAIAssistant'), icon: <Sparkles size={18} /> },
    { id: 'whatsapp', label: t('navWhatsApp'), icon: <MessageSquare size={18} /> },
    { id: 'socialCreator', label: t('navSocial'), icon: <Sparkles size={18} /> },
    { id: 'campaigns', label: t('navCampaigns'), icon: <Megaphone size={18} /> },
    { id: 'reports', label: t('navReports'), icon: <BarChart3 size={18} /> },
    { id: 'subscriptions', label: t('navSubscription'), icon: <CreditCard size={18} /> },
    { id: 'settings', label: t('navSettings'), icon: <Settings size={18} /> },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ id: 'admin', label: t('navAdmin'), icon: <ShieldCheck size={18} /> });
  }

  const handleNav = (targetPage) => {
    setPage(targetPage);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'active' : ''}`} style={{
        transform: mobileMenuOpen ? 'translateX(0)' : undefined
      }}>
        <div className="sidebar-logo">
          <Sparkles style={{ color: 'var(--secondary)' }} />
          <span>{t('appName')}</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`sidebar-item ${page === item.id || (item.id === 'crm' && page === 'leadDetails') ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'start' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={toggleLanguage}
            style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem' }}
          >
            <Globe size={16} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <button 
            className="btn btn-danger" 
            onClick={() => {
              logout();
              setPage('landing');
            }}
            style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem' }}
          >
            <LogOut size={16} />
            <span>{t('navLogout')}</span>
          </button>
        </div>
      </aside>

      {/* Top Header & Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--card-border)'
        }}>
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginInlineStart: 'auto' }}>
            {/* Quick Lang Indicator */}
            <button 
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Globe size={14} />
              <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            {/* Profile widget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
              <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={12} style={{ color: '#818cf8' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Render page element */}
        {renderPage()}
        <FloatingAIAssistant />
      </div>

      {/* CSS adjustments for sidebar mobile drawer */}
      <style>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(\${isRTL ? '100%' : '-100%'});
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar.active {
            transform: translateX(0);
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <CRMProvider>
          <AppContent />
        </CRMProvider>
      </LanguageProvider>
    </AppProvider>
  );
}
