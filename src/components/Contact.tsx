import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Mail, Phone, MapPin, Send, Loader2, MessageCircle, Clock, User, Briefcase, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';
import { Card } from './ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['contact', 'volunteer']),
}).superRefine((data, ctx) => {
  if (data.type === 'volunteer' && (!data.phone || data.phone.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phone number is required for volunteers',
      path: ['phone'],
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface ContactSettings {
  title: string;
  subtitle: string;
  address: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  supportItems: string[];
  locations?: {
    name: string;
    address: string;
    mapUrl: string;
  }[];
  workingHours?: string;
  departments?: {
    name: string;
    email: string;
  }[];
}

export function Contact() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'contact',
      name: '',
      email: '',
      phone: '',
      message: '',
    }
  });

  const formType = watch('type');

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

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data?.settings?.contact) {
        setSettings(data.settings.contact);
      } else {
        throw new Error('Contact settings not found in database');
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
      // Set default settings if fetch fails
      setSettings({
        title: 'Get Involved',
        subtitle: 'Join us in making a difference! Whether you want to volunteer, donate, or simply learn more about our work, we\'d love to hear from you.',
        address: 'Kiryandongo District, Uganda',
        email: 'info@restikirya.org',
        phone: '+256 XXX XXX XXX',
        socialLinks: {
          facebook: 'https://www.facebook.com/restikiryandongo',
          twitter: 'https://x.com/restikirya',
          instagram: 'https://www.instagram.com/restikiryandongo'
        },
        supportItems: [
          'Volunteer your time and skills',
          'Make a donation to support our programs',
          'Partner with us on community initiatives',
          'Spread the word about our work'
        ],
        locations: [
          {
            name: 'Main Office',
            address: 'Kiryandongo District, Uganda',
            mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15951.23456789!2d32.0!3d2.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwMDAnMDAsLjAiTiAzMsKwMDAnMDAsLjAiRQ!5e0!3m2!1sen!2sug!4v1234567890'
          }
        ],
        workingHours: 'Monday - Friday: 8:00 AM - 5:00 PM',
        departments: [
          { name: 'General Inquiries', email: 'info@restikirya.org' },
          { name: 'Partnerships', email: 'partners@restikirya.org' },
          { name: 'Volunteering', email: 'volunteer@restikirya.org' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      const endpoint = data.type === 'volunteer' ? 'volunteer' : 'contact';
      const payload = data.type === 'volunteer'
        ? {
            name: data.name,
            email: data.email,
            phone: data.phone,
            skills: '',
            message: data.message,
          }
        : {
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
          };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      toast.success(
        data.type === 'volunteer'
          ? 'Volunteer application submitted successfully! We will contact you soon.'
          : 'Message sent successfully! We will get back to you soon.'
      );

      reset();
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !settings) {
    return (
      <section id="contact" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            {settings.title}
          </h2>
          <p className="text-lg text-gray-600">
            {settings.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <MapPin className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-900">Location</div>
                    <div className="text-gray-600">{settings.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-900">Email</div>
                    <div className="text-gray-600">{settings.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-900">Phone</div>
                    <div className="text-gray-600">{settings.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp quick connect */}
            <a
              href={`https://wa.me/${(settings.whatsappNumber || settings.phone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-btn"
            >
              <MessageCircle size={18} />
              Chat with us on WhatsApp
            </a>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-xl text-gray-900 mb-4">Ways to Support</h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                {(settings.supportItems || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {settings.workingHours && (
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Office Hours</h4>
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Clock size={16} />
                    </div>
                    <span className="text-sm">{settings.workingHours}</span>
                  </div>
                </div>
              )}

              {settings.departments && settings.departments.length > 0 && (
                <div className="pt-6 mt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Direct Contacts</h4>
                  <div className="space-y-3">
                    {settings.departments.map((dept, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-xs text-gray-500">{dept.name}</span>
                        <a href={`mailto:${dept.email}`} className="text-sm text-emerald-600 hover:underline font-medium">
                          {dept.email}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {settings.socialLinks && (
                <div className="pt-6 mt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Follow Us</h4>
                  <div className="flex gap-3">
                    {settings.socialLinks.facebook && (
                      <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-all">
                        <span className="sr-only">Facebook</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {settings.socialLinks.twitter && (
                      <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-all">
                        <span className="sr-only">Twitter</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      </a>
                    )}
                    {settings.socialLinks.instagram && (
                      <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-all">
                        <span className="sr-only">Instagram</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form Type Selection - Tabbed Style */}
              <div className="bg-gray-100 p-1.5 rounded-xl flex mb-8">
                <button
                  type="button"
                  onClick={() => setValue('type', 'contact')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    formType === 'contact' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  General Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'volunteer')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    formType === 'volunteer' 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Volunteer Application
                </button>
              </div>

              <div>
                <label htmlFor="name" className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                  Full Name <span className="text-emerald-500">*</span>
                </label>
                <div className={`relative flex items-center group rounded-xl border ${errors.name ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500'} focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm`}>
                  <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    {...register('name')}
                    className="w-full pl-12 pr-5 py-2.5 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400/70 text-sm"
                    placeholder="Your name"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.name.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                    Email Address <span className="text-emerald-500">*</span>
                  </label>
                  <div className={`relative flex items-center group rounded-xl border ${errors.email ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500'} focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm`}>
                    <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className="w-full pl-12 pr-5 py-2.5 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400/70 text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                    Phone Number {formType === 'volunteer' && <span className="text-emerald-500">*</span>}
                  </label>
                  <div className={`relative flex items-center group rounded-xl border ${errors.phone ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500'} focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm`}>
                    <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                      <Phone size={20} />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className="w-full pl-12 pr-5 py-2.5 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400/70 text-sm"
                      placeholder="+256 ..."
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.phone.message}</p>}
                </div>
              </div>

              {formType === 'volunteer' && (
                <div className="grid md:grid-cols-2 gap-6 animate-[fadeIn_0.5s_ease-out]">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                      Area of Interest
                    </label>
                    <div className="relative flex items-center group rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm">
                      <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                        <Briefcase size={20} />
                      </div>
                      <select 
                        className="w-full pl-12 pr-10 py-2.5 bg-transparent outline-none text-slate-800 font-medium appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select Area</option>
                        <option value="education">Education & Tutoring</option>
                        <option value="healthcare">Healthcare Support</option>
                        <option value="environment">Environmental Conservation</option>
                        <option value="community">Community Outreach</option>
                        <option value="admin">Administrative Support</option>
                      </select>
                      <div className="absolute right-4 text-slate-400 pointer-events-none group-focus-within:text-emerald-600 transition-colors duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                      Availability
                    </label>
                    <div className="relative flex items-center group rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm">
                      <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                        <Calendar size={20} />
                      </div>
                      <select 
                        className="w-full pl-12 pr-10 py-2.5 bg-transparent outline-none text-slate-800 font-medium appearance-none cursor-pointer text-sm"
                      >
                        <option value="">Select Availability</option>
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="weekends">Weekends Only</option>
                        <option value="remote">Remote / Digital</option>
                      </select>
                      <div className="absolute right-4 text-slate-400 pointer-events-none group-focus-within:text-emerald-600 transition-colors duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="message" className="text-xs font-bold text-slate-500 mb-2 ml-1 block uppercase tracking-wider">
                  {formType === 'volunteer' ? 'Why do you want to join us?' : 'Message'} <span className="text-emerald-500">*</span>
                </label>
                <div className={`relative flex items-start group rounded-xl border ${errors.message ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 focus-within:bg-white focus-within:border-emerald-500'} focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-sm`}>
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors duration-300 pointer-events-none">
                    <MessageSquare size={20} />
                  </div>
                  <textarea
                    id="message"
                    rows={5}
                    {...register('message')}
                    className="w-full pl-12 pr-5 py-2.5 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400/70 text-sm resize-none"
                    placeholder={
                      formType === 'volunteer'
                        ? 'Tell us about your background, skills, and what motivates you to volunteer...'
                        : 'How can we help you?'
                    }
                  />
                </div>
                {errors.message && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-600/15 hover:shadow-xl hover:shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{formType === 'volunteer' ? 'Submit Application' : 'Send Message'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        {settings.locations && settings.locations.length > 0 && (
          <div className="mt-16 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            <div className="text-center mb-10">
              <h3 className="text-2xl text-gray-900 mb-2">Our Locations</h3>
              <p className="text-gray-600">Visit us at any of our branches</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {settings.locations.map((loc, idx) => (
                <Card key={idx} className="overflow-hidden border-0 shadow-xl group">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-900">{loc.name}</h4>
                      <p className="text-xs text-emerald-700 flex items-center gap-1">
                        <MapPin size={12} /> {loc.address}
                      </p>
                    </div>
                  </div>
                  <div className="h-[350px] relative">
                    <iframe
                      src={loc.mapUrl && loc.mapUrl.includes('embed') ? loc.mapUrl : `https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-700"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
