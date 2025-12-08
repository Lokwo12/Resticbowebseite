import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { LoadingScreen } from './components/LoadingScreen';
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
import { PrivacyBanner } from './components/PrivacyBanner';
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard';
import { DebugInfo } from './components/DebugInfo';
import { projectId, publicAnonKey } from './utils/supabase/info';

function HomePage() {
  useEffect(() => {
    // Initialize the backend with sample data
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
    <div className="min-h-screen bg-white">
      <Header />
      <main>
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
      <DebugInfo />
      <BackToTop />
      <FloatingContact />
      <PrivacyBanner />
    </div>
  );
}

function AdminPage() {
  return <EnhancedAdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}