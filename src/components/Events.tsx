import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users as UsersIcon,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building,
  RotateCcw
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import {
  EventItem,
  EVENT_CATEGORIES,
  EVENTS_PAGE_STRINGS,
  normalizeEvent,
  isEventUpcoming
} from '../utils/eventData';

export function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const items = (data.events || []).map(normalizeEvent);
        setEvents(items);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically classify published events as Upcoming or Past based on dates and status
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming: EventItem[] = [];
    const past: EventItem[] = [];

    events.forEach((event) => {
      if (isEventUpcoming(event)) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    // Upcoming sorted earliest to latest
    upcoming.sort((a, b) => {
      const timeA = new Date(a.start_date || a.created_at || 0).getTime();
      const timeB = new Date(b.start_date || b.created_at || 0).getTime();
      return timeA - timeB;
    });

    // Past sorted latest to earliest
    past.sort((a, b) => {
      const timeA = new Date(a.start_date || a.created_at || 0).getTime();
      const timeB = new Date(b.start_date || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  // Find featured upcoming event
  const featuredEvent = useMemo(() => {
    return upcomingEvents.find((e) => e.is_featured) || null;
  }, [upcomingEvents]);

  // Current tab items filtered by search & category
  const displayedEvents = useMemo(() => {
    const list = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return list.filter((event) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || event.event_type.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [activeTab, upcomingEvents, pastEvents, searchQuery, selectedCategory]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date to be announced';
    try {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ── Page Hero Header ── */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb */}
          <nav className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-emerald-400/60">/</span>
            <span className="text-white font-semibold">Events & Activities</span>
          </nav>

          {/* H1 Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-extrabold tracking-tight font-heading leading-tight mb-6">
            {EVENTS_PAGE_STRINGS.mainHeading}
          </h1>

          {/* Approved Intro */}
          <p className="text-base sm:text-lg md:text-[18px] text-emerald-100/90 leading-relaxed max-w-3xl mx-auto font-normal">
            {EVENTS_PAGE_STRINGS.intro}
          </p>
        </div>
      </section>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-20 w-full flex-1">
        
        {/* Featured Upcoming Event Banner (if available) */}
        {featuredEvent && activeTab === 'upcoming' && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-12 bg-white rounded-3xl border border-emerald-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[340px] bg-slate-100 overflow-hidden">
                {featuredEvent.featured_image ? (
                  <img
                    src={featuredEvent.featured_image}
                    alt={featuredEvent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800">
                    <Calendar className="w-16 h-16 opacity-60" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Event
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs">
                      {featuredEvent.event_type}
                    </span>
                    {featuredEvent.status === 'ongoing' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                        Live Now
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 leading-tight mb-3">
                    <Link
                      to={`/events/${featuredEvent.slug}`}
                      className="hover:text-emerald-600 transition-colors"
                    >
                      {featuredEvent.title}
                    </Link>
                  </h2>

                  <p className="text-slate-600 text-sm sm:text-base line-clamp-3 mb-6 leading-relaxed">
                    {featuredEvent.short_description || featuredEvent.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium">{formatDate(featuredEvent.start_date)}</span>
                    </div>
                    {featuredEvent.start_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{featuredEvent.start_time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{featuredEvent.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <Link
                    to={`/events/${featuredEvent.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <span>{EVENTS_PAGE_STRINGS.viewEventButtonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {featuredEvent.registration_url && (
                    <a
                      href={featuredEvent.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
                    >
                      <span>{EVENTS_PAGE_STRINGS.registerButtonText}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs & Search Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Dynamic Event Tabs with Database Counts */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200/60 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {EVENTS_PAGE_STRINGS.upcomingTabTitle} ({upcomingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'past'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {EVENTS_PAGE_STRINGS.pastTabTitle} ({pastEvents.length})
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category dropdown */}
              <div className="relative w-full sm:w-52">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-slate-700 font-medium"
                >
                  <option value="all">All Categories</option>
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Reset filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Events Grid / List ── */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading events...</p>
          </div>
        ) : displayedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Event Image */}
                <div className="relative h-52 bg-slate-100 overflow-hidden">
                  {event.featured_image ? (
                    <img
                      src={event.featured_image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 text-slate-400">
                      <Calendar className="w-12 h-12 opacity-40 text-emerald-700" />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm text-emerald-800 text-xs font-bold shadow-sm">
                      {event.event_type}
                    </span>
                  </div>

                  {event.is_featured && (
                    <div className="absolute top-3 right-3">
                      <span className="p-1.5 rounded-full bg-amber-400 text-amber-950 shadow-sm flex items-center justify-center" title="Featured Event">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Event Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Date & Time Meta */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-2.5">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {formatDate(event.start_date)}
                      </span>
                      {event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {event.start_time}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold font-heading text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                      <Link to={`/events/${event.slug}`}>{event.title}</Link>
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    {/* Short Description */}
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {event.short_description || event.description}
                    </p>

                    {/* Past Event Outcomes Note if available */}
                    {activeTab === 'past' && event.outcomes && (
                      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 line-clamp-2">
                        <strong className="font-semibold text-emerald-800">Impact: </strong>
                        {event.outcomes}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/events/${event.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors"
                    >
                      <span>{EVENTS_PAGE_STRINGS.viewEventButtonText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {activeTab === 'upcoming' && event.registration_url && (
                      <a
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>{EVENTS_PAGE_STRINGS.registerButtonText}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Official Approved Empty State ── */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-slate-900 mb-2">
              {activeTab === 'upcoming'
                ? EVENTS_PAGE_STRINGS.emptyUpcomingHeading
                : EVENTS_PAGE_STRINGS.emptyPastHeading}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {activeTab === 'upcoming'
                ? EVENTS_PAGE_STRINGS.emptyUpcomingDescription
                : EVENTS_PAGE_STRINGS.emptyPastDescription}
            </p>
            {activeTab === 'upcoming' && pastEvents.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 text-xs font-bold transition-colors"
              >
                <span>View Past Completed Events ({pastEvents.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
export default Events;
