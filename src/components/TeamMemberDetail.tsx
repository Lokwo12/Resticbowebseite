import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Linkedin, Twitter, MapPin, 
  Award, CheckCircle2, Heart, Copy, Check, Users
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { toast } from 'sonner';
import { useDonationModal } from './DonationModalContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order?: number;
  key?: string;
}

// Fallback team members for instant presentation & fallback safety
const FALLBACK_TEAM: TeamMember[] = [
  {
    id: 'kwaya-daniel-loborach',
    name: 'Mr. Kwaya Daniel Loborach',
    role: 'Co-Founder',
    department: 'Executive & Finance',
    bio: "Kwaya Daniel Loborach is Co-Founder of RESTI Uganda, bringing a strong background in Business Administration and Management. He holds a Bachelor's degree in the field and applies his expertise in strategic planning, operational efficiency, and sustainable organizational growth to strengthen RESTI's systems and impact.\n\nDaniel is deeply committed to economic empowerment and environmental sustainability. He trains youth in beekeeping—combining ecological stewardship with entrepreneurial skills—and uses his restaurant to create employment opportunities for young people.\n\nAt RESTI, he focuses on building a resilient organizational framework that supports sustainable livelihoods, local enterprise, and lasting socio-economic change.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/c4735251-21ab-43c3-aeef-61aa5429b5c1-Screenshot_2026-09-11_011312.png',
    email: 'info@resticbo.org',
  },
  {
    id: 'anek-immaculate',
    name: 'Anek Immaculate',
    role: 'Co-Founder | Research, Livelihoods & Community Engagement',
    department: 'Programs & Operations',
    bio: "Anek Immaculate is Co-Founder of RESTI Uganda, bringing a strong background in development studies and community programming. She holds a Bachelor's degree in Developmental Studies and applies her expertise in research support, community mobilization, and participatory approaches to strengthen RESTI's field programmes.\n\nAnek is deeply committed to meaningful community engagement and self-reliance. She has worked with ZOA Uganda as a Research Assistant, contributing to data collection, field surveys, and evidence generation for livelihoods, WASH, and community-based initiatives, and has volunteered with the Lutheran World Federation (LWF) Uganda, supporting community engagement, protection messaging, and programme activities in refugee-hosting areas.\n\nAt RESTI, she focuses on designing interventions that are grounded in local realities, responsive to community priorities, and aligned with humanitarian and development standards, helping communities lead their own pathways to sustainable transformation.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/f8d23b1b-e4ae-44dc-9ad1-b2ec7fd7d667-WhatsApp_Image_2026-09-13_at_1.57.38_AM.jpeg',
    email: 'info@resticbo.org',
  },
  {
    id: 'otim-jackson',
    name: 'Otim Jackson',
    role: 'Co-Founder | Agriculture, Livelihoods & Community Extension',
    department: 'Community Extension',
    bio: "Otim Jackson is Co-Founder of RESTI Uganda, bringing a strong background in agriculture and livestock development. He holds a National Diploma in Animal Production and Management from Bukalasa Agricultural College and applies his expertise in farmer extension, livestock production, and market support to strengthen RESTI's livelihoods programming.\n\nOtim is deeply committed to practical, skills-based economic empowerment. Since 2016, he has worked as a private field veterinary extension worker in Kiryandongo District and has supported World Food Programme (WFP) assignments as an enumerator, distribution team member, and contributor to market surveys, Post-Distribution Monitoring, financial literacy surveys, and the Agriculture and Market Support programme in Kiryandongo Refugee Settlement and host communities.\n\nAt RESTI, he focuses on developing livelihood solutions that respond to local economic realities, build greater self-reliance among refugees and host communities, and turn people's productive capacity into lasting income and resilience.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/cce2a529-08ff-4a8f-91a0-fbdc38e14ced-WhatsApp_Image_2026-09-08_at_5.34.23_PM.jpeg',
    email: 'otimjackson82@gmail.com',
  },
  {
    id: 'mr-lokwo-denis',
    name: 'Mr. Lokwo Denis',
    role: 'Co-Founder | Technology, Digital Systems & Innovation',
    department: 'Technology & Innovation',
    bio: "Lokwo Denis is Co-Founder of RESTI Uganda, specializing in technology, digital systems, and innovation. He holds a BSc in Information Technology from Nkumba University and is pursuing an MSc in Computer Science at the University of L'Aquila, Italy, focusing on AI, Complex Networks, and Data Analysis.\n\nWith experience as an IT Support Assistant at Windle International Uganda (2020–2022) and as an ICT Trainer, Lokwo has supported ICT operations, delivered computer literacy training, and developed digital skills among students and communities.\n\nHis technical expertise spans Python, Java, web technologies, REST APIs, Linux, Docker, databases, and AI. At RESTI, he leads efforts to leverage technology for program strengthening, improved service access, and scalable digital solutions that empower refugees and host communities toward self-reliance and resilience.",
    image: 'https://mxffqgefsufcdgnhjjsw.supabase.co/storage/v1/object/public/make-2a4be611-uploads/e40b6cae-de18-4580-a1c7-758e6f16a541-IMG-20250908-WA0042_1_.jpg',
    email: 'lokwodenis@gmail.com',
  }
];

export function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { open: openDonationModal } = useDonationModal();

  const getInitialMember = (): TeamMember | null => {
    const cleanId = (id || '').replace(/^team:/, '').trim().toLowerCase();
    return FALLBACK_TEAM.find(m => 
      m.id.toLowerCase() === cleanId ||
      m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanId
    ) || null;
  };

  const [member, setMember] = useState<TeamMember | null>(getInitialMember);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const cleanBio = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/\?\?/g, "'")
      .replace(/\uFFFD/g, "'")
      .replace(/â€™/g, "'")
      .replace(/â€"/g, "—")
      .trim();
  };

  const fetchMember = async () => {
    try {
      const cleanId = (id || '').replace(/^team:/, '').trim().toLowerCase();

      // Check fallback first
      let matched: TeamMember | null = FALLBACK_TEAM.find(m => 
        m.id.toLowerCase() === cleanId ||
        m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanId
      ) || null;

      // Try live API endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const teamList: any[] = Array.isArray(data.team) ? data.team : [];
        setAllMembers(teamList);

        const found = teamList.find((m: any) => {
          const mKey = (m.key || '').replace(/^team:/, '').toLowerCase();
          const mId = (m.id || '').replace(/^team:/, '').toLowerCase();
          const mNameSlug = (m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return (
            mKey === cleanId ||
            mId === cleanId ||
            mNameSlug === cleanId ||
            m.key === id ||
            m.id === id ||
            (m.name && m.name.toLowerCase().includes(cleanId.replace(/-/g, ' ')))
          );
        });

        if (found) {
          matched = {
            id: (found.id || found.key || cleanId).replace(/^team:/, ''),
            name: found.name || '',
            role: found.role || '',
            department: found.department || 'Leadership',
            bio: cleanBio(found.bio),
            image: found.image || '',
            email: found.email || '',
            linkedin: found.linkedin || '',
            twitter: found.twitter || '',
          };
        }
      }

      if (matched) {
        setMember(matched);
      }
    } catch (err) {
      console.warn('Could not fetch team member from API, using fallback data.', err);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  if (!member) {
    return (
      <div className="bg-slate-50 min-h-screen pb-24 flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div className="max-w-md mx-auto px-4 text-center bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Team Member Not Found</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            The profile you are trying to view does not exist or may have been updated.
          </p>
          <Link
            to="/team"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            Back to Team
          </Link>
        </div>
      </div>
    );
  }

  // Split bio into paragraphs for pristine readability
  const paragraphs = cleanBio(member.bio).split('\n\n').filter(Boolean);

  return (
    <div className="bg-slate-50 min-h-screen pb-28" style={{ paddingTop: '120px' }}>
      <SEO 
        title={`${member.name} — ${member.role} | RESTI`} 
        description={member.bio ? member.bio.slice(0, 160) : `Learn more about ${member.name}, ${member.role} at RESTI.`}
        image={member.image}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/team')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-100 hover:bg-emerald-50"
          >
            <ArrowLeft size={16} />
            Back to All Team Members
          </button>

          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 tracking-wider uppercase">
            RESTI Leadership
          </span>
        </div>

        {/* Hero Card Showcase */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100/90 overflow-hidden mb-12">
          <div className="p-8 sm:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center lg:items-start">
              
              {/* Photo Column */}
              <div className="w-full sm:w-80 lg:w-96 flex-shrink-0">
                <div className="relative group">
                  {/* Glow Backdrop */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.2rem] blur-xl opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
                  
                  {/* Photo Frame */}
                  <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-white shadow-2xl flex items-center justify-center">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-6 text-center">
                        <Users size={64} className="mb-4 opacity-80" />
                        <span className="text-xl font-bold font-heading">{member.name}</span>
                      </div>
                    )}
                    
                    {/* Badge Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Verified Leadership</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">RESTI</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Badges Below Photo */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Kiryandongo District, Uganda</span>
                  </div>

                  {member.email && (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Mail size={15} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(member.email!)}
                        className="text-slate-400 hover:text-emerald-600 p-1 transition-colors"
                        title="Copy Email"
                      >
                        {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}

                  {/* Social Buttons */}
                  <div className="flex gap-2">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow"
                      >
                        <Mail size={14} /> Send Email
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin size={16} />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-colors"
                        title="Twitter / X Profile"
                      >
                        <Twitter size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Details & Information Column */}
              <div className="flex-1 text-left">
                {/* Department & Role Tag */}
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                    {member.department || 'Leadership & Governance'}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100">
                    Community Foundation Member
                  </span>
                </div>

                {/* Member Name */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight mb-3">
                  {member.name}
                </h1>

                {/* Official Role */}
                <p className="text-lg sm:text-xl font-semibold text-emerald-700 mb-8 leading-snug">
                  {member.role}
                </p>

                {/* Divider */}
                <div className="h-px bg-slate-100 mb-8" />

                {/* About & Biography Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <Award size={14} className="text-emerald-600" />
                      Biography & Professional Background
                    </h2>
                    
                    <div className="space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
                      {paragraphs.length > 0 ? (
                        paragraphs.map((p, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {p}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-500 italic">
                          Dedicated team member serving the Refugee Empowerment For Sustainable Transformation Initiative (RESTI) in Kiryandongo District.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="pt-6 grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 transition-colors">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Primary Impact Focus
                      </h4>
                      <p className="text-slate-900 font-semibold text-sm">
                        Refugee Empowerment & Local Economic Growth
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 transition-colors">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Operational Base
                      </h4>
                      <p className="text-slate-900 font-semibold text-sm">
                        Kiryandongo Refugee Settlement & Host Community
                      </p>
                    </div>
                  </div>

                  {/* Supporting Callout */}
                  <div className="pt-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-emerald-950 font-bold text-base mb-1">
                          Support Our Leadership Initiatives
                        </h4>
                        <p className="text-emerald-800 text-xs sm:text-sm">
                          Help RESTI continue its grassroots programming and community impact across Uganda.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openDonationModal}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200/50 hover:shadow-lg transition-all whitespace-nowrap flex items-center gap-2"
                      >
                        <Heart size={15} fill="currentColor" /> Donate to RESTI
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Other Team Members Quick Browse */}
        {allMembers.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 font-heading">Meet Other Leaders</h3>
                <p className="text-slate-500 text-sm">Discover the dedicated minds driving RESTI forward</p>
              </div>
              <Link
                to="/team"
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"
              >
                View All <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allMembers
                .filter(m => (m.id || m.key || '').replace(/^team:/, '') !== (member.id || '').replace(/^team:/, ''))
                .slice(0, 3)
                .map((m) => {
                  const mId = (m.id || m.key || '').replace(/^team:/, '');
                  return (
                    <Link
                      key={m.id || m.key}
                      to={`/team/${mId}`}
                      className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 hover:-translate-y-0.5"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {m.image ? (
                          <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                          {m.name}
                        </h4>
                        <p className="text-xs text-emerald-700 truncate">{m.role}</p>
                        <span className="text-[10px] text-slate-400 mt-1 inline-block uppercase font-medium">
                          {m.department || 'Team Member'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
