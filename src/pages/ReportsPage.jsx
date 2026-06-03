import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCRM } from '../context/CRMContext';
import { BarChart3, TrendingUp, Compass, Award, Percent } from 'lucide-react';

export default function ReportsPage() {
  const { t, isRTL } = useLanguage();
  const { leads, tasks } = useCRM();

  // Computations
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const lostLeads = leads.filter(l => l.status === 'Lost').length;
  
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  
  const totalPipeline = leads
    .filter(l => l.status !== 'Lost' && l.status !== 'Not Interested')
    .reduce((sum, current) => sum + (current.expectedValue || 0), 0);

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Leads by source counts
  const sourceStats = leads.reduce((acc, lead) => {
    const src = isRTL ? (lead.sourceAr || lead.source) : lead.source;
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  // Leads by status counts
  const statusStats = leads.reduce((acc, lead) => {
    const st = isRTL ? (lead.statusAr || lead.status) : lead.status;
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 style={{ color: 'var(--secondary)' }} /> {t('navReports')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {isRTL ? "تقييم أداء مبيعاتك ونمو خطتك الإعلانية." : "Analyze your sales closing metrics and ad performance."}
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('conversionRate')}</span>
            <Percent size={16} style={{ color: 'var(--secondary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{conversionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {wonLeads} {isRTL ? 'صفقات ناجحة من أصل' : 'won deals from'} {totalLeads}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('salesPipeline')}</span>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {isRTL ? `${totalPipeline.toLocaleString()} ريال` : `$${totalPipeline.toLocaleString()}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isRTL ? 'إجمالي قيمة الصفقات النشطة' : 'Total value of active deals'}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isRTL ? 'إكمال المتابعات' : 'Follow-up Completion'}</span>
            <Award size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>{taskCompletionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {completedTasks} {isRTL ? 'مكتملة من أصل' : 'completed out of'} {totalTasks}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isRTL ? 'النشاط الأسبوعي' : 'Weekly Activity'}</span>
            <Compass size={16} style={{ color: '#818cf8' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#818cf8' }}>+18%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isRTL ? 'زيادة تواصل مقارنة بالأسبوع الماضي' : 'Increase in messages vs last week'}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Leads by Source Chart */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>{t('bestSource')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(sourceStats).map(([src, count]) => {
              const pct = Math.round((count / totalLeads) * 100);
              return (
                <div key={src}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>{src}</span>
                    <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--secondary)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads by Status Chart */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>{isRTL ? 'توزيع العملاء حسب الحالة' : 'Leads Distribution by Status'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(statusStats).map(([st, count]) => {
              const pct = Math.round((count / totalLeads) * 100);
              return (
                <div key={st}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>{st}</span>
                    <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
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
    </div>
  );
}
