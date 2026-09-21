import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { SEO } from './SEO';
import { 
  HelpCircle, Search, Plus, Minus, X, ArrowRight, 
  Mail, MessageSquare, Heart, RefreshCw, BookOpen, 
  Briefcase, Users, Handshake, CheckCircle2 
} from 'lucide-react';
import { 
  FAQItem, 
  FAQ_CATEGORIES, 
  DEFAULT_FAQS, 
  normalizeFaqList, 
  buildFaqSchema 
} from '../utils/faqData';

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>(() => DEFAULT_FAQS);
  const [loading, setLoading] = useState<boolean>(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['faq-about-1']));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
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
        
        // Open the first item by default if available
        if (normalized.length > 0) {
          setOpenIds(new Set([normalized[0].id]));
        }
      }
    } catch (err) {
      console.warn('Error fetching FAQs from Supabase, using comprehensive default set:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual question in accordion
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

  // Filter for published FAQs only
  const publishedFaqs = useMemo(() => {
    return faqs.filter(f => f.published !== false);
  }, [faqs]);

  // Filter based on category and search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return publishedFaqs.filter(faq => {
      const matchesCat = selectedCategory === 'all' || 
        faq.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      const matchesQuery = !q || 
        faq.question.toLowerCase().includes(q) || 
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [publishedFaqs, selectedCategory, searchQuery]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: publishedFaqs.length };
    publishedFaqs.forEach(f => {
      const cat = f.category || 'About RESTI';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [publishedFaqs]);

  // Schema for published FAQs visible on page
  const jsonLdSchema = useMemo(() => {
    return buildFaqSchema(filteredFaqs);
  }, [filteredFaqs]);

  // Category Icon helper
  const getCategoryIcon = (catId: string) => {
    switch (catId.toLowerCase()) {
      case 'about resti': return <HelpCircle size={15} />;
      case 'programs': return <BookOpen size={15} />;
      case 'donations': return <Heart size={15} />;
      case 'partnerships': return <Handshake size={15} />;
      case 'opportunities': return <Briefcase size={15} />;
      default: return <HelpCircle size={15} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title="Frequently Asked Questions | RESTI CBO"
        description="Find answers to common questions about RESTI, our programs, donations, partnerships, and how you can get involved in Kiryandongo District, Uganda."
      />

      {/* JSON-LD Structured Data for FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSchema }}
      />

      {/* Hero Header Section */}
      <header className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white pt-32 sm:pt-40 pb-16 sm:pb-24 relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-emerald-100 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <HelpCircle size={16} className="text-emerald-200" aria-hidden="true" />
            <span>Help Center & Knowledge Base</span>
          </div>

          {/* Heading: 36-40px desktop, 28-32px mobile */}
          <h1 className="text-[28px] sm:text-[32px] lg:text-[40px] font-extrabold font-heading text-white tracking-tight leading-[1.15] mb-4">
            Frequently Asked Questions
          </h1>

          {/* Introduction: 17-18px desktop, 16px mobile, leading ~1.6 */}
          <p className="text-[16px] sm:text-[17px] lg:text-[18px] text-emerald-50 leading-[1.6] font-normal max-w-2xl mx-auto">
            Find answers to common questions about RESTI, our programs, donations, partnerships, and how you can get involved.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20 pb-24">
        
        {/* Search & Category Filter Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 mb-10">
          {/* Search Input */}
          <div className="relative mb-6">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
              size={20} 
              aria-hidden="true" 
            />
            <input
              type="text"
              placeholder="Search questions, answers, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] sm:text-[16px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              aria-label="Search frequently asked questions"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search query"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FAQ_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70 border border-transparent'
                  }`}
                  aria-pressed={isActive}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{cat.label}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
            Showing <strong className="text-slate-900">{filteredFaqs.length}</strong> {filteredFaqs.length === 1 ? 'question' : 'questions'}
            {selectedCategory !== 'all' && <span> in <span className="text-emerald-700 font-semibold">{selectedCategory}</span></span>}
            {searchQuery && <span> matching "<span className="text-slate-900 font-semibold">{searchQuery}</span>"</span>}
          </p>

          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="text-[13px] sm:text-[14px] font-bold text-emerald-700 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw size={36} className="text-emerald-600 animate-spin mb-4" />
            <p className="text-[16px] font-medium text-slate-600">Loading answers...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-[22px] font-bold text-slate-900 mb-2 font-heading">
              No Questions Found
            </h3>
            <p className="text-[15px] text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
              We couldn't find any questions matching your current filters. Try searching with different keywords or browse all categories.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[15px] py-2.5 px-6 rounded-xl transition-all shadow-sm"
            >
              <span>Clear Search</span>
            </button>
          </div>
        ) : (
          /* Accordion List */
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIds.has(faq.id);
              const answerId = `faq-answer-${faq.id}`;
              const buttonId = `faq-btn-${faq.id}`;

              return (
                <div
                  key={faq.id || index}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'border-emerald-300 shadow-md ring-1 ring-emerald-200/60' 
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Accessible Accordion Trigger */}
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="flex-1 pr-2">
                      {/* Category Pill Tag */}
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md mb-2.5">
                        {getCategoryIcon(faq.category)}
                        {faq.category}
                      </span>

                      {/* Question Text */}
                      <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-bold font-heading text-slate-900 tracking-tight leading-snug">
                        {faq.question}
                      </h2>
                    </div>

                    {/* Expand/Collapse Toggle Button with Plus / Minus */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen 
                        ? 'bg-emerald-700 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}>
                      {isOpen ? (
                        <Minus size={18} aria-hidden="true" strokeWidth={2.5} />
                      ) : (
                        <Plus size={18} aria-hidden="true" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>

                  {/* Smooth Expandable Answer Container */}
                  {isOpen && (
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 sm:px-6 pb-6 pt-1 border-t border-slate-100 bg-slate-50/40 animate-fade-in"
                    >
                      <p className="text-[15px] sm:text-[16px] lg:text-[16.5px] leading-[1.65] text-slate-700 font-normal">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 10. Contact CTA Card at Bottom ── */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/60 text-center relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <MessageSquare size={28} aria-hidden="true" />
            </div>

            <h2 className="text-[26px] sm:text-[30px] font-extrabold font-heading text-white tracking-tight mb-3">
              Still have questions?
            </h2>

            <p className="text-[16px] sm:text-[17px] text-slate-300 leading-[1.6] max-w-xl mx-auto mb-8 font-normal">
              Can't find the information you're looking for? Get in touch with RESTI and our team will be happy to help.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] sm:text-[16px] py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Mail size={18} aria-hidden="true" />
                <span>Contact RESTI</span>
              </Link>

              <Link
                to="/donate"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-[15px] sm:text-[16px] py-3.5 px-7 rounded-xl border border-white/15 transition-all"
              >
                <span>Support Our Programs</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
