import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import { CRMProvider } from './context/CRMContext';
import { NavigationProvider, Page, useNavigation } from './navigation';
import { RequireAuth, RequireRole, RedirectIfAuthed } from './components/RouteGuards';
import AppLayout from './layouts/AppLayout';

// Every page is split out of the entry chunk. The landing and auth screens are
// the public entry point, so they must not ship the whole authenticated app.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPages = lazy(() => import('./pages/AuthPages'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CRMPage = lazy(() => import('./pages/CRMPage'));
const LeadDetailsPage = lazy(() => import('./pages/LeadDetailsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const AddTaskPage = lazy(() => import('./pages/AddTaskPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const WhatsAppGeneratorPage = lazy(() => import('./pages/WhatsAppGeneratorPage'));
const SocialGeneratorPage = lazy(() => import('./pages/SocialGeneratorPage'));
const CampaignRequestPage = lazy(() => import('./pages/CampaignRequestPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));

function RouteFallback() {
  return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>…</div>;
}

/** The one parameterised route: reads :leadId out of the URL. */
function LeadDetailsRoute() {
  const { leadId } = useParams();
  return <Page component={LeadDetailsPage} leadId={leadId} />;
}

/** WhatsApp generator preselects whichever lead the user came from. */
function WhatsAppRoute() {
  const { selectedLeadId } = useNavigation();
  return <Page component={WhatsAppGeneratorPage} defaultLeadId={selectedLeadId} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/landing" element={<Page component={LandingPage} />} />
        {/* Distinct keys force a remount between the two. AuthPages seeds its
            `isRegister` state from `mode` once, so without this React reuses
            the instance and /register keeps showing the login form. */}
        <Route path="/login" element={<RedirectIfAuthed><Page key="login" component={AuthPages} mode="login" /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><Page key="register" component={AuthPages} mode="register" /></RedirectIfAuthed>} />

        {/* Authenticated shell */}
        <Route element={<RequireAuth />}>
          {/* Onboarding runs full-page, outside the sidebar layout. */}
          <Route path="/onboarding" element={<Page component={OnboardingPage} />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Page component={DashboardPage} />} />
            <Route path="/crm" element={<Page component={CRMPage} />} />
            {/* Same component, different view: CRMPage renders the table for
                /crm and the add-lead form for /crm/new. Reusing it keeps the
                WhatsApp sync and chat-paste importers — which feed the form and
                live in that file — working without being extracted. */}
            <Route path="/crm/new" element={<Page component={CRMPage} view="add" />} />
            <Route path="/lead/:leadId" element={<LeadDetailsRoute />} />
            <Route path="/tasks" element={<Page component={TasksPage} />} />
            {/* Declared before nothing in particular, but note /tasks/new must
                stay a sibling of /tasks — nesting it would render the board
                behind the form. */}
            <Route path="/tasks/new" element={<Page component={AddTaskPage} />} />
            <Route path="/aiAssistant" element={<Page component={AIAssistantPage} />} />
            <Route path="/whatsapp" element={<WhatsAppRoute />} />
            <Route path="/socialCreator" element={<Page component={SocialGeneratorPage} />} />
            <Route path="/campaigns" element={<Page component={CampaignRequestPage} />} />
            <Route path="/reports" element={<Page component={ReportsPage} />} />
            <Route path="/subscriptions" element={<Page component={SubscriptionPage} />} />
            <Route path="/settings" element={<Page component={SettingsPage} />} />

            {/* Admin-only. The guard keeps non-admins out AND keeps the admin
                chunk from ever being downloaded by them. */}
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<Page component={AdminPanelPage} />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <LanguageProvider>
          <CRMProvider>
            <NavigationProvider>
              <AppRoutes />
            </NavigationProvider>
          </CRMProvider>
        </LanguageProvider>
      </AppProvider>
    </HashRouter>
  );
}
