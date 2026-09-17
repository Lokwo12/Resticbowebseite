import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Tag, Share2, Heart, CheckCircle2, 
  MapPin, Users, Target, Activity, ShieldCheck, Sparkles, 
  BookOpen, ExternalLink, Award, Clock, ChevronRight, Check
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { LoadingScreen } from './LoadingScreen';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useDonationModal } from './DonationModalContext';

export interface ProgramMetric {
  label: string;
  value: string;
  subtext?: string;
}

export interface Program {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  image: string;
  createdAt: string;
  objectives: string[];
  keyActivities: { title: string; desc: string }[];
  beneficiaries: string;
  impactMetrics: ProgramMetric[];
  location: string;
  timeline: string;
  leadCoordinator?: string;
}

export const DETAILED_FALLBACK_PROGRAMS: Record<string, Program> = {
  education: {
    id: 'education',
    title: 'Education & Literacy Initiative',
    category: 'Education',
    description: 'Providing quality education support, school supplies, teacher mentorship, and tutoring to children and young adults in Kiryandongo District to unlock their potential.',
    content: `In displaced and under-resourced communities across Kiryandongo District, access to quality schooling is frequently disrupted by extreme poverty, displacement trauma, overcrowded classrooms, and an acute lack of foundational learning resources. 

RESTI's Education & Literacy Initiative directly tackles these disparities by establishing community learning centers, accelerated reading circles, and peer tutoring networks. We partner with local primary and secondary schools to provide essential classroom textbooks, train volunteer community instructors, and provide direct scholastic sponsorships for children at risk of dropping out.

Furthermore, we address period poverty by equipping adolescent girls with reusable sanitary wear, private washrooms, and dignity counseling—removing one of the most persistent barriers causing teenage girls to abandon their formal education.`,
    image: 'https://images.unsplash.com/photo-1666281269793-da06484657e8?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo Refugee Settlement & Host Community Schools, Uganda',
    timeline: 'Active Multi-Year Initiative (2024 – 2027)',
    beneficiaries: '3,450+ refugee and host community children (ages 5–18), adolescent girls, and out-of-school youth annually.',
    impactMetrics: [
      { label: 'Students Enrolled & Supported', value: '3,450+', subtext: 'Refugee & host students' },
      { label: 'School Retention Rate', value: '94%', subtext: 'Academic year completion' },
      { label: 'Partner Schools Supported', value: '8 Schools', subtext: 'In Kiryandongo District' },
      { label: 'Girl-Child Dignity Kits', value: '1,200+', subtext: 'Sanitary & scholastic kits' }
    ],
    objectives: [
      'Increase primary school completion and secondary school transition rates among vulnerable children by over 45%.',
      'Eliminate functional illiteracy through daily after-school remedial reading clinics and mother-tongue bridge tutoring.',
      'Equip community learning hubs with solar-powered study lighting, textbook libraries, and basic digital learning tablets.',
      'Train 80+ volunteer community teachers and peer mentors in child-centered pedagogy and positive psychosocial support.'
    ],
    keyActivities: [
      {
        title: 'Scholastic Kit & Uniform Distribution',
        desc: 'Distributing essential back-to-school kits containing exercise books, mathematical sets, pens, pencils, school bags, and durable uniforms to eliminate financial barriers for marginalized families.'
      },
      {
        title: 'After-School Remedial Literacy Hubs',
        desc: 'Operating daily reading clinics for grades 1 through 7 focusing on foundational phonics, reading comprehension, basic mathematics, and English language fluency.'
      },
      {
        title: 'Girl-Child Scholastic Retention Program',
        desc: 'Supplying menstrual hygiene supplies, reusable sanitary kits, and girl-led mentorship circles that ensure adolescent girls remain in class with dignity without missing school days.'
      },
      {
        title: 'Community Teacher Pedagogy Workshops',
        desc: 'Collaborating with certified district education officers to deliver training in child protection, positive classroom discipline, and trauma-informed instruction for local educators.'
      }
    ]
  },
  healthcare: {
    id: 'healthcare',
    title: 'Community Health & Nutrition Outreach',
    category: 'Healthcare',
    description: 'Running mobile health clinics, maternal care programmes, malnutrition screenings, and community health worker networks to improve health outcomes for vulnerable families.',
    content: `Healthcare delivery in Kiryandongo faces extraordinary pressure from ongoing refugee arrivals, geographical isolation, and high vulnerability to malaria, waterborne diarrheal diseases, and malnutrition.

RESTI’s Community Health & Nutrition Program bridges the critical gap between centralized hospitals and hard-to-reach settlement zones. Operating mobile field clinics and equipping Village Health Teams (VHTs), we provide essential primary care, early childhood growth monitoring, prenatal screenings, and health literacy at the grassroots level.

Our preventative health approach focuses on saving lives before complications escalate, with targeted interventions for pregnant mothers, newborns, and families living miles away from government health centers.`,
    image: 'https://images.unsplash.com/photo-1706806595136-5afefb45da1a?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Panyadoli Health Center IV Catchment, Ranch 18 & Settlement Zones, Uganda',
    timeline: 'Ongoing Vital Healthcare Operation',
    beneficiaries: 'Over 14,000 community members including infants under 5, pregnant mothers, and elderly persons.',
    impactMetrics: [
      { label: 'Patients Treated & Screened', value: '14,200+', subtext: 'Comprehensive medical care' },
      { label: 'Safe Motherhood Deliveries', value: '850+', subtext: 'Prenatal & clinical births' },
      { label: 'Child Malnutrition Screenings', value: '2,300+', subtext: 'MUAC & therapeutic feeding' },
      { label: 'Village Health Teams Trained', value: '65 Workers', subtext: 'Active community liaisons' }
    ],
    objectives: [
      'Drastically reduce preventable infant and under-5 mortality through early danger sign detection and emergency referral.',
      'Eliminate acute childhood malnutrition through bi-weekly nutritional surveillance and distribution of fortified therapeutic foods.',
      'Deliver dignified maternal care and encourage 100% facility-based hospital deliveries among displaced women.',
      'Conduct monthly mobile outreach clinics providing free malaria testing, deworming, and essential pharmaceuticals.'
    ],
    keyActivities: [
      {
        title: 'Mobile Medical Field Clinics',
        desc: 'Deploying qualified nurses and clinical officers to remote settlement clusters to provide free diagnostic tests, general consultations, and life-saving prescription medicines.'
      },
      {
        title: 'Maternal & Newborn Care Circles',
        desc: 'Mobilizing expectant mothers for regular antenatal care (ANC) checkups, providing clean delivery kits (mama kits), and conducting postnatal home visits.'
      },
      {
        title: 'Nutritional Rehabilitation & Cooking Demonstrations',
        desc: 'Teaching community caretakers how to prepare nutrient-dense infant porridge using locally available, drought-resistant ingredients like moringa, soya, and sweet potatoes.'
      },
      {
        title: 'Preventative Epidemic Surveillance',
        desc: 'Equipping Village Health Teams with digital tools to trace and report early clusters of malaria, cholera, and acute respiratory infections to district authorities.'
      }
    ]
  },
  livelihoods: {
    id: 'livelihoods',
    title: 'Sustainable Livelihoods & Micro-Enterprise',
    category: 'Livelihoods',
    description: 'Equipping households with vocational skills, microfinance Village Savings & Loan Associations (VSLA), and climate-smart agricultural training to achieve economic independence.',
    content: `True human dignity begins when families transition from emergency relief assistance to sustainable self-reliance. In Kiryandongo District, displaced families often possess incredible resilience but lack access to startup capital, practical technical tools, and structured market links.

RESTI’s Sustainable Livelihoods program provides hands-on vocational apprenticeships, financial literacy training, and microfinance access through community-led Village Savings and Loan Associations (VSLAs). Participants master in-demand trades such as garment construction, carpentry, organic horticulture, and soap manufacturing.

By establishing revolving community savings funds, our graduates launch profitable micro-enterprises that reliably feed, clothe, and educate their families throughout the year.`,
    image: 'https://images.unsplash.com/photo-1761466977752-de51b3ecce84?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Bweyale Town Council & Kiryandongo Settlement Agricultural Zones, Uganda',
    timeline: 'Multi-Year Economic Empowerment Cohorts',
    beneficiaries: 'Over 700 vulnerable households, female-headed families, and unemployed young adults.',
    impactMetrics: [
      { label: 'Micro-Entrepreneurs Trained', value: '720+', subtext: 'Graduated trade artisans' },
      { label: 'Active Savings Groups (VSLA)', value: '48 Groups', subtext: 'Self-governed community banks' },
      { label: 'Community Capital Mobilized', value: '$68,000+', subtext: 'Cumulative group savings' },
      { label: 'Business Survival Rate', value: '82%', subtext: 'Operational after 12 months' }
    ],
    objectives: [
      'Transition 500+ households each year from external humanitarian aid to profitable small enterprise ownership.',
      'Establish and nurture 50+ community Village Savings & Loan Associations with ledger literacy and cash-box security.',
      'Promote climate-smart horticulture and organic kitchen gardening to improve household food sovereignty.',
      'Provide graduated apprentices with certified trade starter toolkits to begin immediate commercial operations.'
    ],
    keyActivities: [
      {
        title: 'Vocational Technical Apprenticeships',
        desc: 'Offering intensive 3- to 6-month hands-on trade training in tailoring, carpentry, hairdressing, solar electrical installation, and sustainable soap making.'
      },
      {
        title: 'VSLA Community Banking Incubation',
        desc: 'Forming 25–30 member peer savings circles, providing secure triple-lock cash boxes, ledgers, and teaching weekly dividend reinvestment principles.'
      },
      {
        title: 'Climate-Smart Backyard Horticulture',
        desc: 'Distributing drought-resilient seed varieties, introducing sack mound gardening, and teaching organic pest control techniques for high-yield food production.'
      },
      {
        title: 'Micro-Seed Capital Starter Grants',
        desc: 'Awarding competitive equipment starter toolkits and matching micro-grants to the most promising graduate business plans.'
      }
    ]
  },
  wash: {
    id: 'wash',
    title: 'Clean Water & Dignified Sanitation (WASH)',
    category: 'Community',
    description: 'Building boreholes, latrines, and hygiene education hubs to ensure safe water and dignified sanitation for every household.',
    content: `Access to clean, potable drinking water is a fundamental human right that underpins public health, safety, and community productivity. In Kiryandongo, existing water points often break down under heavy communal pressure, forcing women and young girls to trek several miles or queue for hours at contaminated water sources.

RESTI’s WASH program drills and rehabilitates deep-water boreholes, installs solar-powered water pumping stations, and constructs dignified, gender-separated ventilated latrines in community schools and public markets.

To ensure long-term sustainability, every water point is handed over to a democratically trained Water User Committee with locally based technicians equipped with spare part toolkits.`,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo District Settlement Zones & Rural Host Villages, Uganda',
    timeline: 'Continuous Infrastructure & Hygiene Outreach',
    beneficiaries: 'Over 18,500 residents with guaranteed daily access to safe drinking water.',
    impactMetrics: [
      { label: 'Boreholes Drilled & Restored', value: '22 Wells', subtext: 'Deep aquifer water points' },
      { label: 'Residents With Clean Water', value: '18,500+', subtext: 'Daily potable water supply' },
      { label: 'Water User Committees', value: '34 Teams', subtext: 'Trained community stewards' },
      { label: 'Waterborne Illness Drop', value: '-70%', subtext: 'Settlement health clinic reports' }
    ],
    objectives: [
      'Reduce average household water collection wait times from 3 hours to under 30 minutes.',
      'Eradicate dangerous waterborne disease outbreaks (typhoid, cholera, dysentery) across targeted community zones.',
      'Ensure 100% community ownership and zero pump downtime through proactive Water User Committees.',
      'Provide dignified, child-friendly handwashing stations and VIP latrines in public settlement schools.'
    ],
    keyActivities: [
      {
        title: 'Deep Borehole Drilling & Restoration',
        desc: 'Sinking new deep-aquifer boreholes and overhauling collapsed underground cylinders, pipes, and cracked protective surface aprons.'
      },
      {
        title: 'Water User Committee Certification',
        desc: 'Electing and training 7-member gender-balanced management committees for each water point, with specialized maintenance toolkits.'
      },
      {
        title: 'School Sanitation & Hygiene Clubs',
        desc: 'Constructing VIP ventilated latrines in crowded primary schools and training student hygiene ambassadors to lead daily handwashing routines.'
      },
      {
        title: 'Water Quality Testing & Purification',
        desc: 'Conducting routine microbiological water testing and distributing water purification tablets during heavy rainy seasons.'
      }
    ]
  },
  women: {
    id: 'women',
    title: 'Women Empowerment & Protection Initiative',
    category: 'Community',
    description: 'Supporting women through savings groups, legal aid, gender-based violence prevention, and leadership training programmes.',
    content: `Forced displacement places women and adolescent girls under severe structural vulnerabilities, including escalated risks of domestic violence, early forced marriages, economic deprivation, and cultural exclusion from community decision-making.

RESTI’s Women Empowerment & Protection program creates safe, restorative spaces where displaced and host community women access confidential psychosocial counseling, emergency legal aid referrals, and leadership development.

We couple protection initiatives with direct micro-livelihood training, ensuring that women gain the financial sovereignty necessary to protect themselves and their children from exploitation.`,
    image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Kiryandongo Refugee Settlement Safe Spaces & Host Communities, Uganda',
    timeline: 'Active Women Protection & Empowerment Initiative',
    beneficiaries: 'Over 1,850 women, adolescent mothers, GBV survivors, and female community elders.',
    impactMetrics: [
      { label: 'Women Directly Empowered', value: '1,850+', subtext: 'Counseling & skills support' },
      { label: 'GBV Cases Mediated/Referred', value: '420+', subtext: 'Safe legal & medical aid' },
      { label: 'Safe Space Circles', value: '18 Hubs', subtext: 'Grassroots community spaces' },
      { label: 'Women in Camp Leadership', value: '40%', subtext: 'Representation in welfare councils' }
    ],
    objectives: [
      'Provide confidential, dignified psychosocial support and rapid legal/medical referrals for GBV survivors.',
      'Elevate women into elected decision-making roles within settlement welfare councils and local councils.',
      'Eliminate economic dependency by integrating every woman into structured Village Savings groups.',
      'Engage men, boys, and community elders as vocal champions and allies in ending domestic violence.'
    ],
    keyActivities: [
      {
        title: 'Safe Space Community Sanctuaries',
        desc: 'Maintaining confidential, safe gathering centers where women connect for peer support, trauma recovery circles, and life skills workshops.'
      },
      {
        title: 'Legal Aid & Medical Emergency Response',
        desc: 'Collaborating directly with the police Child & Family Protection Unit and health facilities to provide rapid justice and medical support.'
      },
      {
        title: 'Male Champions of Change Dialogues',
        desc: 'Hosting structured community conversation circles for men, elders, and youth to challenge harmful gender norms and prevent domestic violence.'
      },
      {
        title: 'Women Civic Leadership Masterclasses',
        desc: 'Training aspiring female leaders in public speaking, conflict resolution, committee governance, and human rights advocacy.'
      }
    ]
  },
  youth: {
    id: 'youth',
    title: 'Youth Development & Creative Empowerment',
    category: 'Education',
    description: 'Mentorship, sports, arts, and civic engagement programmes that build confidence and purpose in the next generation.',
    content: `Young people constitute over 60% of the displaced population in Kiryandongo District. Without accessible avenues for constructive expression, recreation, and vocational guidance, youth often suffer from boredom, psychological despair, substance misuse, and social friction.

RESTI’s Youth Development program harnesses the universal language of sports, creative arts, debate, and civic volunteerism to break down inter-tribal divides and inspire purpose-driven community leadership.

Through sports for peace leagues, digital storytelling workshops, and youth innovation hubs, we nurture the next generation of changemakers who actively rebuild social harmony across Kiryandongo.`,
    image: 'https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=1200&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    location: 'Bweyale Community Grounds & Kiryandongo Settlement Recreation Centers, Uganda',
    timeline: 'Year-Round Youth Empowerment Program',
    beneficiaries: 'Over 2,800 youth aged 14–29 across diverse ethnic and nationality backgrounds.',
    impactMetrics: [
      { label: 'Active Youth Participants', value: '2,800+', subtext: 'Sports & civic programs' },
      { label: 'Sports for Peace Teams', value: '24 Teams', subtext: 'Inter-ethnic football & netball' },
      { label: 'Community Arts Shows', value: '16 Shows', subtext: 'Theatre, dance & debate' },
      { label: 'Youth Mentors Certified', value: '65 Leaders', subtext: 'Peer counseling facilitators' }
    ],
    objectives: [
      'Foster peaceful co-existence and social cohesion across ethnic groups among refugee and host community youth.',
      'Channel youth energy into constructive vocational preparation, public leadership, and volunteerism.',
      'Dramatically curb substance abuse and youth delinquency through structured athletics and arts mentorship.',
      'Equip youth with digital literacy and creative storytelling skills to amplify their community voices.'
    ],
    keyActivities: [
      {
        title: 'Sports for Peace Seasonal Tournaments',
        desc: 'Organizing structured football and netball leagues uniting players and fans from different nationalities on neutral, celebratory ground.'
      },
      {
        title: 'Youth Peacebuilding Theatre & Arts',
        desc: 'Coaching youth-led performance troupes in drama, traditional drumming, and spoken-word poetry addressing social issues and unity.'
      },
      {
        title: 'Youth Leadership & Innovation Academy',
        desc: 'Conducting weekend training in project management, community organizing, ethical leadership, and conflict resolution.'
      },
      {
        title: 'Peer-to-Peer Psychosocial Mentorship',
        desc: 'Training youth coaches to identify signs of depression, trauma, or substance abuse among peers and guide them to counseling support.'
      }
    ]
  }
};

export function ProgramDetail() {
  const { open: openDonationModal } = useDonationModal();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true);
        const cleanId = (id || '').replace(/^program:/, '').trim().toLowerCase();
        let matchedProgram: Program | null = DETAILED_FALLBACK_PROGRAMS[cleanId] || null;

        // Try single program API route
        try {
          const singleRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${encodeURIComponent(cleanId)}`,
            {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
              signal: AbortSignal.timeout(6000),
            }
          );
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            if (singleData.program) {
              const p = singleData.program;
              const pVal = p.value || p;
              matchedProgram = buildEnrichedProgram(pVal, p.key || cleanId);
            }
          }
        } catch {
          // Fall through to full list search
        }

        // If not found yet, fetch full list from API
        if (!matchedProgram) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
            {
              headers: { Authorization: `Bearer ${publicAnonKey}` },
              signal: AbortSignal.timeout(6000),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const programs = data.programs || [];
            
            const found = programs.find((p: any) => {
              const pKey = (p.key || '').replace(/^program:/, '').trim().toLowerCase();
              const pId = (p.value?.id || p.id || '').replace(/^program:/, '').trim().toLowerCase();
              const pTitle = (p.value?.title || p.title || '').trim().toLowerCase().replace(/\s+/g, '-');
              return (
                pKey === cleanId ||
                pId === cleanId ||
                pTitle === cleanId ||
                p.key === id ||
                p.id === id ||
                p.value?.id === id
              );
            });
            
            if (found) {
              matchedProgram = buildEnrichedProgram(found.value || found, found.key || cleanId);
            }
          }
        }

        // If still not matched, check if any fallback matches by title substring
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

  // Helper to ensure any program record has rich information
  const buildEnrichedProgram = (val: any, fallbackId: string): Program => {
    const rawCategory = (val.category || 'general').toLowerCase();
    
    // Find closest fallback archetype for rich templates
    let archetype = DETAILED_FALLBACK_PROGRAMS.education;
    if (rawCategory.includes('health')) archetype = DETAILED_FALLBACK_PROGRAMS.healthcare;
    else if (rawCategory.includes('live') || rawCategory.includes('agri') || rawCategory.includes('econ')) archetype = DETAILED_FALLBACK_PROGRAMS.livelihoods;
    else if (rawCategory.includes('water') || rawCategory.includes('wash') || rawCategory.includes('sanit')) archetype = DETAILED_FALLBACK_PROGRAMS.wash;
    else if (rawCategory.includes('wom') || rawCategory.includes('gender')) archetype = DETAILED_FALLBACK_PROGRAMS.women;
    else if (rawCategory.includes('youth') || rawCategory.includes('sport')) archetype = DETAILED_FALLBACK_PROGRAMS.youth;

    return {
      id: (val.id || fallbackId).replace(/^program:/, ''),
      title: val.title || archetype.title,
      category: val.category || archetype.category,
      description: val.description || archetype.description,
      content: val.content && val.content.trim().length > 30 ? val.content : (val.description ? `${val.description}\n\n${archetype.content}` : archetype.content),
      image: val.image || archetype.image,
      createdAt: val.createdAt || new Date().toISOString(),
      location: val.location || archetype.location,
      timeline: val.timeline || archetype.timeline,
      beneficiaries: val.beneficiaries || archetype.beneficiaries,
      impactMetrics: val.impactMetrics && Array.isArray(val.impactMetrics) && val.impactMetrics.length > 0 
        ? val.impactMetrics 
        : archetype.impactMetrics,
      objectives: val.objectives && Array.isArray(val.objectives) && val.objectives.length > 0 
        ? val.objectives 
        : (typeof val.objectives === 'string' ? val.objectives.split('\n').filter(Boolean) : archetype.objectives),
      keyActivities: val.keyActivities && Array.isArray(val.keyActivities) && val.keyActivities.length > 0 
        ? val.keyActivities 
        : archetype.keyActivities,
      leadCoordinator: val.leadCoordinator || archetype.leadCoordinator || '',
    };
  };

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

  if (loading) return <LoadingScreen />;

  if (!program) {
    return (
      <div className="bg-slate-50 min-h-screen pb-24 flex items-center justify-center pt-28 sm:pt-36">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <BookOpen size={32} />
          </div>
          <h2 className="text-2xl text-slate-900 mb-2 font-extrabold font-heading">Program Not Found</h2>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            The program you are looking for may have been updated or moved. You can browse all active community initiatives.
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

  return (
    <div className="bg-slate-50/80 min-h-screen pt-24 sm:pt-32 pb-24 font-sans">
      <SEO 
        title={`${program.title} | RESTI Community Programs`} 
        description={program.description.substring(0, 160)} 
        image={program.image} 
        type="article"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link to="/programs" className="hover:text-emerald-700 transition-colors">Our Programs</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{program.title}</span>
        </nav>

        {/* Hero Section Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-10">
          
          {/* Main Hero Header Card */}
          <div className="relative overflow-hidden bg-slate-950">
            <div className="relative h-64 sm:h-96 md:h-[420px] w-full overflow-hidden">
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover opacity-85 hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-12 text-white">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                  {program.category}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-emerald-100 font-medium text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                  <Clock size={12} /> {program.timeline}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight text-white mb-3 max-w-4xl">
                {program.title}
              </h1>

              <p className="text-slate-200 text-sm sm:text-lg max-w-3xl leading-relaxed mb-6">
                {program.description}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={openDonationModal}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  <Heart size={16} className="mr-2 text-rose-300" fill="currentColor" />
                  Support This Program
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold"
                >
                  <Share2 size={16} className="mr-2" />
                  {copied ? 'Link Copied!' : 'Share Initiative'}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Meta Ribbon */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-10 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">Location:</span>
              <span className="truncate">{program.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">Target:</span>
              <span className="truncate">{program.beneficiaries}</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">Status:</span>
              <span className="text-emerald-700 font-bold">100% Community-Verified</span>
            </div>
          </div>
        </div>

        {/* Live Key Impact Metrics Callout Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold font-heading text-slate-900 uppercase tracking-wider text-xs">
              Measured Program Impact in Kiryandongo District
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {program.impactMetrics.map((metric, mIdx) => (
              <div 
                key={mIdx}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors"
              >
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading">
                  {metric.value}
                </p>
                <p className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                  {metric.label}
                </p>
                {metric.subtext && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {metric.subtext}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: COMPREHENSIVE INFORMATION */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Section 1: Detailed Overview & Problem Statement */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Detailed Program Overview
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-3">
                  Context, Challenges & Our Approach
                </h2>
              </div>

              <div className="text-slate-700 leading-relaxed text-base sm:text-lg space-y-4 whitespace-pre-line font-normal">
                {program.content}
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
                <Award className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-950">
                  <p className="font-bold mb-1">Community-Led Sustainable Implementation</p>
                  <p className="text-emerald-800 text-xs sm:text-sm leading-relaxed">
                    Every aspect of this program is co-designed and monitored directly by local refugee welfare leadership and Ugandan host community representatives, guaranteeing lasting community ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Strategic Objectives */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Core Mandate
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-3">
                  Strategic Goals & Objectives
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {program.objectives.map((obj, oIdx) => (
                  <div 
                    key={oIdx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 hover:border-emerald-100 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">
                      {obj}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Key Field Activities & Methodologies */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Field Operations
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-3">
                  Key Interventions & Field Activities
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  How RESTI’s on-the-ground team executes this initiative in Kiryandongo District
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {program.keyActivities.map((act, aIdx) => (
                  <div 
                    key={aIdx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black font-heading text-sm mb-3">
                        {aIdx + 1}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-2 font-heading">
                        {act.title}
                      </h3>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Target Beneficiaries & Geographic Scope */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Target Group & Geography
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-3">
                  Who Benefits & Where We Work
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <Users size={18} />
                    <span>Target Demographic</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {program.beneficiaries}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <MapPin size={18} />
                    <span>Coverage Area</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {program.location}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: SIDEBAR ACTIONS & QUICK FACTS */}
          <div className="space-y-6">
            
            {/* Primary Action / Support Card */}
            <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <Heart className="w-10 h-10 text-rose-300 mb-4" fill="currentColor" />
              
              <h3 className="text-xl font-bold font-heading mb-2">
                Support This Program
              </h3>
              
              <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                Your charitable contributions provide immediate learning materials, medical supplies, clean water parts, and economic toolkits directly to people who need them.
              </p>

              <Button
                onClick={openDonationModal}
                className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold py-3 text-sm shadow-md transition-all"
              >
                Make a Contribution
              </Button>

              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-emerald-200">
                <span>100% Program Allocation</span>
                <span>•</span>
                <span>Tax-Receipt Verified</span>
              </div>
            </div>

            {/* Quick Overview Meta Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-base font-heading">
                Initiative Overview
              </h4>

              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-400">Pillar Category:</span>
                  <span className="font-bold text-slate-800">{program.category}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-400">Operating Cycle:</span>
                  <span className="font-medium text-slate-800">{program.timeline || 'Active Multi-Year'}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-400">Coverage Location:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[160px] text-right" title={program.location}>{program.location || 'Kiryandongo, Uganda'}</span>
                </div>
                {program.leadCoordinator && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400">Lead Coordinator:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px] text-right" title={program.leadCoordinator}>{program.leadCoordinator}</span>
                  </div>
                )}
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-400">Transparency:</span>
                  <span className="font-bold text-emerald-700">Audited Annually</span>
                </div>
              </div>
            </div>

            {/* Volunteer or Partner Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md">
              <h4 className="font-bold text-white text-base font-heading mb-2">
                Partner or Volunteer
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5">
                Are you an institution, NGO, researcher, or specialist wishing to contribute technical expertise or funding to this program?
              </p>
              <div className="flex flex-col gap-2.5">
                <Link to="/volunteer">
                  <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold">
                    Volunteer in the Field
                  </Button>
                </Link>
                <Link to="/partners">
                  <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold">
                    Institutional Partnerships
                  </Button>
                </Link>
              </div>
            </div>

            {/* Other Programs Navigation */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
              <h4 className="font-bold text-slate-900 text-base font-heading mb-3">
                Explore Other Programs
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {Object.keys(DETAILED_FALLBACK_PROGRAMS)
                  .filter(k => k !== program.id)
                  .slice(0, 4)
                  .map((key) => {
                    const otherP = DETAILED_FALLBACK_PROGRAMS[key];
                    return (
                      <Link
                        key={key}
                        to={`/programs/${otherP.id}`}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                          {otherP.title}
                        </p>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                          {otherP.category}
                        </p>
                      </Link>
                    );
                  })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link 
                  to="/programs" 
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between"
                >
                  <span>View All Initiatives</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
