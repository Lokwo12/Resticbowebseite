import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    }
  };

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
                <h1 className="text-emerald-700 leading-tight group-hover:text-emerald-600 transition-colors">{settings.siteName}</h1>
                <p className="text-xs text-gray-600">{settings.tagline}</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection('home')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('programs')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              Programs
            </button>
            <button
              onClick={() => scrollToSection('impact')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              Impact
            </button>
            <button
              onClick={() => scrollToSection('volunteer')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              Get Involved
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-700 hover:text-emerald-600 transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all"
            >
              Contact
            </button>
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
    </header>
  );
}
