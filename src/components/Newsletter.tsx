import { useState } from 'react';
import { Mail, Send, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/newsletter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      toast.success('Successfully subscribed to our newsletter! 🎉');
      setSubscribed(true);
      setEmail('');
      setName('');

      // Reset after 5 seconds
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter" className="newsletter-bg py-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="text-white" size={32} />
          </div>
          <h2 className="text-3xl lg:text-4xl text-white mb-4">
            Stay Connected
          </h2>
          <p className="text-lg text-emerald-50 mb-8">
            Subscribe to our newsletter for updates on our programs, success stories, and upcoming events.
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (optional)"
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email *"
                    required
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Subscribe to Newsletter
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                You're Subscribed! 🎉
              </h3>
              <p className="text-gray-600">
                Thank you for joining our community. We'll keep you updated with our latest news and stories.
              </p>
            </div>
          )}

          <p className="text-sm text-emerald-100 mt-6">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
