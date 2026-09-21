import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Heart, CheckCircle2, MapPin, Users, 
  Sparkles, Clock, ChevronRight, Check, Image as ImageIcon,
  ExternalLink, Calendar, HelpCircle, ArrowRight, ShieldCheck,
  Building2, Globe, BookmarkCheck
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import { SEO } from './SEO';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useDonationModal } from './DonationModalContext';
import { getDeletedProgramIds } from '../utils/programDeletedRegistry';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface ProgramMetric {
  label: string;
  value: string;
  subtext?: string;
  reportingPeriod?: string;
}

export interface ProgramActivity {
  title: string;
  desc: string;
  icon?: string;
  image?: string;
}

export interface ProgramGalleryItem {
  url: string;
  caption: string;
  date?: string;
  location?: string;
}

export interface Program {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'Active' | 'Upcoming' | 'Completed' | 'Paused' | string;
  location: string;
  timeline: string;
  beneficiaries: string;
  verifiedBeneficiaries?: string;
  whereWeWork?: string;
  whoWeSupport?: string;
  objectives: string[];
  keyActivities: ProgramActivity[];
  impactMetrics?: ProgramMetric[];
  impactStatement?: string;
  gallery?: ProgramGalleryItem[];
  leadCoordinator?: string;
}

interface NewsArticleSummary {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  category?: string;
  publishDate?: string;
  image?: string;
  programId?: string;
}

export const DETAILED_FALLBACK_PROGRAMS: Record<string, Program> = {
  education: {
    id: 'education',
    title: 'Education & Literacy Initiative',
    category: 'Education',
    status: 'Active',
    description: 'Providing quality scholastic materials, remedial literacy tutoring, and girl-child retention support for refugee and host community children in Kiryandongo District.',
    content: `In displaced and under-resourced communities across Kiryandongo District, access to quality schooling is frequently disrupted by extreme poverty, displacement trauma, and overcrowded classrooms.

RESTI's Education & Literacy Initiative directly tackles these disparities by establishing community learning centers, accelerated reading circles, and peer tutoring networks. We partner with local primary and secondary schools to provide essential textbooks, train community instructors, and provide direct scholastic assistance for children at risk of dropping out.

Furthermore, we remove key barriers for adolescent girls by providing menstrual hygiene kits and dignity mentorship—ensuring that young women can attend school consistently and safely.`,
    image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo Refugee Settlement & Host Community Schools',
    timeline: 'Ongoing (2024–2026)',
    beneficiaries: 'Refugee and host community children (ages 5–18) and adolescent girls',
    verifiedBeneficiaries: '3,450+',
    whoWeSupport: 'We support vulnerable primary and secondary school children, out-of-school youth seeking literacy catch-up, and adolescent girls in Kiryandongo District who face financial and socio-cultural barriers to completing their education.',
    whereWeWork: 'Refugee settlement primary schools and neighboring host community education hubs across Kiryandongo District where high student ratios strain existing classroom resources.',
    objectives: [
      'Improve primary and secondary school retention rates among marginalized children.',
      'Eliminate functional illiteracy through daily after-school remedial reading clinics.',
      'Equip community learning hubs with solar study lighting, textbook libraries, and basic supplies.',
      'Train community instructors and mentors in child protection and positive classroom discipline.'
    ],
    keyActivities: [
      {
        title: 'Scholastic Kit Distribution',
        desc: 'Supplying exercise books, pens, pencils, mathematical sets, and bags so children attend class equipped to learn.'
      },
      {
        title: 'After-School Remedial Hubs',
        desc: 'Operating daily reading and arithmetic clinics for grades 1 through 7 focusing on foundational phonics and English fluency.'
      },
      {
        title: 'Girl-Child Retention & Dignity Kits',
        desc: 'Distributing menstrual hygiene supplies and hosting girl-led mentorship circles so adolescent girls remain in class with dignity.'
      },
      {
        title: 'Community Teacher Support',
        desc: 'Collaborating with certified district educators to deliver continuous pedagogy training and positive psychosocial support.'
      }
    ],
    impactMetrics: [
      { label: 'Students Supported', value: '3,450+', reportingPeriod: '2024–2025 Academic Cycle' },
      { label: 'Partner Schools Reached', value: '8 Schools', reportingPeriod: '2025' },
      { label: 'Dignity Kits Distributed', value: '1,200+', reportingPeriod: '2024–2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        caption: 'Students receiving exercise books and scholastic materials in Kiryandongo',
        date: '2025',
        location: 'Kiryandongo Settlement'
      },
      {
        url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
        caption: 'Remedial reading circle in session at community learning center',
        date: '2025',
        location: 'Ranch 18'
      }
    ]
  },
  healthcare: {
    id: 'healthcare',
    title: 'Community Health & Nutrition Outreach',
    category: 'Healthcare',
    status: 'Active',
    description: 'Operating mobile health clinics, maternal health checkups, and child malnutrition screenings across remote settlement clusters and host villages in Kiryandongo.',
    content: `Healthcare delivery in Kiryandongo faces extraordinary pressure from geographical isolation, high vulnerability to malaria, waterborne illnesses, and malnutrition.

RESTI’s Community Health & Nutrition Program bridges the gap between centralized medical facilities and hard-to-reach settlement zones. Operating mobile clinics and equipping Village Health Teams (VHTs), we deliver primary care, child growth monitoring, prenatal checkups, and preventative health education directly to neighborhoods.

Our preventative approach focuses on saving lives before complications escalate, with targeted support for pregnant mothers, infants, and families living miles away from government health centers.`,
    image: 'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Panyadoli Catchment & Kiryandongo Settlement Zones',
    timeline: 'Ongoing Essential Service',
    beneficiaries: 'Expectant mothers, infants under 5, and vulnerable families',
    verifiedBeneficiaries: '14,200+',
    whoWeSupport: 'Expectant mothers, newborns, and isolated families in Kiryandongo who cannot easily reach hospital facilities due to transport and economic limitations.',
    whereWeWork: 'Remote ranch clusters and settlement zones in Kiryandongo District located outside easy walking distance of Panyadoli Health Center IV.',
    objectives: [
      'Reduce preventable childhood illnesses through early screening and primary health triage.',
      'Eliminate acute child malnutrition through continuous MUAC surveillance and therapeutic feeding support.',
      'Promote safe motherhood by encouraging facility-based deliveries and regular prenatal checkups.',
      'Conduct regular outreach clinics providing free malaria testing, deworming, and essential medicines.'
    ],
    keyActivities: [
      {
        title: 'Mobile Medical Outreach',
        desc: 'Deploying certified healthcare workers to remote settlement clusters to provide free diagnostic tests and essential medications.'
      },
      {
        title: 'Maternal & Newborn Care Circles',
        desc: 'Connecting expectant mothers with antenatal checkups, safe delivery kits, and postpartum newborn health visits.'
      },
      {
        title: 'Child Malnutrition Screening',
        desc: 'Performing mid-upper arm circumference (MUAC) screenings and teaching caretakers how to prepare nutrient-dense local foods.'
      },
      {
        title: 'Village Health Team (VHT) Training',
        desc: 'Equipping grassroots health workers with diagnostic aids to track and refer disease outbreaks to district health authorities.'
      }
    ],
    impactMetrics: [
      { label: 'Patients Treated & Screened', value: '14,200+', reportingPeriod: '2024–2025' },
      { label: 'Safe Deliveries Supported', value: '850+', reportingPeriod: '2025' },
      { label: 'Village Health Workers Trained', value: '65 Workers', reportingPeriod: '2024–2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
        caption: 'Community health worker conducting health screening in Kiryandongo',
        date: '2025',
        location: 'Kiryandongo'
      }
    ]
  },
  livelihoods: {
    id: 'livelihoods',
    title: 'Sustainable Livelihoods & Micro-Enterprise',
    category: 'Livelihoods',
    status: 'Active',
    description: 'Equipping displaced and host community households with vocational skills, Village Savings & Loan Associations (VSLA), and agricultural training to achieve self-reliance.',
    content: `True human dignity begins when families transition from emergency relief assistance to sustainable self-reliance. In Kiryandongo District, displaced families possess strong determination but often lack startup tools and access to affordable capital.

RESTI’s Sustainable Livelihoods program provides practical vocational apprenticeships, financial literacy training, and community banking through Village Savings and Loan Associations (VSLAs). Participants learn trades such as tailoring, carpentry, and climate-smart horticulture.

By establishing revolving community savings funds, graduates launch viable micro-enterprises that reliably feed, clothe, and educate their families throughout the year.`,
    image: 'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Bweyale Town Council & Settlement Agricultural Zones',
    timeline: 'Multi-Year Economic Cohorts',
    beneficiaries: 'Female-headed households, young adults, and smallholder farmers',
    verifiedBeneficiaries: '720+',
    whoWeSupport: 'Unemployed young adults, single mothers, and subsistence farmers across refugee and host communities who need practical trades and access to community capital.',
    whereWeWork: 'Bweyale Town Council and surrounding agricultural settlements in Kiryandongo District with access to local commercial centers.',
    objectives: [
      'Enable vulnerable households to establish self-sustaining small enterprises.',
      'Form and mentor community Village Savings & Loan Associations with transparent financial governance.',
      'Promote climate-smart horticulture and kitchen gardening for improved household nutrition.',
      'Equip vocational graduates with essential starter toolkits to begin immediate trade work.'
    ],
    keyActivities: [
      {
        title: 'Vocational Trade Apprenticeships',
        desc: 'Hands-on practical training in tailoring, carpentry, hairdressing, and sustainable soap manufacturing.'
      },
      {
        title: 'VSLA Community Savings Groups',
        desc: 'Establishing peer savings circles of 25–30 members with lockboxes, record ledgers, and financial literacy training.'
      },
      {
        title: 'Climate-Resilient Agriculture',
        desc: 'Distributing drought-tolerant seed varieties and training farmers in organic soil enrichment and kitchen gardening.'
      },
      {
        title: 'Starter Toolkit Provision',
        desc: 'Supplying certified trade equipment and sewing machines to graduated apprentices to start their micro-businesses.'
      }
    ],
    impactMetrics: [
      { label: 'Entrepreneurs Graduated', value: '720+', reportingPeriod: '2024–2025' },
      { label: 'Active Savings Groups (VSLA)', value: '48 Groups', reportingPeriod: '2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80',
        caption: 'Women-led tailoring and micro-enterprise workshop in Bweyale',
        date: '2025',
        location: 'Bweyale'
      }
    ]
  },
  wash: {
    id: 'wash',
    title: 'Clean Water & Dignified Sanitation (WASH)',
    category: 'WASH',
    status: 'Active',
    description: 'Rehabilitating deep boreholes, installing safe water points, and training community water committees to secure clean daily drinking water.',
    content: `Access to clean, potable drinking water is a basic human right that underpins public health, safety, and community productivity. In Kiryandongo, existing water points often break down under heavy communal demand, forcing women and children to walk long distances to unprotected sources.

RESTI’s WASH program drills and rehabilitates deep boreholes, installs solar pumping systems, and constructs ventilated latrines in community schools and public markets.

To ensure long-term functionality, every water facility is handed over to a democratically trained Water User Committee equipped with tools and spare part connections for local maintenance.`,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo District Settlement Zones & Rural Host Villages',
    timeline: 'Ongoing Infrastructure & Hygiene',
    beneficiaries: 'Refugee and rural host community residents',
    verifiedBeneficiaries: '18,500+',
    whoWeSupport: 'Settlement residents and neighboring host villages facing water scarcity, particularly women and school-age girls who bear the physical burden of water collection.',
    whereWeWork: 'High-density settlement clusters and rural villages in Kiryandongo District where existing boreholes have broken down or groundwater is constrained.',
    objectives: [
      'Restore broken water points to reduce daily water fetching walk times for families.',
      'Prevent waterborne illness outbreaks by safeguarding water sources and providing purification tablets.',
      'Train and certify local Water User Committees to guarantee 100% community maintenance ownership.',
      'Construct hygienic, ventilated pit latrines and handwashing stations at crowded primary schools.'
    ],
    keyActivities: [
      {
        title: 'Borehole Overhauls & Repairs',
        desc: 'Replacing corroded pipes, damaged cylinders, and cracked concrete protective aprons on community wells.'
      },
      {
        title: 'Water User Committee Governance',
        desc: 'Electing and training gender-balanced local committees to manage maintenance funds and supervise water point care.'
      },
      {
        title: 'School Sanitation Infrastructure',
        desc: 'Constructing ventilated latrines with private cubicles and handwashing stations at crowded primary schools.'
      },
      {
        title: 'Community Hygiene Campaigns',
        desc: 'Conducting door-to-door sanitation demonstrations and distributing safe water purification tablets.'
      }
    ],
    impactMetrics: [
      { label: 'Boreholes Restored & Drilled', value: '22 Wells', reportingPeriod: '2024–2025' },
      { label: 'Community Members Served', value: '18,500+', reportingPeriod: '2025' },
      { label: 'Water Committees Certified', value: '34 Teams', reportingPeriod: '2024–2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&q=80',
        caption: 'Newly rehabilitated community borehole providing clean potable water',
        date: '2025',
        location: 'Kiryandongo'
      }
    ]
  },
  women: {
    id: 'women',
    title: 'Women Empowerment & Protection Initiative',
    category: 'Protection',
    status: 'Active',
    description: 'Providing safe spaces, psychosocial counseling, emergency legal aid referrals, and leadership development for displaced and vulnerable women.',
    content: `Forced displacement places women and adolescent girls under severe structural vulnerabilities, including heightened risks of domestic violence, early forced marriages, and economic dependence.

RESTI’s Women Empowerment & Protection program creates safe, restorative gathering spaces where women access confidential psychosocial counseling, legal aid referrals, and life skills development.

We combine protection with micro-livelihood training, ensuring that women gain the financial independence necessary to support their families and live with security and confidence.`,
    image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo Refugee Settlement Safe Spaces & Host Communities',
    timeline: 'Active Protection Initiative',
    beneficiaries: 'Women, adolescent mothers, and female community leaders',
    verifiedBeneficiaries: '1,850+',
    whoWeSupport: 'Women-headed households, young single mothers, and survivors of gender-based violence who require confidential peer support networks and practical livelihood skills.',
    whereWeWork: 'Community safe spaces and women centers established across Kiryandongo Refugee Settlement and host communities.',
    objectives: [
      'Provide confidential psychosocial counseling and legal/medical referral pathways.',
      'Support women into leadership roles within local settlement welfare councils.',
      'Strengthen financial autonomy through dedicated women-led savings and loan groups.',
      'Engage male community allies and leaders to prevent gender-based violence.'
    ],
    keyActivities: [
      {
        title: 'Community Safe Spaces',
        desc: 'Maintaining confidential, safe centers where women gather for peer mentorship, counseling, and practical skills training.'
      },
      {
        title: 'Rapid Legal & Health Referrals',
        desc: 'Partnering with local health clinics and police child & family protection officers to provide timely crisis support.'
      },
      {
        title: 'Women Civic Leadership Circles',
        desc: 'Training female community champions in public speaking, committee leadership, and human rights advocacy.'
      },
      {
        title: 'Male Champions of Change',
        desc: 'Hosting community dialogues with men, youth, and elders to challenge harmful norms and champion family safety.'
      }
    ],
    impactMetrics: [
      { label: 'Women Directly Supported', value: '1,850+', reportingPeriod: '2024–2025' },
      { label: 'Safe Space Centers', value: '18 Hubs', reportingPeriod: '2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80',
        caption: 'Community women leadership workshop in session',
        date: '2025',
        location: 'Kiryandongo'
      }
    ]
  },
  youth: {
    id: 'youth',
    title: 'Youth Development & Creative Empowerment',
    category: 'Youth',
    status: 'Active',
    description: 'Fostering peaceful co-existence, digital literacy, sports leagues, and creative arts mentorship to build confidence and social cohesion among young people.',
    content: `Young people constitute over 60% of the population in Kiryandongo District. Without constructive opportunities for personal development and recreation, youth can experience frustration, isolation, and social friction.

RESTI’s Youth Development program harnesses the universal language of sports, creative arts, debate, and civic leadership to bridge ethnic divides and nurture community leadership.

Through Sports for Peace tournaments and leadership academies, we equip young people with the skills and confidence to lead constructive change in their communities.`,
    image: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Bweyale Community Grounds & Settlement Recreation Centers',
    timeline: 'Year-Round Youth Program',
    beneficiaries: 'Youth aged 14–29 across diverse ethnic and national backgrounds',
    verifiedBeneficiaries: '2,800+',
    whoWeSupport: 'Young women and men from both refugee settlements and host neighborhoods who want constructive channels for athletics, arts, digital skills, and community service.',
    whereWeWork: 'Community sports grounds, youth recreation centers, and local secondary schools throughout Kiryandongo District.',
    objectives: [
      'Foster peaceful co-existence between refugee and host community youth through shared activities.',
      'Channel youth energies into constructive vocational preparation and community service.',
      'Promote healthy lifestyles and reduce substance misuse through structured athletic leagues.',
      'Provide basic digital literacy and creative storytelling skills to amplify youth voices.'
    ],
    keyActivities: [
      {
        title: 'Sports for Peace Leagues',
        desc: 'Organizing football and netball leagues that bring together mixed teams from different nationalities on neutral ground.'
      },
      {
        title: 'Creative Arts & Peacebuilding',
        desc: 'Mentoring youth troupes in drama, music, and spoken-word poetry addressing social harmony and mutual respect.'
      },
      {
        title: 'Youth Leadership Academy',
        desc: 'Conducting workshops on project planning, public speaking, conflict mediation, and community initiative leadership.'
      },
      {
        title: 'Peer Mentorship Networks',
        desc: 'Training youth coaches to provide positive peer guidance and direct friends in distress to counseling resources.'
      }
    ],
    impactMetrics: [
      { label: 'Active Youth Participants', value: '2,800+', reportingPeriod: '2024–2025' },
      { label: 'Sports for Peace Teams', value: '24 Teams', reportingPeriod: '2025' }
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&q=80',
        caption: 'Youth sports tournament promoting peace and unity in Bweyale',
        date: '2025',
        location: 'Bweyale Community Grounds'
      }
    ]
  }
};

export function ProgramDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const cleanId = (id || '').replace(/^program:/, '').trim().toLowerCase();
  const [program, setProgram] = useState<Program | null>(() => DETAILED_FALLBACK_PROGRAMS[cleanId] || null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedNews, setRelatedNews] = useState<NewsArticleSummary[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const cleanId = (id || '').replace(/^program:/, '').trim().toLowerCase();
        
        // Check deletion registry
        const deletedSet = await getDeletedProgramIds();
        if (deletedSet.has(cleanId)) {
          setProgram(null);
          setLoading(false);
          return;
        }

        let matchedProgram: Program | null = null;

        // 1. Check fallback dictionary first if direct slug match
        if (DETAILED_FALLBACK_PROGRAMS[cleanId]) {
          matchedProgram = DETAILED_FALLBACK_PROGRAMS[cleanId];
        }

        // 2. Direct lookup in Supabase kv_store_2a4be611
        try {
          const { data: kvData } = await supabase
            .from('kv_store_2a4be611')
            .select('*')
            .like('key', 'program:%');

          if (kvData && kvData.length > 0) {
            const foundKv = kvData.find(item => {
              const k = (item.key || '').replace(/^program:/, '').trim().toLowerCase();
              const val = item.value || {};
              const vId = (val.id || '').replace(/^program:/, '').trim().toLowerCase();
              const vTitle = (val.title || '').trim().toLowerCase().replace(/\s+/g, '-');
              return k === cleanId || vId === cleanId || vTitle === cleanId;
            });

            if (foundKv && foundKv.value) {
              matchedProgram = normalizeProgram(foundKv.value, foundKv.key || cleanId);
            }
          }
        } catch (kvErr) {
          console.warn('Direct kv_store read notice:', kvErr);
        }

        // 3. Try backend API single endpoint if still not matched
        if (!matchedProgram) {
          try {
            const singleRes = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${encodeURIComponent(cleanId)}`,
              {
                headers: { Authorization: `Bearer ${publicAnonKey}` },
                signal: AbortSignal.timeout(4000),
              }
            );
            if (singleRes.ok) {
              const singleData = await singleRes.json();
              if (singleData.program) {
                const pVal = singleData.program.value || singleData.program;
                matchedProgram = normalizeProgram(pVal, singleData.program.key || cleanId);
              }
            }
          } catch {
            // Non-critical
          }
        }

        // 4. Try backend API list search
        if (!matchedProgram) {
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
              {
                headers: { Authorization: `Bearer ${publicAnonKey}` },
                signal: AbortSignal.timeout(4000),
              }
            );

            if (response.ok) {
              const data = await response.json();
              const programs = data.programs || [];
              const found = programs.find((p: any) => {
                const pKey = (p.key || '').replace(/^program:/, '').trim().toLowerCase();
                const pId = (p.value?.id || p.id || '').replace(/^program:/, '').trim().toLowerCase();
                const pTitle = (p.value?.title || p.title || '').trim().toLowerCase().replace(/\s+/g, '-');
                return pKey === cleanId || pId === cleanId || pTitle === cleanId;
              });

              if (found) {
                matchedProgram = normalizeProgram(found.value || found, found.key || cleanId);
              }
            }
          } catch {
            // Fall through
          }
        }

        // 5. Fallback title match against detailed fallbacks
        if (!matchedProgram) {
          const fallbackKeys = Object.keys(DETAILED_FALLBACK_PROGRAMS);
          const foundKey = fallbackKeys.find(k => 
            cleanId.includes(k) || k.includes(cleanId) || 
            DETAILED_FALLBACK_PROGRAMS[k].title.toLowerCase().includes(cleanId)
          );
          if (foundKey) {
            matchedProgram = DETAILED_FALLBACK_PROGRAMS[foundKey];
          }
        }

        setProgram(matchedProgram);
      } catch (err) {
        console.error('Error fetching program detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgram();
    }
  }, [id]);

  // Normalize program data strictly WITHOUT cross-program archetype bleeding
  const normalizeProgram = (val: any, rawKey: string): Program => {
    const cleanId = (val.id || rawKey).replace(/^program:/, '');
    
    // Status normalization
    let status = val.status || (val.active === false ? 'Paused' : 'Active');
    const validStatuses = ['Active', 'Upcoming', 'Completed', 'Paused'];
    if (!validStatuses.includes(status)) {
      status = 'Active';
    }

    // Clean activities
    let keyActivities: ProgramActivity[] = [];
    if (Array.isArray(val.keyActivities)) {
      keyActivities = val.keyActivities
        .filter((a: any) => a && (typeof a === 'string' ? a.trim() : a.title))
        .map((a: any) => {
          if (typeof a === 'string') {
            const idx = a.indexOf(':');
            return idx > -1 
              ? { title: a.substring(0, idx).trim(), desc: a.substring(idx + 1).trim() }
              : { title: a.trim(), desc: '' };
          }
          return {
            title: a.title || '',
            desc: a.desc || a.description || '',
            icon: a.icon || '',
            image: a.image || ''
          };
        });
    }

    // Clean objectives / goals
    let objectives: string[] = [];
    if (Array.isArray(val.objectives)) {
      objectives = val.objectives.filter(Boolean);
    } else if (typeof val.objectives === 'string') {
      objectives = val.objectives.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }

    // Clean impact metrics (strictly verified only)
    let impactMetrics: ProgramMetric[] = [];
    if (Array.isArray(val.impactMetrics)) {
      impactMetrics = val.impactMetrics
        .filter((m: any) => m && m.label && m.value)
        .map((m: any) => ({
          label: m.label,
          value: m.value,
          subtext: m.subtext || undefined,
          reportingPeriod: m.reportingPeriod || m.period || undefined
        }));
    }

    // Clean gallery
    let gallery: ProgramGalleryItem[] = [];
    if (Array.isArray(val.gallery)) {
      gallery = val.gallery.filter((g: any) => g && (g.url || g.image)).map((g: any) => ({
        url: g.url || g.image,
        caption: g.caption || '',
        date: g.date || undefined,
        location: g.location || undefined
      }));
    }

    return {
      id: cleanId,
      title: val.title || 'RESTI Community Program',
      category: val.category || 'Community Development',
      status,
      description: val.description || '',
      content: val.content || val.about || val.description || '',
      image: val.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80',
      createdAt: val.createdAt || new Date().toISOString(),
      updatedAt: val.updatedAt || undefined,
      location: val.location || 'Kiryandongo District, Uganda',
      timeline: val.timeline || 'Ongoing (2024–2026)',
      beneficiaries: val.beneficiaries || 'Refugee and host community members',
      verifiedBeneficiaries: val.verifiedBeneficiaries || undefined,
      whereWeWork: val.whereWeWork || (val.location ? `${val.location}. Operating directly to serve vulnerable refugee and host community members.` : 'Kiryandongo District, Uganda.'),
      whoWeSupport: val.whoWeSupport || (val.beneficiaries ? `This initiative directly supports ${val.beneficiaries} across Kiryandongo District.` : 'Vulnerable households, youth, and families in Kiryandongo District.'),
      objectives,
      keyActivities,
      impactMetrics,
      impactStatement: val.impactStatement || undefined,
      gallery,
      leadCoordinator: val.leadCoordinator || undefined
    };
  };

  // Fetch related news and stories dynamically for this program
  useEffect(() => {
    if (!program) return;

    const fetchRelatedNews = async () => {
      try {
        setNewsLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`,
          {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(5000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const articles: any[] = data.news || [];
          
          const progCat = (program.category || '').toLowerCase();
          const progTitle = (program.title || '').toLowerCase();
          const progId = (program.id || '').toLowerCase();

          // Match articles by category, programId, or title relevance
          const matches = articles.filter(art => {
            if (art.status && art.status !== 'published') return false;
            
            const artCat = (art.category || '').toLowerCase();
            const artTitle = (art.title || '').toLowerCase();
            const artDesc = (art.description || '').toLowerCase();

            if (art.programId && (art.programId === progId || art.programId === program.id)) return true;
            if (artCat && progCat && (artCat.includes(progCat) || progCat.includes(artCat))) return true;
            if (artTitle.includes(progTitle) || artDesc.includes(progTitle)) return true;
            if (progId.length > 3 && (artTitle.includes(progId) || artDesc.includes(progId))) return true;

            return false;
          }).slice(0, 3);

          setRelatedNews(matches.map(m => ({
            id: m.id || m.key,
            slug: m.slug,
            title: m.title,
            description: m.description,
            category: m.category,
            publishDate: m.publishDate,
            image: m.image,
            programId: m.programId
          })));
        }
      } catch (err) {
        console.warn('Could not fetch related stories:', err);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchRelatedNews();
  }, [program]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: program?.title,
        text: program?.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Program link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Active').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Active Program
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Check className="w-3.5 h-3.5 text-slate-600" />
            Completed
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Active
          </span>
        );
    }
  };

  if (!program) {
    return (
      <div className="bg-slate-50 min-h-screen pb-24 flex items-center justify-center pt-28 sm:pt-36">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-2xl text-slate-900 mb-2 font-extrabold font-heading">Program Not Found</h2>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            The program you are looking for may have been updated or moved. You can browse all active community initiatives in Kiryandongo.
          </p>
          <Link to="/programs">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <ArrowLeft size={18} className="mr-2" />
              Explore All Programs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasVerifiedMetrics = program.impactMetrics && program.impactMetrics.length > 0;

  return (
    <div className="bg-slate-50/60 min-h-screen pt-24 sm:pt-28 pb-24 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <SEO 
        title={`${program.title} | RESTI Community Programs`} 
        description={program.description ? program.description.substring(0, 160) : 'RESTI CBO community initiative in Kiryandongo District, Uganda.'} 
        image={program.image} 
        type="article"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link to="/programs" className="hover:text-emerald-700 transition-colors">Our Programs</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{program.title}</span>
        </nav>

        {/* ==================================================================== */}
        {/* SECTION 1: PROGRAM HEADER (Clean Hero) */}
        {/* ==================================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 mb-10 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Header Content */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                  {program.category}
                </span>
                {getStatusBadge(program.status)}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 tracking-tight leading-[1.15]">
                {program.title}
              </h1>

              {program.description && (
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                  {program.description}
                </p>
              )}

              {/* Location Tag */}
              <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-700">{program.location}</span>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Button
                  onClick={openDonationModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:-translate-y-0.5"
                >
                  <Heart size={16} className="mr-2 text-white" fill="currentColor" />
                  Support This Program
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl"
                >
                  <Share2 size={16} className="mr-2 text-slate-500" />
                  {copied ? 'Link Copied!' : 'Share'}
                </Button>
              </div>
            </div>

            {/* Right Large Program Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[4/3] bg-slate-100 group">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Main 2-Column Grid: Content & At a Glance Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ================================================================== */}
          {/* LEFT 8 COLUMNS: DETAILED SECTIONS */}
          {/* ================================================================== */}
          <div className="lg:col-span-8 space-y-10">

            {/* ================================================================ */}
            {/* SECTION 2: PROGRAM OVERVIEW ("About This Program") */}
            {/* ================================================================ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 border-b border-slate-100 pb-3">
                About This Program
              </h2>
              <div className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line font-normal space-y-4">
                {program.content}
              </div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 4: WHAT WE DO (3–6 Activity Cards) */}
            {/* ================================================================ */}
            {program.keyActivities && program.keyActivities.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                    What We Do
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Key activities and practical initiatives delivered under this program
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {program.keyActivities.map((act, idx) => (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-3">
                          {idx + 1}
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mb-1.5 font-heading">
                          {act.title}
                        </h3>
                        {act.desc && (
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {act.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================================================================ */}
            {/* SECTION 5: WHO WE SUPPORT */}
            {/* ================================================================ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                  Who We Support
                </h2>
              </div>
              <p className="text-slate-700 text-base leading-relaxed pt-1">
                {program.whoWeSupport}
              </p>
            </section>

            {/* ================================================================ */}
            {/* SECTION 6: WHERE WE WORK */}
            {/* ================================================================ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                  Where We Work
                </h2>
              </div>
              <p className="text-slate-700 text-base leading-relaxed pt-1">
                {program.whereWeWork}
              </p>
            </section>

            {/* ================================================================ */}
            {/* SECTION 7: PROGRAM GOALS (3–5 Clear Goals) */}
            {/* ================================================================ */}
            {program.objectives && program.objectives.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 border-b border-slate-100 pb-3">
                  Our Goals
                </h2>

                <div className="space-y-3 pt-1">
                  {program.objectives.map((goal, gIdx) => (
                    <div 
                      key={gIdx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={13} className="stroke-[3]" />
                      </div>
                      <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">
                        {goal}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================================================================ */}
            {/* SECTION 8: IMPACT (Verified Statistics or Qualitative Statement) */}
            {/* ================================================================ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                  Our Impact
                </h2>
                {hasVerifiedMetrics && (
                  <span className="text-xs font-semibold text-slate-400">
                    Verified Reporting
                  </span>
                )}
              </div>

              {hasVerifiedMetrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {program.impactMetrics!.map((metric, mIdx) => (
                    <div 
                      key={mIdx}
                      className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-heading">
                          {metric.value}
                        </p>
                        <p className="font-bold text-slate-800 text-sm mt-1 leading-snug">
                          {metric.label}
                        </p>
                        {metric.subtext && (
                          <p className="text-slate-500 text-xs mt-1">
                            {metric.subtext}
                          </p>
                        )}
                      </div>
                      {metric.reportingPeriod && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Calendar size={11} className="text-emerald-600 shrink-0" />
                          <span>{metric.reportingPeriod}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Qualitative Impact Statement Fallback */
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-950 flex items-start gap-3.5">
                  <BookmarkCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-semibold text-emerald-900 mb-1">Impact Statement</p>
                    <p className="text-emerald-800">
                      {program.impactStatement || "This program is actively serving communities in Kiryandongo. Verified impact reports will be published following the next project evaluation."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ================================================================ */}
            {/* SECTION 10: PROGRAM GALLERY */}
            {/* ================================================================ */}
            {program.gallery && program.gallery.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                    Program Gallery
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {program.gallery.map((photo, pIdx) => (
                    <div 
                      key={pIdx}
                      className="group rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex flex-col"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-slate-200">
                        <img 
                          src={photo.url} 
                          alt={photo.caption || `${program.title} activity photo`}
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500" 
                        />
                      </div>
                      <div className="p-3.5 flex flex-col justify-between flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                          {photo.caption}
                        </p>
                        {(photo.date || photo.location) && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                            {photo.location && <span>{photo.location}</span>}
                            {photo.date && photo.location && <span>•</span>}
                            {photo.date && <span>{photo.date}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================================================================ */}
            {/* SECTION 9: STORIES & UPDATES */}
            {/* ================================================================ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 border-b border-slate-100 pb-3">
                Stories & Updates from This Program
              </h2>

              {newsLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Loading stories and updates...
                </div>
              ) : relatedNews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {relatedNews.map((article) => (
                    <Link
                      key={article.id}
                      to={`/news/${article.slug || article.id}`}
                      className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {article.image && (
                          <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-slate-200">
                            <img 
                              src={article.image} 
                              alt={article.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                          {article.category || program.category}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-emerald-700">
                        <span>Read Article</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-slate-600 text-sm">
                    No updates published yet. Check back soon for stories and progress from this program.
                  </p>
                </div>
              )}
            </section>

          </div>

          {/* ================================================================== */}
          {/* RIGHT 4 COLUMNS: SIDEBAR (At a Glance & Action Cards) */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-6">

            {/* ================================================================ */}
            {/* SECTION 3: AT A GLANCE (Essential Facts) */}
            {/* ================================================================ */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 sticky top-28">
              <h3 className="text-lg font-bold font-heading text-slate-900 border-b border-slate-100 pb-3">
                At a Glance
              </h3>

              <div className="space-y-4 text-sm">
                
                {/* Location */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Location
                  </span>
                  <p className="font-semibold text-slate-800">
                    {program.location}
                  </p>
                </div>

                {/* Target Group */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Target Group
                  </span>
                  <p className="font-medium text-slate-800">
                    {program.beneficiaries}
                  </p>
                </div>

                {/* Program Period */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Program Period
                  </span>
                  <p className="font-medium text-slate-800">
                    {program.timeline}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </span>
                  <div>
                    {getStatusBadge(program.status)}
                  </div>
                </div>

                {/* Beneficiaries Reached (Only shown if verified) */}
                {program.verifiedBeneficiaries && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Beneficiaries Reached
                    </span>
                    <p className="text-xl font-black text-emerald-700 font-heading">
                      {program.verifiedBeneficiaries}
                    </p>
                  </div>
                )}

              </div>

              {/* Direct Support Button in Sidebar */}
              <div className="pt-2">
                <Button
                  onClick={openDonationModal}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  <Heart size={15} className="mr-2" fill="currentColor" />
                  Support This Program
                </Button>
              </div>

            </div>

            {/* Partnership Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md space-y-3">
              <h4 className="text-base font-bold font-heading text-white">
                Institutional Partnership
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Organizations, researchers, and funding partners can collaborate with RESTI to scale this initiative in Kiryandongo District.
              </p>
              <div className="pt-2">
                <Link to="/contact">
                  <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold py-2">
                    Become a Partner
                  </Button>
                </Link>
              </div>
            </div>

            {/* Other Programs Navigation */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm font-heading uppercase tracking-wider text-slate-400">
                Other Initiatives
              </h4>
              <div className="space-y-2 text-sm">
                {Object.keys(DETAILED_FALLBACK_PROGRAMS)
                  .filter(k => k !== program.id)
                  .slice(0, 4)
                  .map((key) => {
                    const otherP = DETAILED_FALLBACK_PROGRAMS[key];
                    return (
                      <Link
                        key={key}
                        to={`/programs/${otherP.id}`}
                        className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                          {otherP.title}
                        </p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {otherP.category}
                        </p>
                      </Link>
                    );
                  })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link 
                  to="/programs" 
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between"
                >
                  <span>View All Programs</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* ==================================================================== */}
        {/* SECTION 11: SUPPORT THIS PROGRAM (Bottom Clean CTA Banner) */}
        {/* ==================================================================== */}
        <section className="mt-14 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading tracking-tight">
              Support This Program in Kiryandongo
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Your charitable contributions and institutional partnerships help RESTI deliver grassroots education, healthcare, clean water, and self-reliance initiatives across refugee and host communities.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                onClick={openDonationModal}
                className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-8 py-3 rounded-xl shadow-md text-sm sm:text-base"
              >
                <Heart size={16} className="mr-2 text-rose-600" fill="currentColor" />
                Support This Program
              </Button>
              <Link to="/contact">
                <Button
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 text-white border-white/30 font-semibold px-7 py-3 rounded-xl text-sm sm:text-base"
                >
                  Become a Partner
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
