import { useState } from 'react';
import { Heart, Send, CheckCircle2, User, Mail, Phone, MessageSquare } from 'lucide-react';

export function VolunteerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', skills: '', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-40 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Join Us as a Volunteer</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Share your skills, make new friends, and be a part of positive change in Kiryandongo.
          </p>
        </div>
      </div>

      {/* Main Content (Form Layout) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          
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
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Volunteer Application Form</h2>
                <p className="text-gray-500">Please fill out the form below and we will contact you soon.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="+256 700 000 000"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills & Areas of Interest *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MessageSquare size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      required
                      value={formData.skills}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="e.g. Teaching, Health Care, IT, Event Planning"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Why do you want to volunteer with us? *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="Tell us a bit about your motivation..."
                  />
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
