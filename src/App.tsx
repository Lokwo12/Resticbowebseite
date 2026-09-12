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
import { DonationModal } from './components/DonationModal';
import { DonationModalProvider } from './components/DonationModalContext';
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
      '/': 'Home | RESTI CBO',
      '/admin': 'Admin Dashboard | RESTI CBO',
      '/privacy': 'Privacy Policy | RESTI CBO',
      '/terms': 'Terms of Service | RESTI CBO',
      '/refund': 'Refund Policy | RESTI CBO',
      '/news': 'Latest News | RESTI CBO',
      '/stories': 'Impact Stories | RESTI CBO',
      '/team': 'Our Team | RESTI CBO',
      '/reports': 'Impact Reports | RESTI CBO',
      '/impact-dashboard': 'Impact Dashboard | RESTI CBO',
      '/volunteer': 'Volunteer | RESTI CBO',
      '/faqs': 'Frequently Asked Questions | RESTI CBO',
      '/partners': 'Our Partners | RESTI CBO',
      '/opportunities': 'Opportunities | RESTI CBO',
      '/donate': 'Donate | Support Our Mission',
      '/contact': 'Contact Us | RESTI CBO',
      '/financials': 'Financial Transparency | RESTI CBO',
      '/about': 'About Us | RESTI CBO',
      '/events': 'Events Calendar | RESTI CBO',
      '/resources': 'Resources & Downloads | RESTI CBO',
    };

    let title = titleMap[pathname] || 'RESTI CBO';
    if (pathname.startsWith('/news/')) title = 'News Article | RESTI CBO';
    else if (pathname.startsWith('/programs/')) title = 'Program Details | RESTI CBO';
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
        
        <div className="w-full bg-emerald-50 py-16 flex justify-center border-y border-emerald-100">
          <Link to="/impact-dashboard" className="inline-flex items-center gap-3 bg-emerald-600 text-white px-10 py-5 rounded-2xl hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-bold text-xl">
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
        <Route path="/admin" element={<AdminPage />} />
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
        <Route path="/impact-dashboard" element={<MainLayout><ImpactDashboard /></MainLayout>} />
        <Route path="/volunteer" element={<MainLayout><VolunteerPage /></MainLayout>} />
        <Route path="/events" element={<MainLayout><Events /></MainLayout>} />
        <Route path="/resources" element={<MainLayout><Resources /></MainLayout>} />
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