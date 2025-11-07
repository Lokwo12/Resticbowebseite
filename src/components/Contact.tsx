import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    type: 'contact', // contact or volunteer
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            Get Involved
          </h2>
          <p className="text-lg text-gray-600">
            Join us in making a difference! Whether you want to volunteer, donate, or simply learn more about our work, we'd love to hear from you.
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
                    <div className="text-gray-600">Kiryandongo District, Uganda</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-900">Email</div>
                    <div className="text-gray-600">info@restikirya.org</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="text-gray-900">Phone</div>
                    <div className="text-gray-600">+256 XXX XXX XXX</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 mb-4">Ways to Support</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Volunteer your time and skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Make a donation to support our programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Partner with us on community initiatives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span>Spread the word about our work</span>
                </li>
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
                  placeholder="+256 XXX XXX XXX"
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
                disabled={loading}
                className="w-full bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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
      </div>
    </section>
  );
}
