import { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Search, Plus, Minus, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  FAQItem, 
  DEFAULT_FAQS, 
  normalizeFaqList 
} from '../utils/faqData';

export function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['faq-about-1']));
  const [sectionSettings, setSectionSettings] = useState({ 
    title: 'Frequently Asked Questions', 
    description: 'Find answers to common questions about RESTI, our programs, donations, volunteering, partnerships, and how you can get involved.' 
  });

  useEffect(() => {
    fetchFAQs();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.sections?.faq) {
          setSectionSettings(data.settings.sections.faq);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data.faqs) ? data.faqs : [];
        const normalized = normalizeFaqList(rawList);
        setFaqs(normalized);
        if (normalized.length > 0) {
          setOpenIds(new Set([normalized[0].id]));
        }
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const publishedFaqs = useMemo(() => {
    return faqs.filter(f => f.published !== false);
  }, [faqs]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    publishedFaqs.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return ['all', ...Array.from(set)];
  }, [publishedFaqs]);
  
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return publishedFaqs.filter(faq => {
      const matchesCategory = selectedCategory === 'all' || 
        faq.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      const matchesSearch = !q || 
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [publishedFaqs, selectedCategory, searchQuery]);

  if (loading && faqs.length === 0) {
    return (
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4 text-emerald-700">
            <HelpCircle size={28} />
          </div>
          <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold font-heading text-slate-900 mb-3 leading-[1.2]">
            {sectionSettings.title}
          </h2>
          <p className="text-[16px] sm:text-[17px] text-slate-600 max-w-2xl mx-auto leading-[1.6]">
            {sectionSettings.description}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category === 'all' ? 'All Questions' : category}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3.5 mb-10">
            {filteredFaqs.slice(0, 8).map((faq, index) => {
              const isOpen = openIds.has(faq.id);
              const answerId = `home-faq-ans-${faq.id}`;
              const btnId = `home-faq-btn-${faq.id}`;

              return (
                <div
                  key={faq.id || index}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-200/50' 
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="flex-1 pr-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mb-2 inline-block">
                        {faq.category}
                      </span>
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isOpen ? <Minus size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={btnId}
                      className="px-5 sm:px-6 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50"
                    >
                      <p className="text-[14px] sm:text-[15px] leading-[1.65] text-slate-700">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 mb-8">
            <HelpCircle className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-600 text-[15px]">
              {searchQuery ? 'No questions match your search.' : 'No FAQs available in this category.'}
            </p>
          </div>
        )}

        {/* View All FAQs CTA */}
        <div className="text-center pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/faqs"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[15px] py-3 px-6 rounded-xl shadow-sm transition-all"
          >
            <span>View All Frequently Asked Questions</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[15px] py-3 px-6 rounded-xl border border-slate-200 transition-all"
          >
            <Mail size={16} />
            <span>Contact RESTI</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
