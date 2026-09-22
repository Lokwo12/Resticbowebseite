import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Heart,
  Users,
  HandHeart,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import {
  GET_INVOLVED_STRINGS,
  DEFAULT_CONTACT_SETTINGS,
  normalizeContactSettings,
  ContactSettings,
} from '../utils/contactData';

const TOPIC_OPTIONS = [
  'General Inquiry',
  'Partnerships & Collaboration',
  'Donation & Financial Support',
  'Opportunities & Volunteering',
  'Programs & Community Initiatives',
  'Research & Media Inquiries',
];

export function Contact() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: TOPIC_OPTIONS[0],
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
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
        const normalized = normalizeContactSettings(data?.settings?.contact);
        setSettings(normalized);
      } else {
        setSettings(DEFAULT_CONTACT_SETTINGS);
      }
    } catch (error) {
      console.warn('Using default contact settings on homepage:', error);
      setSettings(DEFAULT_CONTACT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const primaryLocation = useMemo(() => {
    const publishedLocations = (settings.locations || []).filter((loc) => loc.published !== false);
    return publishedLocations.find((loc) => loc.isPrimary) || publishedLocations[0] || null;
  }, [settings.locations]);

  const publishedPersons = useMemo(() => {
    return (settings.contactPersons || [])
      .filter((p) => p.published !== false)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [settings.contactPersons]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Please provide your full name.';
    }
    if (!formData.email.trim()) {
      errors.email = 'Please provide your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) {
      errors.subject = 'Please select or enter a subject.';
    }
    if (!formData.message.trim()) {
      errors.message = 'Please enter your message.';
    } else if (formData.message.trim().length < 10) {
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
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        topic: formData.subject.trim(),
        message: formData.message.trim(),
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
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: TOPIC_OPTIONS[0],
        message: '',
      });
      setFieldErrors({});
    } catch (err: any) {
      console.error('Error submitting contact form on homepage:', err);
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

  if (loading) {
    return (
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Get Involved
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-extrabold font-heading text-slate-900 tracking-tight leading-[1.15] mb-4">
            Get Involved & Contact RESTI
          </h2>
          <p className="text-base sm:text-lg md:text-[18px] text-slate-600 font-normal leading-[1.6]">
            {GET_INVOLVED_STRINGS.intro}
          </p>
        </div>

        {/* 4 Action Cards for Ways to Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Donate */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">Donate</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Support our community programs, education initiatives, and emergency relief efforts in Kiryandongo.
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

          {/* Volunteer */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
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

          {/* Partner With Us */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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

          {/* Learn More */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
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

        {/* 2-Column Main Section: Contact Info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          
          {/* Left Column: Official Contact Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-2xl font-bold font-heading text-slate-900 mb-1">
                  {GET_INVOLVED_STRINGS.contactSectionHeading}
                </h3>
                <p className="text-sm text-slate-500">
                  Direct official communications desk for Kiryandongo District.
                </p>
              </div>

              {/* Direct Info List */}
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Location</span>
                    <span className="text-sm font-semibold text-slate-900 leading-snug">
                      {settings.district ? `${settings.district}, ${settings.country}` : settings.address}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-resti-blue-light text-resti-blue flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5" /></div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Official Email</span>
                    <a
                      href={`mailto:${settings.email || GET_INVOLVED_STRINGS.defaultEmail}`}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline break-all"
                    >
                      {settings.email || GET_INVOLVED_STRINGS.defaultEmail}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-resti-orange-light text-resti-orange flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5" /></div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Phone</span>
                    <a
                      href={`tel:${(settings.phone || GET_INVOLVED_STRINGS.defaultPhone).replace(/\s+/g, '')}`}
                      className="text-sm font-semibold text-slate-900 hover:text-emerald-700 transition-colors"
                    >
                      {settings.phone || GET_INVOLVED_STRINGS.defaultPhone}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-resti-gold-light text-resti-gold flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Office Hours</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {settings.workingHours || 'Mon – Fri: 8:30 AM – 5:00 PM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Connect */}
              {whatsappCleanNumber && (
                <a
                  href={`https://wa.me/${whatsappCleanNumber}?text=${encodeURIComponent('Hello RESTI CBO, I would like to inquire about...')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with us on WhatsApp</span>
                </a>
              )}

              {/* Direct Contacts Preview */}
              {publishedPersons.length > 0 && (
                <div className="pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                    Departmental Contacts
                  </h4>
                  <div className="space-y-2.5">
                    {publishedPersons.slice(0, 3).map((person) => {
                      const displayEmail =
                        person.email && !person.email.toLowerCase().includes('gmail.com')
                          ? person.email
                          : 'info@resticbo.org';
                      return (
                        <div key={person.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">{person.name}</span>
                          <a href={`mailto:${displayEmail}`} className="text-emerald-700 hover:underline font-medium">
                            {displayEmail}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Social Media Links with Lucide icons */}
              <div className="pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Follow RESTI
                </h4>
                <div className="flex gap-2">
                  {settings.socialLinks.facebook && (
                    <a
                      href={settings.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialLinks.twitter && (
                    <a
                      href={settings.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialLinks.instagram && (
                    <a
                      href={settings.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialLinks.linkedin && (
                    <a
                      href={settings.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialLinks.youtube && (
                    <a
                      href={settings.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Link to Dedicated Get Involved Page */}
            <div className="p-4 rounded-xl bg-emerald-950 text-white flex items-center justify-between gap-4">
              <div className="text-xs text-emerald-100 leading-snug">
                <span className="font-semibold text-white block">Dedicated "Get Involved" Hub</span>
                View detailed program coordination, leadership direct contacts, and field resources.
              </div>
              <Link
                to="/get-involved"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <span>Explore Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Contact Us Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 md:p-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Direct Inquiry
                </span>
                <h3 className="text-2xl font-bold font-heading text-slate-900 mt-2">
                  {GET_INVOLVED_STRINGS.contactFormHeading}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Send us a message and our team will get back to you promptly.
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Grace Akello"
                    className={`w-full px-4 py-2.5 rounded-xl border ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. grace@example.com"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+256 700 000 000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Subject / Topic */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Subject / Topic <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {TOPIC_OPTIONS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Message <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we collaborate or assist you?"
                    className={`w-full px-4 py-2.5 rounded-xl border ${
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending message...</span>
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

        {/* Contained Single Office Map */}
        {primaryLocation && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Field Location
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-2">
                  {GET_INVOLVED_STRINGS.findOfficeHeading}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {GET_INVOLVED_STRINGS.findOfficeSubtitle}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  primaryLocation.address || 'Kiryandongo Refugee Settlement Uganda'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 text-xs font-bold transition-colors border border-slate-200/60 shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Get Directions on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200">
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
                title={primaryLocation.name || 'RESTI CBO Headquarters'}
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
export default Contact;
