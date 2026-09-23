/**
 * RESTI CBO - Impact Stories Data Models & Utilities
 * 
 * Rules:
 * - Only verified stories based on real beneficiaries, community members, and documented experiences.
 * - Zero fabricated metrics, statistics, quotes, or transformation claims.
 * - STRICTLY NO education or literacy program areas (RESTI does not do education).
 */

export type StoryStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

export interface ImpactStory {
  id: string;
  key?: string;
  title: string;
  slug?: string;
  short_description?: string;
  story: string;
  quote?: string;
  
  // Beneficiary / Community Member Details
  name: string;
  role?: string;
  location?: string;
  
  // Categorization & Program Linkage
  category: string;
  program_id?: string;
  program_name?: string;
  
  // Media
  image?: string;
  additional_images?: string[];
  
  // Metadata & Publishing
  date: string; // ISO date string or YYYY-MM-DD
  status: StoryStatus;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
  
  // Consent & Privacy Safeguards (Admin & Compliance)
  consent_obtained: boolean;
  consent_date?: string;
  permission_name: boolean;  // If false, display as "RESTI Program Participant"
  permission_photo: boolean; // If false, do not display beneficiary face/photo
  permission_quote: boolean;
  consent_notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

// RESTI CBO Actual Verified Work Areas (NO education / literacy)
export const RESTI_STORY_CATEGORIES = [
  { id: 'livelihoods', label: 'Livelihoods & Economic Empowerment' },
  { id: 'wash', label: 'Clean Water & Sanitation (WASH)' },
  { id: 'environment', label: 'Environmental Sustainability' },
  { id: 'climate', label: 'Climate Resilience' },
  { id: 'community', label: 'Community Development & Participation' },
  { id: 'cohesion', label: 'Social Cohesion & Peacebuilding' },
  { id: 'skills', label: 'Skills & Micro-Enterprise' },
  { id: 'governance', label: 'Organizational Development & Governance' },
] as const;

export const DEFAULT_PAGE_HEADER = {
  title: 'Impact Stories',
  subtitle: 'Discover real stories from individuals and communities working with RESTI to build livelihoods, strengthen resilience, improve community well-being, and create locally led solutions.'
};

export const EMPTY_STORIES_STATE = {
  title: 'No Impact Stories Yet',
  message: "Stories from RESTI's programs and community initiatives will appear here as they are documented and published.",
  buttonText: 'Learn About Our Programs',
  buttonLink: '/programs'
};

/**
 * Clean up text artifacts, HTML entities, and mojibake quotation marks
 */
export function cleanStoryText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/\?\?|\?|\?{2,}/g, "'") // replace garbled quotation mark mojibake
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim();
}

/**
 * Resolve display name taking beneficiary consent into account
 */
export function getBeneficiaryDisplayName(story: Partial<ImpactStory>): string {
  // If permission to publish name was explicitly set to false
  if (story.permission_name === false) {
    return 'RESTI Program Participant';
  }
  const cleanName = cleanStoryText(story.name);
  return cleanName || 'RESTI Program Participant';
}

/**
 * Format story publication date for user display
 */
export function formatStoryDate(dateString: string | undefined | null): string {
  if (!dateString) return 'Documented in Program';
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return 'Documented in Program';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Normalize an incoming raw KV store story object into a typed ImpactStory
 */
export function normalizeStory(raw: any): ImpactStory {
  const value = raw.value || raw;
  const id = raw.key || raw.id || value.id || `story:${Date.now()}`;
  
  // Default status: if is_published is explicitly false, draft; otherwise default to published for existing stories
  let status: StoryStatus = value.status || 'published';
  if (value.is_published === false && !value.status) {
    status = 'draft';
  }

  // Normalize category to not include education
  let category = value.category || 'livelihoods';
  if (category.toLowerCase().includes('education')) {
    category = 'skills';
  }

  return {
    id,
    key: id,
    title: cleanStoryText(value.title || 'RESTI Program Story'),
    slug: value.slug || id.replace('story:', ''),
    short_description: cleanStoryText(value.short_description || value.impact || ''),
    story: cleanStoryText(value.story || ''),
    quote: cleanStoryText(value.quote || ''),
    name: cleanStoryText(value.name || ''),
    role: cleanStoryText(value.role || ''),
    location: cleanStoryText(value.location || 'Kiryandongo District, Uganda'),
    category,
    program_id: value.program_id || '',
    program_name: cleanStoryText(value.program_name || ''),
    image: value.image || '',
    additional_images: Array.isArray(value.additional_images) ? value.additional_images : [],
    date: value.date || value.created_at || new Date().toISOString(),
    status,
    is_published: status === 'published',
    is_featured: Boolean(value.is_featured),
    display_order: typeof value.display_order === 'number' ? value.display_order : 0,
    consent_obtained: value.consent_obtained !== undefined ? Boolean(value.consent_obtained) : true,
    consent_date: value.consent_date || (value.date ? value.date.split('T')[0] : ''),
    permission_name: value.permission_name !== undefined ? Boolean(value.permission_name) : true,
    permission_photo: value.permission_photo !== undefined ? Boolean(value.permission_photo) : true,
    permission_quote: value.permission_quote !== undefined ? Boolean(value.permission_quote) : true,
    consent_notes: value.consent_notes || '',
    created_at: value.created_at || value.date || new Date().toISOString(),
    updated_at: value.updated_at || new Date().toISOString()
  };
}
