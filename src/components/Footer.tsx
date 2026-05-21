import { Heart, Facebook, Twitter, Instagram, Mail, ArrowUp, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
const logo = '/logo.png';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useDonationModal } from './DonationModal';

interface FooterSettings {
  description: string;
  copyrightText: string;
  taglineBottom: string;
}

interface GeneralSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
}

interface ContactSettings {
  address: string;
  email: string;
  phone: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
}

export function Footer() {
  const { open: openDonationModal } = useDonationModal();
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    description: 'Empowering communities through education, healthcare, and sustainable development.',
    copyrightText: 'Resti Kiryandongo CBO. All rights reserved.',
    taglineBottom: 'Made with ❤️ for our community'
  });
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Resti Kiryandongo',
    tagline: 'Community Based Organization',
    logoUrl: logo
  });
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    address: 'Kiryandongo District, Uganda',
    email: 'info@restikirya.org',
    phone: '+256 XXX XXX XXX',
    socialLinks: {
      facebook: 'https://www.facebook.com/restikiryandongo',
      twitter: 'https://x.com/restikirya',
      instagram: 'https://www.instagram.com/restikiryandongo'
    }
  });

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [customPages, setCustomPages] = useState<Array<{slug: string; title: string}>>([]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    fetchSettings();
    fetchCustomPages();
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
      if (data.settings?.footer) setFooterSettings(data.settings.footer);
      if (data.settings?.general) setGeneralSettings(data.settings.general);
      if (data.settings?.contact) setContactSettings(data.settings.contact);
    } catch (error) {
      console.error('Error fetching footer settings:', error);
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
    }
  };

  // Determine which logo to use - imported logo or custom URL
  const getLogoUrl = () => {
    if (!generalSettings) return logo;
    // If settings logo is the figma asset path or empty, use imported logo
    if (!generalSettings.logoUrl || generalSettings.logoUrl.includes('figma:asset')) {
      return logo;
    }
    // Otherwise use the custom logo URL
    return generalSettings.logoUrl;
  };

  if (!footerSettings || !generalSettings || !contactSettings) {
    return <footer className="bg-gray-900 text-white py-12"></footer>;
  }

  return (
    <>
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
          {/* About */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="mb-4">
              <img src={getLogoUrl()} alt={`${generalSettings.siteName} Logo`} className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-slate-700 mb-2" />
              <h3 className="text-white mb-1">{generalSettings.siteName}</h3>
              <p className="text-sm text-gray-400 mb-3">{generalSettings.tagline}</p>
            </div>
            <p className="text-gray-400 text-sm">
              {footerSettings.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/#home" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Home</Link></li>
              <li><Link to="/#about" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">About Us</Link></li>
              <li><Link to="/#programs" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Programs</Link></li>
              <li><Link to="/team" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Our Team</Link></li>
              <li><Link to="/stories" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Impact Stories</Link></li>
              <li><Link to="/#events" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Events</Link></li>
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="mb-4">Get Involved</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/volunteer" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Volunteer</Link></li>
              <li><button onClick={openDonationModal} className="block text-left hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Donate</button></li>
              <li><Link to="/partners" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Become a Partner</Link></li>
              <li><Link to="/opportunities" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Opportunities</Link></li>
              <li><Link to="/#newsletter" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Newsletter</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/#gallery" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Gallery</Link></li>
              <li><Link to="/news" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">News</Link></li>
              <li><Link to="/faqs" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">FAQ</Link></li>
              <li><Link to="/reports" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Impact Reports</Link></li>
              <li><Link to="/#impact-dashboard" className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">Impact Dashboard</Link></li>
              {customPages.map(page => (
                <li key={page.slug}>
                  <Link to={`/pages/${page.slug}`} className="block hover:text-emerald-400 hover:translate-x-1 transition-all duration-300">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{contactSettings.address}</li>
              <li>
                <a href={`mailto:${contactSettings.email}`} className="hover:text-emerald-400 transition-colors">
                  {contactSettings.email}
                </a>
              </li>
              <li>{contactSettings.phone}</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a
                href={contactSettings.socialLinks.facebook}
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a
                href={contactSettings.socialLinks.twitter}
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a
                href={contactSettings.socialLinks.instagram}
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
              <a
                href={`mailto:${contactSettings.email}`}
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {footerSettings.copyrightText}
            </p>
            <div className="ngo-badge hidden md:inline-flex">
              <Shield size={12} /> Registered CBO · Uganda
            </div>
          </div>
          
          {/* Legal Links */}
          <div className="flex gap-4 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <Link to="/refund" className="hover:text-emerald-400 transition-colors">Refund Policy</Link>
          </div>

          <p className="text-sm text-gray-400 flex items-center gap-1">
            {footerSettings.taglineBottom.includes('❤️') ? (
              <>
                Made with <Heart size={16} className="text-red-500" /> for our community
              </>
            ) : (
              footerSettings.taglineBottom
            )}
          </p>
        </div>
      </div>
    </footer>

    {/* Back to top */}
    {showBackToTop && (
      <button
        onClick={scrollToTop}
        className="back-to-top"
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>
    )}
    </>
  );
}
