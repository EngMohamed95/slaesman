import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation';
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import CRMBoundary, { SyncErrorBanner } from '../components/CRMBoundary';

import {
  Sparkles, Users, Calendar, MessageSquare, Megaphone,
  BarChart3, Settings, ShieldCheck, LogOut, Menu, X, Globe, User, CreditCard, Sun, Moon
} from 'lucide-react';

export default function AppLayout() {
  const { user, signOut, theme, toggleTheme } = useApp();
  const { t, lang, toggleLanguage, isRTL } = useLanguage();
  const { setPage } = useNavigation();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar highlighting used to compare a `page` string; now it reads the URL.
  const isAt = (id) => pathname === `/${id}`;
  const onLeadDetails = pathname.startsWith('/lead/');

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
      {/* Mobile Backdrop Overlay */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ color: 'var(--secondary)' }} />
            <span>{t('appName')}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-close-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'none',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`sidebar-item ${isAt(item.id) || (item.id === 'crm' && onLeadDetails) ? 'active' : ''}`}
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
            onClick={async () => {
              await signOut();
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
        <header className="app-topbar" style={{
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
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="app-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginInlineStart: 'auto' }}>
            {/* Dark / Light Theme Switcher */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? (isRTL ? "تفعيل الوضع النهاري" : "Switch to Light Mode") : (isRTL ? "تفعيل الوضع الليلي" : "Switch to Dark Mode")}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {theme === 'dark' ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: '#4f46e5' }} />}
              <span className="desktop-only">{theme === 'dark' ? (isRTL ? 'نهاري' : 'Light') : (isRTL ? 'ليلي' : 'Dark')}</span>
            </button>

            {/* Quick Lang Indicator */}
            <button
              onClick={toggleLanguage}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-main)',
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
            <div className="app-profile-chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
              <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={12} style={{ color: '#818cf8' }} />
              </div>
              <span className="profile-email" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Active route renders here, but only once its rows have arrived. */}
        <CRMBoundary>
          <SyncErrorBanner />
          <Outlet />
        </CRMBoundary>
        <FloatingAIAssistant />
      </div>

      {/* Mobile Bottom Navigation Bar (Screens <= 768px) */}
      <nav className="mobile-bottom-bar">
        <button
          className={`mobile-bar-item ${isAt('dashboard') ? 'active' : ''}`}
          onClick={() => handleNav('dashboard')}
        >
          <BarChart3 size={20} />
          <span>{isRTL ? 'الرئيسية' : 'Dashboard'}</span>
        </button>

        <button
          className={`mobile-bar-item ${isAt('crm') || onLeadDetails ? 'active' : ''}`}
          onClick={() => handleNav('crm')}
        >
          <Users size={20} />
          <span>{isRTL ? 'العملاء' : 'CRM'}</span>
        </button>

        <button
          className={`mobile-bar-item ${isAt('whatsapp') ? 'active' : ''}`}
          onClick={() => handleNav('whatsapp')}
        >
          <MessageSquare size={20} />
          <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
        </button>

        <button
          className={`mobile-bar-item ${isAt('aiAssistant') ? 'active' : ''}`}
          onClick={() => handleNav('aiAssistant')}
        >
          <Sparkles size={20} />
          <span>{isRTL ? 'المساعد' : 'AI Assistant'}</span>
        </button>

        <button
          className={`mobile-bar-item ${isAt('tasks') ? 'active' : ''}`}
          onClick={() => handleNav('tasks')}
        >
          <Calendar size={20} />
          <span>{isRTL ? 'المهام' : 'Tasks'}</span>
        </button>
      </nav>

      {/* Dynamic mobile drawer styles consolidated in index.css */}
    </div>
  );
}
