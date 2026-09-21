export type OpportunityCategory = 
  | 'Jobs'
  | 'Internships'
  | 'Consultancy'
  | 'Fellowships'
  | 'Other Opportunities'
  | string;

export type WorkArrangement = 'Field-Based' | 'Remote' | 'Hybrid' | 'On-Site';

export type OpportunityStatus = 'Open' | 'Closing Soon' | 'Ongoing' | 'Closed' | 'Draft' | 'Archived';

export type ApplicationMethod = 'internal' | 'email' | 'external';

export interface OpportunityItem {
  id: string;
  key?: string;
  title: string;
  category: OpportunityCategory;
  type: string;
  workArrangement: WorkArrangement;
  location: string;
  duration?: string;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications?: string[];
  benefits?: string[];
  isOngoing?: boolean;
  deadline?: string;
  status: OpportunityStatus;
  applicationMethod: ApplicationMethod;
  applicationEmail?: string;
  applicationUrl?: string;
  applicationInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateApplication {
  id: string;
  key?: string;
  opportunityId: string;
  opportunityTitle: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  resumeName?: string;
  coverLetter: string;
  consent: boolean;
  status: 'pending' | 'under_review' | 'shortlisted' | 'rejected' | 'offered';
  notes?: string;
  appliedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Jobs',
  'Internships',
  'Consultancy',
  'Fellowships',
  'Other Opportunities'
];

export const WORK_ARRANGEMENTS: WorkArrangement[] = [
  'Field-Based',
  'Remote',
  'Hybrid',
  'On-Site'
];

export const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: 'opp-livelihoods-officer',
    key: 'opportunity:opp-livelihoods-officer',
    title: 'Livelihoods & Agro-Enterprise Field Officer',
    category: 'Jobs',
    type: 'Full-Time',
    workArrangement: 'Field-Based',
    location: 'Kiryandongo District & Refugee Settlement',
    duration: '12 Months (Renewable)',
    shortDescription: 'Lead farmer extension training, post-harvest handling, and market linkages to help refugee and host community smallholders increase agricultural resilience.',
    description: 'RESTI Uganda is seeking a dedicated Livelihoods & Agro-Enterprise Field Officer to manage our sustainable agriculture and smallholder enterprise programs across Kiryandongo District. The officer will work directly with refugee and host community farmer producer groups to enhance climate-smart farming, village savings associations (VSLAs), and market access.',
    responsibilities: [
      'Facilitate practical training in climate-smart agricultural techniques and crop diversification.',
      'Coordinate input distribution, seedling nurseries, and demonstration plots with local communities.',
      'Support Village Savings and Loan Associations (VSLAs) with financial literacy and bookkeeping mentorship.',
      'Establish linkages between community farmer groups, local off-takers, and agribusiness cooperatives.',
      'Conduct regular field monitoring and submit timely quantitative progress reports.'
    ],
    requirements: [
      'Diploma or Degree in Agriculture, Agribusiness, Rural Development, or related discipline.',
      'Minimum 2 years of field experience in community-based agricultural or livelihood projects.',
      'Experience working in refugee settlements or fragile community environments.',
      'Fluency in English; working knowledge of local languages (Acholi, Luo, Juba Arabic, or Runyoro) is an added advantage.',
      'Valid motorcycle riding permit and willingness to work in rural field environments.'
    ],
    benefits: [
      'Competitive non-profit salary package and field allowances.',
      'Comprehensive medical insurance coverage.',
      'Professional mentorship in humanitarian livelihood programming.',
      'Opportunities for leadership growth in a rapidly expanding CBO.'
    ],
    isOngoing: false,
    deadline: '2026-10-31',
    status: 'Open',
    applicationMethod: 'internal',
    applicationEmail: 'careers@resticbo.org',
    applicationUrl: '',
    applicationInstructions: 'Submit your CV (max 3 pages) and a 1-page cover letter detailing your experience with farmer producer groups.',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'opp-comms-intern',
    key: 'opportunity:opp-comms-intern',
    title: 'Digital Communications & Storytelling Intern',
    category: 'Internships',
    type: 'Internship',
    workArrangement: 'Hybrid',
    location: 'Bweyale / Kiryandongo / Remote',
    duration: '3�6 Months',
    shortDescription: 'Work alongside RESTI field staff to document community impact stories, capture high-quality photography, and draft digital reports.',
    description: 'We are seeking an enthusiastic communications student or recent graduate to join our communications team. This internship offers hands-on experience in ethical humanitarian storytelling, nonprofit content production, website updates, and donor communications.',
    responsibilities: [
      'Interview community beneficiaries and draft human-interest impact stories.',
      'Capture dignified, high-quality photographs and short video clips during field activities.',
      'Assist in compiling content for monthly newsletters and social media updates.',
      'Organize and tag media files in RESTI�s digital asset archive.'
    ],
    requirements: [
      'Degree or ongoing studies in Mass Communication, Journalism, Public Relations, or Graphic Design.',
      'Clear, empathetic writing skills in English.',
      'Familiarity with basic photo editing tools and social media platforms.',
      'Respect for informed consent protocols when photographing vulnerable communities.'
    ],
    benefits: [
      'Monthly modest living stipend and communication allowance.',
      'One-on-one mentorship with senior communications and tech leads.',
      'Published portfolio pieces showcasing your humanitarian storytelling.'
    ],
    isOngoing: false,
    deadline: '2026-11-15',
    status: 'Open',
    applicationMethod: 'internal',
    applicationEmail: 'careers@resticbo.org',
    applicationUrl: '',
    applicationInstructions: 'Please upload your CV along with 1-2 writing samples or photo/media portfolio links.',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z'
  },
  {
    id: 'opp-solar-water-consultant',
    key: 'opportunity:opp-solar-water-consultant',
    title: 'Solar Water Infrastructure & Borehole Consultant',
    category: 'Consultancy',
    type: 'Short-Term Consultancy',
    workArrangement: 'On-Site',
    location: 'Kiryandongo Refugee Settlement Zones',
    duration: '3 Months',
    shortDescription: 'Perform technical audits of motorized solar water pumping systems, evaluate yield capacities, and train local community maintenance committees.',
    description: 'RESTI invites experienced water engineering and renewable energy consultants to submit expressions of interest for a comprehensive technical assessment of community solar-powered borehole installations in Kiryandongo District.',
    responsibilities: [
      'Conduct hydrological and electro-mechanical performance assessments of 6 solar-hybrid pumping stations.',
      'Develop preventive maintenance manuals tailored for community water management committees.',
      'Train 25 community water caretakers in routine system inspection and fault isolation.',
      'Produce an engineering assessment report with costed rehabilitation recommendations.'
    ],
    requirements: [
      'BSc or MSc in Civil Engineering, Water Resources Engineering, or Electrical Engineering.',
      'Proven track record of at least 5 years in rural solar water pumping design and audit.',
      'Registration with the Uganda Institution of Professional Engineers (UIPE) or equivalent body.',
      'Demonstrated experience with UN or international humanitarian WASH guidelines.'
    ],
    benefits: [
      'Competitive lump-sum consultancy fee based on agreed deliverables.',
      'Field logistics support in Kiryandongo District.'
    ],
    isOngoing: false,
    deadline: '2026-10-15',
    status: 'Open',
    applicationMethod: 'email',
    applicationEmail: 'procurement@resticbo.org',
    applicationUrl: '',
    applicationInstructions: 'Email your technical proposal, detailed CV, and proposed financial fee schedule to procurement@resticbo.org with subject "Solar WASH Consultancy - [Your Name/Firm]".',
    createdAt: '2026-09-12T11:00:00.000Z',
    updatedAt: '2026-09-12T11:00:00.000Z'
  },
  {
    id: 'opp-youth-fellowship',
    key: 'opportunity:opp-youth-fellowship',
    title: 'Grassroots Peacebuilding & Youth Leadership Fellow',
    category: 'Fellowships',
    type: 'Fellowship',
    workArrangement: 'Field-Based',
    location: 'Kiryandongo District',
    duration: '9 Months',
    shortDescription: 'Facilitate inter-communal sports tournaments, dialogue forums, and cultural exchanges that promote peaceful coexistence among youth.',
    description: 'The RESTI Youth Peace Fellowship empowers young change-makers from refugee and host communities to spearhead community peacebuilding, sports for development, and conflict resolution initiatives across Kiryandongo District.',
    responsibilities: [
      'Organize youth-led community cleaning drives and football tournaments uniting refugee and host youth.',
      'Facilitate constructive dialogues addressing community friction and fostering social cohesion.',
      'Mentor 10 school peace clubs in peaceful dispute resolution and peer support.',
      'Coordinate quarterly Youth Peace Summit bringing together community elders and youth leaders.'
    ],
    requirements: [
      'Aged between 19 and 29 with demonstrated community leadership experience.',
      'Resident of Kiryandongo District or Kiryandongo Refugee Settlement.',
      'Strong public speaking and mediation capability.',
      'Demonstrated commitment to non-violence and social inclusion.'
    ],
    benefits: [
      'Monthly leadership stipend throughout the 9-month fellowship.',
      'Certified peacebuilding and project management leadership modules.',
      'Mini-grant funding to implement your own community peace project.'
    ],
    isOngoing: false,
    deadline: '2026-12-01',
    status: 'Open',
    applicationMethod: 'internal',
    applicationEmail: 'fellowships@resticbo.org',
    applicationUrl: '',
    applicationInstructions: 'Submit our online fellowship application detailing your vision for youth peacebuilding in your village or settlement zone.',
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z'
  }
];

export function computeOpportunityStatus(opp: OpportunityItem): OpportunityStatus {
  if (opp.status === 'Draft' || opp.status === 'Archived' || opp.status === 'Closed') {
    return opp.status;
  }
  
  if (opp.isOngoing || opp.deadline?.toLowerCase() === 'ongoing') {
    return 'Ongoing';
  }
  
  if (opp.deadline) {
    const deadlineDate = new Date(opp.deadline);
    if (!isNaN(deadlineDate.getTime())) {
      deadlineDate.setHours(23, 59, 59, 999);
      const now = new Date();
      if (now.getTime() > deadlineDate.getTime()) {
        return 'Closed';
      }
      const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 7 && daysRemaining >= 0) {
        return 'Closing Soon';
      }
    }
  }
  
  return opp.status || 'Open';
}

export function isOpportunityPubliclyActive(opp: OpportunityItem): boolean {
  if (opp.category?.toLowerCase().includes('volunteer') || opp.type?.toLowerCase().includes('volunteer')) {
    return false;
  }
  const liveStatus = computeOpportunityStatus(opp);
  return liveStatus === 'Open' || liveStatus === 'Closing Soon' || liveStatus === 'Ongoing';
}

export function getCategoryBadgeClasses(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('job') || cat.includes('employment')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (cat.includes('intern')) {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }
  if (cat.includes('consult')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (cat.includes('fellow')) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getStatusBadgeClasses(status: OpportunityStatus): string {
  switch (status) {
    case 'Open':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Closing Soon':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Ongoing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Closed':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Draft':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'Archived':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export interface OpportunitiesSettings {
  emptyTitle: string;
  emptyMessage: string;
  emptyButtonText: string;
  emptyButtonLink: string;
  showInquiriesBox: boolean;
  inquiriesTitle: string;
  inquiriesDescription: string;
  inquiriesEmail: string;
  inquiriesSubject: string;
}

export const DEFAULT_OPPORTUNITIES_SETTINGS: OpportunitiesSettings = {
  emptyTitle: 'No current opportunities',
  emptyMessage: 'We do not currently have any open opportunities. Please check back later for new positions, internships, consultancy tenders, and other ways to get involved with RESTI.',
  emptyButtonText: 'Contact RESTI',
  emptyButtonLink: '/contact',
  showInquiriesBox: true,
  inquiriesTitle: "Don't see a role that matches your skills?",
  inquiriesDescription: "RESTI thrives on passionate changemakers, researchers, and community partners from all walks of life. Send us your profile or proposal, and let us explore how we can collaborate together to build self-reliant refugee and host communities.",
  inquiriesEmail: 'careers@resticbo.org',
  inquiriesSubject: 'General Inquiry / Partnership Proposal',
};

