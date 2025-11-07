import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, FolderOpen } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  category: string;
  date: string;
}

export function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sectionSettings, setSectionSettings] = useState({ title: 'Resources & Downloads', description: 'Access our reports, publications, and educational materials to learn more about our work and impact.' });

  useEffect(() => {
    fetchResources();
    fetchSettings();
  }, []);

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

      if (response.ok) {
        const data = await response.json();
        if (data.settings?.sections?.resources) {
          setSectionSettings(data.settings.sections.resources);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(resources.map(r => r.category)))];
  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <section id="resources" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="resources" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FolderOpen className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card 
                key={resource.id} 
                className="p-6 hover:shadow-xl transition-all duration-300 group"
              >
                {/* File Icon & Type */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{getFileIcon(resource.fileType)}</div>
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        {resource.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline">{resource.category}</Badge>
                </div>

                {/* Title & Description */}
                <h3 className="text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{resource.fileSize}</span>
                  <span>{new Date(resource.date).toLocaleDateString()}</span>
                </div>

                {/* Download Button */}
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Download</span>
                </a>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white">
            <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No resources available in this category.</p>
          </Card>
        )}

        {/* Resource Categories Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center bg-white">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-emerald-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Application Forms</h4>
            <p className="text-sm text-gray-600">
              Volunteer applications, program enrollment forms, and more
            </p>
          </Card>

          <Card className="p-6 text-center bg-white">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Educational Materials</h4>
            <p className="text-sm text-gray-600">
              Guides, worksheets, and learning resources for community programs
            </p>
          </Card>

          <Card className="p-6 text-center bg-white">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-purple-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Policy Documents</h4>
            <p className="text-sm text-gray-600">
              Organizational policies, procedures, and governance documents
            </p>
          </Card>
        </div>

        {/* Need Help CTA */}
        <div className="mt-12 bg-white border-2 border-emerald-600 rounded-2xl p-8 text-center">
          <h3 className="text-gray-900 mb-4">Need a Specific Resource?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            If you can't find what you're looking for or need assistance with any of our resources, 
            please don't hesitate to reach out to our team.
          </p>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}
