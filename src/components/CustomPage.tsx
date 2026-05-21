import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { Button } from './ui/button';

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.page && data.page.published) {
            setPage(data.page);
          } else {
            setPage(null);
          }
        } else {
          setPage(null);
        }
      } catch (err) {
        console.error('Error fetching dynamic page:', err);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) return <LoadingScreen />;

  if (!page) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div className="max-w-md mx-auto px-4 text-center">
          <h2 className="text-2xl text-gray-900 mb-4 font-bold">Page Not Found</h2>
          <p className="text-gray-600 mb-8">The page you are looking for does not exist or has been removed.</p>
          <Link to="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <ArrowLeft size={18} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24" style={{ paddingTop: '120px' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation */}
        <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-8 md:p-12">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Last updated on {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Dynamic HTML Content */}
          <div 
            className="prose prose-emerald max-w-none text-gray-700 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  );
}
