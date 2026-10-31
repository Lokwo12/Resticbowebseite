import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

export type BackgroundSectionId =
  | 'hero'          // Homepage Hero (#home)
  | 'about'         // Our Story & Mission (#about)
  | 'programs'      // Our Work & Programs (#programs)
  | 'impact'        // Our Impact & Stories (#stories)
  | 'gallery'       // Photo Gallery (#gallery)
  | 'partners'      // Partners & Donors (#partners)
  | 'donate'        // Donation Showcase (#donate)
  | 'contact'       // Contact & Inquiries (#contact)
  | 'global'        // Default / Site-wide Ambient Fallback
  | 'page'          // Full page background for individual pages
  | 'content'       // Body content region for individual pages
  | string;         // Support dynamic section identifiers

export type BackgroundMediaType = 'image' | 'video' | 'sequence';

export const RESTI_PROGRAM_PILLARS = [
  'Livelihoods & Economic Empowerment',
  'WASH, Environment & Climate Resilience',
  'Protection & Dignity',
  'Education & Life Skills',
  'Community Cohesion & Peacebuilding',
  'General / Cross-Cutting'
] as const;

export type ProgramPillar = typeof RESTI_PROGRAM_PILLARS[number];

export interface BackgroundMediaItem {
  id: string;
  key?: string;
  title: string;
  alt_text: string;
  page: string;                      // Canonical page key (e.g., 'home', 'about', 'program-livelihoods', etc.)
  section: BackgroundSectionId;     // Display area: 'page' (full-page), 'hero', 'about', 'programs', etc.
  media_type: BackgroundMediaType;
  
  // Media URLs
  url: string;
  poster_url?: string;
  sequence_urls?: string[];
  
  // Device-Specific Media Overrides (Responsive)
  mobile_url?: string;
  tablet_url?: string;
  mobile_poster_url?: string;
  mobile_position?: 'center' | 'top' | 'bottom';
  tablet_position?: 'center' | 'top' | 'bottom';
  
  // Visual & Cinematic Controls
  overlay_darkness: number;         // 0 to 90 (% darkness)
  overlay_color?: string;           // 'black' | 'emerald' | 'navy' | 'charcoal'
  overlay_gradient?: 'none' | 'to-b' | 'to-t' | 'radial' | 'vignette';
  blur: number;                     // 0 to 40 px (converted)
  blur_percent?: number;            // 0 to 100 (% blur intensity)
  parallax: boolean;                // subtle scroll parallax
  position: 'center' | 'top' | 'bottom';
  transition_duration: number;      // ms (e.g. 1000)
  transition_effect?: 'crossfade' | 'zoom' | 'slide';
  
  // Foreground Text Readability & Presentation Controls
  text_color?: 'white' | 'slate-100' | 'emerald-100' | 'amber-100' | 'stone-900';
  text_shadow?: 'none' | 'subtle' | 'medium' | 'strong';
  text_backdrop?: 'none' | 'subtle-blur' | 'pill-badge' | 'card-translucent';
  text_align?: 'center' | 'left' | 'right';
  max_content_width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  title_size_desktop?: 'default' | 'large' | 'huge';
  title_size_mobile?: 'default' | 'compact' | 'large';
  
  // Program Pillar Tagging
  program_pillar?: ProgramPillar | string;
  
  // Publication & Ordering
  display_order: number;
  is_published: boolean;
  published?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageDisplayArea {
  id: string;
  label: string;
  description: string;
}

export interface PageMetadata {
  key: string;
  label: string;
  path: string;
  category: 'core' | 'programs' | 'community' | 'legal' | 'global';
  description: string;
  defaultSection: string;
  displayAreas: PageDisplayArea[];
}

export const PAGE_CATEGORIES = [
  { id: 'core', label: 'Main Website Pages' },
  { id: 'programs', label: 'Program Pillar Pages' },
  { id: 'community', label: 'Community & Transparency' },
  { id: 'legal', label: 'Legal Policies' },
  { id: 'global', label: 'Site-Wide Fallback' }
] as const;

export type PageCategory = typeof PAGE_CATEGORIES[number]['id'];

export const PAGE_METADATA: Record<string, PageMetadata> = {
  home: {
    key: 'home',
    label: 'Homepage',
    path: '/',
    category: 'core',
    description: 'Main homepage of resticbo.org with long-scrolling interactive sections',
    defaultSection: 'hero',
    displayAreas: [
      { id: 'hero', label: 'Homepage Hero Banner', description: 'Top cinematic banner with primary call to action' },
      { id: 'about', label: 'About RESTI Section', description: 'Our Story & Mission preview section' },
      { id: 'programs', label: 'Our Work & Programs Section', description: 'Five core program pillars showcase' },
      { id: 'impact', label: 'Impact Stories Section', description: 'Beneficiary testimonials and transformation stories' },
      { id: 'gallery', label: 'Photo Gallery Section', description: 'Field action and community photo albums' },
      { id: 'partners', label: 'Partners & Donors Section', description: 'Institutional partners and collaboration network' },
      { id: 'faq', label: 'FAQ Section', description: 'Frequently asked questions preview' },
      { id: 'news', label: 'Latest News Section', description: 'Press updates and field announcements' },
      { id: 'donate', label: 'Donation Section', description: 'Fundraising and support call to action' },
      { id: 'contact', label: 'Contact Section', description: 'Quick contact and office reachout' },
      { id: 'page', label: 'Full Homepage Ambient', description: 'Default background when a homepage section has no dedicated media' }
    ]
  },
  about: {
    key: 'about',
    label: 'About RESTI / Our Story',
    path: '/about',
    category: 'core',
    description: 'Comprehensive organization history, mission, vision, values, and leadership journey',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire About page layout' },
      { id: 'hero', label: 'Top Hero / Story Banner', description: 'Top introductory banner' },
      { id: 'content', label: 'Values & Timeline Region', description: 'Middle values and milestone timeline region' }
    ]
  },
  programs: {
    key: 'programs',
    label: 'Programs Directory',
    path: '/programs',
    category: 'core',
    description: 'All programs archive with category filtering and impact indicators',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire programs catalog' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of programs overview' }
    ]
  },
  'program-livelihoods': {
    key: 'program-livelihoods',
    label: 'Livelihoods & Economic Empowerment',
    path: '/programs/livelihoods',
    category: 'programs',
    description: 'Vocational apprenticeships, Village Savings & Loan (VSLA), and micro-enterprise',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Livelihoods pillar page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of Livelihoods page' }
    ]
  },
  'program-environment': {
    key: 'program-environment',
    label: 'WASH, Environment & Climate Resilience',
    path: '/programs/environment',
    category: 'programs',
    description: 'Tree nurseries, reforestation, energy-saving cookstoves, and soil restoration',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Environment & Climate page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of Environment page' }
    ]
  },
  'program-women': {
    key: 'program-women',
    label: 'Protection & Dignity (Women Empowerment)',
    path: '/programs/women',
    category: 'programs',
    description: 'Safe spaces, psychosocial counseling, legal aid referrals, and female leadership',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Protection & Dignity page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of Women & Protection page' }
    ]
  },
  'program-youth': {
    key: 'program-youth',
    label: 'Education & Life Skills / Youth',
    path: '/programs/youth',
    category: 'programs',
    description: 'Sports for Peace, creative arts, youth leadership academies, and peer mentoring',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Youth & Education page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of Youth page' }
    ]
  },
  'program-healthcare': {
    key: 'program-healthcare',
    label: 'Community Health & Nutrition Outreach',
    path: '/programs/healthcare',
    category: 'programs',
    description: 'Mobile clinics, maternal and newborn care, and child malnutrition screenings',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Community Health page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of Health page' }
    ]
  },
  'program-wash': {
    key: 'program-wash',
    label: 'Clean Water & Dignified Sanitation (WASH)',
    path: '/programs/wash',
    category: 'programs',
    description: 'Borehole overhauls, community water user committees, and school sanitation',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire WASH page' },
      { id: 'hero', label: 'Pillar Header Banner', description: 'Top title area of WASH page' }
    ]
  },
  stories: {
    key: 'stories',
    label: 'Impact Stories',
    path: '/stories',
    category: 'core',
    description: 'Real lives transformed, beneficiary voices, and community field stories',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind story archives and story detail pages' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of stories directory' }
    ]
  },
  partners: {
    key: 'partners',
    label: 'Partners & Donors',
    path: '/partners',
    category: 'core',
    description: 'Institutional collaborations, sponsors, government bodies, and networks',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Partners page' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of Partners page' }
    ]
  },
  donate: {
    key: 'donate',
    label: 'Donate & Support',
    path: '/donate',
    category: 'core',
    description: 'Dedicated financial contribution and donation experience',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the donation container' }
    ]
  },
  contact: {
    key: 'contact',
    label: 'Contact & Inquiries',
    path: '/contact',
    category: 'core',
    description: 'Field office locations, phone lines, contact form, and community desk',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Contact & Get Involved page' },
      { id: 'hero', label: 'Header Banner', description: 'Top title area of Contact page' }
    ]
  },
  team: {
    key: 'team',
    label: 'Our Team & Leadership',
    path: '/team',
    category: 'community',
    description: 'Executive committee, board of directors, and field program officers',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the entire Team directory' },
      { id: 'hero', label: 'Header Banner', description: 'Top title area of Team page' }
    ]
  },
  news: {
    key: 'news',
    label: 'Latest News & Updates',
    path: '/news',
    category: 'community',
    description: 'Press releases, announcements, and media articles',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind news archive and article detail pages' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of news archive' }
    ]
  },
  events: {
    key: 'events',
    label: 'Events & Community Drives',
    path: '/events',
    category: 'community',
    description: 'Upcoming workshops, sports for peace tournaments, and community assemblies',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the Events directory' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of events' }
    ]
  },
  resources: {
    key: 'resources',
    label: 'Resources & Toolkits',
    path: '/resources',
    category: 'community',
    description: 'Downloadable manuals, toolkits, and publications',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind resources catalog' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of resources' }
    ]
  },
  reports: {
    key: 'reports',
    label: 'Impact Reports',
    path: '/reports',
    category: 'community',
    description: 'Annual audits, field evaluation PDFs, and donor accountability reports',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind impact reports' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of reports' }
    ]
  },
  'impact-dashboard': {
    key: 'impact-dashboard',
    label: 'Live Impact Dashboard',
    path: '/impact-dashboard',
    category: 'community',
    description: 'Real-time metrics, beneficiaries served, and programmatic maps',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind the impact metrics dashboard' }
    ]
  },
  financials: {
    key: 'financials',
    label: 'Financial Transparency',
    path: '/financials',
    category: 'community',
    description: 'Audit statements, financial breakdowns, and accountability records',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind financial transparency records' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of financials' }
    ]
  },
  faqs: {
    key: 'faqs',
    label: 'Frequently Asked Questions',
    path: '/faqs',
    category: 'community',
    description: 'Questions and answers on programs, governance, donations, and volunteering',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind FAQ directory' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of FAQ' }
    ]
  },
  opportunities: {
    key: 'opportunities',
    label: 'Opportunities & Careers',
    path: '/opportunities',
    category: 'community',
    description: 'Job vacancies, volunteering opportunities, and internships',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind opportunities page' },
      { id: 'hero', label: 'Header Banner', description: 'Top banner of opportunities' }
    ]
  },
  privacy: {
    key: 'privacy',
    label: 'Privacy Policy',
    path: '/privacy',
    category: 'legal',
    description: 'Personal data protection and donor privacy policies',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind privacy policy' }
    ]
  },
  terms: {
    key: 'terms',
    label: 'Terms of Service',
    path: '/terms',
    category: 'legal',
    description: 'Terms of website use and donor agreement',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind terms of service' }
    ]
  },
  refund: {
    key: 'refund',
    label: 'Refund Policy',
    path: '/refund',
    category: 'legal',
    description: 'Charitable contribution and donation refund terms',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind refund policy' }
    ]
  },
  cookies: {
    key: 'cookies',
    label: 'Cookies Policy',
    path: '/cookies',
    category: 'legal',
    description: 'Website cookies and session preferences',
    defaultSection: 'page',
    displayAreas: [
      { id: 'page', label: 'Full Page Background', description: 'Renders behind cookies policy' }
    ]
  },
  global: {
    key: 'global',
    label: 'Global Site Fallback',
    path: '*',
    category: 'global',
    description: 'Default ambient background across the entire website when a page or section has no dedicated media',
    defaultSection: 'global',
    displayAreas: [
      { id: 'global', label: 'Site-Wide Ambient Fallback', description: 'Default background across any unassigned route' }
    ]
  }
};

/**
 * Normalizes any route pathname into its canonical page key.
 * Handles subpaths, query parameters, trailing slashes, and legacy aliases.
 */
export function normalizeRouteToPageKey(pathname: string): { pageKey: string; subKey?: string } {
  if (!pathname) return { pageKey: 'home' };
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase() || '/';

  if (clean === '/' || clean === '') return { pageKey: 'home' };
  if (clean === '/about') return { pageKey: 'about' };
  if (clean === '/programs') return { pageKey: 'programs' };

  if (clean.startsWith('/programs/')) {
    const slug = clean.replace('/programs/', '').replace(/^program:/, '').trim();
    if (slug === 'livelihoods') return { pageKey: 'program-livelihoods', subKey: slug };
    if (slug === 'environment' || slug === 'climate' || slug === 'climate-resilience') return { pageKey: 'program-environment', subKey: slug };
    if (slug === 'women' || slug === 'protection') return { pageKey: 'program-women', subKey: slug };
    if (slug === 'youth' || slug === 'education') return { pageKey: 'program-youth', subKey: slug };
    if (slug === 'healthcare' || slug === 'health') return { pageKey: 'program-healthcare', subKey: slug };
    if (slug === 'wash' || slug === 'water') return { pageKey: 'program-wash', subKey: slug };
    return { pageKey: `program-${slug}`, subKey: slug };
  }

  if (clean === '/stories' || clean === '/impact-stories') return { pageKey: 'stories' };
  if (clean.startsWith('/stories/') || clean.startsWith('/impact-stories/')) {
    return { pageKey: 'stories', subKey: clean.split('/')[2] };
  }

  if (clean === '/partners') return { pageKey: 'partners' };
  if (clean === '/donate' || clean === '/donation' || clean === '/donor' || clean === '/donor/portal' || clean === '/donor/dashboard' || clean === '/donor-dashboard' || clean === '/donor-portal' || clean === '/login' || clean === '/register') {
    return { pageKey: 'donate' };
  }
  if (clean === '/contact' || clean === '/get-involved') return { pageKey: 'contact' };
  if (clean === '/privacy' || clean === '/privacy-policy' || clean === '/pages/privacy-policy' || clean === '/pages/privacy') return { pageKey: 'privacy' };
  if (clean === '/terms' || clean === '/terms-of-service' || clean === '/pages/terms-of-service' || clean === '/pages/terms') return { pageKey: 'terms' };
  if (clean === '/refund' || clean === '/refund-policy' || clean === '/pages/refund-policy' || clean === '/pages/refund') return { pageKey: 'refund' };
  if (clean === '/cookies' || clean === '/cookies-policy' || clean === '/pages/cookies-policy' || clean === '/pages/cookies') return { pageKey: 'cookies' };

  if (clean === '/team') return { pageKey: 'team' };
  if (clean.startsWith('/team/')) return { pageKey: 'team', subKey: clean.split('/')[2] };

  if (clean === '/news') return { pageKey: 'news' };
  if (clean.startsWith('/news/')) return { pageKey: 'news', subKey: clean.split('/')[2] };

  if (clean === '/events') return { pageKey: 'events' };
  if (clean.startsWith('/events/')) return { pageKey: 'events', subKey: clean.split('/')[2] };

  if (clean === '/resources') return { pageKey: 'resources' };
  if (clean === '/faqs') return { pageKey: 'faqs' };
  if (clean === '/reports') return { pageKey: 'reports' };
  if (clean === '/impact-dashboard') return { pageKey: 'impact-dashboard' };
  if (clean === '/financials' || clean === '/transparency' || clean === '/financial-transparency') return { pageKey: 'financials' };
  if (clean === '/opportunities') return { pageKey: 'opportunities' };

  if (clean.startsWith('/pages/')) {
    const slug = clean.replace('/pages/', '');
    if (slug === 'privacy-policy' || slug === 'privacy') return { pageKey: 'privacy' };
    if (slug === 'terms-of-service' || slug === 'terms') return { pageKey: 'terms' };
    if (slug === 'refund-policy' || slug === 'refund') return { pageKey: 'refund' };
    if (slug === 'cookies-policy' || slug === 'cookies') return { pageKey: 'cookies' };
    return { pageKey: `page-${slug}`, subKey: slug };
  }

  return { pageKey: clean.replace(/^\//, '') };
}

export const SECTION_METADATA: Record<string, { label: string; elementId: string; description: string }> = {
  hero: {
    label: 'Homepage Hero',
    elementId: 'home',
    description: 'Top banner of the website, ideal for cinematic video or high-impact hero image'
  },
  about: {
    label: 'Our Story & Mission',
    elementId: 'about',
    description: 'Mission, vision, core values, and the story of RESTI CBO'
  },
  programs: {
    label: 'Our Work & Programs',
    elementId: 'programs',
    description: 'Five key program areas and community activities in Kiryandongo'
  },
  impact: {
    label: 'Our Impact & Stories',
    elementId: 'stories',
    description: 'Beneficiary testimonials, voices from the field, and community impact'
  },
  gallery: {
    label: 'Photo Gallery',
    elementId: 'gallery',
    description: 'Community photo albums and field action moments'
  },
  partners: {
    label: 'Partners & Donors',
    elementId: 'partners',
    description: 'Institutional collaborations, sponsors, and community networks'
  },
  donate: {
    label: 'Donation Showcase',
    elementId: 'donate',
    description: 'Support our mission and fundraising calls to action'
  },
  contact: {
    label: 'Contact & Inquiries',
    elementId: 'contact',
    description: 'Field office location, contact forms, and community inquiries'
  },
  global: {
    label: 'Global Site Fallback',
    elementId: 'main-content',
    description: 'Default ambient background when a section does not have dedicated media'
  }
};

/**
 * Computes contrast evaluation & readability tips based on overlay darkness and text color.
 * Returns recommendation status and accessible guidance aiming for WCAG AA compliance.
 */
export function evaluateTextContrast(
  darkness: number,
  textColor: string = 'white'
): { isRecommended: boolean; label: string; level: 'success' | 'warning' | 'info'; hint: string } {
  const isDarkText = textColor === 'stone-900';

  if (isDarkText) {
    if (darkness <= 25) {
      return {
        isRecommended: true,
        label: 'Optimal Contrast (Dark Text)',
        level: 'success',
        hint: 'Light background with subtle overlay provides good contrast for dark text.'
      };
    }
    return {
      isRecommended: false,
      label: 'Low Contrast Warning',
      level: 'warning',
      hint: 'Dark text over a dark overlay has low contrast. Reduce overlay darkness or switch to light text.'
    };
  }

  // Light text (white, slate-100, emerald-100, amber-100)
  if (darkness >= 45) {
    return {
      isRecommended: true,
      label: 'WCAG AA Compliant Contrast',
      level: 'success',
      hint: 'Overlay darkness is sufficient (45%+) to ensure white/light text is clearly legible across all screens.'
    };
  } else if (darkness >= 30) {
    return {
      isRecommended: true,
      label: 'Moderate Contrast',
      level: 'info',
      hint: 'Acceptable for high-contrast photos; consider adding subtle text shadow or soft text backdrop.'
    };
  } else {
    return {
      isRecommended: false,
      label: 'Insufficient Contrast Warning',
      level: 'warning',
      hint: 'Overlay darkness is low (<30%). Foreground text may blend into light image areas. Increase overlay or enable text backdrop.'
    };
  }
}

/**
 * Clean and normalize background media from KV store or API responses.
 */
export function normalizeBackgroundMedia(raw: any): BackgroundMediaItem {
  const val = raw?.value || raw || {};
  const rawId = raw?.id || raw?.key || val.id || val.key || '';
  const cleanId = rawId.replace(/^bg_media:/, '').replace(/^background_media:/, '').trim() || crypto.randomUUID();

  const isPublished =
    val.is_published !== undefined
      ? Boolean(val.is_published)
      : val.published !== undefined
      ? Boolean(val.published)
      : true;

  const displayOrder =
    typeof val.display_order === 'number'
      ? val.display_order
      : typeof val.order === 'number'
      ? val.order
      : 1;

  const darkness =
    typeof val.overlay_darkness === 'number'
      ? Math.max(0, Math.min(90, val.overlay_darkness))
      : 50;

  // Handle blur_percent (0-100%) and legacy blur (0-8px or 0-40px)
  let blurPercent = 0;
  if (typeof val.blur_percent === 'number') {
    blurPercent = Math.max(0, Math.min(100, Math.round(val.blur_percent)));
  } else if (typeof val.blurPercent === 'number') {
    blurPercent = Math.max(0, Math.min(100, Math.round(val.blurPercent)));
  } else if (typeof val.blur === 'number') {
    // If old blur was in 0-8 range, convert 8px -> 100%
    if (val.blur <= 8) {
      blurPercent = Math.max(0, Math.min(100, Math.round((val.blur / 8) * 100)));
    } else {
      blurPercent = Math.max(0, Math.min(100, Math.round((val.blur / 40) * 100)));
    }
  }

  // 100% blur maps to 40px CSS blur radius
  const blurPixels = Math.round((blurPercent / 100) * 40 * 10) / 10;

  const duration =
    typeof val.transition_duration === 'number'
      ? Math.max(300, Math.min(5000, val.transition_duration))
      : 1000;

  return {
    id: cleanId,
    key: `bg_media:${cleanId}`,
    title: (val.title || '').trim() || 'Untitled Background',
    alt_text: (val.alt_text || val.altText || '').trim(),
    page: (val.section === 'global' || val.page === 'global')
      ? 'global'
      : (val.page || 'home').trim(),
    section: (val.section || (val.page && val.page !== 'home' ? 'page' : 'hero')) as BackgroundSectionId,
    media_type: (val.media_type || val.mediaType || 'image') as BackgroundMediaType,
    url: (val.url || val.imageUrl || val.videoUrl || '').trim(),
    poster_url: (val.poster_url || val.posterUrl || '').trim(),
    sequence_urls: Array.isArray(val.sequence_urls) ? val.sequence_urls : Array.isArray(val.sequenceUrls) ? val.sequenceUrls : [],
    
    // Responsive overrides
    mobile_url: (val.mobile_url || val.mobileUrl || '').trim() || undefined,
    tablet_url: (val.tablet_url || val.tabletUrl || '').trim() || undefined,
    mobile_poster_url: (val.mobile_poster_url || val.mobilePosterUrl || '').trim() || undefined,
    mobile_position: val.mobile_position || val.mobilePosition || undefined,
    tablet_position: val.tablet_position || val.tabletPosition || undefined,

    // Visual controls
    overlay_darkness: darkness,
    overlay_color: val.overlay_color || 'black',
    overlay_gradient: val.overlay_gradient || val.overlayGradient || 'none',
    blur: blurPixels,
    blur_percent: blurPercent,
    parallax: val.parallax !== undefined ? Boolean(val.parallax) : true,
    position: val.position === 'top' || val.position === 'bottom' ? val.position : 'center',
    transition_duration: duration,
    transition_effect: val.transition_effect || 'crossfade',

    // Foreground Text & Presentation
    text_color: val.text_color || val.textColor || 'white',
    text_shadow: val.text_shadow || val.textShadow || 'subtle',
    text_backdrop: val.text_backdrop || val.textBackdrop || 'none',
    text_align: val.text_align || val.textAlign || 'center',
    max_content_width: val.max_content_width || val.maxContentWidth || 'xl',
    title_size_desktop: val.title_size_desktop || val.titleSizeDesktop || 'default',
    title_size_mobile: val.title_size_mobile || val.titleSizeMobile || 'default',

    program_pillar: val.program_pillar || val.programPillar || 'General / Cross-Cutting',
    display_order: displayOrder,
    is_published: isPublished,
    published: isPublished,
    created_at: val.created_at || val.createdAt || new Date().toISOString(),
    updated_at: val.updated_at || val.updatedAt || new Date().toISOString(),
  };
}

/**
 * Resilient multi-tier background media loader:
 * 1. Queries Supabase Edge Function (/background-media).
 * 2. If endpoint fails or is unreachable, falls back directly to Supabase client
 *    querying 'kv_store_2a4be611' table matching prefix 'bg_media:*'.
 */
export async function loadPublicBackgroundMedia(): Promise<BackgroundMediaItem[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/background-media`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawList = data.backgrounds || data.media || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList
          .map(normalizeBackgroundMedia)
          .filter((item) => item.is_published && (item.url || (item.sequence_urls && item.sequence_urls.length > 0)))
          .sort((a, b) => a.display_order - b.display_order);
      }
    }
  } catch (error) {
    console.warn('Edge function background media endpoint failed, attempting direct KV query:', error);
  }

  // Dual-layer fallback: direct Supabase KV store query
  try {
    const { data: kvRows, error } = await supabase
      .from('kv_store_2a4be611')
      .select('key, value')
      .like('key', 'bg_media:%');

    if (!error && Array.isArray(kvRows) && kvRows.length > 0) {
      return kvRows
        .map((r) => normalizeBackgroundMedia({ key: r.key, ...(r.value || {}) }))
        .filter((item) => item.is_published && (item.url || (item.sequence_urls && item.sequence_urls.length > 0)))
        .sort((a, b) => a.display_order - b.display_order);
    }
  } catch (err) {
    console.error('Direct database background media query failed:', err);
  }

  return [];
}
