import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FundraisingProgress } from './components/FundraisingProgress';
import { About } from './components/About';
import { Programs } from './components/Programs';
import { Team } from './components/Team';
import { ImpactStories } from './components/ImpactStories';
import { ImpactDashboard } from './components/ImpactDashboard';
import { ImpactMap } from './components/ImpactMap';
import { Events } from './components/Events';
import { Gallery } from './components/Gallery';
import { Partners } from './components/Partners';
import { VolunteerOpportunities } from './components/VolunteerOpportunities';
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
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard';
import { LegalPage } from './components/LegalPage';
import { NewsArchive } from './components/NewsArchive';
import { StoriesArchive } from './components/StoriesArchive';
import { StoryDetail } from './components/StoryDetail';
import { ProgramDetail } from './components/ProgramDetail';
import { NewsDetail } from './components/NewsDetail';
import { TeamPage } from './components/TeamPage';
import { ImpactReports } from './components/ImpactReports';
import { VolunteerPage } from './components/VolunteerPage';
import { FAQPage } from './components/FAQPage';
import { PartnersPage } from './components/PartnersPage';
import { OpportunitiesPage } from './components/OpportunitiesPage';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { DonationModalProvider, DonationModal } from './components/DonationModal';
import { CardPaymentPage } from './components/CardPaymentPage';
import { ContactPage } from './components/ContactPage';
import { CustomPage } from './components/CustomPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ResetPassword } from './components/ResetPassword';
import { DonorDashboard } from './components/DonorDashboard';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from './components/SEO';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { FinancialReports } from './components/FinancialReports';
import { AboutPage } from './components/AboutPage';

function PageTitleManager() {
  const { pathname } = useLocation();

  const titleMap: Record<string, string> = {
      '/': 'Home | Resti Kiryandongo CBO',
      '/super-secret-admin-route': 'Admin Dashboard | Resti Kiryandongo',
      '/privacy': 'Privacy Policy | Resti Kiryandongo',
      '/terms': 'Terms of Service | Resti Kiryandongo',
      '/refund': 'Refund Policy | Resti Kiryandongo',
      '/news': 'Latest News | Resti Kiryandongo',
      '/stories': 'Impact Stories | Resti Kiryandongo',
      '/team': 'Our Team | Resti Kiryandongo',
      '/reports': 'Impact Reports | Resti Kiryandongo',
      '/volunteer': 'Volunteer | Resti Kiryandongo',
      '/faqs': 'Frequently Asked Questions | Resti Kiryandongo',
      '/partners': 'Our Partners | Resti Kiryandongo',
      '/opportunities': 'Opportunities | Resti Kiryandongo',
      '/donate': 'Donate | Support Our Mission',
      '/contact': 'Contact Us | Resti Kiryandongo',
      '/financials': 'Financial Transparency | Resti Kiryandongo',
      '/about': 'About Us | Resti Kiryandongo',
    };

    let title = titleMap[pathname] || 'Resti Kiryandongo CBO';
    if (pathname.startsWith('/news/')) title = 'News Article | Resti Kiryandongo';
    else if (pathname.startsWith('/programs/')) title = 'Program Details | Resti Kiryandongo';
    else if (pathname.startsWith('/pages/')) title = 'Page | Resti Kiryandongo';

  return <SEO title={title} />;
}

function HomePage() {
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/initialize`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    };

    initializeData();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Header />
      <main className="w-full overflow-x-hidden">
        <Hero />
        <FundraisingProgress />
        <About />
        <Programs />
        <Team />
        <ImpactStories />
        <ImpactDashboard />
        <ImpactMap />
        <Events />
        <Gallery />
        <Partners />
        <VolunteerOpportunities />
        <FAQ />
        <Resources />
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
      <EnhancedAdminDashboard />
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
        <Route path="/super-secret-admin-route" element={<AdminPage />} />
        <Route path="/privacy" element={<MainLayout><LegalPage type="privacy" /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><LegalPage type="terms" /></MainLayout>} />
        <Route path="/refund" element={<MainLayout><LegalPage type="refund" /></MainLayout>} />
        <Route path="/news" element={<MainLayout><NewsArchive /></MainLayout>} />
        <Route path="/news/:id" element={<MainLayout><NewsDetail /></MainLayout>} />
        <Route path="/stories" element={<MainLayout><StoriesArchive /></MainLayout>} />
        <Route path="/stories/:id" element={<MainLayout><StoryDetail /></MainLayout>} />
        <Route path="/programs/:id" element={<MainLayout><ProgramDetail /></MainLayout>} />
        <Route path="/team" element={<MainLayout><TeamPage /></MainLayout>} />
        <Route path="/about" element={<MainLayout><AdminErrorBoundary><AboutPage /></AdminErrorBoundary></MainLayout>} />
        <Route path="/reports" element={<MainLayout><ImpactReports /></MainLayout>} />
        <Route path="/volunteer" element={<MainLayout><VolunteerPage /></MainLayout>} />
        <Route path="/faqs" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/partners" element={<MainLayout><PartnersPage /></MainLayout>} />
        <Route path="/opportunities" element={<MainLayout><OpportunitiesPage /></MainLayout>} />
        <Route path="/donate" element={<MainLayout><CardPaymentPage /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
        <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
        <Route path="/donor/dashboard" element={<MainLayout><DonorDashboard /></MainLayout>} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/financials" element={<MainLayout><FinancialReports /></MainLayout>} />
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