import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { Hero } from './components/Hero';

import { About } from './components/About';
import { Programs } from './components/Programs';
import { Team } from './components/Team';
import { ImpactStories } from './components/ImpactStories';
import { ImpactDashboard } from './components/ImpactDashboard';

import { Events } from './components/Events';
import { EventDetail } from './components/EventDetail';
import { Gallery } from './components/Gallery';
import { Partners } from './components/Partners';

import { FAQ } from './components/FAQ';
import { Resources } from './components/Resources';
import { News } from './components/News';
import { Donation } from './components/Donation';
import { Newsletter } from './components/Newsletter';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { FloatingContact } from './components/FloatingContact';
import { LiveChat } from './components/LiveChat';
import { ScrollToTop } from './components/ScrollToTop';
import { PrivacyBanner } from './components/PrivacyBanner';
const EnhancedAdminDashboard = React.lazy(() => 
  import('./components/EnhancedAdminDashboard').then(m => ({ default: m.EnhancedAdminDashboard }))
);
const AdminResetPassword = React.lazy(() => 
  import('./components/admin/AdminResetPassword').then(m => ({ default: m.AdminResetPassword }))
);
import { LegalPage } from './components/LegalPage';
import { NewsArchive } from './components/NewsArchive';
import { StoriesArchive } from './components/StoriesArchive';
import { StoryDetail } from './components/StoryDetail';
import { ProgramDetail } from './components/ProgramDetail';
import { ProgramsPage } from './components/ProgramsPage';
import { NewsDetail } from './components/NewsDetail';
import { TeamPage } from './components/TeamPage';
import { TeamMemberDetail } from './components/TeamMemberDetail';
import { ImpactReports } from './components/ImpactReports';
import { FAQPage } from './components/FAQPage';
import { PartnersPage } from './components/PartnersPage';
import { OpportunitiesPage } from './components/OpportunitiesPage';
import { DonationModal } from './components/DonationModal';
import { DonationModalProvider } from './components/DonationModalContext';
import { CardPaymentPage } from './components/CardPaymentPage';
import { ContactPage } from './components/ContactPage';
import { CustomPage } from './components/CustomPage';
import { ResetPassword } from './components/ResetPassword';


import { HelmetProvider } from 'react-helmet-async';
import { SEO } from './components/SEO';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { FinancialReports } from './components/FinancialReports';
import { AboutPage } from './components/AboutPage';

function PageTitleManager() {
  const { pathname } = useLocation();

  const titleMap: Record<string, string> = {
      '/': 'Home | RESTI CBO',
      '/admin': 'Admin Dashboard | RESTI CBO',
      '/admin/reset-password': 'Reset Administrator Password | RESTI CBO',
      '/super-secret-admin-route': 'Admin Dashboard | RESTI CBO',
      '/privacy': 'Privacy Policy | RESTI CBO',
      '/cookies': 'Cookies Policy | RESTI CBO',
      '/terms': 'Terms of Service | RESTI CBO',
      '/refund': 'Refund Policy | RESTI CBO',
      '/news': 'Latest News | RESTI CBO',
      '/stories': 'Impact Stories | RESTI CBO',
      '/team': 'Our Team | RESTI CBO',
      '/reports': 'Impact Reports | RESTI CBO',
      '/impact-dashboard': 'Impact Dashboard | RESTI CBO',
      '/faqs': 'Frequently Asked Questions | RESTI CBO',
      '/partners': 'Our Partners | RESTI CBO',
      '/opportunities': 'Opportunities | RESTI CBO',
      '/donate': 'Donate | Support Our Mission',
      '/donation': 'Donate | Support Our Mission',

      '/contact': 'Get Involved & Contact | RESTI CBO',
      '/get-involved': 'Get Involved | RESTI CBO',

      '/financials': 'Financial Transparency | RESTI',
      '/about': 'About Us | RESTI',
      '/events': 'Events & Activities | RESTI CBO',
      '/resources': 'Resources & Downloads | RESTI CBO',
      '/programs': 'Our Programs | RESTI',
    };

    let title = titleMap[pathname] || 'RESTI';
    if (pathname.startsWith('/events/')) title = 'Event Details | RESTI CBO';
    else if (pathname.startsWith('/news/')) title = 'News Article | RESTI CBO';
    else if (pathname.startsWith('/programs/')) title = 'Program Details | RESTI CBO';
    else if (pathname.startsWith('/team/')) title = 'Team Member | RESTI CBO';
    else if (pathname.startsWith('/pages/')) title = 'Page | RESTI CBO';

  return <SEO title={title} />;
}

function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Header />
      <main className="w-full overflow-x-hidden">
        <Hero />

        <About />
        <Programs />
        <Team />
        <ImpactStories />
        
        <div className="w-full bg-gradient-to-r from-sky-50 via-emerald-50 to-amber-50/70 py-16 flex justify-center border-y border-slate-200/80">
          <Link to="/impact-dashboard" className="inline-flex items-center gap-3 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-700 hover:via-teal-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl shadow-lg shadow-sky-950/15 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold text-xl">
            <span>View Our Impact Dashboard</span>
            <span className="bg-white/20 p-2 rounded-full">→</span>
          </Link>
        </div>



        <Gallery />
        <Partners />

        <FAQ />

        <News />
        <Donation />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
      <FloatingContact />
      <LiveChat />
      <PrivacyBanner />
    </div>
  );
}

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>Dashboard render error</h2>
          <pre style={{ background: '#fee', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminPage() {
  return (
    <AdminErrorBoundary>
      <React.Suspense fallback={
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">Loading Secure Admin Dashboard...</p>
        </div>
      }>
        <EnhancedAdminDashboard />
      </React.Suspense>
    </AdminErrorBoundary>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden w-full">
      <Header />
      <main className="flex-grow w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <FloatingContact />
      <LiveChat />
      <PrivacyBanner />
    </div>
  );
}

import { ConfirmProvider } from './hooks/useConfirm';

const queryClient = new QueryClient();

export default function App() {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <ConfirmProvider>
    <DonationModalProvider>
    <BrowserRouter>
    <ScrollToTop />
    <PageTitleManager />
    <GoogleAnalytics />
    <div id="main-content" className="min-h-screen flex flex-col overflow-x-hidden w-full">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/reset-password" element={
          <AdminErrorBoundary>
            <React.Suspense fallback={
              <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">Loading Password Recovery...</p>
              </div>
            }>
              <AdminResetPassword />
            </React.Suspense>
          </AdminErrorBoundary>
        } />
        <Route path="/super-secret-admin-route" element={<AdminPage />} />
        <Route path="/privacy" element={<MainLayout><LegalPage type="privacy" /></MainLayout>} />
        <Route path="/cookies" element={<MainLayout><LegalPage type="cookies" /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><LegalPage type="terms" /></MainLayout>} />
        <Route path="/refund" element={<MainLayout><LegalPage type="refund" /></MainLayout>} />
        <Route path="/news" element={<MainLayout><NewsArchive /></MainLayout>} />
        <Route path="/news/:id" element={<MainLayout><NewsDetail /></MainLayout>} />
        <Route path="/stories" element={<MainLayout><StoriesArchive /></MainLayout>} />
        <Route path="/stories/:id" element={<MainLayout><StoryDetail /></MainLayout>} />
        <Route path="/impact-stories" element={<MainLayout><StoriesArchive /></MainLayout>} />
        <Route path="/impact-stories/:id" element={<MainLayout><StoryDetail /></MainLayout>} />
        <Route path="/programs" element={<MainLayout><ProgramsPage /></MainLayout>} />
        <Route path="/programs/:id" element={<MainLayout><ProgramDetail /></MainLayout>} />
        <Route path="/team" element={<MainLayout><TeamPage /></MainLayout>} />
        <Route path="/team/:id" element={<MainLayout><TeamMemberDetail /></MainLayout>} />
        <Route path="/about" element={<MainLayout><AdminErrorBoundary><AboutPage /></AdminErrorBoundary></MainLayout>} />
        <Route path="/reports" element={<MainLayout><ImpactReports /></MainLayout>} />
        <Route path="/impact-dashboard" element={<MainLayout><ImpactDashboard /></MainLayout>} />
        <Route path="/events" element={<MainLayout><Events /></MainLayout>} />
        <Route path="/events/:slug" element={<MainLayout><EventDetail /></MainLayout>} />
        <Route path="/resources" element={<MainLayout><Resources /></MainLayout>} />
        <Route path="/faqs" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/partners" element={<MainLayout><PartnersPage /></MainLayout>} />
        <Route path="/opportunities" element={<MainLayout><OpportunitiesPage /></MainLayout>} />
        <Route path="/donate" element={<MainLayout><CardPaymentPage /></MainLayout>} />
        <Route path="/donation" element={<Navigate to="/donate" replace />} />
        <Route path="/donor" element={<Navigate to="/donate" replace />} />
        <Route path="/donor/portal" element={<Navigate to="/donate" replace />} />
        <Route path="/donor/dashboard" element={<Navigate to="/donate" replace />} />
        <Route path="/donor-dashboard" element={<Navigate to="/donate" replace />} />
        <Route path="/donor-portal" element={<Navigate to="/donate" replace />} />
        <Route path="/login" element={<Navigate to="/donate" replace />} />
        <Route path="/register" element={<Navigate to="/donate" replace />} />
        <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />

        <Route path="/contact" element={<ContactPage />} />
        <Route path="/get-involved" element={<ContactPage />} />
        <Route path="/financials" element={<MainLayout><FinancialReports /></MainLayout>} />
        <Route path="/transparency" element={<Navigate to="/financials" replace />} />
        <Route path="/financial-transparency" element={<Navigate to="/financials" replace />} />
        <Route path="/pages/:slug" element={<MainLayout><CustomPage /></MainLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
    <DonationModal />
    </BrowserRouter>
    </DonationModalProvider>
    </ConfirmProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}