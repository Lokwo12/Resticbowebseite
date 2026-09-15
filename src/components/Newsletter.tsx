import React, { useState } from 'react';
import { Mail, Send, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof formSchema>;

export function Newsletter() {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name ? data.name.trim() : '';

    try {
      // 1. Quick deduplication check against database
      try {
        const { data: existing } = await supabase
          .from('newsletters')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          toast.info("You're already subscribed to our newsletter! 🎉");
          setSubscribed(true);
          reset();
          setTimeout(() => setSubscribed(false), 5000);
          return;
        }
      } catch (checkErr) {
        // Non-blocking, continue
      }

      // 2. Try submitting via edge function
      let savedViaApi = false;
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/newsletter`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ email: cleanEmail, name: cleanName }),
          }
        );

        if (response.ok) {
          savedViaApi = true;
        } else {
          const resData = await response.json().catch(() => null);
          if (resData?.error && typeof resData.error === 'string' && resData.error.toLowerCase().includes('already subscribed')) {
            toast.info("You're already subscribed to our newsletter! 🎉");
            setSubscribed(true);
            reset();
            setTimeout(() => setSubscribed(false), 5000);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('Direct newsletter endpoint unavailable, falling back to database:', apiErr);
      }

      // 3. Fallback to direct Supabase database insert if API did not succeed
      if (!savedViaApi) {
        const subscriberId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : (Math.random().toString(36).substring(2) + Date.now().toString(36));
        const now = new Date().toISOString();

        const { error: dbError } = await supabase.from('newsletters').upsert({
          id: subscriberId,
          email: cleanEmail,
          status: 'active',
          created_at: now,
          updated_at: now,
        });

        if (dbError) {
          throw new Error(dbError.message || 'Failed to subscribe');
        }

        // Mirror to kv_store_2a4be611 for any legacy key-value prefix queries
        try {
          await supabase.from('kv_store_2a4be611').upsert({
            key: `newsletter:${subscriberId}`,
            value: {
              id: subscriberId,
              email: cleanEmail,
              name: cleanName,
              timestamp: now,
              createdAt: now,
              status: 'active',
            },
          });
        } catch (e) {
          console.warn('Could not mirror to kv_store:', e);
        }
      }

      toast.success('Successfully subscribed to our newsletter! 🎉');
      setSubscribed(true);
      reset();

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
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Your Name (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 text-left flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.name.message}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="Your Email *"
                      className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 text-left flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.email.message}</p>}
                  </div>
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
