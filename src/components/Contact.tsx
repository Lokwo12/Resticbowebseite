import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Mail, Phone, MapPin, Send, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';
import { Card } from './ui/card';

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
}

export function Contact() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    type: 'contact', // contact or volunteer
  });
  const [submitting, setSubmitting] = useState(false);

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
      setSettings(data.settings.contact);
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
          facebook: '#',
          twitter: '#',
          instagram: '#'
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
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = formData.type === 'volunteer' ? 'volunteer' : 'contact';
      const payload = formData.type === 'volunteer'
        ? {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            skills: '',
            message: formData.message,
          }
        : {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
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
        formData.type === 'volunteer'
          ? 'Volunteer application submitted successfully! We will contact you soon.'
          : 'Message sent successfully! We will get back to you soon.'
      );

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        type: 'contact',
      });
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

            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 mb-4">Ways to Support</h3>
              <ul className="space-y-3 text-gray-700">
                {settings.supportItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Type Selection */}
              <div>
                <label className="text-gray-900 mb-2 block">I want to:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="contact"
                      checked={formData.type === 'contact'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-gray-700">Send a message</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="volunteer"
                      checked={formData.type === 'volunteer'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-gray-700">Volunteer</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="text-gray-900 mb-2 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-gray-900 mb-2 block">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-gray-900 mb-2 block">
                  Phone {formData.type === 'volunteer' && '*'}
                </label>
                <input
                  type="tel"
                  id="phone"
                  required={formData.type === 'volunteer'}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={settings.phone}
                />
              </div>

              <div>
                <label htmlFor="message" className="text-gray-900 mb-2 block">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder={
                    formData.type === 'volunteer'
                      ? 'Tell us about your skills and availability...'
                      : 'Your message...'
                  }
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {formData.type === 'volunteer' ? 'Submit Application' : 'Send Message'}
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
                      src={loc.mapUrl}
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
