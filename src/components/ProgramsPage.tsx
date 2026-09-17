import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Search, ArrowRight, Heart, X, CheckCircle2, 
  MapPin, Users, Sparkles, ExternalLink, Calendar
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import { SEO } from './SEO';
import { LoadingScreen } from './LoadingScreen';
import { useDonationModal } from './DonationModalContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DETAILED_FALLBACK_PROGRAMS } from './ProgramDetail';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface Program {
  key: string;
  value: {
    id?: string;
    title: string;
    description: string;
    content?: string;
    image: string;
    category: string;
    createdAt?: string;
    location?: string;
    beneficiaries?: string;
    objectives?: string[];
    keyActivities?: { title: string; desc: string }[];
    impactMetrics?: { label: string; value: string; subtext?: string }[];
  };
}

const FALLBACK_PROGRAMS: Program[] = Object.keys(DETAILED_FALLBACK_PROGRAMS).map((key) => {
  const p = DETAILED_FALLBACK_PROGRAMS[key];
  return {
    key: p.id,
    value: {
      id: p.id,
      title: p.title,
      description: p.description,
      content: p.content,
      image: p.image,
      category: p.category,
      createdAt: p.createdAt,
      location: p.location,
      beneficiaries: p.beneficiaries,
      objectives: p.objectives,
      keyActivities: p.keyActivities,
      impactMetrics: p.impactMetrics,
    }
  };
});

export function ProgramsPage() {
  const { open: openDonationModal } = useDonationModal();
  const [programs, setPrograms] = useState<Program[]>(FALLBACK_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProgram, setPreviewProgram] = useState<any | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      let fetched: Program[] = [];
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
          {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            signal: AbortSignal.timeout(6000),
          }
        );

        if (response.ok) {
          const data = await response.json();
          fetched = data.programs || [];
        }
      } catch (err) {
        console.warn('API programs fetch notice, checking direct Supabase:', err);
      }

      // Check kv_store_2a4be611 for any direct rich program records
      try {
        const { data: kvPrograms } = await supabase
          .from('kv_store_2a4be611')
          .select('*')
          .like('key', 'program:%');
        
        if (kvPrograms && kvPrograms.length > 0) {
          for (const kv of kvPrograms) {
            const cleanK = kv.key.replace(/^program:/, '').toLowerCase();
            const foundIdx = fetched.findIndex(f => (f.value?.id || f.key || '').replace(/^program:/, '').toLowerCase() === cleanK);
            if (foundIdx > -1) {
              fetched[foundIdx] = {
                ...fetched[foundIdx],
                value: {
                  ...fetched[foundIdx].value,
                  ...kv.value
                }
              };
            } else {
              fetched.push({
                key: kv.key,
                value: kv.value
              });
            }
          }
        }
      } catch (sbErr) {
        console.warn('Direct kv store read notice:', sbErr);
      }

      if (fetched.length > 0) {
        // Merge API/KV programs with fallback enrichments if needed
        const merged = fetched.map(f => {
          const rawKey = (f.value?.id || f.key || '').replace(/^program:/, '').toLowerCase();
          const fallback = DETAILED_FALLBACK_PROGRAMS[rawKey];
          if (fallback) {
            return {
              ...f,
              value: {
                ...fallback,
                ...f.value,
                content: f.value?.content || fallback.content,
                objectives: f.value?.objectives || fallback.objectives,
                keyActivities: f.value?.keyActivities || fallback.keyActivities,
                impactMetrics: f.value?.impactMetrics || fallback.impactMetrics,
                beneficiaries: f.value?.beneficiaries || fallback.beneficiaries,
                location: f.value?.location || fallback.location,
              }
            };
          }
          return f;
        });

        // Ensure all flagship programs are present
        const fetchedIds = new Set(fetched.map(f => (f.value?.id || f.key || '').replace(/^program:/, '').toLowerCase()));
        const missingFallbacks = FALLBACK_PROGRAMS.filter(fp => !fetchedIds.has((fp.value?.id || fp.key || '').replace(/^program:/, '').toLowerCase()));
        setPrograms([...merged, ...missingFallbacks]);
      }
    } catch (err) {
      console.warn('Could not fetch live programs, displaying default programs.', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(programs.map(p => (p.value?.category || 'general').toLowerCase())))];

  const filteredPrograms = programs.filter(program => {
    if (!program || !program.value) return false;
    const categoryMatch = selectedCategory === 'all' || (program.value.category || '').toLowerCase() === selectedCategory;
    const titleMatch = (program.value.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (program.value.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = (program.value.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && (titleMatch || descMatch || contentMatch);
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-slate-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
      <SEO 
        title="Our Programs | RESTI — Refugee Empowerment For Sustainable Transformation Initiative" 
        description="Explore our community programs in education, healthcare, sustainable livelihoods, clean water, and women empowerment in Kiryandongo District, Uganda." 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <BookOpen size={16} />
            Our Core Initiatives
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 font-heading">
            Community-Driven Programs
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            We deliver targeted, high-impact programs designed to empower vulnerable families, refugees, and host communities across Kiryandongo District, Uganda.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program) => {
              const programId = (program.value?.id || program.key || '').replace(/^program:/, '');
              const pVal = program.value;
              return (
                <div
                  key={program.key || programId}
                  className="card-lift group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  {pVal.image ? (
                    <div className="relative aspect-video overflow-hidden bg-slate-100 border-b border-slate-100 flex items-center justify-center">
                      <img
                        src={pVal.image}
                        alt={pVal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-emerald-800 shadow-xs border border-white/40">
                          {pVal.category || 'General'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-emerald-50 border-b border-emerald-100 flex items-center justify-center text-emerald-600">
                      <BookOpen size={48} />
                    </div>
                  )}

                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {pVal.title}
                      </h2>
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {pVal.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/programs/${programId}`}
                          className="text-emerald-700 hover:text-emerald-800 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 group/link"
                        >
                          View Full Program
                          <ArrowRight size={15} className="group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPreviewProgram({ ...pVal, id: programId })}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Quick View
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={openDonationModal}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Donate to support this program"
                      >
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No programs found</h3>
            <p className="text-sm text-slate-500 mb-6">Try adjusting your search query or selecting a different category filter.</p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Support Banner */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Want to support these community programs?</h3>
            <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
              100% of your charitable contributions go directly to field resources, classroom supplies, clinic equipment, and borehole rehabilitation.
            </p>
          </div>
          <button
            type="button"
            onClick={openDonationModal}
            className="px-8 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Make a Donation
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK VIEW SLIDEOVER / MODAL */}
      {/* ========================================================= */}
      {previewProgram && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
                  {previewProgram.category || 'Program'}
                </span>
                <span className="text-sm font-bold text-slate-200 truncate max-w-md">
                  {previewProgram.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewProgram(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Media image if present */}
              {previewProgram.image && (
                <div className="h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={previewProgram.image}
                    alt={previewProgram.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-slate-900 font-heading mb-2">
                  {previewProgram.title}
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {previewProgram.description}
                </p>
              </div>

              {/* Detailed Content / Story */}
              {previewProgram.content && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Program Overview & Background
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {previewProgram.content}
                  </p>
                </div>
              )}

              {/* Strategic Objectives */}
              {previewProgram.objectives && previewProgram.objectives.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Strategic Goals & Objectives
                  </h4>
                  <div className="space-y-2">
                    {previewProgram.objectives.map((obj: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Field Activities */}
              {previewProgram.keyActivities && previewProgram.keyActivities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Key Field Activities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewProgram.keyActivities.map((act: any, aIdx: number) => (
                      <div key={aIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <p className="font-bold text-slate-900 mb-1">
                          {typeof act === 'object' ? act.title : act}
                        </p>
                        {typeof act === 'object' && act.desc && (
                          <p className="text-slate-500 leading-relaxed">{act.desc}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beneficiaries and Location Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                {previewProgram.beneficiaries && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>Target:</strong> {previewProgram.beneficiaries}</span>
                  </div>
                )}
                {previewProgram.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>Location:</strong> {previewProgram.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Link 
                to={`/programs/${previewProgram.id}`}
                className="flex-1 sm:flex-initial"
              >
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm">
                  View Full Program Page <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  onClick={openDonationModal}
                  variant="outline" 
                  className="flex-1 sm:flex-initial text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
                >
                  <Heart size={14} className="mr-1.5" /> Support
                </Button>
                <Button
                  onClick={() => setPreviewProgram(null)}
                  variant="outline"
                  className="flex-1 sm:flex-initial text-slate-600 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
