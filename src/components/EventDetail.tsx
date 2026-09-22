import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Share2,
  ExternalLink,
  Users,
  CheckCircle2,
  Sparkles,
  Building,
  Navigation,
  AlertCircle,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Image as ImageIcon
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  EventItem,
  EVENTS_PAGE_STRINGS,
  normalizeEvent,
  isEventUpcoming
} from '../utils/eventData';

export function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      fetchEventDetail(slug);
    }
  }, [slug]);

  const fetchEventDetail = async (slugOrId: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events/${encodeURIComponent(slugOrId)}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          setEvent(normalizeEvent(data.event));
          return;
        }
      }

      // Fallback: fetch all events and locate match locally
      const listRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events?all=true`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (listRes.ok) {
        const listData = await listRes.json();
        const items: EventItem[] = (listData.events || []).map(normalizeEvent);
        const match = items.find((e) => e.slug === slugOrId || e.id === slugOrId);
        if (match) {
          setEvent(match);
          return;
        }
      }

      setEvent(null);
    } catch (err) {
      console.error('Error fetching event detail:', err);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Event link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-32 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-lg text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Event Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            The event you are looking for may have been rescheduled, archived, or the link may be incorrect.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Events</span>
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = isEventUpcoming(event);
  const formattedStartDate = event.start_date
    ? new Date(event.start_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date to be announced';

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(event.title);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ── Event Detail Hero ── */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-20 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-emerald-400/60">/</span>
            <Link to="/events" className="hover:text-white transition-colors">
              Events
            </Link>
            <span className="text-emerald-400/60">/</span>
            <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs">
              {event.title}
            </span>
          </nav>

          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
              {event.event_type}
            </span>

            {event.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Featured Event
              </span>
            )}

            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                isUpcoming
                  ? 'bg-emerald-400 text-emerald-950'
                  : 'bg-white/10 text-emerald-200 border border-white/15'
              }`}
            >
              {isUpcoming ? 'Upcoming Event' : 'Past Event'}
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight mb-4">
            {event.title}
          </h1>

          {/* Quick Date & Location strip */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-emerald-100/90 pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{formattedStartDate}</span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>
                  {event.start_time} {event.end_time ? `– ${event.end_time}` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area (2 Columns) ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-6 relative z-20 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Event Body & Gallery */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Featured Image */}
            {event.featured_image && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100 max-h-[480px]">
                <img
                  src={event.featured_image}
                  alt={event.title}
                  className="w-full h-full object-cover max-h-[480px]"
                />
              </div>
            )}

            {/* Event Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 md:p-10 space-y-6">
              
              {/* Short Description Lead */}
              {event.short_description && (
                <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed border-l-4 border-emerald-500 pl-4 py-1 italic bg-emerald-50/40 rounded-r-xl">
                  {event.short_description}
                </p>
              )}

              {/* Full Description */}
              <div>
                <h2 className="text-xl font-bold font-heading text-slate-900 mb-4">About This Event</h2>
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-base">
                  {event.description || 'Detailed information for this event will be published shortly.'}
                </div>
              </div>

              {/* Past Event Outcomes / Achievements */}
              {!isUpcoming && (event.outcomes || event.summary) && (
                <div className="mt-8 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Event Summary & Outcomes
                  </div>
                  {event.summary && (
                    <p className="text-sm text-slate-700 leading-relaxed">{event.summary}</p>
                  )}
                  {event.outcomes && (
                    <div className="pt-2 text-sm text-slate-800 font-medium leading-relaxed">
                      <strong>Outcomes & Impact: </strong>
                      {event.outcomes}
                    </div>
                  )}
                </div>
              )}

              {/* Event Photo Gallery */}
              {event.gallery && event.gallery.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-heading text-slate-900">Event Gallery</h3>
                    <span className="text-xs text-slate-500">{event.gallery.length} photos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {event.gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedGalleryImg(imgUrl)}
                        className="relative h-32 sm:h-40 rounded-xl overflow-hidden cursor-pointer group border border-slate-200"
                      >
                        <img
                          src={imgUrl}
                          alt={`${event.title} gallery photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Share Bar */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Share this event:</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 transition-colors"
                    title="Share on X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-blue-700 hover:text-white text-slate-600 transition-colors"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Events & Activities</span>
              </Link>
            </div>
          </div>

          {/* Right Sidebar: Key Facts & Registration Card */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Registration Card (if upcoming & available) */}
            {isUpcoming && (
              <div className="bg-white rounded-3xl border border-emerald-200 shadow-md p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <h3 className="font-bold font-heading text-lg text-slate-900">Event Registration</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Participation is open to community members, partners, and stakeholders in Kiryandongo District.
                </p>

                {event.registration_deadline && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Deadline: </strong>
                    {event.registration_deadline}
                  </div>
                )}

                {event.registration_url ? (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <span>{EVENTS_PAGE_STRINGS.registerButtonText}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                    No advance online registration required. Walk-ins are welcomed at the venue.
                  </div>
                )}
              </div>
            )}

            {/* Event Quick Facts Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5">
              <h3 className="font-bold font-heading text-lg text-slate-900 pb-3 border-b border-slate-100">
                Event Information
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Date</span>
                    <span className="font-semibold text-slate-900 leading-snug">{formattedStartDate}</span>
                    {event.end_date && event.end_date !== event.start_date && (
                      <span className="text-xs text-slate-500 block">to {event.end_date}</span>
                    )}
                  </div>
                </div>

                {/* Time */}
                {event.start_time && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Time</span>
                      <span className="font-semibold text-slate-900 leading-snug">
                        {event.start_time} {event.end_time ? `– ${event.end_time}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Venue & Location</span>
                    <span className="font-semibold text-slate-900 leading-snug block">{event.location}</span>
                    {event.address && (
                      <span className="text-xs text-slate-500 block mt-0.5">{event.address}</span>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.location} ${event.address || ''} Uganda`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline mt-1.5"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Organizer</span>
                    <span className="font-semibold text-slate-900 leading-snug">{event.organizer}</span>
                  </div>
                </div>

                {/* Contact Email */}
                {event.contact_email && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Inquiries</span>
                      <a
                        href={`mailto:${event.contact_email}`}
                        className="font-semibold text-emerald-700 hover:underline break-all"
                      >
                        {event.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Contact Phone */}
                {event.contact_phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Telephone</span>
                      <a
                        href={`tel:${event.contact_phone.replace(/\s+/g, '')}`}
                        className="font-semibold text-slate-900 hover:text-emerald-700"
                      >
                        {event.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Program Link if configured */}
            {event.related_program && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Associated Initiative</span>
                <h4 className="text-base font-bold font-heading leading-tight">{event.related_program}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This activity is organized under RESTI's sustainable community empowerment programs.
                </p>
                <Link
                  to="/programs"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Explore Programs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Lightbox / Gallery Modal */}
      {selectedGalleryImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedGalleryImg}
              alt="Gallery enlarged"
              className="w-full h-full object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedGalleryImg(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default EventDetail;
