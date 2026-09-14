import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, TrendingUp, ShieldCheck } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useScrollAnimation } from '../utils/animations';

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MOCK_EXPENSES = [
  { name: 'Program Services', value: 75, color: '#10b981' },
  { name: 'Community Grants', value: 15, color: '#3b82f6' },
  { name: 'Management & General', value: 7, color: '#f59e0b' },
  { name: 'Fundraising', value: 3, color: '#8b5cf6' },
];

const MOCK_REVENUE = [
  { year: '2022', revenue: 120000 },
  { year: '2023', revenue: 180000 },
  { year: '2024', revenue: 250000 },
  { year: '2025', revenue: 310000 },
];

const DEFAULT_REPORTS = [
  { year: '2025', title: 'Q1 Impact & Financial Summary', size: '2.4 MB', fileUrl: '#' },
  { year: '2024', title: 'Annual Report & Audited Financials', size: '5.1 MB', fileUrl: '#' },
  { year: '2023', title: 'Annual Report & Audited Financials', size: '4.8 MB', fileUrl: '#' },
  { year: '2022', title: 'Annual Report & Audited Financials', size: '3.9 MB', fileUrl: '#' },
];

export function FinancialReports() {
  const [financials, setFinancials] = useState<any>({
    badge: 'Transparency',
    title: 'Financial Transparency',
    description: 'We believe in complete transparency. See exactly how your contributions are making a difference in the Kiryandongo District.',
    expenses: MOCK_EXPENSES,
    revenue: MOCK_REVENUE,
    revenueNote: 'Consistent growth in support allows us to expand our sustainable programs every year.',
    reportsTitle: 'Annual Reports & Audits',
    reportsDescription: 'Download our comprehensive annual reports and audited financial statements to see detailed breakdowns of our impact and operations.',
    reports: DEFAULT_REPORTS,
    commitmentTitle: 'Committed to Transparency',
    commitmentDescription: 'We believe in complete transparency about how donations are used and the impact we create. Our annual reports provide detailed breakdowns of our programs, finances, and outcomes.',
    commitmentButtonText: 'Request More Information',
    commitmentButtonLink: '#contact'
  });

  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.financials) {
          setFinancials((prev: any) => ({
            ...prev,
            ...data.settings.financials,
            expenses: data.settings.financials.expenses?.length ? data.settings.financials.expenses : MOCK_EXPENSES,
            revenue: data.settings.financials.revenue?.length ? data.settings.financials.revenue : MOCK_REVENUE,
            reports: data.settings.financials.reports?.length ? data.settings.financials.reports : DEFAULT_REPORTS,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching financial settings:', err);
    }
  };

  const expensesData = financials.expenses || MOCK_EXPENSES;
  const revenueData = financials.revenue || MOCK_REVENUE;
  const reportsData = financials.reports || DEFAULT_REPORTS;

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 animate-[fadeInDown_0.8s_ease-out]">
          <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <ShieldCheck size={14} />
            {financials.badge || 'Transparency'}
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            {financials.title || 'Financial Transparency'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {financials.description || 'We believe in complete transparency. See exactly how your contributions are making a difference in the Kiryandongo District.'}
          </p>
        </div>

        <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          
          {/* Where the money goes */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-heading">Where The Money Goes</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Allocation']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {expensesData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }} />
                  <span className="text-sm text-gray-600 font-medium truncate">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Growth */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 font-heading">Funding Growth</h3>
              <TrendingUp className="text-emerald-500" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-6 text-center">
              {financials.revenueNote || 'Consistent growth in support allows us to expand our sustainable programs every year.'}
            </p>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-premium-soft border border-gray-100 relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-heading mb-3">
                {financials.reportsTitle || 'Annual Reports & Audits'}
              </h2>
              <p className="text-gray-600 max-w-xl">
                {financials.reportsDescription || 'Download our comprehensive annual reports and audited financial statements to see detailed breakdowns of our impact and operations.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {reportsData.map((report: any, index: number) => (
              <div key={index} className="group flex items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-500">PDF Document • {report.size || 'PDF'}</p>
                  </div>
                </div>
                {report.fileUrl && report.fileUrl !== '#' ? (
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors"
                    aria-label={`Download ${report.title}`}
                  >
                    <Download size={20} />
                  </a>
                ) : (
                  <button 
                    className="p-3 rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors" 
                    aria-label="Download Report" 
                    onClick={() => alert("Report download will begin shortly.")}
                  >
                    <Download size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Commitment to Transparency Callout */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent)] opacity-10"></div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              {financials.commitmentTitle || 'Committed to Transparency'}
            </h3>
            <p className="mb-8 text-emerald-50 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {financials.commitmentDescription || 'We believe in complete transparency about how donations are used and the impact we create. Our annual reports provide detailed breakdowns of our programs, finances, and outcomes.'}
            </p>
            <a
              href={financials.commitmentButtonLink || '#contact'}
              className="inline-block bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-50 hover:shadow-lg transition-all"
            >
              {financials.commitmentButtonText || 'Request More Information'}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
