/**
 * RESTI CBO - Events Data Types, Constants, and Utilities
 */

export interface EventItem {
  id: string;
  key?: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  event_type: string;
  category?: string;
  featured_image?: string;
  image?: string;
  gallery?: string[];
  start_date: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  date?: string;
  start_time: string; // e.g. "09:00 AM"
  end_time?: string;   // e.g. "04:00 PM"
  time?: string;
  location: string;
  address?: string;
  organizer?: string;
  registration_required: boolean;
  registration_url?: string;
  registration_deadline?: string;
  contact_email?: string;
  contact_phone?: string;
  status: EventStatus;
  is_featured: boolean;
  is_published: boolean;
  summary?: string;     // For past events: event recap
  outcomes?: string;    // For past events: achievements & impact
  related_program?: string;
  display_order?: number;
  capacity?: number;
  registered?: number;
  created_at?: string;
  updated_at?: string;
}

export const EVENT_CATEGORIES = [
  'Community Activity',
  'Training',
  'Workshop',
  'Meeting',
  'Awareness Campaign',
  'Fundraising',
  'Volunteer Activity',
  'Environmental Activity',
  'WASH Activity',
  'Livelihoods',
  'Youth Activity',
  'Other'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number] | string;

export const EVENT_STATUSES = [
  'draft',
  'published',
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
  'archived'
] as const;

export type EventStatus = typeof EVENT_STATUSES[number] | string;

export const EVENTS_PAGE_STRINGS = {
  mainHeading: 'Events & Activities',
  intro:
    'Join RESTI at our upcoming events, community activities, training sessions, workshops, and other initiatives. Follow our events to learn, participate, and contribute to positive change in our communities.',
  upcomingTabTitle: 'Upcoming Events',
  pastTabTitle: 'Past Events',
  emptyUpcomingHeading: 'No upcoming events scheduled',
  emptyUpcomingDescription:
    'RESTI does not currently have any upcoming events listed. Please check back soon for new community activities, training sessions, workshops, and other opportunities to participate.',
  emptyPastHeading: 'No past events yet',
  emptyPastDescription:
    'Past RESTI events and activities will appear here as they are completed.',
  registerButtonText: 'Register for this',
  viewEventButtonText: 'View Event',
  defaultOrganizer: 'RESTI CBO',
  defaultEmail: 'info@resticbo.org',
  defaultPhone: '+256 700 000 000',
  defaultLocation: 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda',
};

/**
 * Generate a clean URL-friendly slug from an event title
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper to determine if an event is upcoming or past based on dates and status
 */
export function isEventUpcoming(event: EventItem): boolean {
  if (event.status === 'completed' || event.status === 'archived') {
    return false;
  }
  if (event.status === 'upcoming' || event.status === 'ongoing') {
    return true;
  }

  const dateStr = event.end_date || event.start_date;
  if (!dateStr) return true;

  try {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return true;
    
    // Compare date to start of today (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If event date has not fully elapsed, consider upcoming/ongoing
    return eventDate >= today;
  } catch {
    return true;
  }
}

/**
 * Clean and normalize event item from KV/API response
 */
export function normalizeEvent(raw: any): EventItem {
  const val = raw?.value || raw || {};
  const rawId = raw?.id || raw?.key || val.id || val.key || '';
  const cleanId = rawId.replace(/^event:/, '').trim();

  const title = (val.title || '').trim();
  const slug = (val.slug || slugify(title) || cleanId).trim();

  const startDate = val.start_date || val.date || '';
  const endDate = val.end_date || '';
  const startTime = val.start_time || val.time || '';
  const endTime = val.end_time || '';

  const isPublished =
    val.is_published !== undefined
      ? Boolean(val.is_published)
      : val.published !== undefined
      ? Boolean(val.published)
      : val.status !== 'draft' && val.status !== 'archived';

  const isFeatured =
    val.is_featured !== undefined
      ? Boolean(val.is_featured)
      : Boolean(val.featured);

  const gallery = Array.isArray(val.gallery)
    ? val.gallery.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : [];

  return {
    id: cleanId || `event-${Date.now()}`,
    key: `event:${cleanId}`,
    title: title || 'Untitled Event',
    slug,
    short_description: val.short_description || val.shortDescription || (val.description ? val.description.slice(0, 160) : ''),
    description: val.description || '',
    event_type: val.event_type || val.category || 'Community Activity',
    category: val.category || val.event_type || 'Community Activity',
    image: val.featured_image || val.image || '',
    date: startDate,
    time: startTime,
    featured_image: val.featured_image || val.image || '',
    gallery,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    location: val.location || EVENTS_PAGE_STRINGS.defaultLocation,
    address: val.address || '',
    organizer: val.organizer || EVENTS_PAGE_STRINGS.defaultOrganizer,
    registration_required: Boolean(val.registration_required ?? val.registrationRequired ?? (val.registration_url || val.registrationUrl)),
    registration_url: val.registration_url || val.registrationUrl || '',
    registration_deadline: val.registration_deadline || val.registrationDeadline || '',
    contact_email: val.contact_email || val.contactEmail || EVENTS_PAGE_STRINGS.defaultEmail,
    contact_phone: val.contact_phone || val.contactPhone || EVENTS_PAGE_STRINGS.defaultPhone,
    status: (val.status) || 'published',
    is_featured: isFeatured,
    is_published: isPublished,
    summary: val.summary || '',
    outcomes: val.outcomes || '',
    related_program: val.related_program || val.relatedProgram || '',
    display_order: typeof val.display_order === 'number' ? val.display_order : typeof val.order === 'number' ? val.order : 1,
    capacity: typeof val.capacity === 'number' ? val.capacity : undefined,
    registered: typeof val.registered === 'number' ? val.registered : 0,
    created_at: val.created_at || val.createdAt || new Date().toISOString(),
    updated_at: val.updated_at || val.updatedAt || new Date().toISOString(),
  };
}
