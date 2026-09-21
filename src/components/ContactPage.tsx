import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Header } from './Header';
import { Footer } from './Footer';
import { Newsletter } from './Newsletter';
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Heart,
  Users,
  HandHeart,
  BookOpen,
  User,
  ArrowRight,
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Navigation,
} from 'lucide-react';
import {
  GET_INVOLVED_STRINGS,
  DEFAULT_CONTACT_SETTINGS,
  normalizeContactSettings,
  ContactSettings,
  ContactPerson,
  OfficeLocation,
} from '../utils/contactData';

interface FormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const TOPIC_OPTIONS = [
  'General Inquiry',
  'Partnerships & Collaboration',
  'Donation & Financial Support',
  'Opportunities & Volunteering',
  'Programs & Community Initiatives',
  'Research & Media Inquiries',
];

export function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [formValues, setFormValues] = useState<FormValues>({
    name: '',
    email: '',
    phone: '',
    subject: TOPIC_OPTIONS[0],
    message: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
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
        const normalized = normalizeContactSettings(data?.settings?.contact);
        setSettings(normalized);
      } else {
        setSettings(DEFAULT_CONTACT_SETTINGS);
      }
    } catch (err) {
      console.warn('Using default contact settings:', err);
      setSettings(DEFAULT_CONTACT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  // Primary office location
  const primaryLocation = useMemo(() => {
    const publishedLocations = (settings.locations || []).filter((loc) => loc.published !== false);
    return publishedLocations.find((loc) => loc.isPrimary) || publishedLocations[0] || null;
  }, [settings.locations]);

  // Published direct contact persons
  const publishedPersons = useMemo(() => {
    return (settings.contactPersons || [])
      .filter((p) => p.published !== false)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [settings.contactPersons]);

  // Client validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formValues.name.trim()) {
      errors.name = 'Please provide your full name.';
    }
    if (!formValues.email.trim()) {
      errors.email = 'Please provide your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formValues.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formValues.subject.trim()) {
      errors.subject = 'Please select or enter a subject.';
    }
    if (!formValues.message.trim()) {
      errors.message = 'Please enter your message.';
    } else if (formValues.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      const payload = {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim() || undefined,
        subject: formValues.subject.trim(),
        topic: formValues.subject.trim(),
        message: formValues.message.trim(),
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || GET_INVOLVED_STRINGS.formErrorMessage);
      }

      setSubmitStatus('success');
      setStatusMessage(GET_INVOLVED_STRINGS.formSuccessMessage);
      setFormValues({
        name: '',
        email: '',
        phone: '',
        subject: TOPIC_OPTIONS[0],
        message: '',
      });
      setFieldErrors({});
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setSubmitStatus('error');
      setStatusMessage(
        err.message ||
          `${GET_INVOLVED_STRINGS.formErrorMessage} (${settings.email || GET_INVOLVED_STRINGS.defaultEmail})`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappCleanNumber = (settings.whatsappNumber || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header />

      {/* ── Page Hero Header (ONLY ONE Main Heading) ── */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white overflow-hidden">
        {/* Background decorative textures */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumbs */}
          <nav className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-emerald-400/60">/</span>
            <span className="text-white font-semibold">Get Involved</span>
          </nav>

          {/* Main H1 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-extrabold tracking-tight font-heading leading-tight mb-6">
            {GET_INVOLVED_STRINGS.mainHeading}
          </h1>

          {/* Intro description */}
          <p className="text-base sm:text-lg md:text-[18px] text-emerald-100/90 leading-relaxed max-w-3xl mx-auto font-normal">
            {GET_INVOLVED_STRINGS.intro}
          </p>
        </div>
      </section>

      {/* ── Section 1: Contact RESTI (Direct Official Channels) ── */}
      <section className="relative -mt-10 z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8 lg:p-10">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Official Channels
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-3">
              {GET_INVOLVED_STRINGS.contactSectionHeading}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Reach out directly to our community coordination desk in Kiryandongo District.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {/* Location */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Location
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-snug break-words">
                  {settings.district ? `${settings.district}, ${settings.country}` : settings.address}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {primaryLocation?.name || 'Headquarters'}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Email
                </div>
                <a
                  href={`mailto:${settings.email || GET_INVOLVED_STRINGS.defaultEmail}`}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline leading-snug break-all"
                >
                  {settings.email || GET_INVOLVED_STRINGS.defaultEmail}
                </a>
                <div className="text-xs text-slate-500 mt-1">Official Inquiry Desk</div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Phone
                </div>
                <a
                  href={`tel:${(settings.phone || GET_INVOLVED_STRINGS.defaultPhone).replace(/\s+/g, '')}`}
                  className="text-sm font-semibold text-slate-900 hover:text-emerald-700 transition-colors leading-snug"
                >
                  {settings.phone || GET_INVOLVED_STRINGS.defaultPhone}
                </a>
                <div className="text-xs text-slate-500 mt-1">Direct Call Support</div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-emerald-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Office Hours
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-snug">
                  {settings.workingHours || 'Mon – Fri: 8:30 AM – 5:00 PM'}
                </div>
                <div className="text-xs text-slate-500 mt-1">East Africa Time (EAT)</div>
              </div>
            </div>
          </div>

          {/* WhatsApp Quick Connect (Rendered ONLY if WhatsApp number is configured) */}
          {whatsappCleanNumber && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/60 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 text-slate-700 text-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Need a quick answer?</span>
                  <span className="text-xs text-slate-600">Connect with our field team via WhatsApp messaging.</span>
                </div>
              </div>
              <a
                href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent('Hello RESTI CBO, I would like to inquire about...')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with us on WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Ways to Support ── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Action & Collaboration
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 mt-3">
            {GET_INVOLVED_STRINGS.waysToSupportHeading}
          </h2>
          <p className="text-slate-600 text-base mt-2">
            Every contribution makes a tangible difference in the lives of refugees and local host communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Donate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Donate</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Support our programs, education initiatives, and emergency relief efforts directly in Kiryandongo.
              </p>
            </div>
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Make a Donation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Volunteer */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <HandHeart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Volunteer</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Join our grassroots initiatives and make an impact on the ground with community-driven projects.
              </p>
            </div>
            <Link
              to="/opportunities"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Partner With Us */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Partner With Us</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Collaborate with RESTI to drive sustainable community development, grant programs, and research.
              </p>
            </div>
            <Link
              to="/partners"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Become a Partner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4: Learn More */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Learn More</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Explore our programs, community impact stories, active projects, and annual financial disclosures.
              </p>
            </div>
            <Link
              to="/programs"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <span>Explore Our Work</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 3: Direct Contacts (Dynamic published contact persons) ── */}
      {publishedPersons.length > 0 && (
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Leadership & Coordination
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-3">
                Direct Contacts
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                For specific program inquiries, reach out to our departmental leads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPersons.map((person) => {
                const hasValidEmail =
                  person.email &&
                  person.email.trim().length > 0 &&
                  !person.email.toLowerCase().includes('gmail.com');
                const displayEmail = hasValidEmail ? person.email : 'info@resticbo.org';

                return (
                  <div
                    key={person.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-4 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all"
                  >
                    {person.image ? (
                      <img
                        src={person.image}
                        alt={person.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xl flex-shrink-0">
                        {person.name ? person.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                        {person.name}
                      </h3>
                      <p className="text-xs font-medium text-emerald-700 mt-1 line-clamp-2 leading-snug">
                        {person.role}
                      </p>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        {displayEmail && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <a
                              href={`mailto:${displayEmail}`}
                              className="hover:text-emerald-700 hover:underline truncate"
                            >
                              {displayEmail}
                            </a>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <a
                              href={`tel:${person.phone.replace(/\s+/g, '')}`}
                              className="hover:text-emerald-700"
                            >
                              {person.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4 & 5: Contact Form + Follow RESTI (Unified 2-Column Section) ── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Follow RESTI & Information */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Connect With Us
              </span>
              <h2 className="text-3xl font-bold font-heading text-slate-900 mt-3">
                {GET_INVOLVED_STRINGS.followHeading}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mt-2">
                Follow RESTI across our digital channels for daily field stories, program updates, community milestones, and volunteer notices.
              </p>
            </div>

            {/* Social Links Cards */}
            <div className="space-y-3">
              {settings.socialLinks.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-slate-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Facebook className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Facebook</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              )}

              {settings.socialLinks.twitter && (
                <a
                  href={settings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-slate-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Twitter className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">X (formerly Twitter)</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              )}

              {settings.socialLinks.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-slate-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Instagram</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              )}

              {settings.socialLinks.linkedin && (
                <a
                  href={settings.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-slate-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">LinkedIn</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              )}

              {settings.socialLinks.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-slate-700 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">YouTube</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </a>
              )}
            </div>

            {/* Privacy & Direct Response guarantee */}
            <div className="p-5 rounded-2xl bg-emerald-950 text-white flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-100 leading-relaxed">
                <span className="font-semibold text-white block mb-1">Your privacy is respected</span>
                All messages sent through this form are protected and delivered directly to the RESTI coordination team. We do not sell or share contact details with third parties.
              </div>
            </div>
          </div>

          {/* Right Column: Contact Us Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8 md:p-10">
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Direct Inquiry
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 mt-3">
                  {GET_INVOLVED_STRINGS.contactFormHeading}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Fill out the form below and our team will get back to you promptly.
                </p>
              </div>

              {/* Status alerts */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-bold text-emerald-800">{GET_INVOLVED_STRINGS.formSuccessTitle}</div>
                    <p className="mt-0.5 text-emerald-700">{statusMessage}</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-bold text-red-800">{GET_INVOLVED_STRINGS.formErrorTitle}</div>
                    <p className="mt-0.5 text-red-700">{statusMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                    placeholder="e.g. Grace Akello"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
                    } text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formValues.email}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      placeholder="e.g. grace@example.com"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        fieldErrors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
                      } text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formValues.phone}
                      onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                      placeholder="+256 700 000 000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Subject / Topic */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subject / Topic <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={formValues.subject}
                    onChange={(e) => setFormValues({ ...formValues, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Content */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Message <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formValues.message}
                    onChange={(e) => setFormValues({ ...formValues, message: e.target.value })}
                    placeholder="Please provide details about how you would like to get involved, collaborate, or inquire..."
                    className={`w-full px-4 py-3 rounded-xl border ${
                      fieldErrors.message ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
                    } text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-y`}
                  />
                  {fieldErrors.message && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending your message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Find Our Office (ONE Single Contained Map Section) ── */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Field Presence
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 mt-3">
              {GET_INVOLVED_STRINGS.findOfficeHeading}
            </h2>
            <p className="text-slate-600 text-base mt-2">
              {GET_INVOLVED_STRINGS.findOfficeSubtitle}
            </p>
          </div>

          {primaryLocation ? (
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
              {/* Responsive Map Frame */}
              <div className="h-[420px] md:h-[500px] w-full">
                <iframe
                  src={
                    primaryLocation.mapUrl && primaryLocation.mapUrl.includes('embed')
                      ? primaryLocation.mapUrl
                      : `https://maps.google.com/maps?q=${encodeURIComponent(
                          primaryLocation.address || 'Kiryandongo Refugee Settlement, Kiryandongo District, Uganda'
                        )}&t=&z=13&ie=UTF8&iwloc=&output=embed`
                  }
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={primaryLocation.name || 'RESTI CBO Office'}
                />
              </div>

              {/* Floating Info Overlay Card */}
              <div className="p-6 md:absolute md:bottom-6 md:left-6 md:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Primary Office
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {primaryLocation.name || GET_INVOLVED_STRINGS.primaryOfficeName}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {primaryLocation.address || GET_INVOLVED_STRINGS.primaryOfficeAddress}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      primaryLocation.address || 'Kiryandongo Refugee Settlement Uganda'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                  <span className="text-[11px] text-slate-400">Kiryandongo, Uganda</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center bg-slate-50">
              <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">
                {GET_INVOLVED_STRINGS.emptyLocationHeading}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                {GET_INVOLVED_STRINGS.emptyLocationDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      <Newsletter />
      <Footer />
    </div>
  );
}
export default ContactPage;
