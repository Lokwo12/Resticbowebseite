import React, { useState } from 'react';
import { TrendingUp, Download, Trash2, Eye } from 'lucide-react';
import { Button } from '../../ui/button';
import { exportToCSV } from '../../../utils/csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function DonationsTab({ accessToken, projectId, setViewingItem }: any) {
  const queryClient = useQueryClient();
  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const fetchDonations = async () => {
    const offset = (page - 1) * limit;
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch donations');
    const data = await res.json();
    return data;
  };

  const { data = { donations: [], count: 0 }, isLoading } = useQuery({
    queryKey: ['donations', page],
    queryFn: fetchDonations,
    enabled: !!accessToken
  });

  const donations = data.donations || [];
  const totalCount = data.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const deleteMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      // Not an existing endpoint? The monolith had `handleBulkDeleteDonations` which deleted them one by one.
      // We can use Promise.all to delete one by one if there's no bulk endpoint.
      await Promise.all(keys.map(key => 
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations/${key.split(':')[1] || key}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('Donations deleted successfully');
      setSelectedDonations([]);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleDeleteDonation = (key: string) => {
    if (confirm('Are you sure you want to delete this donation record?')) {
      deleteMutation.mutate([key]);
    }
  };

  const handleBulkDeleteDonations = () => {
    if (confirm(`Are you sure you want to delete ${selectedDonations.length} donation records?`)) {
      deleteMutation.mutate(selectedDonations);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
      <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
            <TrendingUp size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Donations <span className="text-sm font-normal text-emerald-200">({totalCount})</span></h3>
            <p className="text-sm text-emerald-100 mt-1.5 opacity-80 font-medium">View donation records</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-emerald-100">Total Donations</p>
            <p className="text-2xl font-bold text-white">
              ${donations.reduce((sum: number, d: any) => sum + (d.value.amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => exportToCSV(donations.map((d: any) => d.value), 'donations.csv')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-sm text-white font-medium transition-colors"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {donations.length > 0 && (() => {
        const byMonth: Record<string, number> = {};
        donations.forEach((d: any) => {
          const month = new Date(d.value.created_at || d.value.timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          byMonth[month] = (byMonth[month] || 0) + (d.value.amount || 0);
        });
        const chartData = Object.entries(byMonth).map(([month, total]) => ({ month, total: parseFloat(total.toFixed(2)) }));
        return (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Donations by Month</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: any) => [`$${v}`, 'Total']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {selectedDonations.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="text-sm text-slate-700 leading-relaxed">{selectedDonations.length} selected</span>
          <Button onClick={handleBulkDeleteDonations} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 size={14} className="mr-1" /> Delete Selected
          </Button>
          <Button onClick={() => setSelectedDonations([])} variant="outline" size="sm">
            Clear Selection
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {donations.map((donation: any) => (
          <div key={donation.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-t-emerald-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:border-emerald-300 transition-all duration-300 shadow-sm">
            <input
              type="checkbox"
              checked={selectedDonations.includes(donation.key)}
              onChange={(e) => {
                if (e.target.checked) setSelectedDonations([...selectedDonations, donation.key]);
                else setSelectedDonations(selectedDonations.filter(id => id !== donation.key));
              }}
              className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 pl-6">
                  <h4 className="text-base font-semibold text-slate-800 tracking-tight">{donation.value.name}</h4>
                  <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                    ${donation.value.amount}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1 pl-6">{donation.value.email}</p>
                <p className="text-sm text-slate-700 leading-relaxed pl-6">Payment: {donation.value.payment_method}</p>
                <span className="text-xs text-gray-400 pl-6 block mt-2">
                  {new Date(donation.value.created_at || donation.value.timestamp).toLocaleString()}
                </span>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 pl-6 relative z-20">
                  <button onClick={() => setViewingItem(donation)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
                    <Eye size={13} /> View
                  </button>
                  <button onClick={() => handleDeleteDonation(donation.key)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {donations.length === 0 && (
          <div className="text-center py-24 col-span-full">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={26} className="text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No donations yet</p>
            <p className="text-xs text-gray-400">Donation records will appear here</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      page === num
                        ? 'z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
