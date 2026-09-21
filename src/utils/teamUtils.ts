/**
 * Team Data Types & Utilities for RESTI CBO
 *
 * Provides shared fallback team data, biography sanitization,
 * concise summary generation for team cards, and identifier normalization.
 */

export interface TeamMember {
  id: string;
  key?: string;
  name: string;
  role: string;
  department?: string;
  bio: string;
  shortBio?: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order?: number;
  published?: boolean;
  status?: string;
}

/**
 * Standard Fallback Team reflecting the verified Supabase records
 * for instant rendering and offline/network resiliency.
 */
export const FALLBACK_TEAM: TeamMember[] = [
  {
    id: 'ba58bb08-f3ce-4cdf-a8d1-df4e7e1fbe3d',
    key: 'team:ba58bb08-f3ce-4cdf-a8d1-df4e7e1fbe3d',
    name: 'Mr. Meta Alex',
    role: 'Co-Founder & Founding Director | Research, Evidence & Community Engagement',
    department: 'Leadership & Research',
    bio: "Meta Alex is Co-Founder of RESTI Uganda, bringing a strong background in humanitarian and development research. He holds a diploma in General Agriculture and applies his expertise in research, evidence generation, and community engagement to strengthen RESTI's programmes and impact.\n\nMeta is deeply committed to evidence-based, community-led development. He has led baseline studies, needs assessments, household surveys, market assessments, and monitoring exercises for partners including ZOA Uganda, the World Food Programme (WFP), and Matrix360 Uganda in Kiryandongo, Adjumani, and Moyo.\n\nAt RESTI, he focuses on linking community skills, livelihoods, agricultural knowledge, and research evidence to sustainable opportunities and partnerships, ensuring interventions are grounded in real community needs and data.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/e512cb6f-853c-4dd9-ba34-082c3e6d0adf-WhatsApp_Image_2026-09-08_at_5.30.34_PM.jpeg',
    email: 'metamax618@gmail.com',
    order: 1,
    published: true,
    status: 'active',
  },
  {
    id: '54c1e38a-9652-46be-8e98-b8dc533af6a8',
    key: 'team:54c1e38a-9652-46be-8e98-b8dc533af6a8',
    name: 'Mr. Kwaya Daniel Loborach',
    role: 'Co-Founder',
    department: 'Executive & Finance',
    bio: "Kwaya Daniel Loborach is Co-Founder of RESTI Uganda, bringing a strong background in Business Administration and Management. He holds a Bachelor's degree in the field and applies his expertise in strategic planning, operational efficiency, and sustainable organizational growth to strengthen RESTI's systems and impact.\n\nDaniel is deeply committed to economic empowerment and environmental sustainability. He trains youth in beekeeping—combining ecological stewardship with entrepreneurial skills—and uses his restaurant to create employment opportunities for young people.\n\nAt RESTI, he focuses on building a resilient organizational framework that supports sustainable livelihoods, local enterprise, and lasting socio-economic change.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/c4735251-21ab-43c3-aeef-61aa5429b5c1-Screenshot_2026-09-11_011312.png',
    email: 'info@resticbo.org',
    order: 3,
    published: true,
    status: 'active',
  },
  {
    id: '3778b4e0-f58f-4016-b9b2-15195859745f',
    key: 'team:3778b4e0-f58f-4016-b9b2-15195859745f',
    name: 'Anek Immaculate',
    role: 'Co-Founder | Research, Livelihoods & Community Engagement',
    department: 'Programs & Operations',
    bio: "Anek Immaculate is Co-Founder of RESTI Uganda, bringing a strong background in development studies and community programming. She holds a Bachelor's degree in Developmental Studies and applies her expertise in research support, community mobilization, and participatory approaches to strengthen RESTI's field programmes.\n\nAnek is deeply committed to meaningful community engagement and self-reliance. She has worked with ZOA Uganda as a Research Assistant, contributing to data collection, field surveys, and evidence generation for livelihoods, WASH, and community-based initiatives, and has served with the Lutheran World Federation (LWF) Uganda, supporting community engagement, protection messaging, and programme activities in refugee-hosting areas.\n\nAt RESTI, she focuses on designing interventions that are grounded in local realities, responsive to community priorities, and aligned with humanitarian and development standards, helping communities lead their own pathways to sustainable transformation.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/f8d23b1b-e4ae-44dc-9ad1-b2ec7fd7d667-WhatsApp_Image_2026-09-13_at_1.57.38_AM.jpeg',
    email: 'info@resticbo.org',
    order: 5,
    published: true,
    status: 'active',
  },
  {
    id: '89010655-70b6-491c-88ab-1770ac8713b0',
    key: 'team:89010655-70b6-491c-88ab-1770ac8713b0',
    name: 'Otim Jackson',
    role: 'Co-Founder | Agriculture, Livelihoods & Community Extension',
    department: 'Community Extension',
    bio: "Otim Jackson is Co-Founder of RESTI Uganda, bringing a strong background in agriculture and livestock development. He holds a National Diploma in Animal Production and Management from Bukalasa Agricultural College and applies his expertise in farmer extension, livestock production, and market support to strengthen RESTI's livelihoods programming.\n\nOtim is deeply committed to practical, skills-based economic empowerment. Since 2016, he has worked as a private field veterinary extension worker in Kiryandongo District and has supported World Food Programme (WFP) assignments as an enumerator, distribution team member, and contributor to market surveys, Post-Distribution Monitoring, financial literacy surveys, and the Agriculture and Market Support programme in Kiryandongo Refugee Settlement and host communities.\n\nAt RESTI, he focuses on developing livelihood solutions that respond to local economic realities, build greater self-reliance among refugees and host communities, and turn people's productive capacity into lasting income and resilience.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/cce2a529-08ff-4a8f-91a0-fbdc38e14ced-WhatsApp_Image_2026-09-08_at_5.34.23_PM.jpeg',
    email: 'otimjackson82@gmail.com',
    order: 7,
    published: true,
    status: 'active',
  },
  {
    id: '773acb2a-61a7-4509-bc8d-cb925e47393c',
    key: 'team:773acb2a-61a7-4509-bc8d-cb925e47393c',
    name: 'Mr. Lokwo Denis',
    role: 'Co-Founder | Technology, Digital Systems & Innovation',
    department: 'Technology & Innovation',
    bio: "Lokwo Denis is Co-Founder of RESTI Uganda, specializing in technology, digital systems, and innovation. He holds a BSc in Information Technology from Nkumba University and is pursuing an MSc in Computer Science at the University of L'Aquila, Italy, focusing on AI, Complex Networks, and Data Analysis.\n\nWith experience as an IT Support Assistant at Windle International Uganda (2020–2022) and as an ICT Trainer, Lokwo has supported ICT operations, delivered computer literacy training, and developed digital skills among students and communities.\n\nHis technical expertise spans Python, Java, web technologies, REST APIs, Linux, Docker, databases, and AI. At RESTI, he leads efforts to leverage technology for program strengthening, improved service access, and scalable digital solutions that empower refugees and host communities toward self-reliance and resilience.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/e40b6cae-de18-4580-a1c7-758e6f16a541-IMG-20250908-WA0042_1_.jpg',
    email: 'lokwodenis@gmail.com',
    order: 8,
    published: true,
    status: 'active',
  }
];

/**
 * Normalizes member identifier by removing any "team:" prefix.
 */
export function cleanMemberId(id?: string): string {
  if (!id) return '';
  return id.replace(/^team:/, '').trim();
}

/**
 * Strips UTF-8 artifacts and any duplicate role/position lines from the beginning of the biography.
 */
export function cleanBio(rawBio?: string, role?: string): string {
  if (!rawBio) return '';
  let cleaned = rawBio
    .replace(/\?\?/g, "'")
    .replace(/\uFFFD/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '—')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .trim();

  // If role is provided, strip exact leading role match if duplicated
  if (role) {
    const trimmedRole = role.trim();
    if (cleaned.toLowerCase().startsWith(trimmedRole.toLowerCase())) {
      cleaned = cleaned.slice(trimmedRole.length).trim();
    }
  }

  // Remove any redundant leading line starting with "Co-Founder" or similar repeated role headers
  cleaned = cleaned.replace(/^(Co-Founder[^\n]*\n+)/i, '').trim();

  return cleaned;
}

/**
 * Generates a concise, highly readable 2-4 sentence summary for team cards.
 * Uses curated summaries for known founders, or dynamically extracts 2-3 clean
 * sentences for newly added team members.
 */
export function getTeamMemberSummary(member: { name: string; role?: string; bio?: string; shortBio?: string }): string {
  // 1. Explicit shortBio takes highest priority
  if (member.shortBio && member.shortBio.trim().length > 0) {
    return member.shortBio.trim();
  }

  const cleanName = (member.name || '').toLowerCase().trim();

  // 2. Curated, professional 2-3 sentence summaries for known co-founders
  if (cleanName.includes('meta alex')) {
    return 'Meta Alex is Co-Founder of RESTI Uganda with experience in humanitarian and development research, community engagement, and evidence generation. He holds a Diploma in General Agriculture and supports RESTI in linking community knowledge, livelihoods, and research evidence to sustainable opportunities.';
  }
  if (cleanName.includes('kwaya') || cleanName.includes('loborach')) {
    return 'Kwaya Daniel Loborach is Co-Founder of RESTI Uganda, bringing a strong background in Business Administration and Management. He applies his expertise in strategic planning, operational efficiency, and sustainable organizational growth to strengthen RESTI\'s systems, youth beekeeping programs, and livelihood impact.';
  }
  if (cleanName.includes('anek') || cleanName.includes('immaculate')) {
    return 'Anek Immaculate is Co-Founder of RESTI Uganda, bringing a strong background in development studies and participatory community programming. She focuses on designing field interventions grounded in local realities, evidence generation, and self-reliance for refugee and host communities.';
  }
  if (cleanName.includes('otim') || cleanName.includes('jackson')) {
    return 'Otim Jackson is Co-Founder of RESTI Uganda, bringing a strong background in agriculture, livestock development, and extension services. He focuses on developing practical livelihood solutions that respond to local economic realities, building lasting resilience and productive capacity across communities.';
  }
  if (cleanName.includes('lokwo') || cleanName.includes('denis')) {
    return 'Lokwo Denis is Co-Founder of RESTI Uganda, specializing in technology, digital systems, and innovation. He leverages software engineering, data analysis, and digital literacy training to strengthen program delivery, expand service access, and empower refugee and host communities.';
  }

  // 3. Dynamic intelligent extraction for newly added team members
  const bio = cleanBio(member.bio, member.role);
  if (!bio) return '';

  // Extract complete sentences ending in ., !, or ?
  const sentences = bio.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    let summary = '';
    for (const s of sentences) {
      if ((summary + s).length > 280 && summary.length > 0) break;
      summary += (summary ? ' ' : '') + s.trim();
      const count = (summary.match(/[.!?]/g) || []).length;
      if (count >= 3) break;
    }
    if (summary) return summary;
  }

  return bio.length > 240 ? `${bio.slice(0, 240).trim()}...` : bio;
}

/**
 * Determines if a team member is active and published for public display.
 */
export function isTeamMemberActive(member: any): boolean {
  if (!member) return false;
  if (member.published === false) return false;
  if (member.status && ['inactive', 'draft', 'archived', 'hidden'].includes(String(member.status).toLowerCase())) {
    return false;
  }
  return true;
}

/**
 * Extracts 2-letter uppercase initials for fallback avatars.
 */
export function getInitials(name?: string): string {
  if (!name) return 'RC';
  const parts = name.replace(/^Mr\.?\s*|^Mrs\.?\s*|^Ms\.?\s*|^Dr\.?\s*/i, '').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
