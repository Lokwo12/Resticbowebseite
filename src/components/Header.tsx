import { Menu, X, Heart, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
const logo = '/logo.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SiteSettings {
  general: { siteName: string; tagline: string; logoUrl: string; };
  header?: { announcementText?: string; announcementLink?: string; showAnnouncement?: boolean; };
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    general: { siteName: 'Resti Kiryandongo', tagline: 'Community Based Organization', logoUrl: logo },
    header: { announcementText: 'We are looking for volunteers in Kiryandongo', announcementLink: 'contact', showAnnouncement: true }
  });
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Track active section
      const sections = ['home', 'about', 'programs', 'impact', 'volunteer', 'contact'];
      const scrollPosition = window.scrollY + 100;
      
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
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement Bar */}
      {showAnnouncement && (
      <div className="announcement-bar text-white text-xs font-medium py-1.5 text-center flex items-center justify-center gap-2">
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
                alt={`${settings.siteName} Logo`} 
                className={`w-auto transition-all duration-300 group-hover:scale-105 ${scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'}`} 
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
            <button
              onClick={() => scrollToSection('about')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              About
            </button>
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
            <button
              onClick={() => scrollToSection('impact')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => scrollToSection('volunteer')}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                scrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300 drop-shadow'
              }`}
            >
              Get Involved
            </button>
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
              onClick={() => scrollToSection('donate')}
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
              <button onClick={() => scrollToSection('team')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Our Team
              </button>
              <button onClick={() => scrollToSection('impact')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Impact Stories
              </button>
              <button onClick={() => scrollToSection('impact-dashboard')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Our Impact
              </button>
              <button onClick={() => scrollToSection('events')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Events
              </button>
              <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Gallery
              </button>
              <button onClick={() => scrollToSection('partners')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Partners
              </button>
              <button onClick={() => scrollToSection('volunteer')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Volunteer
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                FAQ
              </button>
              <button onClick={() => scrollToSection('resources')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Resources
              </button>
              <button onClick={() => scrollToSection('news')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                News
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Contact
              </button>
              <button onClick={() => scrollToSection('donate')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors mt-2">
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