import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Header } from './Header';
import { Contact } from './Contact';
import { Footer } from './Footer';
import { Newsletter } from './Newsletter';
import { Mail, Phone, MapPin } from 'lucide-react';

export function ContactPage() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
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
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings.contact);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const primaryLocation = settings?.locations?.[0] || {
    name: 'Main Office',
    address: 'Kiryandongo District, Uganda',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15951.23456789!2d32.0!3d2.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwMDAnMDAsLjAiTiAzMsKwMDAnMDAsLjAiRQ!5e0!3m2!1sen!2sug!4v1234567890'
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section for Contact Page */}
      <section className="relative pt-48 pb-32 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-emerald-900/90"></div>
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80" 
            alt="Contact Us" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          {/* Breadcrumbs */}
          <nav className="flex justify-center items-center gap-2 mb-8 text-emerald-200/80 text-sm animate-[fadeInDown_0.6s_ease-out]">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-emerald-500">/</span>
            <span className="text-white font-medium">Contact</span>
          </nav>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-[fadeInDown_0.8s_ease-out]">
            {settings?.title || 'Get In Touch'}
          </h1>
          <p className="text-xl text-emerald-50 max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out]">
            {settings?.subtitle || "Have questions or want to support our mission? Reach out to us. We'd love to hear from you."}
          </p>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce opacity-50">
            <div className="w-1 h-12 rounded-full bg-gradient-to-b from-white/80 to-transparent mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Main Contact Content */}
      <main className="-mt-16 relative z-20 pb-20">
        <Contact />
      </main>

      {/* Map Section Header */}
      <section className="bg-white pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs">Location</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3">Find Our Office</h2>
        </div>
      </section>

      {/* Contained Map Section */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="relative h-[550px] bg-gray-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden border border-gray-100">
          <iframe 
            src={primaryLocation.mapUrl && primaryLocation.mapUrl.includes('embed') ? primaryLocation.mapUrl : `https://maps.google.com/maps?q=${encodeURIComponent(primaryLocation.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={primaryLocation.name}
          ></iframe>
          
          {/* Floating Address Card on Map - Enhanced Visibility */}
          <div className="absolute top-1/2 -translate-y-1/2 left-10 z-10 hidden md:block">
            <div className="bg-gray-900/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/10 max-w-sm transform hover:scale-105 transition-transform duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Visit Us
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{primaryLocation.name}</h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                {primaryLocation.address}
              </p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryLocation.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 group"
              >
                <MapPin size={20} className="group-hover:bounce" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-only Address Card */}
      <section className="md:hidden mx-4 -mt-20 mb-20 relative z-30">
        <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl border border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Our Headquarters
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{primaryLocation.name}</h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
            {primaryLocation.address}
          </p>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryLocation.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20"
          >
            <MapPin size={20} />
            <span>Get Directions</span>
          </a>
        </div>
      </section>

      <div className="py-20 md:py-32 bg-white"></div>

      <Newsletter />
      <Footer />
    </div>
  );
}
