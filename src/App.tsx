import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
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
import { ScrollToTop } from './components/ScrollToTop';
import { PrivacyBanner } from './components/PrivacyBanner';
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard';
import { LegalPage } from './components/LegalPage';
import { NewsArchive } from './components/NewsArchive';
import { StoriesArchive } from './components/StoriesArchive';
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

function PageTitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/': 'Home | Resti Kiryandongo CBO',
      '/admin': 'Admin Dashboard | Resti Kiryandongo',
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
    };

    if (pathname.startsWith('/news/')) {
      document.title = 'News Article | Resti Kiryandongo';
    } else if (pathname.startsWith('/programs/')) {
      document.title = 'Program Details | Resti Kiryandongo';
    } else {
      document.title = titleMap[pathname] || 'Resti Kiryandongo CBO';
    }
  }, [pathname]);

  return null;
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
        <About />
        <Programs />
        <Team />
        <ImpactStories />
        <ImpactDashboard />
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
      <PrivacyBanner />
    </div>
  );
}

function AdminPage() {
  return <EnhancedAdminDashboard />;
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
      <PrivacyBanner />
    </div>
  );
}

export default function App() {
  return (
    <DonationModalProvider>
    <BrowserRouter>
    <ScrollToTop />
    <PageTitleManager />
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
        <Route path="/programs/:id" element={<MainLayout><ProgramDetail /></MainLayout>} />
        <Route path="/team" element={<MainLayout><TeamPage /></MainLayout>} />
        <Route path="/reports" element={<MainLayout><ImpactReports /></MainLayout>} />
        <Route path="/volunteer" element={<MainLayout><VolunteerPage /></MainLayout>} />
        <Route path="/faqs" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/partners" element={<MainLayout><PartnersPage /></MainLayout>} />
        <Route path="/opportunities" element={<MainLayout><OpportunitiesPage /></MainLayout>} />
        <Route path="/donate" element={<MainLayout><CardPaymentPage /></MainLayout>} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
    <DonationModal />
    </BrowserRouter>
    </DonationModalProvider>
  );
}