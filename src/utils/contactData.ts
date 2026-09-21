/**
 * Contact & "Get Involved" Data Types & Constants for RESTI CBO
 */

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  image?: string;
  order?: number;
  published: boolean;
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  district: string;
  country: string;
  mapUrl?: string;
  isPrimary: boolean;
  published: boolean;
}

export interface ContactSettings {
  title: string;
  subtitle: string;
  address: string;
  district: string;
  country: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  workingHours?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  supportItems?: string[];
  locations?: OfficeLocation[];
  contactPersons?: ContactPerson[];
}

export const GET_INVOLVED_STRINGS = {
  mainHeading: 'Get Involved',
  intro:
    'Join RESTI in supporting locally led solutions and creating opportunities for communities. Whether you want to volunteer, donate, partner with us, support our programs, or learn more about our work, there are many ways to get involved.',
  contactSectionHeading: 'Contact RESTI',
  waysToSupportHeading: 'Ways to Support',
  contactFormHeading: 'Contact Us',
  followHeading: 'Follow RESTI',
  findOfficeHeading: 'Find Our Office',
  findOfficeSubtitle: 'Find our office and community presence in Kiryandongo District.',
  primaryOfficeName: 'Kiryandongo Refugee Settlement Office',
  primaryOfficeAddress: 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda / Bweyale',
  emptyLocationHeading: 'Location information coming soon',
  emptyLocationDescription:
    'Please contact RESTI directly for information about our current office and community locations.',
  formSuccessTitle: 'Message sent successfully',
  formSuccessMessage:
    'Thank you for contacting RESTI. We have received your message and will get back to you as soon as possible.',
  formErrorTitle: 'Unable to send your message',
  formErrorMessage:
    'Please check your information and try again. If the problem continues, contact RESTI directly.',
  defaultEmail: 'info@resticbo.org',
  defaultPhone: '+256 700 000 000',
  defaultWhatsApp: '+256700000000',
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  title: 'Get Involved',
  subtitle: GET_INVOLVED_STRINGS.intro,
  address: 'Kiryandongo Refugee Settlement, Bweyale',
  district: 'Kiryandongo District',
  country: 'Uganda',
  email: 'info@resticbo.org',
  phone: '+256 700 000 000',
  whatsappNumber: '+256700000000',
  workingHours: 'Monday - Friday: 8:30 AM - 5:00 PM (EAT)',
  socialLinks: {
    facebook: 'https://facebook.com/resticbo',
    twitter: 'https://x.com/resticbo',
    instagram: 'https://instagram.com/resticbo',
    linkedin: '',
    youtube: '',
  },
  locations: [
    {
      id: 'loc-main',
      name: 'Kiryandongo Community Office',
      address: 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda / Bweyale',
      district: 'Kiryandongo District',
      country: 'Uganda',
      mapUrl:
        'https://maps.google.com/maps?q=Kiryandongo%20Refugee%20Settlement%20Bweyale%20Uganda&t=&z=13&ie=UTF8&iwloc=&output=embed',
      isPrimary: true,
      published: true,
    },
  ],
  contactPersons: [
    {
      id: 'cp-1',
      name: 'Meta Alex',
      role: 'Co-Founder & Founding Director | Research & Community Engagement',
      email: 'info@resticbo.org',
      phone: '+256 700 000 000',
      image:
        'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/e512cb6f-853c-4dd9-ba34-082c3e6d0adf-WhatsApp_Image_2026-09-08_at_5.30.34_PM.jpeg',
      order: 1,
      published: true,
    },
    {
      id: 'cp-2',
      name: 'Kwaya Daniel Loborach',
      role: 'Co-Founder | Operations & Programs',
      email: 'info@resticbo.org',
      phone: '+256 700 000 000',
      image:
        'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/c4735251-21ab-43c3-aeef-61aa5429b5c1-Screenshot_2026-09-11_011312.png',
      order: 2,
      published: true,
    },
    {
      id: 'cp-3',
      name: 'Anek Immaculate',
      role: 'Co-Founder | Livelihoods & Community Programs',
      email: 'info@resticbo.org',
      phone: '+256 700 000 000',
      image:
        'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/f8d23b1b-e4ae-44dc-9ad1-b2ec7fd7d667-WhatsApp_Image_2026-09-13_at_1.57.38_AM.jpeg',
      order: 3,
      published: true,
    },
  ],
};

/**
 * Normalizes raw settings fetched from Supabase
 */
export function normalizeContactSettings(raw: any): ContactSettings {
  if (!raw) return DEFAULT_CONTACT_SETTINGS;
  const contact = raw.contact || raw;

  const social = contact.socialLinks || {};
  // Sanitize personal email addresses if present
  let safeEmail = contact.email || DEFAULT_CONTACT_SETTINGS.email;
  if (safeEmail.toLowerCase().includes('gmail.com')) {
    safeEmail = DEFAULT_CONTACT_SETTINGS.email;
  }

  const rawLocations = Array.isArray(contact.locations) ? contact.locations : [];
  const locations: OfficeLocation[] = rawLocations.map((loc: any, idx: number) => ({
    id: loc.id || `loc-${idx}`,
    name: loc.name || 'Community Office',
    address: loc.address || 'Kiryandongo District, Uganda',
    district: loc.district || 'Kiryandongo',
    country: loc.country || 'Uganda',
    mapUrl: loc.mapUrl || '',
    isPrimary: loc.isPrimary !== undefined ? Boolean(loc.isPrimary) : idx === 0,
    published: loc.published !== undefined ? Boolean(loc.published) : true,
  }));

  const rawPersons = Array.isArray(contact.contactPersons)
    ? contact.contactPersons
    : Array.isArray(contact.departments)
    ? contact.departments.map((dept: any, idx: number) => ({
        id: `cp-${idx}`,
        name: dept.name || 'Team Member',
        role: dept.role || 'Program Representative',
        email: dept.email && !dept.email.toLowerCase().includes('gmail.com') ? dept.email : 'info@resticbo.org',
        phone: dept.phone || '',
        order: idx + 1,
        published: true,
      }))
    : DEFAULT_CONTACT_SETTINGS.contactPersons || [];

  const contactPersons: ContactPerson[] = rawPersons.map((person: any, idx: number) => {
    let pEmail = person.email;
    if (pEmail && pEmail.toLowerCase().includes('gmail.com')) {
      pEmail = 'info@resticbo.org';
    }
    return {
      id: person.id || `cp-${idx}`,
      name: person.name || '',
      role: person.role || person.position || '',
      email: pEmail,
      phone: person.phone || '',
      image: person.image || '',
      order: typeof person.order === 'number' ? person.order : idx + 1,
      published: person.published !== undefined ? Boolean(person.published) : true,
    };
  });

  return {
    title: GET_INVOLVED_STRINGS.mainHeading,
    subtitle: GET_INVOLVED_STRINGS.intro,
    address: contact.address || DEFAULT_CONTACT_SETTINGS.address,
    district: contact.district || DEFAULT_CONTACT_SETTINGS.district,
    country: contact.country || DEFAULT_CONTACT_SETTINGS.country,
    email: safeEmail,
    phone: contact.phone || DEFAULT_CONTACT_SETTINGS.phone,
    whatsappNumber: contact.whatsappNumber || DEFAULT_CONTACT_SETTINGS.whatsappNumber,
    workingHours: contact.workingHours || DEFAULT_CONTACT_SETTINGS.workingHours,
    socialLinks: {
      facebook: social.facebook || DEFAULT_CONTACT_SETTINGS.socialLinks.facebook || '',
      twitter: social.twitter || DEFAULT_CONTACT_SETTINGS.socialLinks.twitter || '',
      instagram: social.instagram || DEFAULT_CONTACT_SETTINGS.socialLinks.instagram || '',
      linkedin: social.linkedin || '',
      youtube: social.youtube || '',
    },
    locations: locations.length > 0 ? locations : DEFAULT_CONTACT_SETTINGS.locations,
    contactPersons: contactPersons.length > 0 ? contactPersons : DEFAULT_CONTACT_SETTINGS.contactPersons,
  };
}
