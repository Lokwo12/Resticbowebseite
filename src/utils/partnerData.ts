import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

export interface Partner {
  id: string;
  key?: string;
  name: string;
  logo_url?: string;
  logo?: string;
  partner_type: string;
  category?: string;
  description: string;
  website_url?: string;
  website?: string;
  display_order: number;
  is_published: boolean;
  published?: boolean;
  since?: string;
  created_at?: string;
  updated_at?: string;
}

export const PARTNER_TYPES = [
  'Government',
  'International NGO',
  'National NGO',
  'Local CBO',
  'UN/International Organization',
  'Private Sector',
  'Foundation',
  'Academic/Research Institution',
  'Community Partner',
  'Other'
] as const;

export type PartnerType = typeof PARTNER_TYPES[number] | string;

export const PARTNER_PAGE_STRINGS = {
  title: 'Our Partners & Sponsors',
  introParagraph1:
    'RESTI values collaboration, participation, inclusion, and the empowerment of local organizations representing displaced and host communities. We support locally led development by working with civil-society actors, public institutions, development partners, and other organizations to strengthen community capacity and expand opportunities for sustainable change.',
  introParagraph2:
    'RESTI also seeks appropriate partnerships and consortia that bring together complementary expertise, resources, and networks while strengthening local capacity and community ownership.',
  emptyStateHeading: 'Our partnerships are growing',
  emptyStateDescription:
    'RESTI is building relationships with organizations and institutions that share our commitment to locally led and sustainable community development. Partner information will be published here as partnerships are established.',
  adminEmptyHeading: 'No partners added yet',
  adminEmptyDescription: 'Add your first partner or sponsor to display them on the public website.'
};

/**
 * Clean and normalize partner items fetched from API/KV.
 */
export function normalizePartner(raw: any): Partner {
  const val = raw?.value || raw || {};
  const rawId = raw?.id || raw?.key || val.id || val.key || '';
  const cleanId = rawId.replace(/^partner:/, '').trim();

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

  const logo = val.logo_url || val.logo || '';
  const website = val.website_url || val.website || '';
  const partnerType = val.partner_type || val.category || 'Community Partner';

  return {
    id: cleanId,
    key: `partner:${cleanId}`,
    name: (val.name || '').trim(),
    logo_url: logo,
    logo,
    partner_type: partnerType,
    category: partnerType,
    description: (val.description || '').trim(),
    website_url: website,
    website,
    display_order: displayOrder,
    is_published: isPublished,
    published: isPublished,
    since: val.since || '',
    created_at: val.created_at || val.createdAt || '',
    updated_at: val.updated_at || val.updatedAt || ''
  };
}

/**
 * Filter out any mock/fictional sample partners if any remain in legacy storage.
 */
export function isValidPublicPartner(partner: Partner): boolean {
  if (!partner || !partner.name || !partner.name.trim()) return false;
  if (!partner.is_published) return false;

  const nameLower = partner.name.toLowerCase().trim();
  // Filter out any lingering legacy dummy sample entries
  if (
    nameLower.includes('global giving') ||
    nameLower.includes('kiryandongo district local government') ||
    (nameLower === 'youth action network' || nameLower === 'youth action network uganda') ||
    nameLower.includes('uganda development foundation') ||
    nameLower.includes('global health initiative') ||
    nameLower.includes('community water alliance')
  ) {
    return false;
  }

  return true;
}

/**
 * Sort partners by display_order ascending, then created_at descending.
 */
export function sortPartners(items: Partner[]): Partner[] {
  return [...items].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Resilient multi-layer partner loader:
 * 1. Fetches from Supabase Edge Function (/partners).
 * 2. If endpoint fails or returns empty, falls back directly to Supabase client
 *    querying PostgreSQL 'partners' table and 'kv_store_2a4be611' table.
 */
export async function loadPublicPartners(): Promise<Partner[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawPartners = data.partners || [];
      const normalized = rawPartners
        .map(normalizePartner)
        .filter(isValidPublicPartner);

      if (normalized.length > 0) {
        return sortPartners(normalized);
      }
    }
  } catch (error) {
    console.warn('Edge function partners endpoint failed, trying direct database query:', error);
  }

  // Fallback: Direct Supabase query (merging PostgreSQL partners and KV store)
  try {
    const [pgRes, kvRes] = await Promise.all([
      supabase.from('partners').select('*'),
      supabase.from('kv_store_2a4be611').select('key, value').like('key', 'partner:%')
    ]);

    const map = new Map<string, Partner>();

    if (pgRes.data && Array.isArray(pgRes.data)) {
      for (const row of pgRes.data) {
        const norm = normalizePartner(row);
        if (norm.is_published && isValidPublicPartner(norm)) {
          map.set(norm.id, norm);
        }
      }
    }

    if (kvRes.data && Array.isArray(kvRes.data)) {
      for (const row of kvRes.data) {
        const norm = normalizePartner({ key: row.key, ...(row.value || {}) });
        if (norm.is_published && isValidPublicPartner(norm)) {
          map.set(norm.id, norm);
        }
      }
    }

    return sortPartners(Array.from(map.values()));
  } catch (err) {
    console.error('Direct database partners query failed:', err);
    return [];
  }
}
