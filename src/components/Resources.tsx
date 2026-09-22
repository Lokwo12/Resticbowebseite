import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Search, Filter, RefreshCw, ExternalLink,
  FolderOpen, Calendar, User, ArrowRight, X, Sparkles,
  FileSpreadsheet, Presentation, FileCode, Image as ImageIcon,
  File, HelpCircle, Mail, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  ResourceItem,
  RESOURCES_PAGE_STRINGS,
  normalizeResource
} from '../utils/resourceData';

export function Resources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const fetchResources = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const items = (data.resources || []).map(normalizeResource);
        setResources(items);
      } else {
        console.error('Failed to fetch resources:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Compute published resources only
  const publishedResources = useMemo(() => {
    return resources.filter(r => r.is_published);
  }, [resources]);

  // Compute dynamic categories: ONLY categories that actually have at least one published resource
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    publishedResources.forEach(r => {
      if (r.category && r.category.trim()) {
        cats.add(r.category.trim());
      }
    });
    return Array.from(cats).sort();
  }, [publishedResources]);

  // Compute available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    publishedResources.forEach(r => {
      if (r.year && r.year.trim()) {
        years.add(r.year.trim());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [publishedResources]);

  // Compute available file types
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    publishedResources.forEach(r => {
      if (r.file_type && r.file_type.trim()) {
        types.add(r.file_type.trim().toUpperCase());
      }
    });
    return Array.from(types).sort();
  }, [publishedResources]);

  // Filtered resources based on user interaction
  const filteredResources = useMemo(() => {
    return publishedResources.filter(res => {
      // Category filter
      if (selectedCategory !== 'all' && res.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Year filter
      if (selectedYear !== 'all' && res.year !== selectedYear) {
        return false;
      }
      // File type filter
      if (selectedType !== 'all' && res.file_type.toUpperCase() !== selectedType.toUpperCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesDesc = res.description.toLowerCase().includes(q);
        const matchesCat = res.category.toLowerCase().includes(q);
        const matchesAuthor = (res.author || '').toLowerCase().includes(q);
        const matchesYear = (res.year || '').includes(q);
        return matchesTitle || matchesDesc || matchesCat || matchesAuthor || matchesYear;
      }
      return true;
    });
  }, [publishedResources, selectedCategory, selectedYear, selectedType, searchQuery]);

  // Featured resources
  const featuredResources = useMemo(() => {
    return publishedResources.filter(r => r.is_featured);
  }, [publishedResources]);

  // File icon helper
  const renderFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase();
    if (type === 'PDF') {
      return (
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100">
          <FileText size={24} />
        </div>
      );
    }
    if (['XLS', 'XLSX', 'CSV'].includes(type)) {
      return (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
          <FileSpreadsheet size={24} />
        </div>
      );
    }
    if (['PPT', 'PPTX'].includes(type)) {
      return (
        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
          <Presentation size={24} />
        </div>
      );
    }
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(type)) {
      return (
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
          <ImageIcon size={24} />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-200">
        <File size={24} />
      </div>
    );
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedYear !== 'all' || selectedType !== 'all' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedYear('all');
    setSelectedType('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── 1. Page Header ── */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200/80 pt-16 pb-14 sm:pt-20 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-emerald-700 font-bold">Resources & Downloads</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-slate-900 tracking-tight leading-tight mb-4">
              {RESOURCES_PAGE_STRINGS.mainHeading}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {RESOURCES_PAGE_STRINGS.intro}
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading resources & documents...</p>
          </div>
        ) : publishedResources.length === 0 ? (
          /* ── 13. Official Approved Empty State: No resources available yet ── */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-slate-900 mb-2">
              {RESOURCES_PAGE_STRINGS.emptyAllHeading}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
              {RESOURCES_PAGE_STRINGS.emptyAllDescription}
            </p>
          </div>
        ) : (
          <>
            {/* ── 10 & 11. Search and Dynamic Filters ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={RESOURCES_PAGE_STRINGS.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dynamic Category Filter Buttons (Only displays categories with published resources) */}
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    All Resources ({publishedResources.length})
                  </button>

                  {availableCategories.map(cat => {
                    const count = publishedResources.filter(r => r.category.toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Year & File Type Sub-Filters */}
              {(availableYears.length > 1 || availableTypes.length > 1) && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Filter size={13} /> Filters:
                  </span>

                  {availableYears.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-500 font-medium">Year:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="all">All Years</option>
                        {availableYears.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {availableTypes.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-500 font-medium">Format:</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="all">All Formats</option>
                        {availableTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="text-resti-green hover:text-resti-green-dark font-semibold underline ml-auto"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── 12. Featured Resources Spotlight (Only shown if at least 1 featured resource exists) ── */}
            {featuredResources.length > 0 && selectedCategory === 'all' && !searchQuery.trim() && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                    Featured Resources
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredResources.map(resource => (
                    <div
                      key={resource.id}
                      className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-2xl p-6 border-2 border-emerald-200/80 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {renderFileIcon(resource.file_type)}
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {resource.category}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="font-bold text-slate-700">{resource.file_type}</span>
                                {resource.file_size && <span>• {resource.file_size}</span>}
                                {resource.year && <span>• {resource.year}</span>}
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
                            <Sparkles size={11} className="fill-amber-950" />
                            Featured
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-5 mt-4 border-t border-emerald-100 flex items-center justify-between gap-3">
                        {resource.author && (
                          <span className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            {resource.author}
                          </span>
                        )}

                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={resource.file_name || resource.title}
                          className="ml-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] bg-resti-blue hover:bg-resti-blue-dark text-white text-xs font-bold shadow-sm transition-colors"
                          aria-label={`Download ${resource.title} (${resource.file_type})`}
                        >
                          <Download size={14} />
                          <span>Download {resource.file_type}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 5. All Resources Cards Grid ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                  {selectedCategory === 'all' ? 'All Resources' : selectedCategory}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({filteredResources.length})
                  </span>
                </h2>
              </div>

              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {filteredResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        {/* Card Header: Icon & Category */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {renderFileIcon(resource.file_type)}
                            <div>
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {resource.category}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="font-bold text-slate-700">{resource.file_type}</span>
                                {resource.file_size && <span>• {resource.file_size}</span>}
                              </div>
                            </div>
                          </div>

                          {resource.is_featured && (
                            <span className="p-1.5 rounded-full bg-amber-400 text-amber-950 shadow-sm" title="Featured Document">
                              <Sparkles size={12} className="fill-amber-950" />
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                            {resource.description || 'Verified RESTI institutional document.'}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer: Metadata & Download Button */}
                      <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          {resource.year ? (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar size={12} className="text-slate-400" />
                              {resource.year}
                            </span>
                          ) : (
                            <span />
                          )}

                          {resource.author && (
                            <span className="truncate max-w-[140px] text-right font-medium">
                              {resource.author}
                            </span>
                          )}
                        </div>

                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={resource.file_name || resource.title}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors duration-200"
                          aria-label={`Download ${resource.title} (${resource.file_type})`}
                        >
                          <Download size={15} />
                          <span>Download {resource.file_type} {resource.file_size ? `(${resource.file_size})` : ''}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── 14. Official Approved Empty Filter State ── */
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center max-w-lg mx-auto my-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {RESOURCES_PAGE_STRINGS.emptyFilterHeading}
                  </h3>
                  <p className="text-sm text-slate-500 mb-5">
                    {RESOURCES_PAGE_STRINGS.emptyFilterDescription}
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="text-xs font-semibold rounded-xl"
                  >
                    {RESOURCES_PAGE_STRINGS.viewAllButtonText}
                  </Button>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── 15. "Need a Specific Resource?" Section ── */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <Mail size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            {RESOURCES_PAGE_STRINGS.needResourceHeading}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            {RESOURCES_PAGE_STRINGS.needResourceDescription}
          </p>
          <div className="pt-3">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all duration-200"
            >
              <span>{RESOURCES_PAGE_STRINGS.contactButtonText}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Resources;
