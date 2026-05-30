import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function OpportunitiesTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowOpportunityForm } = props;
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const { items: opportunities, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteOpportunities, limit } = useAdminData('opportunities', 'opportunities', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Opportunities Management */}
            {activeTab === 'opportunities' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Target size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Opportunities <span className="text-sm font-normal text-purple-200">({opportunities.length})</span></h3>
                      <p className="text-sm text-purple-100 mt-1.5 opacity-80 font-medium">Manage volunteer opportunities</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingItem(null); setShowOpportunityForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-purple-700 hover:bg-purple-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Opportunity
                  </button>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white border border-gray-200 border-l-4 border-l-purple-500 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setEditingItem(opp); setShowOpportunityForm(true); }}
                    >
                      {/* Title + category */}
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-800 flex-1">{opp.title}</h4>
                        {opp.category && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap flex-shrink-0">{opp.category}</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-shrink-0">{opp.description}</p>

                      {/* Metadata pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {opp.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Globe size={11} className="text-slate-400" /> {opp.location}
                          </span>
                        )}
                        {opp.timeCommitment && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Clock size={11} className="text-slate-400" /> {opp.timeCommitment}
                          </span>
                        )}
                        {opp.openPositions != null && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Users size={11} className="text-slate-400" /> {opp.openPositions} spot{opp.openPositions !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Requirements */}
                      {opp.requirements?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Requirements</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.requirements.slice(0, 3).map((req: string, i: number) => (
                              <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-md px-2 py-0.5">{req}</span>
                            ))}
                            {opp.requirements.length > 3 && (
                              <span className="text-xs text-slate-400">+{opp.requirements.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Benefits */}
                      {opp.benefits?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Benefits</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.benefits.slice(0, 3).map((b: string, i: number) => (
                              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md px-2 py-0.5">{b}</span>
                            ))}
                            {opp.benefits.length > 3 && (
                              <span className="text-xs text-slate-400">+{opp.benefits.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingItem(opp); setShowOpportunityForm(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleBulkDeleteOpportunities([opp.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Target size={26} className="text-purple-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No opportunities yet</p>
                      <p className="text-xs text-gray-400">Create your first volunteer opportunity!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
