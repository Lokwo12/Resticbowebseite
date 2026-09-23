import { 
  Menu, X, Heart, ChevronDown, Search, User, 
  Users, HelpCircle, FileText, BarChart3, 
  Calendar, Newspaper, FolderDown, HandHeart, Briefcase, Building2, 
  ShieldCheck, Sparkles, ExternalLink
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
const logo = '/logo.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useDonationModal } from './DonationModalContext';
import { GlobalSearch } from './GlobalSearch';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SiteSettings {
  general: { siteName: string; tagline: string; logoUrl: string; };
  header?: { announcementText?: string; announcementLink?: string; showAnnouncement?: boolean; };
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<string | null>('main');
  const { open: openDonationModal } = useDonationModal();
  const location = useLocation();

  const [settings, setSettings] = useState<SiteSettings>({
    general: { 
      siteName: 'RESTI', 
      tagline: 'Refugee Empowerment For Sustainable Transformation Initiative', 
      logoUrl: logo 
    },
    header: { 
      announcementText: 'Turning potential into sustainable transformation in fragile settings', 
      announcementLink: 'programs', 
      showAnnouncement: true 
    }
  });

  const [scrolled, setScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customPages, setCustomPages] = useState<Array<{slug: string; title: string}>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [donorUser, setDonorUser] = useState<any>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDonorUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setDonorUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 15);
      
      // Hide on scroll down after 120px, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    fetchSettings();
    fetchCustomPages();
  }, []);

  // Close dropdown on outside click
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
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            general: data.settings.general || prev.general,
            header: data.settings.header || prev.header,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching header settings:', error);
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

  const getLogoUrl = () => {
    const logoUrl = settings.general?.logoUrl;
    if (!logoUrl || logoUrl.includes('figma:asset')) return logo;
    return logoUrl;
  };

  const isSolid = scrolled || location.pathname !== '/';

  // Helper for active page styling
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.hash;
    return location.pathname.startsWith(path);
  };

  const toggleMobileSection = (section: string) => {
    setMobileSectionOpen(mobileSectionOpen === section ? null : section);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        showHeader || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Main Navbar Bar */}
      <div className={`transition-all duration-300 ${
        isSolid 
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-resti-neutral-border' 
          : 'bg-emerald-950/60 backdrop-blur-md border-b border-white/10'
      }`}>
        <nav className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between transition-all duration-300 h-16 sm:h-20 lg:h-24">
            
            {/* Logo & Brand Identity */}
            <div className="flex items-center shrink-0 mr-1 sm:mr-3 xl:mr-4">
              <Link 
                to="/#home"
                className="flex items-center gap-2 sm:gap-3 group"
                onClick={() => {
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <img 
                    src={getLogoUrl()} 
                    alt={settings.general?.siteName || 'RESTI'} 
                    className={`aspect-square rounded-full object-contain bg-white shadow-xs transition-all duration-300 group-hover:scale-105 p-1 ${
                      isSolid 
                        ? 'w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-2 border-emerald-500/30' 
                        : 'w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-2 border-white/90 shadow-md shadow-black/20'
                    }`} 
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></span>
                </div>
                
                <div className="flex flex-col text-left justify-center min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg sm:text-2xl font-black font-heading tracking-tight leading-none transition-colors ${
                      isSolid ? 'text-gray-900' : 'text-white'
                    }`}>
                      {settings.general?.siteName || 'RESTI'}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-200/60 leading-none">
                      CBO
                    </span>
                  </div>
                  
                  {/* Full subtitle on large screens, compact on tablets, hidden on small phones to prevent crowding */}
                  <p className={`hidden 2xl:block text-[11px] leading-tight mt-1 transition-colors max-w-[280px] truncate ${
                    isSolid ? 'text-gray-600' : 'text-emerald-100/90'
                  }`}>
                    {settings.general?.tagline || 'Refugee Empowerment For Sustainable Transformation Initiative'}
                  </p>
                  <p className={`hidden xl:block 2xl:hidden text-[11px] leading-tight mt-1 transition-colors max-w-[210px] truncate ${
                    isSolid ? 'text-gray-600' : 'text-emerald-100/90'
                  }`}>
                    Refugee Empowerment Initiative
                  </p>
                  <p className={`hidden sm:block xl:hidden text-[10px] leading-tight mt-0.5 transition-colors font-medium ${
                    isSolid ? 'text-emerald-700' : 'text-emerald-200'
                  }`}>
                    Kiryandongo, Uganda
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 flex-nowrap shrink-0">
              
              {/* Home */}
              <Link
                to="/"
                className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors whitespace-nowrap ${
                  isActive('/') && !location.hash
                    ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                    : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>

              {/* About Dropdown */}
              <div 
                className="nav-dropdown-container relative"
                onMouseEnter={() => setActiveDropdown('about')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'about' ? null : 'about')}
                  className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    isActive('/about') || isActive('/team') || isActive('/financials') || isActive('/faqs')
                      ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                      : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  About Us <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'about' ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute left-0 top-full pt-2 w-64 transition-all duration-200 z-50 ${
                  activeDropdown === 'about' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1.5 ring-1 ring-black/5">
                    <Link 
                      to="/about"
                      onClick={() => setActiveDropdown(null)} 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Sparkles size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">About RESTI</div>
                        <div className="text-[11px] text-gray-500">Mission, vision & values</div>
                      </div>
                    </Link>
                    <Link 
                      to="/team" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Users size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Our Team</div>
                        <div className="text-[11px] text-gray-500">Leadership & field staff</div>
                      </div>
                    </Link>
                    <Link 
                      to="/financials" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Financial Transparency</div>
                        <div className="text-[11px] text-gray-500">Audits & accountability</div>
                      </div>
                    </Link>
                    <Link 
                      to="/faqs" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-t border-slate-50 mt-1"
                    >
                      <HelpCircle size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Frequently Asked Questions</div>
                        <div className="text-[11px] text-gray-500">Answers to common inquiries</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Programs */}
              <Link
                to="/programs"
                className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors whitespace-nowrap ${
                  isActive('/programs')
                    ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                    : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                Programs
              </Link>

              {/* Impact Dropdown */}
              <div 
                className="nav-dropdown-container relative"
                onMouseEnter={() => setActiveDropdown('impact')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'impact' ? null : 'impact')}
                  className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    isActive('/stories') || isActive('/reports') || isActive('/impact-dashboard')
                      ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                      : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Impact <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'impact' ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute left-0 top-full pt-2 w-64 transition-all duration-200 z-50 ${
                  activeDropdown === 'impact' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1.5 ring-1 ring-black/5">
                    <Link 
                      to="/stories" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Sparkles size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Impact Stories</div>
                        <div className="text-[11px] text-gray-500">Real lives transformed</div>
                      </div>
                    </Link>
                    <Link 
                      to="/reports" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <FileText size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Impact Reports</div>
                        <div className="text-[11px] text-gray-500">Annual & field evaluations</div>
                      </div>
                    </Link>
                    <Link 
                      to="/impact-dashboard" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <BarChart3 size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Live Impact Dashboard</div>
                        <div className="text-[11px] text-gray-500">Real-time metrics & reach</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Media & Resources Dropdown */}
              <div 
                className="nav-dropdown-container relative"
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                  className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    isActive('/news') || isActive('/events') || isActive('/resources')
                      ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                      : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  News & Events <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute left-0 top-full pt-2 w-64 transition-all duration-200 z-50 ${
                  activeDropdown === 'resources' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1.5 ring-1 ring-black/5">
                    <Link 
                      to="/news" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Newspaper size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Latest News</div>
                        <div className="text-[11px] text-gray-500">Press releases & community news</div>
                      </div>
                    </Link>
                    <Link 
                      to="/events" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Calendar size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Events Calendar</div>
                        <div className="text-[11px] text-gray-500">Workshops & community drives</div>
                      </div>
                    </Link>
                    <Link 
                      to="/resources" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <FolderDown size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Resources & Downloads</div>
                        <div className="text-[11px] text-gray-500">Publications & toolkits</div>
                      </div>
                    </Link>

                    {/* Dynamic Custom Pages if any */}
                    {customPages.length > 0 && (
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">More Pages</div>
                        {customPages.map(page => (
                          <Link
                            key={page.slug}
                            to={`/pages/${page.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="block px-4 py-1.5 text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {page.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Get Involved Dropdown */}
              <div 
                className="nav-dropdown-container relative"
                onMouseEnter={() => setActiveDropdown('involved')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'involved' ? null : 'involved')}
                  className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    isActive('/opportunities') || isActive('/partners') || isActive('/donor')
                      ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                      : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Get Involved <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'involved' ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute left-0 top-full pt-2 w-64 transition-all duration-200 z-50 ${
                  activeDropdown === 'involved' ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1.5 ring-1 ring-black/5">
                    <Link 
                      to="/get-involved" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <HandHeart size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Get Involved</div>
                        <div className="text-[11px] text-gray-500">Ways to support & contribute</div>
                      </div>
                    </Link>
                    <Link 
                      to="/opportunities" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Briefcase size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Opportunities</div>
                        <div className="text-[11px] text-gray-500">Careers & internships</div>
                      </div>
                    </Link>
                    <Link 
                      to="/partners" 
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Building2 size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-[15px] text-gray-900 leading-tight">Become a Partner</div>
                        <div className="text-[11px] text-gray-500">Institutional collaborations</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <Link
                to="/contact"
                className={`px-2 xl:px-2.5 py-2 rounded-lg text-[15px] xl:text-[16px] font-medium transition-colors whitespace-nowrap ${
                  isActive('/contact')
                    ? isSolid ? 'text-resti-green font-bold bg-resti-green-light/90' : 'text-white font-bold bg-white/15'
                    : isSolid ? 'text-resti-neutral-dark hover:text-resti-green hover:bg-resti-neutral-offwhite' : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Right Action Controls */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0 ml-1 xl:ml-3">
              
              {/* Search Trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isSolid 
                    ? 'text-gray-600 hover:text-emerald-700 hover:bg-slate-100' 
                    : 'text-white/90 hover:text-white hover:bg-white/15'
                }`}
                title="Search website (Ctrl+K)"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher isSolid={isSolid} />

              {/* Donate Button */}
              <button
                onClick={() => { setActiveDropdown(null); openDonationModal(); }}
                className="btn-resti-donate text-[15px] cursor-pointer"
              >
                <Heart size={14} fill="currentColor" className="text-white" />
                <span>Donate</span>
              </button>
            </div>

            {/* Mobile Actions: Language + Search + Hamburger */}
            <div className="lg:hidden flex items-center gap-0.5 sm:gap-1">
              <LanguageSwitcher isSolid={isSolid} />
              
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isSolid ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                }`}
                aria-label="Search website"
              >
                <Search size={20} />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isSolid ? 'text-gray-800 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                }`}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-full bg-white shadow-2xl border-t border-slate-100 max-h-[82vh] overflow-y-auto z-50 animate-in slide-in-from-top duration-200">
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            
            {/* Quick Mobile CTAs */}
            <div>
              <button 
                onClick={() => { setMobileMenuOpen(false); openDonationModal(); }} 
                className="w-full flex items-center justify-center gap-1.5 bg-resti-green hover:bg-resti-green-dark text-white py-3 rounded-[10px] font-bold shadow-md shadow-resti-green/20 transition-all text-[15px] sm:text-[16px]"
              >
                <Heart size={16} fill="currentColor" className="text-white" />
                Donate Now
              </button>
            </div>

            {/* Categorized Mobile Navigation */}
            <div className="flex flex-col divide-y divide-slate-100">
              
              {/* Primary Links */}
              <div className="py-2 flex flex-col space-y-1">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-colors ${
                    isActive('/') && !location.hash ? 'bg-emerald-50 text-emerald-700' : 'text-gray-800 hover:bg-slate-50'
                  }`}
                >
                  <span>Home</span>
                </Link>

                <Link 
                  to="/programs" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-colors ${
                    isActive('/programs') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-800 hover:bg-slate-50'
                  }`}
                >
                  <span>Our Programs</span>
                </Link>

                <Link 
                  to="/contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-colors ${
                    isActive('/contact') ? 'bg-emerald-50 text-emerald-700' : 'text-gray-800 hover:bg-slate-50'
                  }`}
                >
                  <span>Contact Us</span>
                </Link>
              </div>

              {/* About Group */}
              <div className="py-2">
                <button 
                  onClick={() => toggleMobileSection('about')}
                  className="w-full flex items-center justify-between px-3 py-2 font-bold text-gray-900 rounded-lg hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" />
                    About RESTI
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${mobileSectionOpen === 'about' ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
                </button>

                {mobileSectionOpen === 'about' && (
                  <div className="pl-7 pr-3 py-1.5 flex flex-col space-y-1 animate-in fade-in duration-150">
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>About Us (Mission & Vision)</span>
                    </Link>
                    <Link to="/team" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Our Team & Leadership</span>
                    </Link>
                    <Link to="/financials" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Financial Transparency</span>
                    </Link>
                    <Link to="/faqs" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Frequently Asked Questions</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Impact Group */}
              <div className="py-2">
                <button 
                  onClick={() => toggleMobileSection('impact')}
                  className="w-full flex items-center justify-between px-3 py-2 font-bold text-gray-900 rounded-lg hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-emerald-600" />
                    Impact & Accountability
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${mobileSectionOpen === 'impact' ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
                </button>

                {mobileSectionOpen === 'impact' && (
                  <div className="pl-7 pr-3 py-1.5 flex flex-col space-y-1 animate-in fade-in duration-150">
                    <Link to="/stories" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Impact Stories</span>
                    </Link>
                    <Link to="/reports" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Annual Impact Reports</span>
                    </Link>
                    <Link to="/impact-dashboard" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Live Metrics Dashboard</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Media & Events Group */}
              <div className="py-2">
                <button 
                  onClick={() => toggleMobileSection('media')}
                  className="w-full flex items-center justify-between px-3 py-2 font-bold text-gray-900 rounded-lg hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Newspaper size={16} className="text-emerald-600" />
                    News & Resources
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${mobileSectionOpen === 'media' ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
                </button>

                {mobileSectionOpen === 'media' && (
                  <div className="pl-7 pr-3 py-1.5 flex flex-col space-y-1 animate-in fade-in duration-150">
                    <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Latest News & Press</span>
                    </Link>
                    <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Upcoming Events</span>
                    </Link>
                    <Link to="/resources" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Resources & Toolkits</span>
                    </Link>
                    {customPages.map(page => (
                      <Link 
                        key={page.slug} 
                        to={`/pages/${page.slug}`} 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="py-1.5 text-sm text-emerald-700 hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink size={12} />
                        <span>{page.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Get Involved Group */}
              <div className="py-2">
                <button 
                  onClick={() => toggleMobileSection('involved')}
                  className="w-full flex items-center justify-between px-3 py-2 font-bold text-gray-900 rounded-lg hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <HandHeart size={16} className="text-emerald-600" />
                    Get Involved
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${mobileSectionOpen === 'involved' ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
                </button>

                {mobileSectionOpen === 'involved' && (
                  <div className="pl-7 pr-3 py-1.5 flex flex-col space-y-1 animate-in fade-in duration-150">
                    <Link to="/get-involved" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-emerald-800 font-medium hover:text-emerald-600 flex items-center gap-2">
                      <span>Get Involved</span>
                    </Link>
                    <Link to="/opportunities" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Careers & Opportunities</span>
                    </Link>
                    <Link to="/partners" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-sm text-gray-700 hover:text-emerald-600 flex items-center gap-2">
                      <span>Become a Partner</span>
                    </Link>
                  </div>
                )}
              </div>

            </div>

            {/* Mobile Footer Meta */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-gray-500">
              <span>Kiryandongo Refugee Settlement</span>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-emerald-600 font-semibold hover:underline">
                Get Support →
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}