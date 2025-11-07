import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import logo from 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GeneralSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!moreMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

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
      setSettings(data.settings.general);
    } catch (error) {
      console.error('Error fetching header settings:', error);
      // Set default settings if fetch fails
      setSettings({
        siteName: 'Resti Kiryandongo',
        tagline: 'Community Based Organization',
        logoUrl: logo
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
      setMoreMenuOpen(false);
    }
  };

  const primaryLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'programs', label: 'Programs' },
    { id: 'impact', label: 'Impact' },
    { id: 'volunteer', label: 'Get Involved' },
    { id: 'contact', label: 'Contact' },
  ];

  const secondaryLinks = [
    { id: 'team', label: 'Our Team' },
    { id: 'impact', label: 'Impact Stories' },
    { id: 'impact-dashboard', label: 'Impact Dashboard' },
    { id: 'events', label: 'Events' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'partners', label: 'Partners' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'faq', label: 'FAQ' },
    { id: 'resources', label: 'Resources' },
    { id: 'news', label: 'News' },
  ];

  const allMobileLinks = [...primaryLinks, ...secondaryLinks.filter(link => !primaryLinks.some(primary => primary.id === link.id))];

  // Determine which logo to use - imported logo or custom URL
  const getLogoUrl = () => {
    if (!settings) return logo;
    // If settings logo is the figma asset path or empty, use imported logo
    if (!settings.logoUrl || settings.logoUrl.includes('figma:asset')) {
      return logo;
    }
    // Otherwise use the custom logo URL
    return settings.logoUrl;
  };

  if (loading || !settings) {
    return <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16"></header>;
  }

  return (
    <header className={`fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={() => scrollToSection('home')} className="flex items-center gap-4 hover:opacity-90 transition-all duration-300 group">
              <img 
                src={getLogoUrl()} 
                alt={`${settings.siteName} Logo`} 
                className={`w-auto transition-all duration-300 group-hover:scale-105 ${scrolled ? 'h-16 sm:h-20 lg:h-24' : 'h-20 sm:h-24 lg:h-28'}`} 
              />
              <div className="hidden sm:block">
                <h1 className="text-emerald-700 leading-tight group-hover:text-emerald-600 transition-colors">{settings.siteName}</h1>
                <p className="text-xs text-gray-600">{settings.tagline}</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {primaryLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
              >
                {link.label}
              </button>
            ))}

            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                className="text-gray-700 hover:text-emerald-600 transition-all duration-300 flex items-center gap-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
              >
                More
                <ChevronDown size={16} className={`transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  {secondaryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection('donate')}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Donate
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col space-y-3">
              {allMobileLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-gray-700 hover:text-emerald-600 transition-colors text-left px-2 py-1"
                >
                  {link.label}
                </button>
              ))}
              <button onClick={() => scrollToSection('donate')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors mt-2">
                Donate Now
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
