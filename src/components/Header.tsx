import { Menu, X, Heart, ChevronRight, ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
const logo = '/logo.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModal';

interface SiteSettings {
  general: { siteName: string; tagline: string; logoUrl: string; };
  header?: { announcementText?: string; announcementLink?: string; showAnnouncement?: boolean; };
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { open: openDonationModal } = useDonationModal();
  const [settings, setSettings] = useState<SiteSettings>({
    general: { siteName: 'Resti Kiryandongo', tagline: 'Community Based Organization', logoUrl: logo },
    header: { announcementText: 'We are looking for volunteers in Kiryandongo', announcementLink: 'contact', showAnnouncement: true }
  });
  const [scrolled, setScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);

      // Track active section
      const sections = ['home', 'about', 'programs', 'impact', 'volunteer', 'contact'];
      const scrollPosition = currentScrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.settings) {
        setSettings(prev => ({
          ...prev,
          general: data.settings.general || prev.general,
          header: data.settings.header || prev.header,
        }));
      }
    } catch (error) {
      console.error('Error fetching header settings:', error);
      // Default settings already set as initial state — no action needed
    }
  };

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const getLogoUrl = () => {
    const logoUrl = settings.general?.logoUrl;
    if (!logoUrl || logoUrl.includes('figma:asset')) return logo;
    return logoUrl;
  };

  const announcementText = settings.header?.announcementText || 'We are looking for volunteers in Kiryandongo';
  const announcementLink = settings.header?.announcementLink || 'contact';
  const showAnnouncement = settings.header?.showAnnouncement !== false;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${
        showHeader || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Announcement Bar */}
      {showAnnouncement && (
      <div className="announcement-bar text-white text-xs font-medium py-1.5 text-center flex items-center justify-center gap-2 px-4 flex-wrap">
        <span>🌍 {announcementText}</span>
        <button
          onClick={() => scrollToSection(announcementLink)}
          className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full transition-colors font-semibold"
        >
          Apply now <ChevronRight size={12} />
        </button>
      </div>
      )}
      {/* Main nav */}
      <div className={`transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/10 backdrop-blur-md border-b border-white/20'
      }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={() => scrollToSection('home')} className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group">
              <img 
                src={getLogoUrl()} 
                alt={`${settings.general?.siteName || 'Resti Kiryandongo'} Logo`} 
                className={`w-auto max-w-[160px] object-contain transition-all duration-300 group-hover:scale-105 ${scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'}`} 
              />
              <div className="hidden sm:block">
                <h1 className={`leading-tight group-hover:text-emerald-600 transition-colors ${
                  scrolled ? 'text-emerald-700' : 'text-white drop-shadow-lg'
                }`}>{settings.general?.siteName || 'Resti Kiryandongo'}</h1>
                <p className={`text-xs transition-colors ${
                  scrolled ? 'text-gray-600' : 'text-white/90 drop-shadow'
                }`}>{settings.general?.tagline || 'Community Based Organization'}</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection('home')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              Home
            </button>
            <div className="relative group">
              <button
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 ${
                  scrolled 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                About <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 top-full w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pt-2">
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                  <div className="py-1">
                    <button onClick={() => scrollToSection('about')} className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">About Us</button>
                    <Link to="/team" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Our Team</Link>
                    <Link to="/faqs" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">FAQs</Link>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => scrollToSection('programs')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              Programs
            </button>
            <div className="relative group">
              <button
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 ${
                  scrolled 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                Impact <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 top-full w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pt-2">
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                  <div className="py-1">
                    <button onClick={() => scrollToSection('impact')} className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Impact Stories</button>
                    <Link to="/reports" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Impact Reports</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <button
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 ${
                  scrolled 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                Get Involved <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 top-full w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pt-2">
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                  <div className="py-1">
                    <Link to="/volunteer" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Volunteer</Link>
                    <Link to="/opportunities" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Opportunities</Link>
                    <Link to="/partners" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">Become a Partner</Link>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => scrollToSection('contact')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              Contact
            </button>
            <button
              onClick={openDonationModal}
              className={`px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                scrolled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg'
              }`}
            >
              Donate
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled 
                ? 'hover:bg-gray-100 text-gray-700' 
                : 'hover:bg-white/20 text-white'
            }`}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden py-4 border-t max-h-[70vh] overflow-y-auto ${
            scrolled 
              ? 'border-gray-200 bg-white' 
              : 'border-white/20 bg-white/95 backdrop-blur-lg'
          }`}>
            <div className="flex flex-col space-y-3">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Home
              </button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                About Us
              </button>
              <button onClick={() => scrollToSection('programs')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Our Programs
              </button>
              <Link to="/team" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Our Team
              </Link>
              <button onClick={() => scrollToSection('impact')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Impact Stories
              </button>
              <Link to="/reports" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Impact Reports
              </Link>
              <button onClick={() => scrollToSection('events')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Events
              </button>
              <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Gallery
              </button>
              <Link to="/partners" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Partners
              </Link>
              <Link to="/volunteer" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Volunteer
              </Link>
              <Link to="/opportunities" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Opportunities
              </Link>
              <Link to="/faqs" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </Link>
              <Link to="/news" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                News
              </Link>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Contact
              </button>
              <button onClick={openDonationModal} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors mt-2">
                Donate Now
              </button>
            </div>
          </div>
        )}
      </nav>
      </div>
    </header>
  );
}