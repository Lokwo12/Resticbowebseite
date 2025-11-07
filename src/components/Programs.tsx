import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }

      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  return (
    <section id="programs" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            Our Programs
          </h2>
          <p className="text-lg text-gray-600">
            We run comprehensive programs designed to address the most pressing needs in our community, creating pathways to opportunity and sustainable development.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.filter(p => p && p.value).map((program) => (
            <div
              key={program.key}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
            >
              {program.value.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={program.value.image}
                    alt={program.value.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs mb-3">
                  {program.value.category}
                </div>
                <h3 className="text-xl text-gray-900 mb-3">
                  {program.value.title}
                </h3>
                <p className="text-gray-600">
                  {program.value.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {programs.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">No programs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
