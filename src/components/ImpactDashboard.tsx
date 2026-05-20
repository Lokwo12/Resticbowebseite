import { useState, useEffect } from 'react';
import { TrendingUp, Users, Heart, BookOpen, Download, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ImpactStats {
  peopleServed: number;
  programsActive: number;
  volunteersActive: number;
  fundsRaised: number;
  communitiesReached: number;
  successRate: number;
}

interface Report {
  id: string;
  title: string;
  year: string;
  fileUrl: string;
  description: string;
  fileSize: string;
}

const FALLBACK_STATS: ImpactStats = {
  peopleServed: 2500,
  programsActive: 10,
  volunteersActive: 50,
  fundsRaised: 125000000,
  communitiesReached: 6,
  successRate: 90,
};

export function ImpactDashboard() {
  const [stats, setStats] = useState<ImpactStats>(FALLBACK_STATS);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionSettings, setSectionSettings] = useState({ title: 'Impact Dashboard', description: 'See the measurable impact of our work through data, statistics, and comprehensive reports.' });

  useEffect(() => {
    fetchData();
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
        if (data.settings?.sections?.impact) {
          setSectionSettings(data.settings.sections.impact);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/impact-stats`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        )
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) setStats(statsData.stats);
      }
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }
    } catch (error) {
      console.warn('Impact API unavailable, using fallback data.', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <section id="impact-dashboard" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Impact Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* People Served */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Users className="text-emerald-600" size={24} />
                </div>
                <Badge variant="secondary">+12% YoY</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">People Served</h3>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stats.peopleServed.toLocaleString()}</p>
              <Progress value={75} className="h-2" />
            </Card>

            {/* Active Programs */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shadow-inner">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">Active Programs</h3>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stats.programsActive}</p>
              <Progress value={stats.programsActive * 10} className="h-2" />
            </Card>

            {/* Volunteers */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Users className="text-purple-600" size={24} />
                </div>
                <Badge variant="secondary">Growing</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">Active Volunteers</h3>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stats.volunteersActive}</p>
              <Progress value={60} className="h-2" />
            </Card>

            {/* Funds Raised */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Heart className="text-emerald-600" size={24} />
                </div>
                <Badge variant="secondary">2024</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">Funds Raised</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">UGX {stats.fundsRaised.toLocaleString()}</p>
              <div className="text-xs text-gray-500 mb-3">Est. ${(stats.fundsRaised / 3750).toLocaleString(undefined, {maximumFractionDigits: 0})} USD</div>
              <Progress value={65} className="h-2" />
            </Card>

            {/* Communities Reached */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shadow-inner">
                  <Users className="text-orange-600" size={24} />
                </div>
                <Badge variant="secondary">Expanding</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">Communities Reached</h3>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stats.communitiesReached}</p>
              <Progress value={stats.communitiesReached * 20} className="h-2" />
            </Card>

            {/* Success Rate */}
            <Card className="p-6 hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 bg-white border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shadow-inner">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <Badge variant="secondary">Excellence</Badge>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-medium">Program Success Rate</h3>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stats.successRate}%</p>
              <Progress value={stats.successRate} className="h-2" />
            </Card>
          </div>
        )}

        {/* Annual Reports */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-gray-900 mb-2">Annual Reports</h3>
            <p className="text-gray-600">
              Download our detailed annual reports for complete transparency on our operations and impact.
            </p>
          </div>

          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-emerald-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-gray-900">{report.title}</h4>
                        <Badge variant="outline">{report.year}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{report.fileSize}</span>
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Download size={16} />
                          <span className="text-sm">Download PDF</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-50">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Annual reports will be available soon.</p>
            </Card>
          )}
        </div>

        {/* Transparency Message */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="mb-4">Committed to Transparency</h3>
          <p className="mb-6 text-emerald-50 max-w-2xl mx-auto">
            We believe in complete transparency about how donations are used and the impact we create. 
            Our annual reports provide detailed breakdowns of our programs, finances, and outcomes.
          </p>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Request More Information
          </button>
        </div>
      </div>
    </section>
  );
}
