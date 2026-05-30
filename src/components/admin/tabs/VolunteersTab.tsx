import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';
import { exportToCSV } from '../../../utils/csv';

export function VolunteersTab(props: any) {
  const [volunteerFilter, setVolunteerFilter] = useState('all');
  const getFilteredVolunteers = () => { if (volunteerFilter === 'all') return volunteers; return volunteers.filter((v:any) => v.value?.status === volunteerFilter); };
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, handleUpdateVolunteerStatus } = props;
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const { items: volunteers, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteVolunteers, limit } = useAdminData('volunteers', 'volunteers', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Volunteers Management */}
            {activeTab === 'volunteers' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-rose-600 to-pink-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Heart size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Volunteer Applications <span className="text-sm font-normal text-rose-200">({volunteerFilter === 'all' ? totalCount : volunteers.filter((v:any) => v.value?.status === volunteerFilter).length})</span></h3>
                      <p className="text-sm text-rose-100 mt-1.5 opacity-80 font-medium">Manage volunteer registrations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToCSV(((volunteerFilter === 'all') ? volunteers : volunteers.filter((v:any) => v.value?.status === volunteerFilter)).map(v => v.value), 'volunteers.csv')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm text-white font-semibold transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Heart size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rose-700">{totalCount}</p>
                      <p className="text-xs text-rose-500 font-medium">Total</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">{volunteers.filter(v => v.value?.status === 'pending').length}</p>
                      <p className="text-xs text-amber-500 font-medium">Pending</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{volunteers.filter(v => v.value?.status === 'approved').length}</p>
                      <p className="text-xs text-emerald-500 font-medium">Approved</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{volunteers.filter(v => v.value?.status === 'rejected').length}</p>
                      <p className="text-xs text-red-400 font-medium">Rejected</p>
                    </div>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={volunteerFilter}
                    onChange={(e) => setVolunteerFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedVolunteers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">{selectedVolunteers.length} selected</span>
                    <button
                      onClick={() => handleBulkDeleteVolunteers(selectedVolunteers)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedVolunteers([])}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                )}

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {((volunteerFilter === 'all') ? volunteers : volunteers.filter((v:any) => v.value?.status === volunteerFilter)).map((volunteer) => (
                    <div key={volunteer.key} className="bg-white border border-gray-200 border-l-4 border-l-rose-400 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-rose-300 transition-all duration-300 shadow-sm flex flex-col group">

                      {/* Top: checkbox + avatar + name/badge */}
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.includes(volunteer.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVolunteers([...selectedVolunteers, volunteer.key]);
                            } else {
                              setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.key));
                            }
                          }}
                          className="mt-1 w-4 h-4 rounded flex-shrink-0 text-rose-600 focus:ring-rose-400"
                        />
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-rose-700">
                          {volunteer.value.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate mb-1.5">{volunteer.value.name}</h4>
                          <Badge className={
                            volunteer.value.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            volunteer.value.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }>
                            {volunteer.value.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5 pl-7">
                        <p className="text-xs text-slate-600 truncate">{volunteer.value.email}</p>
                        {volunteer.value.phone && (
                          <p className="text-xs text-slate-500">{volunteer.value.phone}</p>
                        )}
                        {volunteer.value.skills && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            <span className="font-medium text-slate-700">Skills:</span> {volunteer.value.skills}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Applied: {new Date(volunteer.value.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20">
                        <button
                          onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                        >
                          <X size={13} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleBulkDeleteVolunteers([volunteer.key])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {((volunteerFilter === 'all') ? volunteers : volunteers.filter((v:any) => v.value?.status === volunteerFilter)).length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                        <Heart size={26} className="text-rose-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No volunteer applications</p>
                      <p className="text-xs text-gray-400">
                        {volunteerFilter !== 'all' ? 'No applications match this filter' : 'Applications will appear here when submitted'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
