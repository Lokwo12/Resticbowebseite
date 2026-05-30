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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customPages, setCustomPages] = useState<Array<{slug: string; title: string}>>([]);

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
    fetchCustomPages();
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
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

  const fetchCustomPages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        const published = (data.pages || []).filter((p: any) => p.published);
        setCustomPages(published.map((p: any) => ({ slug: p.slug, title: p.title })));
      }
    } catch {
      // silently ignore
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
      setActiveDropdown(null);
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
  const isSolid = scrolled || window.location.pathname !== '/';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${
        showHeader || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Announcement Bar */}
      {showAnnouncement && (
      <div className="announcement-bar bg-emerald-950 text-white text-[11px] sm:text-xs font-semibold tracking-wider uppercase py-2 text-center flex items-center justify-center gap-2 px-4 flex-wrap border-b border-emerald-900/30">
        <span className="flex items-center gap-1.5"><span className="animate-pulse text-emerald-400">🌍</span> {announcementText}</span>
        <Link
          to="/volunteer"
          className="inline-flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 px-3 py-0.5 rounded-full transition-all duration-300 font-bold font-heading tracking-tight text-[10px] tracking-wide"
        >
          Apply now <ChevronRight size={10} />
        </Link>
      </div>
      )}
      {/* Main nav */}
      <div className={`transition-all duration-300 ${
        isSolid 
          ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-100/80' 
          : 'bg-emerald-950/40 backdrop-blur-md border-b border-white/5'
      }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${isSolid ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/#home"
              className="flex items-center gap-3 group transition-transform hover:scale-102"
            >
              <img 
                src={getLogoUrl()} 
                alt="Resti Kiryandongo" 
                className={`rounded-full object-cover shadow-sm transition-all duration-300 group-hover:scale-105 border ${
                  isSolid 
                    ? 'h-12 w-12 sm:h-14 sm:w-14 border-emerald-500/20' 
                    : 'h-14 w-14 sm:h-16 sm:w-16 border-white/20'
                }`} 
              />
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold font-heading tracking-tight tracking-tight transition-colors ${
                  isSolid ? 'text-gray-800' : 'text-white'
                }`}>{settings.general?.siteName || 'Resti Kiryandongo'}</h1>
                <p className={`text-xs transition-colors ${
                  isSolid ? 'text-gray-600' : 'text-white/90'
                }`}>{settings.general?.tagline || 'Community Based Organization'}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link
              to="/#home"
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                isSolid 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300'
              }`}
            >
              Home
            </Link>
            
            {/* About Dropdown */}
            <div 
              className="nav-dropdown-container relative"
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onMouseEnter={() => setActiveDropdown('about')}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'about' ? null : 'about');
                }}
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 py-4 ${
                  isSolid 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                About <ChevronDown size={14} />
              </button>
              <div className={`absolute left-0 top-full w-48 transition-all duration-300 z-50 pt-0 ${
                activeDropdown === 'about' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
              }`}>
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden mt-1">
                  <div className="py-1">
                    <Link 
                      to="/about"
                      onClick={() => setActiveDropdown(null)} 
                      className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      About Us
                    </Link>
                    <Link 
                      to="/team" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Our Team
                    </Link>
                    <Link 
                      to="/faqs" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      FAQs
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/#programs"
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                isSolid 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300'
              }`}
            >
              Programs
            </Link>

            {/* Impact Dropdown */}
            <div 
              className="nav-dropdown-container relative"
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onMouseEnter={() => setActiveDropdown('impact')}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'impact' ? null : 'impact');
                }}
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 py-4 ${
                  isSolid 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                Impact <ChevronDown size={14} />
              </button>
              <div className={`absolute left-0 top-full w-48 transition-all duration-300 z-50 pt-0 ${
                activeDropdown === 'impact' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
              }`}>
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden mt-1">
                  <div className="py-1">
                    <Link 
                      to="/stories" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Impact Stories
                    </Link>
                    <Link 
                      to="/reports" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Impact Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Involved Dropdown */}
            <div 
              className="nav-dropdown-container relative"
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onMouseEnter={() => setActiveDropdown('involved')}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'involved' ? null : 'involved');
                }}
                className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all flex items-center gap-1 py-4 ${
                  isSolid 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white hover:text-emerald-300 drop-shadow'
                }`}
              >
                Get Involved <ChevronDown size={14} />
              </button>
              <div className={`absolute left-0 top-full w-48 transition-all duration-300 z-50 pt-0 ${
                activeDropdown === 'involved' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
              }`}>
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden mt-1">
                  <div className="py-1">
                    <Link 
                      to="/volunteer" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Volunteer
                    </Link>
                    <Link 
                      to="/opportunities" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Opportunities
                    </Link>
                    <Link 
                      to="/partners" 
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      Become a Partner
                    </Link>
                  </div>
                </div>
              </div>
            </div>


            <Link
              to="/contact"
              onClick={() => setActiveDropdown(null)}
              className={`transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all ${
                isSolid 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white hover:text-emerald-300'
              }`}
            >
              Contact
            </Link>
            <button
              onClick={() => { openDonationModal(); setActiveDropdown(null); }}
              className={`px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                isSolid
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg'
              }`}
            >
              Donate
            </button>
          </div>

          {/* Mobile right actions: hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isSolid
                  ? 'hover:bg-gray-100 text-gray-700'
                  : 'hover:bg-white/20 text-white'
              }`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden py-4 border-t max-h-[70vh] overflow-y-auto ${
            scrolled 
              ? 'border-gray-200 bg-white' 
              : 'border-white/20 bg-white/95 backdrop-blur-lg'
          }`}>
            <div className="flex flex-col space-y-3">
              <Link to="/#home" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Home
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                About Us
              </Link>
              <Link to="/#programs" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Our Programs
              </Link>
              <Link to="/team" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Our Team
              </Link>
              <Link to="/stories" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Impact Stories
              </Link>
              <Link to="/reports" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Impact Reports
              </Link>
              <Link to="/#events" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Events
              </Link>
              <Link to="/#gallery" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1">
                Gallery
              </Link>
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
              <Link to="/contact" className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>

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