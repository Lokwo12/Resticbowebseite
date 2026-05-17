import React, { useState } from 'react';
import { Heart, Send, CheckCircle2, User, Mail, Phone, MessageSquare, Briefcase, Calendar, Cake, MapPin, GraduationCap, Globe, Shield, Users, ChevronDown, Upload, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

export function VolunteerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    education: '',
    occupation: '',
    languages: '',
    areaOfInterest: '',
    availability: '',
    emergencyContact: '',
    reference: '',
    message: '',
    cv: null as File | null
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, cv: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Package extra form fields nicely inside skills and message to fit the database/KV store schema perfectly without changing backend
      const combinedSkills = [
        formData.areaOfInterest ? `Area: ${formData.areaOfInterest}` : '',
        formData.education ? `Education: ${formData.education}` : '',
        formData.occupation ? `Occupation: ${formData.occupation}` : '',
        formData.languages ? `Languages: ${formData.languages}` : ''
      ].filter(Boolean).join(' | ');

      const combinedMessage = [
        formData.message ? `Message: ${formData.message}` : '',
        formData.dob ? `DOB: ${formData.dob}` : '',
        formData.gender ? `Gender: ${formData.gender}` : '',
        formData.address ? `Address: ${formData.address}` : '',
        formData.availability ? `Availability: ${formData.availability}` : '',
        formData.emergencyContact ? `Emergency Contact: ${formData.emergencyContact}` : '',
        formData.reference ? `Reference: ${formData.reference}` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        skills: combinedSkills,
        message: combinedMessage
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/volunteer`,
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
        throw new Error(errorData.error || 'Failed to submit application');
      }

      toast.success('Volunteer application submitted successfully!');
      setSubmitted(true);
      setFormData({
        name: '', email: '', phone: '', dob: '', gender: '', address: '', 
        education: '', occupation: '', languages: '', areaOfInterest: '', 
        availability: '', emergencyContact: '', reference: '', message: '',
        cv: null
      });
    } catch (err) {
      console.error('Error submitting volunteer form:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-emerald-950 text-white pt-44 pb-36 overflow-hidden relative antialiased">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1641569707854-c80945fb4719?w=1600&q=80" 
            alt="Volunteer Background" 
            className="w-full h-full object-cover opacity-30 contrast-110"
          />
          {/* Darker premium overlay for absolute text legibility */}
          <div className="absolute inset-0 bg-emerald-950/80 z-10"></div>
        </div>
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumbs */}
          <nav className="flex justify-center items-center gap-2 mb-10 text-emerald-400 text-sm font-bold tracking-wide animate-[fadeIn_1s_ease-out]">
            <a href="/" className="hover:text-emerald-300 transition-colors uppercase">Home</a>
            <span className="text-emerald-500">/</span>
            <span className="text-white uppercase">Volunteer</span>
          </nav>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-8 border border-white/20 shadow-2xl backdrop-blur-sm">
            <Heart className="text-emerald-400 animate-pulse" size={40} />
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-6 text-white tracking-tighter leading-none uppercase drop-shadow-2xl">
            Join Our Mission
          </h1>
          <p className="text-emerald-50/90 max-w-3xl mx-auto text-xl md:text-2xl font-medium tracking-tight leading-relaxed drop-shadow-md">
            Share your skills, make new friends, and be a part of positive change in Kiryandongo.
          </p>
        </div>
      </div>

      {/* Main Content (Form Layout) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-40">
        <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-16 border border-gray-100">
          
          {submitted ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Thank you for your interest in volunteering with us. We have received your application and will get back to you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Official Application
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Volunteer Application Form</h2>
                <p className="text-gray-500 text-lg">Please fill out the form below and we will contact you soon.</p>
                <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-emerald-200 mx-auto mt-6 rounded-full opacity-60"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Personal Identification */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <User size={20} className="text-emerald-600" />
                    Personal Identification
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="name" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Full Name <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <User size={22} />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="Your Full Name"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label htmlFor="dob" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Date of Birth <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Cake size={22} />
                        </div>
                        <input
                          type="date"
                          id="dob"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Gender */}
                    <div>
                      <label htmlFor="gender" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Gender <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100 pointer-events-none">
                          <Heart size={22} />
                        </div>
                        <div className="relative flex-1">
                          <select 
                            id="gender"
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-transparent outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Email Address <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Mail size={22} />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Phone Number <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Phone size={22} />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="+256 ..."
                        />
                      </div>
                    </div>

                    {/* Physical Address */}
                    <div>
                      <label htmlFor="address" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Physical Address <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <MapPin size={22} />
                        </div>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="Current Residence / City"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-4" />

                {/* Section 2: Professional Background */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <GraduationCap size={20} className="text-emerald-600" />
                    Background & Skills
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Education */}
                    <div>
                      <label htmlFor="education" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Highest Education <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100 pointer-events-none">
                          <GraduationCap size={22} />
                        </div>
                        <div className="relative flex-1">
                          <select 
                            id="education"
                            name="education"
                            required
                            value={formData.education}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-transparent outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                          >
                            <option value="">Select Level</option>
                            <option value="primary">Primary Education</option>
                            <option value="secondary">Secondary Education</option>
                            <option value="certificate">Certificate / Vocational</option>
                            <option value="diploma">Diploma</option>
                            <option value="degree">Bachelor's Degree</option>
                            <option value="postgrad">Postgraduate</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Occupation */}
                    <div>
                      <label htmlFor="occupation" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Current Occupation <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Briefcase size={22} />
                        </div>
                        <input
                          type="text"
                          id="occupation"
                          name="occupation"
                          required
                          value={formData.occupation}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="e.g. Student, Teacher, etc."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Languages Spoken */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="languages" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Languages Spoken <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Globe size={22} />
                        </div>
                        <input
                          type="text"
                          id="languages"
                          name="languages"
                          required
                          value={formData.languages}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="e.g. English, Swahili, etc."
                        />
                      </div>
                    </div>

                    {/* CV Upload */}
                    <div>
                      <label htmlFor="cv" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        CV / Resume <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white relative">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          {formData.cv ? <FileText size={22} className="text-emerald-600" /> : <Upload size={22} />}
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="file"
                            id="cv"
                            name="cv"
                            required
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="px-5 py-4 flex items-center justify-between pointer-events-none">
                            <span className={`font-medium ${formData.cv ? 'text-emerald-700' : 'text-gray-400'}`}>
                              {formData.cv ? formData.cv.name : 'Click to upload (PDF/DOC)'}
                            </span>
                            {!formData.cv && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded uppercase tracking-wider font-bold">Upload</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-4" />

                {/* Section 3: Volunteer Interest */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <Heart size={20} className="text-emerald-600" />
                    Volunteer Preferences
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Area of Interest */}
                    <div>
                      <label htmlFor="areaOfInterest" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Area of Interest <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100 pointer-events-none">
                          <Briefcase size={22} />
                        </div>
                        <div className="relative flex-1">
                          <select 
                            id="areaOfInterest"
                            name="areaOfInterest"
                            required
                            value={formData.areaOfInterest}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-transparent outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                          >
                            <option value="">Select Area</option>
                            <option value="education">Education & Tutoring</option>
                            <option value="healthcare">Healthcare Support</option>
                            <option value="environment">Environmental Conservation</option>
                            <option value="community">Community Outreach</option>
                            <option value="admin">Administrative Support</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <label htmlFor="availability" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Availability <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100 pointer-events-none">
                          <Calendar size={22} />
                        </div>
                        <div className="relative flex-1">
                          <select 
                            id="availability"
                            name="availability"
                            required
                            value={formData.availability}
                            onChange={handleChange}
                            className="w-full px-5 py-4 bg-transparent outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                          >
                            <option value="">Select Availability</option>
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="weekends">Weekends Only</option>
                            <option value="remote">Remote / Digital</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why do you want to join us? */}
                  <div>
                    <label htmlFor="message" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                      Why do you want to join us? <span className="text-emerald-500">*</span>
                    </label>
                    <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                      <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100 pt-5 items-start">
                        <MessageSquare size={22} />
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400 resize-none"
                        placeholder="Tell us about your background, skills, and what motivates you to volunteer..."
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-4" />

                {/* Section 4: Safety & References */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <Shield size={20} className="text-emerald-600" />
                    Safety & References
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Emergency Contact */}
                    <div>
                      <label htmlFor="emergencyContact" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        Emergency Contact <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Phone size={22} />
                        </div>
                        <input
                          type="text"
                          id="emergencyContact"
                          name="emergencyContact"
                          required
                          value={formData.emergencyContact}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="Name & Phone Number"
                        />
                      </div>
                    </div>

                    {/* Reference */}
                    <div>
                      <label htmlFor="reference" className="text-[13px] font-semibold text-gray-500 mb-1.5 ml-1 block uppercase tracking-[0.05em]">
                        One Reference <span className="text-emerald-500">*</span>
                      </label>
                      <div className="flex group rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-gray-50/50 focus-within:bg-white">
                        <div className="flex-shrink-0 w-14 flex items-center justify-center text-gray-400 group-focus-within:text-emerald-600 transition-all border-r border-gray-100">
                          <Users size={22} />
                        </div>
                        <input
                          type="text"
                          id="reference"
                          name="reference"
                          required
                          value={formData.reference}
                          onChange={handleChange}
                          className="flex-1 px-5 py-4 bg-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                          placeholder="Name & Contact of Referee"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
