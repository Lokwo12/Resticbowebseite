/**
 * RESTI CBO - Resources & Downloads Data Types, Constants, and Utilities
 */

export interface ResourceItem {
  id: string;
  key?: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  fileUrl?: string; // alias
  file_name: string;
  fileName?: string; // alias
  file_type: string;
  fileType?: string; // alias
  file_size: string;
  fileSize?: string; // alias
  thumbnail_url?: string;
  thumbnailUrl?: string;
  year?: string;
  author?: string;
  publication_date?: string;
  date?: string; // alias
  display_order?: number;
  order?: number; // alias
  is_featured: boolean;
  isFeatured?: boolean;
  is_published: boolean;
  isPublished?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Verified RESTI CBO Resource Categories
 * NOTE: Strictly excludes Education, Literacy, Schools, or Teaching materials.
 */
export const RESOURCE_CATEGORIES = [
  'Reports & Publications',
  'Annual Reports',
  'Research & Assessments',
  'WASH Resources',
  'Livelihoods Resources',
  'Environment & Climate Resources',
  'Community Development Resources',
  'Social Cohesion Resources',
  'Program Resources',
  'Policy & Governance Documents',
  'Application & Registration Forms',
  'Financial Reports',
  'Organizational Documents',
  'Other'
] as const;

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number] | string;

export const RESOURCES_PAGE_STRINGS = {
  mainHeading: 'Resources & Downloads',
  intro:
    'Access RESTI’s reports, publications, policies, forms, assessments, program resources, and other documents that provide information about our work and community initiatives.',
  emptyAllHeading: 'No resources available yet',
  emptyAllDescription:
    'RESTI’s reports, publications, policies, forms, assessments, and other resources will appear here as they are published.',
  emptyFilterHeading: 'No resources found',
  emptyFilterDescription:
    'There are currently no published resources matching your selection.',
  viewAllButtonText: 'View All Resources',
  searchPlaceholder: 'Search resources by title, description, category, author, or year...',
  downloadButtonPrefix: 'Download',
  needResourceHeading: 'Need a Specific Resource?',
  needResourceDescription:
    "Can't find the document or information you're looking for? Contact RESTI and let us know what you need. Our team will assist where possible.",
  contactButtonText: 'Contact RESTI',
  featuredBadgeText: 'Featured Document',
  allFilterTab: 'All Resources',
};

/**
 * Format raw byte size into human readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Extract clean file extension
 */
export function getFileExtension(filenameOrUrl: string): string {
  if (!filenameOrUrl) return 'FILE';
  const clean = filenameOrUrl.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toUpperCase() || 'FILE';
    return ext.length <= 5 ? ext : 'FILE';
  }
  return 'FILE';
}

/**
 * Normalize resource entity from KV/API response
 */
export function normalizeResource(raw: any): ResourceItem {
  const val = raw?.value || raw || {};
  const rawId = raw?.id || raw?.key || val.id || val.key || '';
  const cleanId = rawId.replace(/^resource:/, '').trim();

  const fileUrl = val.file_url || val.fileUrl || '';
  const fileName = val.file_name || val.fileName || (fileUrl ? fileUrl.split('/').pop()?.split('?')[0] : 'document');
  const fileType = (val.file_type || val.fileType || getFileExtension(fileName || fileUrl)).toUpperCase();
  const fileSize = val.file_size || val.fileSize || '';

  const isPublished =
    val.is_published !== undefined
      ? Boolean(val.is_published)
      : val.published !== undefined
      ? Boolean(val.published)
      : true;

  const isFeatured =
    val.is_featured !== undefined
      ? Boolean(val.is_featured)
      : val.featured !== undefined
      ? Boolean(val.featured)
      : false;

  const publicationDate = val.publication_date || val.date || val.created_at || '';
  const year = val.year || (publicationDate ? new Date(publicationDate).getFullYear().toString() : '');

  const category = val.category || 'Reports & Publications';

  return {
    id: cleanId || `res-${Date.now()}`,
    key: `resource:${cleanId}`,
    title: (val.title || 'Untitled Document').trim(),
    description: (val.description || '').trim(),
    category,
    file_url: fileUrl,
    fileUrl: fileUrl,
    file_name: fileName,
    fileName: fileName,
    file_type: fileType,
    fileType: fileType,
    file_size: fileSize,
    fileSize: fileSize,
    thumbnail_url: val.thumbnail_url || val.thumbnailUrl || '',
    thumbnailUrl: val.thumbnail_url || val.thumbnailUrl || '',
    year,
    author: (val.author || '').trim(),
    publication_date: publicationDate,
    date: publicationDate,
    display_order: typeof val.display_order === 'number' ? val.display_order : typeof val.order === 'number' ? val.order : 1,
    order: typeof val.display_order === 'number' ? val.display_order : typeof val.order === 'number' ? val.order : 1,
    is_featured: isFeatured,
    isFeatured: isFeatured,
    is_published: isPublished,
    isPublished: isPublished,
    created_at: val.created_at || val.createdAt || new Date().toISOString(),
    updated_at: val.updated_at || val.updatedAt || new Date().toISOString(),
  };
}
