import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Loader2 } from 'lucide-react';
import { useScrollAnimation, getStaggerDelay } from '../utils/animations';

interface Program {
  key: string;
  value: {
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt: string;
  };
}

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Our Programs', description: 'We run comprehensive programs designed to address the most pressing needs in our community, creating pathways to opportunity and sustainable development.' });
  // Start visible since Programs is near top of page (after Hero & About)
  const { ref, isVisible } = useScrollAnimation({ startVisible: true });

  useEffect(() => {
    fetchPrograms();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('🔄 Fetching Programs section settings...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📡 Programs settings response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Programs section settings from API:', data.settings?.sections?.programs);
        if (data.settings?.sections?.programs) {
          setSectionSettings(data.settings.sections.programs);
          console.log('✅ Programs section settings updated');
        } else {
          console.log('⚠️ No programs section settings found, using defaults');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching section settings:', err);
    }
  };

  const fetchPrograms = async () => {
    try {
      console.log('🔄 Fetching Programs list...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📡 Programs list response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();
      console.log('📦 Programs list from API:', data.programs);
      setPrograms(data.programs || []);
      console.log('✅ Programs count:', (data.programs || []).length);
    } catch (err) {
      console.error('❌ Error fetching programs:', err);
      setError('Failed to load programs. Please try again later.');
    } finally {
      console.log('🏁 Programs fetch complete');
      setLoading(false);
    }
  };

  console.log('🎨 Programs component render - loading:', loading, 'programs count:', programs.length);
  console.log('📋 Section settings:', sectionSettings);

  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-emerald-600" size={48} />
          </div>
        </div>
      </section>
    );
  }

  console.log('🎯 Programs component rendering section');

  return (
    <section id="programs" className="py-20 bg-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            {sectionSettings.title}
          </h2>
          <p className="text-lg text-gray-600">
            {sectionSettings.description}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 animate-[fadeIn_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.filter(p => p && p.value).map((program, index) => (
            <div
              key={program.key}
              className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isVisible ? getStaggerDelay(index, 100) : '0ms' }}
            >
              {program.value.image && (
                <div className="aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={program.value.image}
                    alt={program.value.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  {program.value.category}
                </div>
                <h3 className="text-xl text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                  {program.value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {program.value.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {programs.length === 0 && !error && (
          <div className="text-center py-12 animate-[fadeIn_0.5s_ease-out]">
            <p className="text-gray-500">No programs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
