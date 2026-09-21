/**
 * FAQ Data Types, Categories, and Comprehensive Default FAQs for RESTI CBO
 */

export interface FAQItem {
  id: string;
  key?: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQCategoryConfig {
  id: string;
  label: string;
  description: string;
}

export const FAQ_CATEGORIES: FAQCategoryConfig[] = [
  { id: 'all', label: 'All Questions', description: 'Browse all frequently asked questions' },
  { id: 'About RESTI', label: 'About RESTI', description: 'Mission, vision, history, and target communities' },
  { id: 'Programs', label: 'Programs', description: 'Livelihoods, education, healthcare, and peacebuilding' },
  { id: 'Donations', label: 'Donations', description: 'Giving options, payment methods, and financial stewardship' },
  { id: 'Volunteering', label: 'Volunteering', description: 'Remote and field volunteer opportunities' },
  { id: 'Partnerships', label: 'Partnerships', description: 'Organizational, corporate, and institutional collaboration' },
  { id: 'Opportunities', label: 'Opportunities', description: 'Jobs, tenders, fellowships, and internships' },
];

/**
 * Standard comprehensive FAQ collection for RESTI CBO.
 * Provides complete coverage of common institutional, programmatic, and donor inquiries.
 */
export const DEFAULT_FAQS: FAQItem[] = [
  // ── About RESTI ──
  {
    id: 'faq-about-1',
    key: 'faq:about-1',
    question: 'What is RESTI?',
    answer: 'RESTI (Refugee Empowerment For Sustainable Transformation Initiative) is a registered community-based organization dedicated to empowering refugees and host communities in Kiryandongo District, Uganda. We focus on sustainable livelihoods, quality education, healthcare awareness, and social cohesion.',
    category: 'About RESTI',
    order: 1,
    published: true,
    featured: true,
  },
  {
    id: 'faq-about-2',
    key: 'faq:about-2',
    question: 'Where does RESTI work?',
    answer: 'RESTI operates primarily across Kiryandongo Refugee Settlement and neighboring host communities in Mid-Western Uganda. Our community hubs and field projects are situated directly within local clusters to serve both refugee and host families effectively.',
    category: 'About RESTI',
    order: 2,
    published: true,
  },
  {
    id: 'faq-about-3',
    key: 'faq:about-3',
    question: 'Who does RESTI support?',
    answer: 'We support displaced individuals, refugee households, and vulnerable members of the host community, with special focus on youth, women, and smallholder farmers. Our initiatives emphasize mutual collaboration, peaceful coexistence, and self-reliance.',
    category: 'About RESTI',
    order: 3,
    published: true,
  },
  {
    id: 'faq-about-4',
    key: 'faq:about-4',
    question: 'When was RESTI founded?',
    answer: 'RESTI was founded in 2024 by local community leaders, educators, and development practitioners responding to the critical need for locally led, sustainable transformation and economic empowerment in Kiryandongo District.',
    category: 'About RESTI',
    order: 4,
    published: true,
  },

  // ── Programs ──
  {
    id: 'faq-prog-1',
    key: 'faq:prog-1',
    question: 'What programs does RESTI offer?',
    answer: 'RESTI offers community-focused programs across four key pillars: Sustainable Livelihoods & Agriculture (including youth beekeeping and climate-smart farming), Quality Education & Digital Skills, Community Health & WASH Awareness, and Peacebuilding & Social Cohesion.',
    category: 'Programs',
    order: 5,
    published: true,
    featured: true,
  },
  {
    id: 'faq-prog-2',
    key: 'faq:prog-2',
    question: 'How can I participate in a RESTI program?',
    answer: 'Community members can register for ongoing training cohorts, agricultural extension sessions, and workshops at our local field centers in Kiryandongo. Program announcements and enrollment schedules are also shared through community mobilizers and our Opportunities portal.',
    category: 'Programs',
    order: 6,
    published: true,
  },
  {
    id: 'faq-prog-3',
    key: 'faq:prog-3',
    question: 'Who can benefit from RESTI programs?',
    answer: 'Both refugee and host community members living in our operational areas can benefit from RESTI programs. We prioritize vulnerable households, youth seeking vocational skills, and families eager to build sustainable livelihoods.',
    category: 'Programs',
    order: 7,
    published: true,
  },
  {
    id: 'faq-prog-4',
    key: 'faq:prog-4',
    question: 'Where are RESTI programs implemented?',
    answer: 'Our programs are conducted on-site in Kiryandongo District, utilizing community halls, demonstration farms, local schools, and neighborhood clusters to ensure accessible, community-grounded implementation.',
    category: 'Programs',
    order: 8,
    published: true,
  },

  // ── Donations ──
  {
    id: 'faq-don-1',
    key: 'faq:don-1',
    question: 'How can I donate to RESTI Kiryandongo CBO?',
    answer: 'You can support RESTI through the donation options available on our website. Depending on the available payment methods, you may be able to make a one-time or recurring contribution. Donations help support RESTI\'s community programs and locally led initiatives.',
    category: 'Donations',
    order: 9,
    published: true,
    featured: true,
  },
  {
    id: 'faq-don-2',
    key: 'faq:don-2',
    question: 'What payment methods are available?',
    answer: 'Our website supports secure online contributions via international debit/credit cards and mobile money options where configured. For direct bank transfers or organizational wire instructions, please contact our administrative team via our Contact page.',
    category: 'Donations',
    order: 10,
    published: true,
  },
  {
    id: 'faq-don-3',
    key: 'faq:don-3',
    question: 'Can I donate to a specific program?',
    answer: 'Yes. You can designate your donation to a specific focus area, such as youth beekeeping, digital education, or agricultural inputs. Simply specify your intended initiative during donation or send a brief notification to our finance desk.',
    category: 'Donations',
    order: 11,
    published: true,
  },
  {
    id: 'faq-don-4',
    key: 'faq:don-4',
    question: 'Will I receive a donation receipt?',
    answer: 'Yes. Every confirmed online donation generates an automatic confirmation receipt. Formal institutional receipts and annual contribution statements for audit or tax accounting can also be issued upon request.',
    category: 'Donations',
    order: 12,
    published: true,
  },
  {
    id: 'faq-don-5',
    key: 'faq:don-5',
    question: 'How is my donation used?',
    answer: 'Donations directly fund community-level activities, purchase training tools and farming inputs, and facilitate skills workshops. RESTI upholds strict financial transparency and publishes annual accountability updates for partners and donors.',
    category: 'Donations',
    order: 13,
    published: true,
  },

  // ── Volunteering ──
  {
    id: 'faq-vol-1',
    key: 'faq:vol-1',
    question: 'Can I volunteer if I don\'t live in Kiryandongo?',
    answer: 'Yes! We welcome remote volunteers who can assist with grant writing, research, digital communications, curriculum design, and technical mentorship. We also host short-term and project-based volunteers visiting Kiryandongo District.',
    category: 'Volunteering',
    order: 14,
    published: true,
    featured: true,
  },
  {
    id: 'faq-vol-2',
    key: 'faq:vol-2',
    question: 'What volunteer opportunities are available?',
    answer: 'Available volunteer roles include community outreach facilitators, ICT and literacy trainers, agricultural extension aides, and event coordinators. Current openings are posted on our Opportunities page.',
    category: 'Volunteering',
    order: 15,
    published: true,
  },
  {
    id: 'faq-vol-3',
    key: 'faq:vol-3',
    question: 'How can I apply to volunteer?',
    answer: 'You can apply by visiting the Opportunities section of our website or by submitting a volunteer inquiry through our Contact page with your background and areas of interest.',
    category: 'Volunteering',
    order: 16,
    published: true,
  },

  // ── Partnerships ──
  {
    id: 'faq-part-1',
    key: 'faq:part-1',
    question: 'How can an organization partner with RESTI?',
    answer: 'Organizations can partner with RESTI through project co-implementation, institutional grants, technical advisory, or joint research initiatives. Interested organizations can initiate discussions through our Contact form or by emailing info@resticbo.org.',
    category: 'Partnerships',
    order: 17,
    published: true,
  },
  {
    id: 'faq-part-2',
    key: 'faq:part-2',
    question: 'Can businesses or institutions support RESTI programs?',
    answer: 'Yes. We welcome corporate partnerships, academic research collaborations, and social enterprise sponsorships that align with our mission of community empowerment and sustainable development.',
    category: 'Partnerships',
    order: 18,
    published: true,
  },
  {
    id: 'faq-part-3',
    key: 'faq:part-3',
    question: 'How can I collaborate with RESTI?',
    answer: 'Reach out via our Contact page with a brief description of your organization and collaborative ideas. Our leadership team will arrange an introductory discussion to explore shared objectives.',
    category: 'Partnerships',
    order: 19,
    published: true,
  },

  // ── Opportunities ──
  {
    id: 'faq-opp-1',
    key: 'faq:opp-1',
    question: 'Where can I find current RESTI job opportunities?',
    answer: 'All open employment positions, consultancy tenders, and internship opportunities are published on our dedicated Opportunities page at resticbo.org/opportunities.',
    category: 'Opportunities',
    order: 20,
    published: true,
  },
  {
    id: 'faq-opp-2',
    key: 'faq:opp-2',
    question: 'Does RESTI offer internships?',
    answer: 'Yes. RESTI offers internship placements for university students and recent graduates looking for hands-on experience in community development, humanitarian programs, and non-profit administration.',
    category: 'Opportunities',
    order: 21,
    published: true,
  },
  {
    id: 'faq-opp-3',
    key: 'faq:opp-3',
    question: 'Does RESTI accept consultants or volunteers?',
    answer: 'Yes. We periodically engage technical consultants for specialized evaluations and assessments, and we continuously welcome passionate volunteers across our ongoing community projects.',
    category: 'Opportunities',
    order: 22,
    published: true,
  }
];

/**
 * Normalizes and strips HTML tags if answer was saved via rich-text editor.
 */
export function cleanFaqText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\?\?/g, "'")
    .replace(/\uFFFD/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€"/g, '—')
    .trim();
}

/**
 * Normalizes raw FAQ records fetched from Supabase and merges them
 * intelligently with default categorized questions if needed.
 */
export function normalizeFaqList(rawList: any[]): FAQItem[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_FAQS;
  }

  const mapped: FAQItem[] = rawList.map((item: any) => {
    const rawId = item.id || item.key || '';
    const cleanId = rawId.replace(/^faq:/, '').trim();
    const val = item.value || item;

    // Normalize category name to standard casing
    let category = val.category || 'About RESTI';
    const catLower = category.toLowerCase().trim();
    if (catLower === 'general' || catLower === 'about' || catLower === 'about resti') {
      category = 'About RESTI';
    } else if (catLower === 'programs' || catLower === 'program') {
      category = 'Programs';
    } else if (catLower === 'donations' || catLower === 'donation' || catLower === 'finance') {
      category = 'Donations';
    } else if (catLower === 'volunteering' || catLower === 'volunteer') {
      category = 'Volunteering';
    } else if (catLower === 'partnerships' || catLower === 'partnership' || catLower === 'partners') {
      category = 'Partnerships';
    } else if (catLower === 'opportunities' || catLower === 'opportunity' || catLower === 'careers' || catLower === 'jobs') {
      category = 'Opportunities';
    }

    // Capitalize properly if needed
    let question = (val.question || '').trim();
    if (question.toLowerCase() === 'how can i donate to resti kiryandongo cbo?' || question.toLowerCase() === 'how can i donate to the organization?') {
      question = 'How can I donate to RESTI Kiryandongo CBO?';
    } else if (question.toLowerCase() === "can i volunteer if i don't live in kiryandongo?") {
      question = "Can I volunteer if I don't live in Kiryandongo?";
    } else if (question.toLowerCase() === 'what programs do you offer?' || question.toLowerCase() === 'what programs does resti offer?') {
      question = 'What programs does RESTI offer?';
    }

    return {
      id: cleanId,
      key: item.key || `faq:${cleanId}`,
      question,
      answer: cleanFaqText(val.answer || ''),
      category,
      order: typeof val.order === 'number' ? val.order : 999,
      published: val.published !== undefined ? val.published : true,
      featured: val.featured !== undefined ? val.featured : false,
      createdAt: val.createdAt,
      updatedAt: val.updatedAt,
    };
  });

  // If Supabase only has the 3 initial sample items, complement with the full structured set
  if (mapped.length <= 3) {
    const existingQuestions = new Set(mapped.map(m => m.question.toLowerCase().trim()));
    const additional = DEFAULT_FAQS.filter(d => !existingQuestions.has(d.question.toLowerCase().trim()));
    return [...mapped, ...additional].sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  return mapped.sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Builds FAQPage JSON-LD schema for SEO structured data.
 */
export function buildFaqSchema(faqs: FAQItem[]): string {
  const publishedFaqs = faqs.filter(f => f.published !== false && f.question && f.answer);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: publishedFaqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
  return JSON.stringify(schema);
}
