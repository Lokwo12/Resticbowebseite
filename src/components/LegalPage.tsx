import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Shield, Lock, FileText, Scale } from 'lucide-react';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'refund';
}

export function LegalPage({ type }: LegalPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        const data = await response.json();
        const legal = data.settings?.legal;
        
        if (legal) {
          if (type === 'privacy') setContent(legal.privacyPolicy || '');
          else if (type === 'terms') setContent(legal.termsOfService || '');
          else if (type === 'refund') setContent(legal.refundPolicy || '');
        }
      } catch (err) {
        console.error('Error fetching legal settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [type]);

  const titles = {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    refund: 'Refund Policy'
  };

  const icons = {
    privacy: <Lock className="text-white" size={32} />,
    terms: <FileText className="text-white" size={32} />,
    refund: <Scale className="text-white" size={32} />
  };

  const fallbacks = {
    privacy: 'Our Privacy Policy is currently being updated. Please check back soon or contact us directly.',
    terms: 'Our Terms of Service are currently being updated. Please check back soon or contact us directly.',
    refund: 'Our Refund Policy is currently being updated. Please check back soon or contact us directly.'
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-32 pb-24">
        <div className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            {icons[type]}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{titles[type]}</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Please read our {titles[type].toLowerCase()} carefully.
          </p>
        </div>
      </div>

      {/* Main Content (Overlapping Card Layout) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-4 text-base">
            {content || fallbacks[type]}
          </div>
          
          <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
            <Shield size={16} className="text-emerald-600" />
            <p>If you have any questions about our {titles[type].toLowerCase()}, please contact us.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
