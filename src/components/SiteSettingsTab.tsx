import React, { useState, useEffect } from 'react';
import { ImpactDashboardManager } from './admin/ImpactDashboardManager';
import { ImpactReportsManager } from './admin/ImpactReportsManager';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Save, RefreshCw, Plus, Trash2, Upload, BarChart, Code, PieChart, TrendingUp, DollarSign, FileText, Heart, ShieldCheck, Sparkles, Globe, Eye, HelpCircle, Users, LayoutDashboard, HandHeart, Settings, Search, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const SETTING_CATEGORIES = [
  { id: 'all', label: 'All Modules' },
  { id: 'branding', label: 'Branding & Layout' },
  { id: 'content', label: 'Core Content' },
  { id: 'impact', label: 'Impact & Financials' },
  { id: 'engagement', label: 'Forms & Engagement' },
  { id: 'developer', label: 'Code & Analytics' },
];

export const SETTING_SECTIONS = [
  { id: 'general', label: 'General & SEO', category: 'branding', icon: Globe, desc: 'Site name, logo, metadata & favicon' },
  { id: 'header', label: 'Header & Banner', category: 'branding', icon: LayoutDashboard, desc: 'Top alert bar and main navigation' },
  { id: 'footer', label: 'Footer Links', category: 'branding', icon: Globe, desc: 'Footer columns, copyright & socials' },
  { id: 'legal', label: 'Legal Pages', category: 'branding', icon: ShieldCheck, desc: 'Privacy Notice & Terms of Service' },
  
  { id: 'hero', label: 'Hero Showcase', category: 'content', icon: Sparkles, desc: 'Homepage banner, sliders & primary CTA' },
  { id: 'about', label: 'About & Mission', category: 'content', icon: FileText, desc: 'Mission, vision, The Way We Work & story' },
  { id: 'sections', label: 'Section Headers', category: 'content', icon: FileText, desc: 'Subheadings and introductory blurbs' },

  { id: 'impactDashboard', label: 'Impact Dashboard', category: 'impact', icon: TrendingUp, desc: 'Live stats, KPI badges & methodology' },
  { id: 'impactReports', label: 'Impact Reports', category: 'impact', icon: FileText, desc: 'Publications, accountability pillars & disclosures' },
  { id: 'financials', label: 'Financials & Audits', category: 'impact', icon: PieChart, desc: 'Expenses chart, revenue & PDF audits' },

  { id: 'donation', label: 'Donation & Gateways', category: 'engagement', icon: DollarSign, desc: 'Presets, MTN/Airtel/Bank & allocation' },
  { id: 'donorPortal', label: "Donor's Portal", category: 'engagement', icon: HandHeart, desc: 'Manage your donation, tabs, field stories & FAQs' },
  { id: 'contact', label: 'Contact Info', category: 'engagement', icon: Users, desc: 'Headquarters, phone, email & field map' },

  { id: 'analytics', label: 'Analytics & Code', category: 'developer', icon: Code, desc: 'Google Tag, tracking & custom headers' },
];

export const DEFAULT_FINANCIALS = {
  badge: 'Transparency',
  title: 'Financial Transparency',
  description: 'We believe in complete transparency. See exactly how your contributions are making a difference in the Kiryandongo District.',
  expenses: [
    { name: 'Program Services', value: 75, color: '#10b981' },
    { name: 'Community Grants', value: 15, color: '#3b82f6' },
    { name: 'Management & General', value: 7, color: '#f59e0b' },
    { name: 'Fundraising', value: 3, color: '#8b5cf6' },
  ],
  revenue: [
    { year: '2022', revenue: 120000 },
    { year: '2023', revenue: 180000 },
    { year: '2024', revenue: 250000 },
    { year: '2025', revenue: 310000 },
  ],
  revenueNote: 'Consistent growth in support allows us to expand our sustainable programs every year.',
  reportsTitle: 'Annual Reports & Audits',
  reportsDescription: 'Download our comprehensive annual reports and audited financial statements to see detailed breakdowns of our impact and operations.',
  reports: [
    { year: '2025', title: 'Q1 Impact & Financial Summary', size: '2.4 MB', fileUrl: '#' },
    { year: '2024', title: 'Annual Report & Audited Financials', size: '5.1 MB', fileUrl: '#' },
    { year: '2023', title: 'Annual Report & Audited Financials', size: '4.8 MB', fileUrl: '#' },
    { year: '2022', title: 'Annual Report & Audited Financials', size: '3.9 MB', fileUrl: '#' },
  ],
  commitmentTitle: 'Committed to Transparency',
  commitmentDescription: 'We believe in complete transparency about how donations are used and the impact we create. Our annual reports provide detailed breakdowns of our programs, finances, and outcomes.',
  commitmentButtonText: 'Request More Information',
  commitmentButtonLink: '#contact'
};

export const DEFAULT_VOLUNTEER_SETTINGS = {
  heroTitle: 'Join Our Mission',
  heroSubtitle: 'Share your skills, make new friends, and be a part of positive change in Kiryandongo.',
  heroImage: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=1600&q=80',
  successTitle: 'Application Received!',
  successMessage: 'Thank you for your interest in volunteering with us. We have received your application and will get back to you shortly.'
};

export const DEFAULT_DONATION_PAGE_SETTINGS = {
  badge: 'DONATE NOW',
  title: 'Support the Community Foundation',
  subtitle: 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future.',
  secondarySubtitle: 'Every contribution makes a difference.',
  orgName: 'Refugee Empowerment For Sustainable Transformation Initiative CBO (RESTI)',
  orgSub: 'Registered CBO - Uganda NGO Bureau',
  leftQuote1: 'Your donation helps refugees and host communities access skills, strengthen livelihoods, and build a more resilient future. Every contribution makes a difference.',
  leftQuote2: 'When you donate to RESTI, you help refugees and host communities build sustainable livelihoods, access new opportunities, and create a better future. We can’t do this without your support. Please support RESTI today.',
  whySupportTitle: 'Why Your Support Matters',
  whySupportText: 'Every contribution helps us provide essential services to vulnerable families. Based on our latest financial disclosures, 90% of all public donations go directly to community programs, with only 10% used for essential administrative overhead.',
  programPercentage: '90%',
  programLabel: 'Goes to Programs',
  overheadPercentage: '10%',
  familiesSupported: '0',
  familiesLabel: 'Families Supported',
  privacyTitle: 'Security & Privacy is Important to Us',
  privacyText: 'Your details will be kept securely and will not be shared with third parties. Please see our Privacy Notice and Cookies Policy for more information.',
};

export const DEFAULT_IMPACT_DASHBOARD_SETTINGS = {
  badge: 'Live Impact',
  title: 'Our Impact',
  description: 'See the measurable impact of our work through data, statistics, and comprehensive reports.',
  peopleServedBadge: '+12% YoY',
  programsActiveBadge: 'Active',
  volunteersActiveBadge: 'Growing',
  fundsRaisedBadge: '2025',
  communitiesReachedBadge: 'Expanding',
  successRateBadge: 'Excellence',
  commitmentTitle: 'Committed to Transparency',
  commitmentDescription: 'We believe in complete transparency about how donations are used and the impact we create. Our annual reports provide detailed breakdowns of our programs, finances, and outcomes.',
  commitmentButtonText: 'Request More Information',
};

export const DEFAULT_DONOR_PORTAL_SETTINGS = {
  badge: 'RESTI Donor Portal',
  welcomePrefix: 'Welcome,',
  defaultName: 'Valued Supporter',
  makeGiftBtnText: 'Make a Gift',
  signOutBtnText: 'Sign Out',
  
  metric1Label: 'Total Contributed',
  metric2Label: 'Gifts Recorded',
  metric3Label: 'Official Receipts',
  metric4Label: 'Field Focus',
  metric4Value: 'Kiryandongo Settlements',

  tabOverviewLabel: 'Overview',
  tabHistoryLabel: 'Giving History & Receipts',
  tabManageLabel: 'Manage Donations',
  tabImpactLabel: 'Impact Updates',
  tabProfileLabel: 'My Profile',

  securityNote: 'Every contribution is strictly deployed to on-the-ground programs in Kiryandongo District, Uganda. We never sell or exchange donor details with outside third parties. For institutional auditing or grant matching letters, contact info@resticbo.org.',
  auditEmail: 'info@resticbo.org',

  manageTitle: 'Manage Your Donation',
  manageSubtitle: 'Manage payment cards, pause, or adjust your monthly gifts securely',
  manageDescription: 'Recurring donors are the backbone of RESTI\'s sustainability in fragile settlement environments. They ensure vulnerable children have tuition for the full academic year and allow vocational workshops to stock ongoing training tools.',
  billingProviderLabel: 'Billing Provider:',
  billingProviderValue: 'Secure PCI-DSS Level 1 Encrypted',
  buttonText: 'Manage Your Donation',
  buttonLoadingText: 'Connecting to Donation Portal...',
  sidebarPledgeTitle: 'Pledge $25 / Month',
  sidebarPledgeText: 'A monthly pledge of $25 provides 2 refugee women with vocational tailoring materials and Village Savings (VSLA) seed capital every single month.',
  sidebarPledgeButtonText: 'Set Up Monthly Gift',
  faqs: [
    {
      question: 'How do I change my monthly donation amount?',
      answer: 'Click the "Manage Your Donation" button above. You can update your pledge amount, change billing frequency, or switch cards directly.',
    },
    {
      question: 'Can I set up recurring gifts via Mobile Money?',
      answer: 'MTN MoMo and Airtel Money in Uganda require donor PIN authorization per transaction. For recurring automated support, card payments are recommended.',
    },
  ],

  impactBadge: 'Kiryandongo Field Dispatch',
  impactTitle: 'How Your Contributions Are Changing Lives',
  impactSubtitle: 'Because of dedicated supporters like you, RESTI continues to bridge emergency survival and sustainable dignity across settlements in Kiryandongo District, Uganda.',
  impactStories: [
    {
      title: 'Vocational Tailoring Cohort',
      description: '18 single refugee mothers completed their hands-on certification and received startup sewing machines to establish self-reliant village micro-enterprises.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Youth Digital Inclusion Center',
      description: 'Expanded workstation hours so 45+ adolescent youths can study computer literacy, CV building, and distance education curriculum weekly.',
      image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'VSLA Climate-Smart Farming',
      description: 'Disbursed drought-resilient maize and vegetable seeds to women-led agricultural clusters, securing nutritional resilience for 120+ children.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    },
  ],
  leadershipHeading: 'A Message From RESTI Leadership',
  leadershipQuote: '"On behalf of the refugee families and local host communities in Kiryandongo, thank you for walking this transformative journey with us."',
  leadershipAuthor: 'Mr. Kwaya Daniel Loborach',
  leadershipRole: 'Co-Founder, RESTI Uganda',
};

export const DEFAULT_TRUST_BADGES = [
  { icon: '🏛️', label: 'Registered CBO', sub: 'Uganda NGO Bureau' },
  { icon: '🌍', label: 'Community Focus', sub: 'Refugees & Host Communities' },
  { icon: '💯', label: '100% Transparent', sub: 'Annual Reports Published' },
  { icon: '🤝', label: 'Community-Led', sub: 'Locally Driven Solutions' },
];

export interface WayWeWorkItem {
  title: string;
  desc: string;
}

export interface WayWeWorkSettings {
  badge?: string;
  title?: string;
  intro: string;
  items: WayWeWorkItem[];
}

export const DEFAULT_WAY_WE_WORK: WayWeWorkSettings = {
  badge: 'Guiding Principles',
  title: 'The Way We Work',
  intro: 'Our values guide how we carry out our daily work and how we interact with each other, with communities, and with partners.',
  items: [
    {
      title: 'We value people.',
      desc: 'All people have inherent dignity and potential. We place communities at the centre of our work, treating everyone with respect regardless of ethnicity, gender, religion, age, or displacement status. We seek to enable people to live normal and peaceful lives, develop their potential, and build hope for the future.'
    },
    {
      title: 'We are committed.',
      desc: 'We aim for lasting change, not short-term assistance. We stay with communities beyond the initial crisis, supporting them as they move from relief to recovery and from potential to sustainable transformation.'
    },
    {
      title: 'We are good stewards.',
      desc: 'We use the resources entrusted to us in the most responsible, efficient, and transparent way. We are accountable to the communities we serve and to the partners and donors who support our work.'
    },
    {
      title: 'We serve with integrity.',
      desc: 'We uphold high standards of personal and organizational integrity. We are open and honest in how we deal and communicate with stakeholders, and we treat people with respect in all our interactions.'
    }
  ]
};

interface SiteSettingsTabProps {
  settings: any;
  onUpdate: () => void;
  accessToken: string;
  userRole?: string;
}

export function SiteSettingsTab({ settings: initialSettings, onUpdate, accessToken, userRole }: SiteSettingsTabProps) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setSettings((prev: any) => ({ ...prev, general: { ...prev.general, logoUrl: data.url } }));
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading slide photo...');
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      const newImages = [...(settings.hero?.backgroundImages || [])];
      newImages[index] = data.url;
      setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, backgroundImages: newImages } }));
      
      toast.success('Slide photo uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading story photo...');
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setSettings((prev: any) => ({
        ...prev,
        about: {
          ...prev.about,
          storyImage: data.url,
        },
      }));
      
      toast.success('Story photo uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading document...');
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      const currentReports = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
      currentReports[index] = {
        ...currentReports[index],
        fileUrl: data.url,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      setSettings((prev: any) => ({
        ...prev,
        financials: { ...(prev.financials || DEFAULT_FINANCIALS), reports: currentReports }
      }));
      toast.success('Document uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleVolunteerBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading banner image...');
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setSettings((prev: any) => ({
        ...prev,
        volunteer: { ...(prev.volunteer || DEFAULT_VOLUNTEER_SETTINGS), heroImage: data.url }
      }));
      toast.success('Banner uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleDonorImpactImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading story image...');
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      const currentStories = [...(settings.donorPortal?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories)];
      currentStories[index] = { ...currentStories[index], image: data.url };
      setSettings((prev: any) => ({
        ...prev,
        donorPortal: {
          ...(prev.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS),
          impactStories: currentStories,
        }
      }));
      toast.success('Story image uploaded successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({ settings }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast.success('Site settings saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings/initialize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      toast.success('Default settings initialized!');
      onUpdate();
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast.error('Failed to initialize settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings || Object.keys(settings).length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <h3 className="text-xl text-gray-900 mb-4">No Site Settings Found</h3>
          <p className="text-gray-600 mb-6">
            Initialize default site settings to get started with customizing your website.
          </p>
          <Button onClick={handleInitialize} disabled={saving}>
            <RefreshCw size={18} className="mr-2" />
            Initialize Default Settings
          </Button>
        </div>
      </Card>
    );
  }

  const visibleSections = SETTING_SECTIONS.filter((section) => {
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesSearch =
      !searchFilter.trim() ||
      section.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      section.desc.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeSectionInfo = SETTING_SECTIONS.find((s) => s.id === activeSection);
  const ActiveIcon = activeSectionInfo?.icon || Settings;

  return (
    <div className="space-y-6">
      {/* Sticky Header Control Bar */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Settings size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Site Customizer</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
                {activeSectionInfo && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <ActiveIcon size={12} className="text-emerald-500" />
                    Editing: {activeSectionInfo.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full visual and content control over homepage, donation portal, financial audits, and interactive forms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              title="Preview site changes in a new tab"
            >
              <ExternalLink size={13} className="text-emerald-500" />
              <span>Preview Site</span>
            </a>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save All Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        {/* Categorized Sub-tab Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          {/* Category Dropdown, Filter Pills & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropdown Category Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {SETTING_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Pills (hidden on mobile, visible on tablet+) */}
              <div className="hidden lg:flex items-center gap-1 overflow-x-auto pb-0">
                {SETTING_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Hide / Dropdown Module Grid Toggle */}
              <button
                type="button"
                onClick={() => setIsNavHidden(!isNavHidden)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition ml-auto sm:ml-0"
                title={isNavHidden ? 'Click to show all module cards' : 'Click to hide module cards'}
              >
                {isNavHidden ? (
                  <>
                    <ChevronDown size={13} className="text-emerald-500" />
                    <span>Dropdown Grid</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={13} className="text-slate-400" />
                    <span>Hide Grid</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative flex items-center shrink-0 w-full md:w-56">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter setting sections..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Clear filter"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Jump Dropdown when grid is hidden */}
          {isNavHidden && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <ActiveIcon size={16} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Editing: {activeSectionInfo?.label || activeSection}
                </span>
              </div>
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {SETTING_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tab Triggers Grid (Hideable / Dropdown) */}
          {!isNavHidden && (
            <TabsList className="bg-transparent p-0 h-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
              {visibleSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSection === sec.id;
                return (
                  <TabsTrigger
                    key={sec.id}
                    value={sec.id}
                    className={`h-auto flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm font-semibold'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title={sec.desc}
                  >
                    <Icon
                      size={18}
                      className={`mb-1.5 shrink-0 ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs leading-tight line-clamp-1">{sec.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          )}
        </div>

        {/* ===== HEADER & ANNOUNCEMENT BAR ===== */}
        <TabsContent value="header">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Header & Announcement Bar</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showAnnouncement"
                  checked={settings.header?.showAnnouncement !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, showAnnouncement: e.target.checked } })
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="showAnnouncement" className="text-sm text-gray-700">Show announcement bar at the top of the page</label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Announcement Text</label>
                <input
                  type="text"
                  value={settings.header?.announcementText || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, announcementText: e.target.value } })
                  }
                  placeholder="We are looking for volunteers in Kiryandongo"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Announcement Button Link (section ID)</label>
                <select
                  value={settings.header?.announcementLink || 'contact'}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, announcementLink: e.target.value } })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {['home','about','programs','impact','volunteer','contact','donate'].map(id => (
                    <option key={id} value={id}>{id.charAt(0).toUpperCase() + id.slice(1)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Which page section the "Apply now" button scrolls to.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.general?.siteName || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={settings.general?.tagline || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, tagline: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.general?.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Organization Logo</label>
                {/* Preview */}
                {settings.general?.logoUrl && (
                  <div className="mb-3 p-3 border rounded-lg bg-gray-50 flex items-center gap-4">
                    <img
                      src={settings.general.logoUrl}
                      alt="Logo preview"
                      className="h-14 w-auto max-w-[140px] object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-gray-500">Current logo</span>
                  </div>
                )}
                {/* Upload button */}
                <div className="flex gap-2 mb-2">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium ${logoUploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                    <Upload size={15} />
                    {logoUploading ? 'Uploading…' : 'Upload logo image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
                {/* Manual URL fallback */}
                <input
                  type="text"
                  value={settings.general?.logoUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, logoUrl: e.target.value },
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a file or paste a URL. Click Save after changing.</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Primary Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.general?.primaryColor || '#10b981'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, primaryColor: e.target.value },
                      })
                    }
                    className="w-20 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={settings.general?.primaryColor || '#10b981'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Badge Text</label>
                <input
                  type="text"
                  value={settings.hero?.badgeText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Main Title</label>
                <input
                  type="text"
                  value={settings.hero?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={settings.hero?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, subtitle: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primary Button Text</label>
                  <input
                    type="text"
                    value={settings.hero?.primaryButtonText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, primaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Secondary Button Text</label>
                  <input
                    type="text"
                    value={settings.hero?.secondaryButtonText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Hero Image URL</label>
                <input
                  type="text"
                  value={settings.hero?.imageUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, imageUrl: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Hero Background Slides</label>
                <div className="space-y-3">
                  {(settings.hero?.backgroundImages || []).map((imgUrl: string, index: number) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="w-24 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-sm relative group">
                        {imgUrl ? (
                          <img src={imgUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) => {
                              const newImages = [...(settings.hero?.backgroundImages || [])];
                              newImages[index] = e.target.value;
                              setSettings({
                                ...settings,
                                hero: { ...settings.hero, backgroundImages: newImages },
                              });
                            }}
                            placeholder="Image URL"
                            className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                          <label className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center justify-center transition-colors" title="Upload Photo">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleSlideUpload(e, index)}
                            />
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newImages = [...(settings.hero?.backgroundImages || [])];
                          newImages.splice(index, 1);
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, backgroundImages: newImages },
                          });
                        }}
                        className="p-2 text-red-500 hover:bg-red-100 bg-red-50 rounded-lg transition-colors mt-1"
                        title="Remove Slide"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newImages = [...(settings.hero?.backgroundImages || []), ''];
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, backgroundImages: newImages },
                      });
                    }}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-colors font-medium border border-dashed border-emerald-300 w-full justify-center"
                  >
                    <Plus size={16} /> Add Slide Photo
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These photos will rotate in the homepage background carousel. Paste image URLs to update them. If empty, default images will be used.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Hero Section Statistics (Impact Numbers)</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      These numbers appear directly across the homepage Hero section. Set them to 0 or any custom count.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          hero: {
                            ...settings.hero,
                            stats: [
                              { value: '0', label: 'Families Supported' },
                              { value: '0', label: 'Active Programs' },
                              { value: '0', label: 'Volunteers' }
                            ],
                          },
                        });
                        toast.success('Stats reset to 0 defaults. Click Save Changes to apply.');
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reset to 0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentStats = settings.hero?.stats || [
                          { value: '0', label: 'Families Supported' },
                          { value: '0', label: 'Active Programs' },
                          { value: '0', label: 'Volunteers' }
                        ];
                        setSettings({
                          ...settings,
                          hero: {
                            ...settings.hero,
                            stats: [...currentStats, { value: '0', label: 'New Metric' }],
                          },
                        });
                      }}
                      className="flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus size={14} /> Add Statistic
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(settings.hero?.stats && settings.hero.stats.length > 0
                    ? settings.hero.stats
                    : [
                        { value: '0', label: 'Families Supported' },
                        { value: '0', label: 'Active Programs' },
                        { value: '0', label: 'Volunteers' }
                      ]
                  ).map((stat: any, index: number) => (
                    <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="w-1/3">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Value / Count</label>
                        <input
                          type="text"
                          value={stat.value ?? '0'}
                          onChange={(e) => {
                            const statsList = settings.hero?.stats && settings.hero.stats.length > 0
                              ? [...settings.hero.stats]
                              : [
                                  { value: '0', label: 'Families Supported' },
                                  { value: '0', label: 'Active Programs' },
                                  { value: '0', label: 'Volunteers' }
                                ];
                            statsList[index] = { ...statsList[index], value: e.target.value };
                            setSettings({
                              ...settings,
                              hero: { ...settings.hero, stats: statsList },
                            });
                          }}
                          placeholder="0 or 100+"
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Label / Description</label>
                        <input
                          type="text"
                          value={stat.label || ''}
                          onChange={(e) => {
                            const statsList = settings.hero?.stats && settings.hero.stats.length > 0
                              ? [...settings.hero.stats]
                              : [
                                  { value: '0', label: 'Families Supported' },
                                  { value: '0', label: 'Active Programs' },
                                  { value: '0', label: 'Volunteers' }
                                ];
                            statsList[index] = { ...statsList[index], label: e.target.value };
                            setSettings({
                              ...settings,
                              hero: { ...settings.hero, stats: statsList },
                            });
                          }}
                          placeholder="e.g., Families Supported"
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const statsList = settings.hero?.stats && settings.hero.stats.length > 0
                            ? [...settings.hero.stats]
                            : [
                                { value: '0', label: 'Families Supported' },
                                { value: '0', label: 'Active Programs' },
                                { value: '0', label: 'Volunteers' }
                              ];
                          statsList.splice(index, 1);
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, stats: statsList },
                          });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors mt-5"
                        title="Remove Statistic"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">About Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.about?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Hero Video URL</label>
                  <input
                    type="text"
                    value={settings.about?.heroVideoUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        about: { ...settings.about, heroVideoUrl: e.target.value },
                      })
                    }
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mission Video URL</label>
                  <input
                    type="text"
                    value={settings.about?.missionVideoUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        about: { ...settings.about, missionVideoUrl: e.target.value },
                      })
                    }
                    placeholder="https://example.com/video2.mp4"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Introduction</label>
                <textarea
                  value={settings.about?.intro || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, intro: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mission Statement</label>
                <textarea
                  value={settings.about?.mission || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, mission: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Vision Statement</label>
                <textarea
                  value={settings.about?.vision || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, vision: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ── OUR STORY SECTION (HEADLINE & FEATURED PHOTO BESIDE IT) ── */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-base font-bold text-gray-900">
                    Our Story (Headline, Photo & Narrative)
                  </label>
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    About Page Showcase
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Configure the movement headline, section tag, featured community photograph, and narrative paragraphs displayed on the About page.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Section Tag / Badge</label>
                    <input
                      type="text"
                      value={settings.about?.storyBadge || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          about: { ...settings.about, storyBadge: e.target.value },
                        })
                      }
                      placeholder="Our Story"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Main Story Headline / Movement Title
                    </label>
                    <input
                      type="text"
                      value={settings.about?.storyTitle || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          about: { ...settings.about, storyTitle: e.target.value },
                        })
                      }
                      placeholder="From a small village initiative to a district-wide movement."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-gray-900"
                    />
                  </div>

                  {/* Story Featured Photo beside headline */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Story Photo (Featured Right Beside Headline)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="w-36 h-24 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group">
                        {settings.about?.storyImage ? (
                          <img
                            src={settings.about.storyImage}
                            alt="Story preview"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <img
                            src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80"
                            alt="Default story preview"
                            className="w-full h-full object-cover opacity-60"
                          />
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={settings.about?.storyImage || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                about: { ...settings.about, storyImage: e.target.value },
                              })
                            }
                            placeholder="https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80"
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <label
                            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition shrink-0"
                            title="Upload new story photo"
                          >
                            <Upload size={14} />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleStoryImageUpload}
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Recommended: High-resolution community photograph (1200×800px).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Narrative Paragraphs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700">Narrative Story Paragraphs</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newStory = [...(settings.about?.story || []), ''];
                        setSettings({
                          ...settings,
                          about: { ...settings.about, story: newStory },
                        });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <Plus size={13} /> Add Paragraph
                    </button>
                  </div>
                  {(settings.about?.story || []).map((paragraph: string, index: number) => (
                    <div key={index} className="flex gap-2 items-start">
                      <textarea
                        value={paragraph}
                        onChange={(e) => {
                          const newStory = [...(settings.about?.story || [])];
                          newStory[index] = e.target.value;
                          setSettings({
                            ...settings,
                            about: { ...settings.about, story: newStory },
                          });
                        }}
                        rows={3}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder={`Paragraph ${index + 1}...`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newStory = [...(settings.about?.story || [])];
                          newStory.splice(index, 1);
                          setSettings({
                            ...settings,
                            about: { ...settings.about, story: newStory },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition mt-1"
                        title="Remove paragraph"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Way We Work (Guiding Principles) */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="block text-base font-bold text-gray-900">
                        The Way We Work (Guiding Principles)
                      </label>
                      <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Featured on About & Homepage
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage the guiding principles, section badge, title, intro text, and each organizational value statement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentWWW = settings.about?.wayWeWork || DEFAULT_WAY_WE_WORK;
                        const newItems = [...(currentWWW.items || []), { title: '', desc: '' }];
                        setSettings({
                          ...settings,
                          about: {
                            ...settings.about,
                            wayWeWork: { ...currentWWW, items: newItems }
                          }
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <Plus size={15} /> Add Principle
                    </button>
                  </div>
                </div>

                {/* Header & Intro settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Section Badge</label>
                    <input
                      type="text"
                      value={(settings.about?.wayWeWork?.badge !== undefined) ? settings.about.wayWeWork.badge : DEFAULT_WAY_WE_WORK.badge}
                      onChange={(e) => {
                        const currentWWW = settings.about?.wayWeWork || DEFAULT_WAY_WE_WORK;
                        setSettings({
                          ...settings,
                          about: {
                            ...settings.about,
                            wayWeWork: { ...currentWWW, badge: e.target.value }
                          }
                        });
                      }}
                      placeholder="Guiding Principles"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Section Heading</label>
                    <input
                      type="text"
                      value={(settings.about?.wayWeWork?.title !== undefined) ? settings.about.wayWeWork.title : DEFAULT_WAY_WE_WORK.title}
                      onChange={(e) => {
                        const currentWWW = settings.about?.wayWeWork || DEFAULT_WAY_WE_WORK;
                        setSettings({
                          ...settings,
                          about: {
                            ...settings.about,
                            wayWeWork: { ...currentWWW, title: e.target.value }
                          }
                        });
                      }}
                      placeholder="The Way We Work"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Introductory Statement</label>
                    <textarea
                      value={(settings.about?.wayWeWork?.intro !== undefined) ? settings.about.wayWeWork.intro : DEFAULT_WAY_WE_WORK.intro}
                      onChange={(e) => {
                        const currentWWW = settings.about?.wayWeWork || DEFAULT_WAY_WE_WORK;
                        setSettings({
                          ...settings,
                          about: {
                            ...settings.about,
                            wayWeWork: { ...currentWWW, intro: e.target.value }
                          }
                        });
                      }}
                      rows={2}
                      placeholder="Our values guide how we carry out our daily work..."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Principle cards */}
                <div className="space-y-3">
                  {((settings.about?.wayWeWork?.items !== undefined) ? settings.about.wayWeWork.items : DEFAULT_WAY_WE_WORK.items).map((item: any, index: number) => {
                    const currentWWW = settings.about?.wayWeWork || DEFAULT_WAY_WE_WORK;
                    const itemsList = currentWWW.items || [];
                    return (
                      <div key={index} className="flex gap-3 items-start p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Principle Title</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...itemsList];
                                updated[index] = { ...updated[index], title: e.target.value };
                                setSettings({
                                  ...settings,
                                  about: {
                                    ...settings.about,
                                    wayWeWork: { ...currentWWW, items: updated }
                                  }
                                });
                              }}
                              placeholder="e.g. We value people."
                              className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Description / Commitment</label>
                            <textarea
                              value={item.desc}
                              onChange={(e) => {
                                const updated = [...itemsList];
                                updated[index] = { ...updated[index], desc: e.target.value };
                                setSettings({
                                  ...settings,
                                  about: {
                                    ...settings.about,
                                    wayWeWork: { ...currentWWW, items: updated }
                                  }
                                });
                              }}
                              rows={3}
                              placeholder="Description of this guiding principle..."
                              className="w-full px-3 py-2 text-sm text-gray-700 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 mt-6">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              if (index === 0) return;
                              const updated = [...itemsList];
                              const temp = updated[index - 1];
                              updated[index - 1] = updated[index];
                              updated[index] = temp;
                              setSettings({
                                ...settings,
                                about: {
                                  ...settings.about,
                                  wayWeWork: { ...currentWWW, items: updated }
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={index === itemsList.length - 1}
                            onClick={() => {
                              if (index === itemsList.length - 1) return;
                              const updated = [...itemsList];
                              const temp = updated[index + 1];
                              updated[index + 1] = updated[index];
                              updated[index] = temp;
                              setSettings({
                                ...settings,
                                about: {
                                  ...settings.about,
                                  wayWeWork: { ...currentWWW, items: updated }
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = itemsList.filter((_: any, i: number) => i !== index);
                              setSettings({
                                ...settings,
                                about: {
                                  ...settings.about,
                                  wayWeWork: { ...currentWWW, items: updated }
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Principle"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {(!settings.about?.wayWeWork?.items || settings.about.wayWeWork.items.length === 0) && (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-gray-500 mb-2">No custom principles defined. Default principles are currently showing on the website.</p>
                      <button
                        type="button"
                        onClick={() => setSettings({
                          ...settings,
                          about: {
                            ...settings.about,
                            wayWeWork: DEFAULT_WAY_WE_WORK
                          }
                        })}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Load Default Principles
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-900">Legacy Core Values</label>
                  <button
                    onClick={() => {
                      const newValues = [...(settings.about?.values || []), { icon: 'Heart', title: '', description: '' }];
                      setSettings({ ...settings, about: { ...settings.about, values: newValues } });
                    }}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus size={16} /> Add Value
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.about?.values || []).map((val: any, index: number) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-4">
                          <select
                            value={val.icon}
                            onChange={(e) => {
                              const newValues = [...(settings.about?.values || [])];
                              newValues[index] = { ...newValues[index], icon: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, values: newValues } });
                            }}
                            className="w-1/3 px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Heart">Heart</option>
                            <option value="Users">Users</option>
                            <option value="Target">Target</option>
                            <option value="Award">Award</option>
                          </select>
                          <input
                            type="text"
                            value={val.title}
                            onChange={(e) => {
                              const newValues = [...(settings.about?.values || [])];
                              newValues[index] = { ...newValues[index], title: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, values: newValues } });
                            }}
                            placeholder="Value Title (e.g. Compassion)"
                            className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <textarea
                          value={val.description}
                          onChange={(e) => {
                            const newValues = [...(settings.about?.values || [])];
                            newValues[index] = { ...newValues[index], description: e.target.value };
                            setSettings({ ...settings, about: { ...settings.about, values: newValues } });
                          }}
                          placeholder="Description of the value..."
                          rows={2}
                          className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newValues = settings.about.values.filter((_: any, i: number) => i !== index);
                          setSettings({ ...settings, about: { ...settings.about, values: newValues } });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Value"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(!settings.about?.values || settings.about.values.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No core values added yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-900">Timeline / Milestones</label>
                  <button
                    onClick={() => {
                      const newTimeline = [...(settings.about?.timeline || []), { year: '', title: '', desc: '' }];
                      setSettings({ ...settings, about: { ...settings.about, timeline: newTimeline } });
                    }}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus size={16} /> Add Event
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.about?.timeline || []).map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={item.year}
                            onChange={(e) => {
                              const newTimeline = [...(settings.about?.timeline || [])];
                              newTimeline[index] = { ...newTimeline[index], year: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, timeline: newTimeline } });
                            }}
                            placeholder="Year (e.g. 2023)"
                            className="w-1/3 px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const newTimeline = [...(settings.about?.timeline || [])];
                              newTimeline[index] = { ...newTimeline[index], title: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, timeline: newTimeline } });
                            }}
                            placeholder="Milestone Title"
                            className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <textarea
                          value={item.desc}
                          onChange={(e) => {
                            const newTimeline = [...(settings.about?.timeline || [])];
                            newTimeline[index] = { ...newTimeline[index], desc: e.target.value };
                            setSettings({ ...settings, about: { ...settings.about, timeline: newTimeline } });
                          }}
                          placeholder="Description of the milestone..."
                          rows={2}
                          className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newTimeline = settings.about.timeline.filter((_: any, i: number) => i !== index);
                          setSettings({ ...settings, about: { ...settings.about, timeline: newTimeline } });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(!settings.about?.timeline || settings.about.timeline.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No timeline events added yet.</p>
                  )}
                </div>
              </div>

              {/* Trust & Accreditations Badges (Key Credibility Highlights) */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                  <div>
                    <label className="block text-base font-bold text-gray-900">
                      Trust, Accreditations & Key Highlights
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Prominent credibility badges displayed on the About section (e.g. Registered CBO, Uganda NGO Bureau, 100% Transparent).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentBadges = settings.about?.trustBadges || DEFAULT_TRUST_BADGES;
                      const newBadges = [...currentBadges, { icon: '✨', label: '', sub: '' }];
                      setSettings({ ...settings, about: { ...settings.about, trustBadges: newBadges } });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer w-fit"
                  >
                    <Plus size={15} /> Add Credibility Badge
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(settings.about?.trustBadges || DEFAULT_TRUST_BADGES).map((badge: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                      <div className="w-16 shrink-0">
                        <label className="block text-[11px] font-bold uppercase text-emerald-800 tracking-wider mb-1 text-center">Emoji</label>
                        <input
                          type="text"
                          value={badge.icon}
                          onChange={(e) => {
                            const newBadges = [...(settings.about?.trustBadges || DEFAULT_TRUST_BADGES)];
                            newBadges[index] = { ...newBadges[index], icon: e.target.value };
                            setSettings({ ...settings, about: { ...settings.about, trustBadges: newBadges } });
                          }}
                          placeholder="🏛️"
                          className="w-full text-center text-2xl py-2 px-1 border border-emerald-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-inner"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Badge Title / Label</label>
                          <input
                            type="text"
                            value={badge.label}
                            onChange={(e) => {
                              const newBadges = [...(settings.about?.trustBadges || DEFAULT_TRUST_BADGES)];
                              newBadges[index] = { ...newBadges[index], label: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, trustBadges: newBadges } });
                            }}
                            placeholder="e.g. Registered CBO"
                            className="w-full px-3 py-2 text-sm font-bold text-gray-900 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Subtitle / Details</label>
                          <input
                            type="text"
                            value={badge.sub}
                            onChange={(e) => {
                              const newBadges = [...(settings.about?.trustBadges || DEFAULT_TRUST_BADGES)];
                              newBadges[index] = { ...newBadges[index], sub: e.target.value };
                              setSettings({ ...settings, about: { ...settings.about, trustBadges: newBadges } });
                            }}
                            placeholder="e.g. Uganda NGO Bureau"
                            className="w-full px-3 py-1.5 text-xs text-gray-700 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentBadges = settings.about?.trustBadges || DEFAULT_TRUST_BADGES;
                          const newBadges = currentBadges.filter((_: any, i: number) => i !== index);
                          setSettings({ ...settings, about: { ...settings.about, trustBadges: newBadges } });
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-6 shrink-0"
                        title="Delete Badge"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {(!settings.about?.trustBadges || settings.about.trustBadges.length === 0) && (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-gray-500 mb-2">No custom trust badges configured. Default badges are currently showing on the website.</p>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, about: { ...settings.about, trustBadges: DEFAULT_TRUST_BADGES } })}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Load Default Badges
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ===== FINANCIAL TRANSPARENCY & AUDITS ===== */}
        <TabsContent value="financials">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <PieChart size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Financial Transparency & Audits</h3>
                <p className="text-sm text-gray-500">Manage all texts, expense breakdowns, revenue charts, and downloadable audited reports on the Financials page (/financials).</p>
              </div>
            </div>

            {/* Page Header Settings */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-4">
              <h4 className="text-sm font-bold text-gray-800">Page Header</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={settings.financials?.badge ?? DEFAULT_FINANCIALS.badge}
                    onChange={(e) => setSettings({
                      ...settings,
                      financials: { ...(settings.financials || DEFAULT_FINANCIALS), badge: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={settings.financials?.title ?? DEFAULT_FINANCIALS.title}
                    onChange={(e) => setSettings({
                      ...settings,
                      financials: { ...(settings.financials || DEFAULT_FINANCIALS), title: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle / Mission Statement</label>
                <textarea
                  value={settings.financials?.description ?? DEFAULT_FINANCIALS.description}
                  onChange={(e) => setSettings({
                    ...settings,
                    financials: { ...(settings.financials || DEFAULT_FINANCIALS), description: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Where The Money Goes (Expense Allocation) */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Expense Allocation (Where The Money Goes)</h4>
                  <p className="text-xs text-gray-500">Percentages shown on the interactive allocation pie chart.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentExpenses = settings.financials?.expenses || DEFAULT_FINANCIALS.expenses;
                    setSettings({
                      ...settings,
                      financials: {
                        ...(settings.financials || DEFAULT_FINANCIALS),
                        expenses: [...currentExpenses, { name: 'New Category', value: 10, color: '#06b6d4' }]
                      }
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  <Plus size={14} /> Add Category
                </button>
              </div>

              <div className="space-y-3">
                {(settings.financials?.expenses || DEFAULT_FINANCIALS.expenses).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1">Category Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const exp = [...(settings.financials?.expenses || DEFAULT_FINANCIALS.expenses)];
                          exp[idx] = { ...exp[idx], name: e.target.value };
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), expenses: exp } });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[11px] text-gray-500 mb-1">Percent (%)</label>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => {
                          const exp = [...(settings.financials?.expenses || DEFAULT_FINANCIALS.expenses)];
                          exp[idx] = { ...exp[idx], value: Number(e.target.value) };
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), expenses: exp } });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[11px] text-gray-500 mb-1">Color</label>
                      <input
                        type="color"
                        value={item.color || '#10b981'}
                        onChange={(e) => {
                          const exp = [...(settings.financials?.expenses || DEFAULT_FINANCIALS.expenses)];
                          exp[idx] = { ...exp[idx], color: e.target.value };
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), expenses: exp } });
                        }}
                        className="w-full h-8 p-0.5 border rounded-md cursor-pointer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const exp = [...(settings.financials?.expenses || DEFAULT_FINANCIALS.expenses)];
                        exp.splice(idx, 1);
                        setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), expenses: exp } });
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mt-4"
                      title="Remove Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Growth (Revenue Bar Chart) */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Funding Growth (Annual Revenue)</h4>
                  <p className="text-xs text-gray-500">Amounts displayed in the Funding Growth bar chart.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentRev = settings.financials?.revenue || DEFAULT_FINANCIALS.revenue;
                    setSettings({
                      ...settings,
                      financials: {
                        ...(settings.financials || DEFAULT_FINANCIALS),
                        revenue: [...currentRev, { year: '2026', revenue: 350000 }]
                      }
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  <Plus size={14} /> Add Year
                </button>
              </div>

              <div className="space-y-3">
                {(settings.financials?.revenue || DEFAULT_FINANCIALS.revenue).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="w-28">
                      <label className="block text-[11px] text-gray-500 mb-1">Year</label>
                      <input
                        type="text"
                        value={item.year}
                        onChange={(e) => {
                          const rev = [...(settings.financials?.revenue || DEFAULT_FINANCIALS.revenue)];
                          rev[idx] = { ...rev[idx], year: e.target.value };
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), revenue: rev } });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[11px] text-gray-500 mb-1">Total Revenue ($ USD)</label>
                      <input
                        type="number"
                        value={item.revenue}
                        onChange={(e) => {
                          const rev = [...(settings.financials?.revenue || DEFAULT_FINANCIALS.revenue)];
                          rev[idx] = { ...rev[idx], revenue: Number(e.target.value) };
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), revenue: rev } });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-md text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rev = [...(settings.financials?.revenue || DEFAULT_FINANCIALS.revenue)];
                        rev.splice(idx, 1);
                        setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), revenue: rev } });
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mt-4"
                      title="Remove Year"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chart Footnote Text</label>
                <input
                  type="text"
                  value={settings.financials?.revenueNote ?? DEFAULT_FINANCIALS.revenueNote}
                  onChange={(e) => setSettings({
                    ...settings,
                    financials: { ...(settings.financials || DEFAULT_FINANCIALS), revenueNote: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Annual Reports & Audited Statements Downloads */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Audited Financial Statements & Annual Reports</h4>
                  <p className="text-xs text-gray-500">Downloadable PDF reports displayed in the grid.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentReps = settings.financials?.reports || DEFAULT_FINANCIALS.reports;
                    setSettings({
                      ...settings,
                      financials: {
                        ...(settings.financials || DEFAULT_FINANCIALS),
                        reports: [...currentReps, { year: '2025', title: 'Annual Financial Audit Statement', size: '3.2 MB', fileUrl: '#' }]
                      }
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 shadow-sm"
                >
                  <Plus size={14} /> Add Report
                </button>
              </div>

              <div className="space-y-4">
                {(settings.financials?.reports || DEFAULT_FINANCIALS.reports).map((rep: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Report Title</label>
                        <input
                          type="text"
                          value={rep.title}
                          onChange={(e) => {
                            const reps = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
                            reps[idx] = { ...reps[idx], title: e.target.value };
                            setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), reports: reps } });
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Year</label>
                          <input
                            type="text"
                            value={rep.year}
                            onChange={(e) => {
                              const reps = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
                              reps[idx] = { ...reps[idx], year: e.target.value };
                              setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), reports: reps } });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">File Size</label>
                          <input
                            type="text"
                            value={rep.size}
                            onChange={(e) => {
                              const reps = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
                              reps[idx] = { ...reps[idx], size: e.target.value };
                              setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), reports: reps } });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={rep.fileUrl}
                          onChange={(e) => {
                            const reps = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
                            reps[idx] = { ...reps[idx], fileUrl: e.target.value };
                            setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), reports: reps } });
                          }}
                          placeholder="PDF URL (e.g. https://...)"
                          className="w-full px-3 py-1.5 border rounded-lg text-sm"
                        />
                      </div>
                      <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <Upload size={14} /> Upload PDF
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleReportUpload(e, idx)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const reps = [...(settings.financials?.reports || DEFAULT_FINANCIALS.reports)];
                          reps.splice(idx, 1);
                          setSettings({ ...settings, financials: { ...(settings.financials || DEFAULT_FINANCIALS), reports: reps } });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete Report"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Commitment to Transparency Callout */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-4">
              <h4 className="text-sm font-bold text-gray-800">Transparency Commitment Callout Banner</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Banner Headline</label>
                  <input
                    type="text"
                    value={settings.financials?.commitmentTitle ?? DEFAULT_FINANCIALS.commitmentTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      financials: { ...(settings.financials || DEFAULT_FINANCIALS), commitmentTitle: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={settings.financials?.commitmentButtonText ?? DEFAULT_FINANCIALS.commitmentButtonText}
                    onChange={(e) => setSettings({
                      ...settings,
                      financials: { ...(settings.financials || DEFAULT_FINANCIALS), commitmentButtonText: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Commitment Paragraph</label>
                <textarea
                  value={settings.financials?.commitmentDescription ?? DEFAULT_FINANCIALS.commitmentDescription}
                  onChange={(e) => setSettings({
                    ...settings,
                    financials: { ...(settings.financials || DEFAULT_FINANCIALS), commitmentDescription: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ===== IMPACT DASHBOARD SETTINGS ===== */}
        <TabsContent value="impactDashboard">
          <ImpactDashboardManager
            impactStats={settings.impactDashboard}
            onUpdate={onUpdate}
            accessToken={accessToken}
            userRole={userRole}
          />
        </TabsContent>

        {/* ===== IMPACT REPORTS SETTINGS ===== */}
        <TabsContent value="impactReports">
          <ImpactReportsManager
            initialData={settings.impactReports}
            onUpdate={onUpdate}
            accessToken={accessToken}
            userRole={userRole}
          />
        </TabsContent>

        {/* Contact Section */}
        <TabsContent value="contact">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.contact?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={settings.contact?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, subtitle: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={settings.contact?.address || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.contact?.email || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={settings.contact?.phone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phone: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">WhatsApp Number (international format, e.g. +256700000000)</label>
                <input
                  type="tel"
                  value={settings.contact?.whatsappNumber || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, whatsappNumber: e.target.value },
                    })
                  }
                  placeholder="+256700000000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for the WhatsApp quick-connect button on the Contact section.</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Social Links</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            facebook: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Facebook URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            twitter: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Twitter URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            instagram: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Instagram URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Branch Locations */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Branch Locations</h4>
                    <p className="text-xs text-gray-500">Add branch names, addresses and Google Maps embed links</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const locations = [...(settings.contact?.locations || [])];
                      locations.push({ name: 'New Branch', address: '', mapUrl: '' });
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, locations }
                      });
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Add Branch
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(settings.contact?.locations || []).map((loc: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 relative group">
                      <button 
                        onClick={() => {
                          const locations = settings.contact.locations.filter((_: any, i: number) => i !== idx);
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, locations }
                          });
                        }}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={loc.name}
                            onChange={(e) => {
                              const locations = [...settings.contact.locations];
                              locations[idx] = { ...locations[idx], name: e.target.value };
                              setSettings({ ...settings, contact: { ...settings.contact, locations } });
                            }}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Address</label>
                          <input
                            type="text"
                            value={loc.address}
                            onChange={(e) => {
                              const locations = [...settings.contact.locations];
                              locations[idx] = { ...locations[idx], address: e.target.value };
                              setSettings({ ...settings, contact: { ...settings.contact, locations } });
                            }}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">Google Maps Embed URL</label>
                        <input
                          type="text"
                          value={loc.mapUrl}
                          onChange={(e) => {
                            const locations = [...settings.contact.locations];
                            locations[idx] = { ...locations[idx], mapUrl: e.target.value };
                            setSettings({ ...settings, contact: { ...settings.contact, locations } });
                          }}
                          placeholder="https://www.google.com/maps/embed?..."
                          className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">To get this: Google Maps → Share → Embed a map → copy 'src' value from iframe.</p>
                      </div>
                    </div>
                  ))}
                  {(settings.contact?.locations || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-gray-400 text-sm">
                      No branch locations added.
                    </div>
                  )}
                </div>
              </div>
              {/* Working Hours */}
              <div className="pt-6 border-t mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">Office Hours</label>
                <input
                  type="text"
                  value={settings.contact?.workingHours || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, workingHours: e.target.value },
                    })
                  }
                  placeholder="Monday - Friday: 8:00 AM - 5:00 PM"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Department Contacts */}
              <div className="pt-6 border-t mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Direct Contacts / Departments</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const departments = [...(settings.contact?.departments || [])];
                      departments.push({ name: '', email: '' });
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, departments }
                      });
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Add Department
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(settings.contact?.departments || []).map((dept: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start group">
                      <input
                        type="text"
                        value={dept.name}
                        onChange={(e) => {
                          const departments = [...settings.contact.departments];
                          departments[idx] = { ...departments[idx], name: e.target.value };
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        placeholder="Department Name"
                        className="flex-1 px-3 py-1.5 text-sm border rounded-md"
                      />
                      <input
                        type="email"
                        value={dept.email}
                        onChange={(e) => {
                          const departments = [...settings.contact.departments];
                          departments[idx] = { ...departments[idx], email: e.target.value };
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-1.5 text-sm border rounded-md"
                      />
                      <button 
                        onClick={() => {
                          const departments = settings.contact.departments.filter((_: any, i: number) => i !== idx);
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Footer Section */}
        <TabsContent value="footer">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Footer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Footer Description</label>
                <textarea
                  value={settings.footer?.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, description: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={settings.footer?.copyrightText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, copyrightText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Bottom Tagline</label>
                <input
                  type="text"
                  value={settings.footer?.taglineBottom || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, taglineBottom: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Made with ❤️ for our community"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Legal Pages */}
        <TabsContent value="legal">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Legal Pages</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the content for your organization's legal pages. You can use simple text or HTML tags if needed.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Privacy Policy</label>
                <textarea
                  value={settings.legal?.privacyPolicy || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, privacyPolicy: e.target.value },
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Privacy Policy here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Terms of Service</label>
                <textarea
                  value={settings.legal?.termsOfService || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, termsOfService: e.target.value },
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Terms of Service here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Refund Policy</label>
                <textarea
                  value={settings.legal?.refundPolicy || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, refundPolicy: e.target.value },
                    })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Refund Policy here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Cookies Policy</label>
                <textarea
                  value={settings.legal?.cookiesPolicy || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, cookiesPolicy: e.target.value },
                    })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Cookies Policy here..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Section Headers */}
        <TabsContent value="sections">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-6">Section Headers & Descriptions</h3>
            <p className="text-sm text-gray-600 mb-6">
              Customize the title and description for each major section of your website.
            </p>
            <div className="space-y-6">
              {/* Programs Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Programs Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.programs?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            programs: { ...settings.sections?.programs, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.programs?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            programs: { ...settings.sections?.programs, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* News Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">News Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.news?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            news: { ...settings.sections?.news, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.news?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            news: { ...settings.sections?.news, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Gallery Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.gallery?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            gallery: { ...settings.sections?.gallery, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.gallery?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            gallery: { ...settings.sections?.gallery, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Stories Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Stories Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.stories?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            stories: { ...settings.sections?.stories, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.stories?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            stories: { ...settings.sections?.stories, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Team Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.team?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            team: { ...settings.sections?.team, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.team?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            team: { ...settings.sections?.team, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Events Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Events Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.events?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            events: { ...settings.sections?.events, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.events?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            events: { ...settings.sections?.events, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Partners Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Partners Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.partners?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.partners?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <label className="block text-sm text-gray-700 mb-1">CTA Title</label>
                    <input
                      type="text"
                      value={settings.sections?.partners?.ctaTitle || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, ctaTitle: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g. Become a Partner"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">CTA Description</label>
                    <textarea
                      value={settings.sections?.partners?.ctaDescription || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, ctaDescription: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      placeholder="We're always looking for partnerships..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">FAQ Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.faq?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            faq: { ...settings.sections?.faq, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.faq?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            faq: { ...settings.sections?.faq, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Resources Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.resources?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.resources?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Volunteer Opportunities Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Volunteer Opportunities Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.opportunities?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.opportunities?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Dashboard Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Dashboard Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.impact?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.impact?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Resources Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.resources?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.resources?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Opportunities Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Opportunities Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.opportunities?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.opportunities?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Dashboard Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Dashboard Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.impact?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.impact?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ===== DONATION & PAYMENTS ===== */}
        <TabsContent value="donation">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Donation & Payment Details</h3>
            <p className="text-sm text-gray-500 mb-6">These values appear on the Donation page and are fully editable here.</p>
            <div className="space-y-6">
              {/* Donation Page Headlines & Messages */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Donation Page Banner & Headlines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={settings.donation?.badge ?? DEFAULT_DONATION_PAGE_SETTINGS.badge}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), badge: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Main Heading</label>
                    <input
                      type="text"
                      value={settings.donation?.title ?? DEFAULT_DONATION_PAGE_SETTINGS.title}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Subtitle</label>
                    <textarea
                      value={settings.donation?.subtitle ?? DEFAULT_DONATION_PAGE_SETTINGS.subtitle}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), subtitle: e.target.value }
                      })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Secondary Subtitle / Accent</label>
                    <textarea
                      value={settings.donation?.secondarySubtitle ?? DEFAULT_DONATION_PAGE_SETTINGS.secondarySubtitle}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), secondarySubtitle: e.target.value }
                      })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Left Card Mission Statements & Impact */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Mission Box & Impact Allocation</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Title</label>
                  <input
                    type="text"
                    value={settings.donation?.orgName ?? DEFAULT_DONATION_PAGE_SETTINGS.orgName}
                    onChange={(e) => setSettings({
                      ...settings,
                      donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), orgName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Subtitle</label>
                  <input
                    type="text"
                    value={settings.donation?.orgSub ?? DEFAULT_DONATION_PAGE_SETTINGS.orgSub}
                    onChange={(e) => setSettings({
                      ...settings,
                      donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), orgSub: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mission Quote 1 (Bold)</label>
                    <textarea
                      value={settings.donation?.leftQuote1 ?? DEFAULT_DONATION_PAGE_SETTINGS.leftQuote1}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), leftQuote1: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mission Quote 2 (Callout)</label>
                    <textarea
                      value={settings.donation?.leftQuote2 ?? DEFAULT_DONATION_PAGE_SETTINGS.leftQuote2}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), leftQuote2: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Why Your Support Matters (Title)</label>
                    <input
                      type="text"
                      value={settings.donation?.whySupportTitle ?? DEFAULT_DONATION_PAGE_SETTINGS.whySupportTitle}
                      onChange={(e) => setSettings({
                        ...settings,
                        donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), whySupportTitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Program % (e.g. 90%)</label>
                      <input
                        type="text"
                        value={settings.donation?.programPercentage ?? DEFAULT_DONATION_PAGE_SETTINGS.programPercentage}
                        onChange={(e) => setSettings({
                          ...settings,
                          donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), programPercentage: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Program Label</label>
                      <input
                        type="text"
                        value={settings.donation?.programLabel ?? DEFAULT_DONATION_PAGE_SETTINGS.programLabel}
                        onChange={(e) => setSettings({
                          ...settings,
                          donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), programLabel: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Why Your Support Matters (Text)</label>
                  <textarea
                    value={settings.donation?.whySupportText ?? DEFAULT_DONATION_PAGE_SETTINGS.whySupportText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), whySupportText: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Security & Privacy Notice */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-3">
                <h4 className="text-sm font-bold text-gray-800">Security & Privacy Guarantee</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Privacy Guarantee Title</label>
                  <input
                    type="text"
                    value={settings.donation?.privacyTitle ?? DEFAULT_DONATION_PAGE_SETTINGS.privacyTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), privacyTitle: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Privacy Guarantee Text</label>
                  <textarea
                    value={settings.donation?.privacyText ?? DEFAULT_DONATION_PAGE_SETTINGS.privacyText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donation: { ...(settings.donation || DEFAULT_DONATION_PAGE_SETTINGS), privacyText: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">MTN Mobile Money</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Merchant Number</label>
                  <input
                    type="text"
                    value={settings.donation?.merchantMTN || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, donation: { ...settings.donation, merchantMTN: e.target.value } })
                    }
                    placeholder="0772 000 000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Airtel Money</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Merchant Number</label>
                  <input
                    type="text"
                    value={settings.donation?.merchantAirtel || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, donation: { ...settings.donation, merchantAirtel: e.target.value } })
                    }
                    placeholder="0701 000 000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Bank Transfer Details</h4>
                <div className="space-y-3">
                  {[
                    { key: 'bankName', label: 'Bank Name', placeholder: 'Stanbic Bank Uganda' },
                    { key: 'accountName', label: 'Account Name', placeholder: 'RESTI' },
                    { key: 'accountNumber', label: 'Account Number', placeholder: '9030012345678' },
                    { key: 'branch', label: 'Branch', placeholder: 'Kiryandongo Branch' },
                    { key: 'swiftCode', label: 'SWIFT / BIC Code', placeholder: 'SBICUGKX' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={(settings.donation as any)?.[key] || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, donation: { ...settings.donation, [key]: e.target.value } })
                        }
                        placeholder={placeholder}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Donation Impact Breakdown */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Donation Impact Breakdown</h4>
                <p className="text-xs text-gray-500 mb-4">Set the dollar amounts and their descriptions.</p>
                <div className="space-y-6">
                  {[1, 2, 3].map((tierNum) => {
                    const tierKey = `tier${tierNum}` as 'tier1' | 'tier2' | 'tier3';
                    const amount = settings.donation_breakdown?.[tierKey]?.amount || '';
                    const desc = settings.donation_breakdown?.[tierKey]?.description || '';
                    
                    return (
                      <div key={tierKey} className="pb-4 border-b border-emerald-100 last:border-0 last:pb-0">
                        <div className="flex gap-4 mb-2">
                          <div className="w-24">
                            <label className="block text-xs text-gray-600 mb-1">Amount ($)</label>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => {
                                const bd = settings.donation_breakdown || { tier1: { amount: '', description: '' }, tier2: { amount: '', description: '' }, tier3: { amount: '', description: '' } };
                                setSettings({ ...settings, donation_breakdown: { ...bd, [tierKey]: { ...bd[tierKey], amount: e.target.value } } });
                              }}
                              className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Description</label>
                            <input
                              type="text"
                              value={desc}
                              onChange={(e) => {
                                const bd = settings.donation_breakdown || { tier1: { amount: '', description: '' }, tier2: { amount: '', description: '' }, tier3: { amount: '', description: '' } };
                                setSettings({ ...settings, donation_breakdown: { ...bd, [tierKey]: { ...bd[tierKey], description: e.target.value } } });
                              }}
                              className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Donor Portal Settings */}
        <TabsContent value="donorPortal">
          <Card className="p-6 sm:p-8 space-y-8 border-slate-200 dark:border-slate-800">
            {/* Super Admin Notice Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>👑</span> Super-Admin Managed Module
                  </span>
                  <span className="text-xs bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full font-mono">
                    /donor-portal
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Donor's Portal & Giving Management</h3>
                <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Full control over the donor self-service portal. Configure header greetings, metric labels, "Manage Your Donation" recurring billing options, FAQs, and field impact bulletins.
                </p>
              </div>
              <a
                href="/donor-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition"
              >
                <span>Preview Donor Portal</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* SECTION 1: HEADER & GREETINGS */}
            <div className="space-y-4 pt-2 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart size={18} className="text-emerald-600" />
                    Portal Header & Greet Banner
                  </h4>
                  <p className="text-xs text-slate-500">Configure the top hero banner displayed to authenticated donors.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Top Badge Label</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.badge ?? DEFAULT_DONOR_PORTAL_SETTINGS.badge}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), badge: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="RESTI Donor Portal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Welcome Greeting Prefix</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.welcomePrefix ?? DEFAULT_DONOR_PORTAL_SETTINGS.welcomePrefix}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), welcomePrefix: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Welcome,"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fallback Donor Name</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.defaultName ?? DEFAULT_DONOR_PORTAL_SETTINGS.defaultName}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), defaultName: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Valued Supporter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">"Make a Gift" Button Text</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.makeGiftBtnText ?? DEFAULT_DONOR_PORTAL_SETTINGS.makeGiftBtnText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), makeGiftBtnText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Make a Gift"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: LIVE METRICS CARDS */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart size={18} className="text-emerald-600" />
                  Live KPI Metric Grid Labels
                </h4>
                <p className="text-xs text-slate-500">Configure titles for the 4 metric cards on the donor overview.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metric 1 Label</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.metric1Label ?? DEFAULT_DONOR_PORTAL_SETTINGS.metric1Label}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), metric1Label: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Total Contributed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metric 2 Label</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.metric2Label ?? DEFAULT_DONOR_PORTAL_SETTINGS.metric2Label}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), metric2Label: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Gifts Recorded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metric 3 Label</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.metric3Label ?? DEFAULT_DONOR_PORTAL_SETTINGS.metric3Label}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), metric3Label: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Official Receipts"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Metric 4 (Field Focus)</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.metric4Value ?? DEFAULT_DONOR_PORTAL_SETTINGS.metric4Value}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), metric4Value: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Kiryandongo Settlements"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: TAB LABELS */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-emerald-600" />
                  Portal Navigation Tab Names
                </h4>
                <p className="text-xs text-slate-500">Customize the labels for the 4 navigation tabs inside the portal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tab 1 (History)</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.tabHistoryLabel ?? DEFAULT_DONOR_PORTAL_SETTINGS.tabHistoryLabel}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), tabHistoryLabel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tab 2 (Manage Donation)</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.tabManageLabel ?? DEFAULT_DONOR_PORTAL_SETTINGS.tabManageLabel}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), tabManageLabel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tab 3 (Impact)</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.tabImpactLabel ?? DEFAULT_DONOR_PORTAL_SETTINGS.tabImpactLabel}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), tabImpactLabel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tab 4 (Profile)</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.tabProfileLabel ?? DEFAULT_DONOR_PORTAL_SETTINGS.tabProfileLabel}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), tabProfileLabel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: MANAGE YOUR DONATION (SUPER ADMIN HIGHLIGHT) */}
            <div className="space-y-5 border-b border-slate-100 dark:border-slate-800 pb-8 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    <span>👑</span> Super-Admin Management: "Manage Your Donation"
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Subscription & Self-Service Portal Section
                  </h4>
                  <p className="text-xs text-slate-500">
                    Replace all Stripe-branded phrasing with clean, institutional "Manage Your Donation" controls.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.manageTitle ?? DEFAULT_DONOR_PORTAL_SETTINGS.manageTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), manageTitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    placeholder="Manage Your Donation"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Action Button Text</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.buttonText ?? DEFAULT_DONOR_PORTAL_SETTINGS.buttonText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), buttonText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700"
                    placeholder="Manage Your Donation"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.manageSubtitle ?? DEFAULT_DONOR_PORTAL_SETTINGS.manageSubtitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), manageSubtitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Manage payment cards, pause, or adjust your monthly gifts securely"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Button Connecting / Loading Text</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.buttonLoadingText ?? DEFAULT_DONOR_PORTAL_SETTINGS.buttonLoadingText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), buttonLoadingText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Connecting to Donation Portal..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section Description / Impact Note</label>
                  <textarea
                    rows={2}
                    value={settings.donorPortal?.manageDescription ?? DEFAULT_DONOR_PORTAL_SETTINGS.manageDescription}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), manageDescription: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Provider Label</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.billingProviderLabel ?? DEFAULT_DONOR_PORTAL_SETTINGS.billingProviderLabel}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), billingProviderLabel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Provider Display Value</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.billingProviderValue ?? DEFAULT_DONOR_PORTAL_SETTINGS.billingProviderValue}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), billingProviderValue: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Secure PCI-DSS Level 1 Encrypted"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sidebar Pledge Card Title</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.sidebarPledgeTitle ?? DEFAULT_DONOR_PORTAL_SETTINGS.sidebarPledgeTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), sidebarPledgeTitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sidebar Pledge Button Text</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.sidebarPledgeButtonText ?? DEFAULT_DONOR_PORTAL_SETTINGS.sidebarPledgeButtonText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), sidebarPledgeButtonText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sidebar Pledge Description</label>
                  <textarea
                    rows={2}
                    value={settings.donorPortal?.sidebarPledgeText ?? DEFAULT_DONOR_PORTAL_SETTINGS.sidebarPledgeText}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), sidebarPledgeText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle size={18} className="text-emerald-600" />
                    Manage Donation Tab FAQs
                  </h4>
                  <p className="text-xs text-slate-500">Edit or add frequently asked questions displayed to recurring donors.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const currentFaqs = settings.donorPortal?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs;
                    setSettings({
                      ...settings,
                      donorPortal: {
                        ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS),
                        faqs: [...currentFaqs, { question: 'New Question', answer: 'Answer goes here.' }]
                      }
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add FAQ
                </Button>
              </div>

              <div className="space-y-3">
                {(settings.donorPortal?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs).map((faq: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentFaqs = [...(settings.donorPortal?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs)];
                          currentFaqs.splice(idx, 1);
                          setSettings({
                            ...settings,
                            donorPortal: {
                              ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS),
                              faqs: currentFaqs
                            }
                          });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 text-xs flex items-center gap-1"
                        title="Delete FAQ"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const currentFaqs = [...(settings.donorPortal?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs)];
                          currentFaqs[idx] = { ...currentFaqs[idx], question: e.target.value };
                          setSettings({
                            ...settings,
                            donorPortal: {
                              ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS),
                              faqs: currentFaqs
                            }
                          });
                        }}
                        placeholder="Question..."
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const currentFaqs = [...(settings.donorPortal?.faqs || DEFAULT_DONOR_PORTAL_SETTINGS.faqs)];
                          currentFaqs[idx] = { ...currentFaqs[idx], answer: e.target.value };
                          setSettings({
                            ...settings,
                            donorPortal: {
                              ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS),
                              faqs: currentFaqs
                            }
                          });
                        }}
                        placeholder="Answer..."
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6: FIELD IMPACT BULLETINS */}
            <div className="space-y-5 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600" />
                  Field Impact Bulletins & Stories
                </h4>
                <p className="text-xs text-slate-500">Customize the 3 impact cards and leadership quote shown to donors in Tab 3.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Impact Badge</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.impactBadge ?? DEFAULT_DONOR_PORTAL_SETTINGS.impactBadge}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactBadge: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Impact Heading</label>
                  <input
                    type="text"
                    value={settings.donorPortal?.impactTitle ?? DEFAULT_DONOR_PORTAL_SETTINGS.impactTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactTitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Impact Subtitle / Intro</label>
                  <textarea
                    rows={2}
                    value={settings.donorPortal?.impactSubtitle ?? DEFAULT_DONOR_PORTAL_SETTINGS.impactSubtitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactSubtitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* 3 Impact Story Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {(settings.donorPortal?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories).map((story: any, sIdx: number) => (
                  <div key={sIdx} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Story #{sIdx + 1}
                    </span>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Story Title</label>
                      <input
                        type="text"
                        value={story.title}
                        onChange={(e) => {
                          const stories = [...(settings.donorPortal?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories)];
                          stories[sIdx] = { ...stories[sIdx], title: e.target.value };
                          setSettings({
                            ...settings,
                            donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactStories: stories }
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={story.description}
                        onChange={(e) => {
                          const stories = [...(settings.donorPortal?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories)];
                          stories[sIdx] = { ...stories[sIdx], description: e.target.value };
                          setSettings({
                            ...settings,
                            donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactStories: stories }
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={story.image}
                          onChange={(e) => {
                            const stories = [...(settings.donorPortal?.impactStories || DEFAULT_DONOR_PORTAL_SETTINGS.impactStories)];
                            stories[sIdx] = { ...stories[sIdx], image: e.target.value };
                            setSettings({
                              ...settings,
                              donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), impactStories: stories }
                            });
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[11px] outline-none"
                          placeholder="https://..."
                        />
                        <label className="cursor-pointer px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs flex items-center gap-1 shrink-0" title="Upload Image">
                          <Upload size={13} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDonorImpactImageUpload(e, sIdx)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leadership Box */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Leadership Sign-Off Section</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Heading</label>
                    <input
                      type="text"
                      value={settings.donorPortal?.leadershipHeading ?? DEFAULT_DONOR_PORTAL_SETTINGS.leadershipHeading}
                      onChange={(e) => setSettings({
                        ...settings,
                        donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), leadershipHeading: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Leader Full Name</label>
                    <input
                      type="text"
                      value={settings.donorPortal?.leadershipAuthor ?? DEFAULT_DONOR_PORTAL_SETTINGS.leadershipAuthor}
                      onChange={(e) => setSettings({
                        ...settings,
                        donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), leadershipAuthor: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Leader Title / Role</label>
                    <input
                      type="text"
                      value={settings.donorPortal?.leadershipRole ?? DEFAULT_DONOR_PORTAL_SETTINGS.leadershipRole}
                      onChange={(e) => setSettings({
                        ...settings,
                        donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), leadershipRole: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Leadership Quote</label>
                    <textarea
                      rows={2}
                      value={settings.donorPortal?.leadershipQuote ?? DEFAULT_DONOR_PORTAL_SETTINGS.leadershipQuote}
                      onChange={(e) => setSettings({
                        ...settings,
                        donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), leadershipQuote: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 7: AUDIT & PRIVACY FOOTER NOTE */}
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  Tax & Auditing Guarantee Note
                </h4>
                <p className="text-xs text-slate-500">Security note displayed at the bottom of the Giving History tab.</p>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={settings.donorPortal?.securityNote ?? DEFAULT_DONOR_PORTAL_SETTINGS.securityNote}
                  onChange={(e) => setSettings({
                    ...settings,
                    donorPortal: { ...(settings.donorPortal || DEFAULT_DONOR_PORTAL_SETTINGS), securityNote: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Quiz Settings */}
        {/* Analytics Settings */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Analytics Configuration</h3>
            <p className="text-sm text-gray-500 mb-6">Manage tracking and SEO analytics tools for your website.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Google Analytics Measurement ID</label>
                <input
                  type="text"
                  value={settings.analytics?.gaMeasurementId || ''}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, gaMeasurementId: e.target.value } })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">Starts with 'G-'. Leave blank to disable Google Analytics.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save size={20} className="mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
