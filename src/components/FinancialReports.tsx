import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, TrendingUp, ShieldCheck } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useScrollAnimation } from '../utils/animations';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const MOCK_EXPENSES = [
  { name: 'Program Services', value: 75 },
  { name: 'Community Grants', value: 15 },
  { name: 'Management & General', value: 7 },
  { name: 'Fundraising', value: 3 },
];

const MOCK_REVENUE = [
  { year: '2022', revenue: 120000 },
  { year: '2023', revenue: 180000 },
  { year: '2024', revenue: 250000 },
  { year: '2025', revenue: 310000 },
];

const REPORTS = [
  { year: '2025', title: 'Q1 Impact & Financial Summary', size: '2.4 MB' },
  { year: '2024', title: 'Annual Report & Audited Financials', size: '5.1 MB' },
  { year: '2023', title: 'Annual Report & Audited Financials', size: '4.8 MB' },
  { year: '2022', title: 'Annual Report & Audited Financials', size: '3.9 MB' },
];

export function FinancialReports() {
  const [settings, setSettings] = useState<any>(null);
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
        setSettings(data.settings?.general || {});
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 animate-[fadeInDown_0.8s_ease-out]">
          <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <ShieldCheck size={14} />
            Transparency
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            Financial Transparency
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We believe in complete transparency. See exactly how your contributions are making a difference in the Kiryandongo District.
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
                    data={MOCK_EXPENSES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {MOCK_EXPENSES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              {MOCK_EXPENSES.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm text-gray-600 font-medium">{item.name} ({item.value}%)</span>
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
                <BarChart data={MOCK_REVENUE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(val) => `$${val / 1000}k`}
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
              Consistent growth in support allows us to expand our sustainable programs every year.
            </p>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-premium-soft border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-heading mb-3">Annual Reports & Audits</h2>
              <p className="text-gray-600 max-w-xl">
                Download our comprehensive annual reports and audited financial statements to see detailed breakdowns of our impact and operations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {REPORTS.map((report) => (
              <div key={report.year} className="group flex items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-500">PDF Document • {report.size}</p>
                  </div>
                </div>
                <button className="p-3 rounded-full text-emerald-600 hover:bg-emerald-50 transition-colors" aria-label="Download Report" onClick={() => alert("Report download will begin shortly.")}>
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
