import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LoadingScreen } from './LoadingScreen';
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  date: string;
  fileUrl: string;
  thumbnail?: string;
}

export function ImpactReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await response.json();
        const reportsData = data.reports || [];
        
        // Map data if needed
        const mappedReports = reportsData.map((item: any) => ({
          id: item.key || item.id || '',
          title: item.value?.title || item.title || '',
          description: item.value?.description || item.description || '',
          date: item.value?.date || item.date || new Date().toISOString(),
          fileUrl: item.value?.fileUrl || item.fileUrl || '#',
          thumbnail: item.value?.thumbnail || item.thumbnail || '',
        }));
        
        setReports(mappedReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const fallbackReports: Report[] = [
    {
      id: '1',
      title: 'Annual Impact Report 2025',
      description: 'A comprehensive review of our activities, achievements, and financial summary for the year 2025.',
      date: '2026-01-15',
      fileUrl: '#',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: '2',
      title: 'Youth Empowerment Project - Mid-Term Evaluation',
      description: 'An independent evaluation of our ongoing youth empowerment initiatives in Kiryandongo.',
      date: '2025-11-05',
      fileUrl: '#',
      thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    },
    {
      id: '3',
      title: 'Community Needs Assessment 2025',
      description: 'Detailed research report on the most pressing needs of the community to guide our future programs.',
      date: '2025-03-10',
      fileUrl: '#',
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    }
  ];

  const displayReports = reports.length > 0 ? reports : fallbackReports;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white pt-12 sm:pt-20 pb-12 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <FileText className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Impact Reports & Resources</h1>
          <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
            Explore our detailed reports to see how your support translates into real change on the ground.
          </p>
        </div>
      </div>

      {/* Main Content (Grid Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow duration-300">
              {/* Report Thumbnail */}
              <div className="h-48 overflow-hidden relative bg-gray-100">
                {report.thumbnail ? (
                  <img
                    src={report.thumbnail}
                    alt={report.title}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                    <FileText size={48} className="text-emerald-600" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(report.date)}
                  </span>
                </div>
              </div>

              {/* Report Info */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-emerald-600 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-4 line-clamp-3">
                    {report.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="View Online"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
