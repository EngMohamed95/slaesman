import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { useApp } from '../context/AppContext';
import UpgradePaywall from '../components/UpgradePaywall';
import { isGeminiActive, callGeminiApi } from '../utils/gemini';
import { 
  BarChart3, 
  TrendingUp, 
  Compass, 
  Award, 
  Percent, 
  Calendar, 
  DollarSign, 
  Filter, 
  Sparkles, 
  Printer, 
  Briefcase, 
  Users, 
  Target, 
  Layers, 
  ArrowUpRight, 
  Zap, 
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

export default function ReportsPage() {
  const { t, isRTL, lang } = useLanguage();
  const { leads, tasks, campaignRequests } = useCRM();
  const { validateFeatureAccess, selectedCurrency } = useApp();

  // Tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, funnel, sources, campaigns, ai
  
  // Filters
  const [timeframe, setTimeframe] = useState('all'); // all, last30, thisMonth
  const [budgetRange, setBudgetRange] = useState('all'); // all, under500k, 500k-2m, over2m

  // AI Analyst state
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // 1. Calculate relative latest date in the leads array to make timeframe filter always work with mock data
  const latestLeadDate = leads.reduce((max, l) => {
    if (!l.lastContact) return max;
    const d = new Date(l.lastContact);
    return d > max ? d : max;
  }, new Date('2026-06-01'));

  // 2. Filter Leads
  const filteredLeads = leads.filter(lead => {
    // Budget range filter
    if (budgetRange === 'under500k' && lead.budget >= 500000) return false;
    if (budgetRange === '500k-2m' && (lead.budget < 500000 || lead.budget > 2000000)) return false;
    if (budgetRange === 'over2m' && lead.budget <= 2000000) return false;

    // Timeframe filter
    if (!lead.lastContact) return timeframe === 'all';
    const leadDate = new Date(lead.lastContact);
    
    if (timeframe === 'thisMonth') {
      return leadDate.getMonth() === latestLeadDate.getMonth() && 
             leadDate.getFullYear() === latestLeadDate.getFullYear();
    }
    if (timeframe === 'last30') {
      const diffTime = Math.abs(latestLeadDate - leadDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    
    return true;
  });

  // 3. Computed Metrics
  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter(l => l.status === 'Won').length;
  const lostLeads = filteredLeads.filter(l => l.status === 'Lost').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  
  const totalPipeline = filteredLeads
    .filter(l => l.status !== 'Lost' && l.status !== 'Not Interested')
    .reduce((sum, current) => sum + (current.expectedValue || current.budget || 0), 0);

  const wonPipeline = filteredLeads
    .filter(l => l.status === 'Won')
    .reduce((sum, current) => sum + (current.expectedValue || current.budget || 0), 0);

  const averageLeadBudget = totalLeads > 0 
    ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.budget || 0), 0) / totalLeads) 
    : 0;

  const highestLeadBudget = filteredLeads.reduce((max, l) => (l.budget > max ? l.budget : max), 0);

  // Tasks
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // New Leads
  const newLeadsCount = filteredLeads.filter(l => l.status === 'New').length;

  // Marketing Budget Calculations
  const allocatedMarketingBudget = 30000; // 30,000 in selected currency
  const totalCampaignBudget = campaignRequests.reduce((sum, c) => sum + (c.budget || 0), 0);
  const activeCampaignsCount = campaignRequests.filter(c => c.status.includes('Active') || c.statusAr.includes('نشطة')).length;
  const remainingMarketingBudget = Math.max(0, allocatedMarketingBudget - totalCampaignBudget);
  const roas = totalCampaignBudget > 0 ? (wonPipeline / totalCampaignBudget).toFixed(1) : '0.0';

  // Currency symbols
  const getCurrencySymbol = () => {
    if (selectedCurrency === 'AED') return isRTL ? 'درهم' : 'AED';
    if (selectedCurrency === 'EGP') return isRTL ? 'جنيه' : 'EGP';
    if (selectedCurrency === 'JOD') return isRTL ? 'دينار' : 'JOD';
    if (selectedCurrency === 'USD') return '$';
    return isRTL ? 'ريال' : 'SAR';
  };
  const cSymbol = getCurrencySymbol();

  // Mock Social Media performance indicators
  const mockSocialStats = {
    postsCreated: 24,
    calendarScheduled: 3,
    engagementRate: '5.2%',
    reach: '12,400'
  };

  // Funnel calculations
  const funnelStats = filteredLeads.reduce((acc, lead) => {
    const status = lead.status;
    if (status === 'New') acc.new += 1;
    else if (status === 'Contacted') acc.contacted += 1;
    else if (status === 'Interested' || status === 'Needs Follow-up') acc.interested += 1;
    else if (status === 'Close to Deal') acc.close += 1;
    else if (status === 'Won') acc.won += 1;
    
    if (lead.budget) {
      if (status === 'New') acc.newBudget += lead.budget;
      else if (status === 'Contacted') acc.contactedBudget += lead.budget;
      else if (status === 'Interested' || status === 'Needs Follow-up') acc.interestedBudget += lead.budget;
      else if (status === 'Close to Deal') acc.closeBudget += lead.budget;
      else if (status === 'Won') acc.wonBudget += lead.budget;
    }
    return acc;
  }, { 
    new: 0, newBudget: 0, 
    contacted: 0, contactedBudget: 0, 
    interested: 0, interestedBudget: 0, 
    close: 0, closeBudget: 0, 
    won: 0, wonBudget: 0 
  });

  const funnelStages = [
    { name: t('funnelNew'), count: funnelStats.new, budget: funnelStats.newBudget, color: 'var(--secondary)' },
    { name: t('funnelContacted'), count: funnelStats.contacted, budget: funnelStats.contactedBudget, color: '#818cf8' },
    { name: t('funnelInterested'), count: funnelStats.interested, budget: funnelStats.interestedBudget, color: '#a78bfa' },
    { name: t('funnelClose'), count: funnelStats.close, budget: funnelStats.closeBudget, color: '#f472b6' },
    { name: t('funnelWon'), count: funnelStats.won, budget: funnelStats.wonBudget, color: 'var(--success)' },
  ];

  // Leads by source calculations (counts and budgets)
  const sourceStats = filteredLeads.reduce((acc, lead) => {
    const src = isRTL ? (lead.sourceAr || lead.source) : lead.source;
    if (!acc[src]) {
      acc[src] = { count: 0, budget: 0, wonCount: 0, wonRevenue: 0 };
    }
    acc[src].count += 1;
    acc[src].budget += lead.budget || 0;
    if (lead.status === 'Won') {
      acc[src].wonCount += 1;
      acc[src].wonRevenue += lead.expectedValue || lead.budget || 0;
    }
    return acc;
  }, {});

  // Campaign Analytics Summary

  // Run AI Sales Analyst
  const handleGenerateAIReport = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const simplifiedLeads = filteredLeads.map(l => ({
        name: isRTL ? (l.nameAr || l.name) : l.name,
        status: isRTL ? (l.statusAr || l.status) : l.status,
        budget: l.budget,
        source: isRTL ? (l.sourceAr || l.source) : l.source,
        interest: isRTL ? (l.interestLevelAr || l.interestLevel) : l.interestLevel,
        service: isRTL ? (l.serviceAr || l.service) : l.service
      }));

      const simplifiedTasks = tasks.map(t => ({
        title: isRTL ? (t.titleAr || t.title) : t.title,
        completed: t.completed,
        priority: t.priority
      }));

      const prompt = `
        You are a senior sales consultant and AI business analyst.
        Analyze the following real-time data from a sales CRM application to draft a comprehensive, strategic performance evaluation report.
        
        System Language Preference: ${lang === 'ar' ? 'Arabic' : 'English'}.
        YOU MUST WRITE THE ENTIRE REPORT ONLY IN ${lang === 'ar' ? 'Arabic' : 'English'}. Use bullet points, bold text, emojis, and professional business layout.

        DATA BRIEFING:
        - Leads Database: ${JSON.stringify(simplifiedLeads)}
        - Follow-up Tasks: ${JSON.stringify(simplifiedTasks)}
        - Key Performance Indicators:
          * Total Leads: ${totalLeads}
          * Won Deals: ${wonLeads}
          * Lost Deals: ${lostLeads}
          * Pipeline Value: ${totalPipeline} SAR/USD
          * Conversion Rate: ${conversionRate}%
          * Average Budget Size: ${averageLeadBudget} SAR/USD
          * Task Completion Rate: ${taskCompletionRate}%

        REPORT REQUIREMENTS:
        1. **Overview & Performance Evaluation** (نظرة عامة على الأداء): Assess pipeline quality, deal closure efficiency, and responsiveness to contacts.
        2. **Funnel Dropout Analysis** (تحليل تساقط العملاء): Identify bottlenecks in the funnel stages.
        3. **Marketing ROI Recommendation** (توصيات التسويق والعائد): Review current lead sources and specify which channel yields the highest quality leads (budget sizes and closing rates). Give advice on next ad spend.
        4. **SWOT Analysis** (تحليل SWOT): Clear breakdown of Strengths, Weaknesses, Opportunities, Threats based directly on this lead lists and tasks list.
        5. **Actionable Recommendations** (توصيات عملية وخطوات قادمة): State 3-5 concrete steps the user must take immediately. Refer to actual lead names from the database for urgent action (e.g. "Draft WhatsApp reply to Sarah Connor", "Re-engage Lina Haddad").
      `;

      const systemInstruction = lang === 'ar' 
        ? "أنت خبير استشاري ومحلل مبيعات ذكي. قم بصياغة تقارير تحليلية ممتازة ومباشرة بلغة مهنية محفزة وبأعلى جودة باللغة العربية." 
        : "You are a senior sales performance analyst. Write detailed strategic evaluations based on CRM data in a clean, encouraging, executive tone.";

      const reportText = await callGeminiApi(prompt, systemInstruction);
      setAiReport(reportText);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Gemini API Error');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in print-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Header and Print Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
            <BarChart3 style={{ color: 'var(--secondary)', width: '32px', height: '32px' }} /> {t('navReports')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
            {isRTL 
              ? "تحليل شامل لفرص المبيعات، ومصادر العملاء المربحة، مع توصيات المحلل الذكي." 
              : "Advanced analytical metrics of conversion pipelines, ROI by channels, and AI sales performance guidance."
            }
          </p>
        </div>

        <button onClick={handlePrint} className="btn btn-secondary" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <Printer size={16} />
          {isRTL ? "طباعة التقرير" : "Print Report"}
        </button>
      </div>

      {/* Glassmorphic Filter Bar */}
      <div className="card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '1.5rem', 
        flexWrap: 'wrap', 
        padding: '1.25rem', 
        marginBottom: '2rem',
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{isRTL ? "أدوات التصفية المتقدمة" : "Advanced Filtering"}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('filterTimeframe')}:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ width: 'auto', minWidth: '130px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="all">{isRTL ? "كل الأوقات" : "All Time"}</option>
              <option value="last30">{isRTL ? "آخر 30 يوم" : "Last 30 Days"}</option>
              <option value="thisMonth">{isRTL ? "هذا الشهر" : "This Month"}</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('filterBudget')}:</label>
            <select 
              value={budgetRange} 
              onChange={(e) => setBudgetRange(e.target.value)}
              style={{ width: 'auto', minWidth: '150px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="all">{t('allBudgets')}</option>
              <option value="under500k">{t('lowBudget')}</option>
              <option value="500k-2m">{t('midBudget')}</option>
              <option value="over2m">{t('highBudget')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--card-border)', 
        marginBottom: '2rem', 
        gap: '0.5rem', 
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', name: t('tabOverview'), icon: Compass },
          { id: 'funnel', name: t('tabFunnel'), icon: Layers },
          { id: 'sources', name: t('tabSources'), icon: Target },
          { id: 'campaigns', name: t('tabCampaigns'), icon: Briefcase },
          { id: 'ai', name: t('tabAIAnalyst'), icon: Sparkles, badge: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                color: isActive ? 'var(--secondary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--secondary)' : '2px solid transparent',
                borderRadius: '0.5rem 0.5rem 0 0',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--secondary)' : 'inherit' }} />
              {tab.name}
              {tab.badge && (
                <span style={{ 
                  fontSize: '0.65rem', 
                  background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: '9999px',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite'
                }}>
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* 1. Sales & Revenue Metrics Section */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', textAlign: 'start' }}>
              <TrendingUp size={20} style={{ color: 'var(--secondary)' }} />
              {isRTL ? "أداء المبيعات والإيرادات والعملاء الجدد" : "Sales, Revenue & New Leads Performance"}
            </h3>
            <div className="grid-4">
              {/* Conversion Gauge Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('conversionRate')}</span>
                  <Percent size={18} style={{ color: 'var(--secondary)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="54" height="54" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--card-border)"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--secondary)"
                        strokeWidth="3.5"
                        strokeDasharray={`${conversionRate}, 100`}
                      />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{conversionRate}%</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{wonLeads} / {totalLeads}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRTL ? "صفقات مغلقة بنجاح" : "Won contracts total"}</div>
                  </div>
                </div>
              </div>

              {/* Money Collected Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {isRTL ? "الفلوس المحصلة من العميل" : "Revenue Collected (Won)"}
                  </span>
                  <Award size={18} style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', textAlign: 'start' }}>
                    {wonPipeline.toLocaleString()} {cSymbol}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'start' }}>
                    {isRTL ? `إجمالي الفلوس المحصلة فعلياً` : `Total actual money collected`}
                  </div>
                </div>
              </div>

              {/* Potential Sales Pipeline Value */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "المبيعات المحتملة الجارية" : "Potential Active Pipeline"}</span>
                  <TrendingUp size={18} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', textAlign: 'start' }}>
                    {(totalPipeline - wonPipeline).toLocaleString()} {cSymbol}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textAlign: 'start' }}>
                    <ArrowUpRight size={12} style={{ color: '#818cf8' }} />
                    <span>{isRTL ? `من أصل ${filteredLeads.filter(l => l.status !== 'Lost' && l.status !== 'Won' && l.status !== 'Not Interested').length} صفقات جارية` : `From open active deals`}</span>
                  </div>
                </div>
              </div>

              {/* New Leads Added Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "الليدز الجديدة (New Leads)" : "New Leads Added"}</span>
                  <Users size={18} style={{ color: 'var(--secondary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', textAlign: 'start' }}>
                    {newLeadsCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'start' }}>
                    {isRTL ? "عملاء جدد بانتظار المتابعة" : "Leads awaiting first contact"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Marketing & Ads Budgets Section */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', textAlign: 'start' }}>
              <Target size={20} style={{ color: 'var(--accent)' }} />
              {isRTL ? "ميزانيات الحملات الإعلانية الممولة" : "Marketing & Paid Ad Budgets"}
            </h3>
            <div className="grid-4">
              {/* Allocated Marketing Budget */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "ميزانية التسويق المعتمدة" : "Allocated Marketing Budget"}</span>
                  <DollarSign size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'start' }}>
                    {allocatedMarketingBudget.toLocaleString()} {cSymbol}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>{isRTL ? "الميزانية المحددة للتسويق" : "Total platform ad allowance"}</span>
                </div>
              </div>

              {/* Spent Ad Budget */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "الميزانية المصروفة إعلانياً" : "Spent Ad Budget"}</span>
                  <Briefcase size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', textAlign: 'start' }}>
                    {totalCampaignBudget.toLocaleString()} {cSymbol}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>
                    {isRTL ? `موزعة على ${campaignRequests.length} حملات معلنة` : `Spent on active campaigns`}
                  </span>
                </div>
              </div>

              {/* Remaining Ad Budget */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "الميزانية المتبقية للتسويق" : "Remaining Ad Budget"}</span>
                  <Layers size={18} style={{ color: 'var(--secondary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)', textAlign: 'start' }}>
                    {remainingMarketingBudget.toLocaleString()} {cSymbol}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>{isRTL ? "رصيد تسويق متاح وحر" : "Available for new campaign briefs"}</span>
                </div>
              </div>

              {/* ROAS Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "معدل العائد على الإعلانات (ROAS)" : "Return on Ad Spend (ROAS)"}</span>
                  <Zap size={18} style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', textAlign: 'start' }}>
                    {roas}x
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>
                    {isRTL ? "عائد المبيعات الفعلي / المصاريف" : "Revenue / Spent campaign budget ratio"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Social Media & Content Section */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', textAlign: 'start' }}>
              <Sparkles size={20} style={{ color: '#ec72b6' }} />
              {isRTL ? "أداء وقنوات وسائل التواصل (السوشيال ميديا)" : "Social Media & Content Analytics"}
            </h3>
            <div className="grid-3">
              {/* AI Generated Content */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContext: 'space-between', minHeight: '110px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "محتوى السوشيال ميديا المولد بالـ AI" : "AI Content Generated"}</span>
                  <Sparkles size={16} style={{ color: '#ec72b6' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'start' }}>
                    {mockSocialStats.postsCreated} {isRTL ? "منشور وسيناريو ريلز" : "posts & scripts"}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>{isRTL ? "تم توليدها تلقائياً عبر صانع المحتوى" : "Generated via Social Creator Copilot"}</span>
                </div>
              </div>

              {/* Scheduled Posts */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContext: 'space-between', minHeight: '110px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "المنشورات المجدولة في تقويم النشر" : "Scheduled Calendar Posts"}</span>
                  <Calendar size={16} style={{ color: 'var(--secondary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)', textAlign: 'start' }}>
                    {mockSocialStats.calendarScheduled} {isRTL ? "منشورات مجدولة أسبوعياً" : "scheduled items"}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>{isRTL ? "موزعة بالتقويم على قنوات النشر" : "Planned for the current weekly cycle"}</span>
                </div>
              </div>

              {/* Engagement and Reach */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContext: 'space-between', minHeight: '110px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isRTL ? "الوصول والتفاعل التقديري" : "Reach & Engagement Rate"}</span>
                  <Users size={16} style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', textAlign: 'start' }}>
                    {mockSocialStats.reach} {isRTL ? "وصول وتفاعل" : "reach"}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'start' }}>
                    {isRTL ? `بمتوسط معدل تفاعل ${mockSocialStats.engagementRate}` : `Average engagement of ${mockSocialStats.engagementRate}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Overview Details */}
          <div className="grid-2">
            
            {/* Top Won Deals */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--success)' }} />
                {isRTL ? "أحدث الصفقات الناجحة (Won)" : "Top Won Deals & Revenue"}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {filteredLeads.filter(l => l.status === 'Won').slice(0, 4).map(lead => (
                  <div key={lead.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isRTL ? (lead.nameAr || lead.name) : lead.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {isRTL ? (lead.serviceAr || lead.service) : lead.service}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem' }}>
                        {isRTL ? `${(lead.expectedValue || lead.budget).toLocaleString()} ريال` : `$${(lead.expectedValue || lead.budget).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.lastContact}</div>
                    </div>
                  </div>
                ))}
                {filteredLeads.filter(l => l.status === 'Won').length === 0 && (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={24} style={{ color: 'var(--text-muted)' }} />
                    <span>{isRTL ? "لا توجد صفقات ناجحة ضمن الفلاتر المحددة." : "No won deals found within the selected filters."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Insights Quick Widget */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} style={{ color: 'var(--accent)' }} />
                {isRTL ? "مؤشرات الكفاءة والسرعة" : "Efficiency Indicators"}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, justifyContent: 'center' }}>
                <div>
                  <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', justifyContent: 'space-between' }}>
                    <span>{isRTL ? "قيمة الصفقات المغلقة مقابل الكلية" : "Won Deal Pipeline Value ratio"}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {totalPipeline > 0 ? Math.round((wonPipeline / (totalPipeline + wonPipeline)) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${totalPipeline > 0 ? Math.round((wonPipeline / (totalPipeline + wonPipeline)) * 100) : 0}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', 
                      borderRadius: '4px' 
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', justifyContent: 'space-between' }}>
                    <span>{isRTL ? "العملاء بمستوى اهتمام مرتفع (High)" : "High Interest Level Leads"}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {totalLeads > 0 ? Math.round((filteredLeads.filter(l => l.interestLevel === 'High').length / totalLeads) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${totalLeads > 0 ? Math.round((filteredLeads.filter(l => l.interestLevel === 'High').length / totalLeads) * 100) : 0}%`, 
                      height: '100%', 
                      background: 'var(--accent)', 
                      borderRadius: '4px' 
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', justifyContent: 'space-between' }}>
                    <span>{isRTL ? "معدل الموافقة على محادثات واتساب" : "WhatsApp Consent rate"}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {totalLeads > 0 ? Math.round((filteredLeads.filter(l => l.consent?.whatsapp).length / totalLeads) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${totalLeads > 0 ? Math.round((filteredLeads.filter(l => l.consent?.whatsapp).length / totalLeads) * 100) : 0}%`, 
                      height: '100%', 
                      background: 'var(--secondary)', 
                      borderRadius: '4px' 
                    }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. SALES FUNNEL */}
      {activeTab === 'funnel' && (
        <div className="fade-in card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 700 }}>{isRTL ? "مراحل قمع المبيعات ومجموع قيم الصفقات" : "Sales Pipeline Stage Funnel"}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 2rem' }}>
            {isRTL 
              ? "تحليل تسلسلي لعدد العملاء وإجمالي الميزانيات المالية عند كل مرحلة من مراحل المتابعة والبيع."
              : "A linear layout illustrating customer volume attrition and expected financial values across each milestone."
            }
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
            {funnelStages.map((stage, idx) => {
              // Calculate percent width of block. The first block is 100% width, others scale relative to the max count or fixed decreasing widths
              const widthPct = 100 - (idx * 12); // Decreasing funnel visual
              const leadPercentage = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
              
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  transition: 'transform 0.2s ease'
                }} className="funnel-row">
                  {/* Label Block */}
                  <div style={{ width: '150px', textAlign: isRTL ? 'left' : 'right', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {stage.name}
                  </div>

                  {/* Funnel Visual Block */}
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    height: '42px', 
                    background: `linear-gradient(135deg, ${stage.color}22 0%, ${stage.color}11 100%)`,
                    border: `1px solid ${stage.color}44`,
                    borderRadius: '0.5rem',
                    padding: '0 1rem',
                    position: 'relative',
                    width: `${widthPct}%`,
                    maxWidth: `${widthPct}%`,
                    boxShadow: `0 2px 8px ${stage.color}05`,
                    margin: '0 auto'
                  }}>
                    {/* Background Progress fill */}
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      bottom: 0, 
                      left: isRTL ? 'auto' : 0, 
                      right: isRTL ? 0 : 'auto', 
                      width: `${leadPercentage}%`, 
                      background: stage.color, 
                      opacity: 0.15,
                      borderRadius: '0.4rem',
                      zIndex: 0
                    }} />

                    {/* Left: Lead count */}
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, zIndex: 1, color: stage.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={14} /> {stage.count} {isRTL ? "عملاء" : "leads"}
                    </span>

                    {/* Right: Budget */}
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, zIndex: 1, color: 'var(--text-main)' }}>
                      {isRTL ? `${stage.budget.toLocaleString()} ريال` : `$${stage.budget.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Funnel Conversion Stats */}
                  <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    {leadPercentage}%
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{isRTL ? "نسبة إتمام الصفقات الفعالة" : "Pipeline Won Ratio"}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                {wonLeads + lostLeads > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) : 0}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{isRTL ? "مجموع قيمة الصفقات النشطة" : "Active Stage Value"}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                {isRTL ? `${(totalPipeline - wonPipeline).toLocaleString()} ريال` : `$${(totalPipeline - wonPipeline).toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. SOURCE ROI INSIGHTS */}
      {activeTab === 'sources' && (
        <div className="fade-in">
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            {Object.entries(sourceStats).map(([sourceName, stats]) => {
              const leadPercentage = totalLeads > 0 ? Math.round((stats.count / totalLeads) * 100) : 0;
              const sourceWonRevenue = stats.wonRevenue;
              const sourceBudgetPct = averageLeadBudget > 0 ? Math.round((stats.budget / (totalLeads * averageLeadBudget)) * 100) : 0;
              
              return (
                <div key={sourceName} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{sourceName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {stats.count} {isRTL ? "عملاء مسجلين" : "registered leads"} ({leadPercentage}%)
                      </span>
                    </div>
                    <span className="badge badge-new" style={{ fontSize: '0.7rem' }}>
                      {isRTL ? "نسبة النجاح:" : "Win Rate:"} {stats.count > 0 ? Math.round((stats.wonCount / stats.count) * 100) : 0}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isRTL ? "إجمالي ميزانية المصدر:" : "Total Pipeline Value:"}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {isRTL ? `${stats.budget.toLocaleString()} ريال` : `$${stats.budget.toLocaleString()}`}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isRTL ? "إيرادات الصفقات المغلقة (Won):" : "Won Revenue:"}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        {isRTL ? `${sourceWonRevenue.toLocaleString()} ريال` : `$${sourceWonRevenue.toLocaleString()}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{isRTL ? "متوسط ميزانية العميل:" : "Average Deal Budget:"}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>
                        {isRTL ? `${Math.round(stats.budget / (stats.count || 1)).toLocaleString()} ريال` : `$${Math.round(stats.budget / (stats.count || 1)).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress visual */}
                  <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.25rem' }}>
                    <div style={{ 
                      width: `${Math.min(sourceBudgetPct, 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>
              );
            })}
            
            {Object.keys(sourceStats).length === 0 && (
              <div style={{ gridColumn: 'span 2', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {isRTL ? "لا توجد مصادر عملاء متاحة حالياً." : "No lead sources available."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="fade-in">
          
          {/* Ad Campaign Metrics Row */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('totalAdSpend')}</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)' }}>
                {isRTL ? `${totalCampaignBudget.toLocaleString()} ريال` : `$${totalCampaignBudget.toLocaleString()}`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isRTL ? `موزعة على ${campaignRequests.length} حملات إعلانية` : `Allocated to ${campaignRequests.length} brief requests`}
              </span>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{isRTL ? "الحملات النشطة الآن" : "Active Ad Briefs"}</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
                {activeCampaignsCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isRTL ? "قيد التسليم وجلب العملاء المحتملين" : "Active and delivering leads"}
              </span>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{isRTL ? "متوسط تكلفة العميل (تقديري)" : "Simulated Cost-per-Lead"}</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                {isRTL ? `${totalLeads > 0 ? Math.round(totalCampaignBudget / totalLeads) : 0} ريال` : `$${totalLeads > 0 ? Math.round(totalCampaignBudget / totalLeads) : 0}`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isRTL ? "إجمالي الإنفاق مقسوماً على عملاء CRM" : "Total spend / database lead count"}
              </span>
            </div>
          </div>

          {/* Platform breakdown */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>{isRTL ? "توزيع الإنفاق حسب المنصات الإعلانية" : "Ad Spend Distribution by Platform"}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {campaignRequests.reduce((acc, c) => {
                const plat = c.platform || 'Other';
                const existing = acc.find(item => item.name === plat);
                if (existing) {
                  existing.budget += c.budget || 0;
                } else {
                  acc.push({ name: plat, budget: c.budget || 0 });
                }
                return acc;
              }, []).map((platData, idx) => {
                const pct = totalCampaignBudget > 0 ? Math.round((platData.budget / totalCampaignBudget) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContext: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{platData.name}</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {isRTL ? `${platData.budget.toLocaleString()} ريال` : `$${platData.budget.toLocaleString()}`} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. AI SALES ANALYST */}
      {activeTab === 'ai' && (
        <div className="fade-in">
          {!validateFeatureAccess('socialCreator') ? (
            <UpgradePaywall 
              requiredPlan="Pro" 
              featureNameAr="المحلل الاستراتيجي الذكي للمبيعات" 
              featureNameEn="AI Sales Analyst Report" 
            />
          ) : !isGeminiActive() ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px dashed var(--danger)' }}>
              <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>{isRTL ? "مفتاح API غير متوفر" : "Gemini API Key Missing"}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                {isRTL 
                  ? "تحليل الذكاء الاصطناعي يتطلب مفتاح API لتشغيل نموذج Gemini. يرجى التوجه لصفحة الإعدادات لإضافة مفتاح API مجاني."
                  : "To generate dynamic SWOT and strategic reviews from your live CRM database, configure your Google Gemini API Key in Settings first."
                }
              </p>
              <a href="#/settings" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                {isRTL ? "الانتقال إلى الإعدادات" : "Go to Settings"}
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Strategic Action Box */}
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                borderColor: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'var(--secondary-glow)', padding: '0.75rem', borderRadius: '50%' }}>
                    <Sparkles style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div style={{ textAlign: 'start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                      {isRTL ? "المحلل الاستراتيجي الذكي للمبيعات" : "AI Sales Intelligence Engine"}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                      {isRTL 
                        ? "سيقوم الذكاء الاصطناعي بقراءة إحصائيات عملائك، ميزانياتهم، ومهام المتابعة لبناء تقرير أداء مخصص." 
                        : "Analyzes leads, budgets, and pending actions to compile customized SWOT insights and advice."
                      }
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleGenerateAIReport} 
                  disabled={aiLoading} 
                  className="btn btn-primary"
                  style={{ minWidth: '180px', gap: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                  <Sparkles size={16} />
                  {aiLoading ? t('generatingAIReport') : t('generateAIReport')}
                </button>
              </div>

              {/* AI Report Output */}
              {aiLoading && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem' }}>
                  <div className="pulse-loader" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--secondary-glow)',
                    border: '3px solid var(--secondary)',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {isRTL ? "جاري قراءة وتحليل بيانات العملاء والمهام..." : "Reviewing CRM metrics and compiling instructions..."}
                  </span>
                </div>
              )}

              {aiError && (
                <div className="card" style={{ background: 'var(--danger-glow)', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem' }}>
                  <AlertCircle size={20} />
                  <span>{aiError}</span>
                </div>
              )}

              {aiReport && !aiLoading && (
                <div className="card fade-in" style={{ padding: '2rem', textAlign: 'start' }}>
                  <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award style={{ color: 'var(--accent)' }} />
                    {t('aiReportTitle')}
                  </h3>
                  
                  {/* Styled Markdown renderer block */}
                  <div className="markdown-body" style={{ 
                    color: 'var(--text-main)', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Cairo, system-ui, sans-serif'
                  }}>
                    {aiReport}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Styled Animations for loading/pulsing in React inline */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(6, 182, 212, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          body { background: white !important; color: black !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
          .card { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
          .btn, select, label { display: none !important; }
          .print-container { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
