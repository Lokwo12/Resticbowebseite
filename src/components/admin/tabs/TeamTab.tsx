import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function TeamTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowTeamForm } = props;
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const { items: team, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteTeam, limit } = useAdminData('team', 'team', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Team Management */}
            {activeTab === 'team' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Users size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Team Members <span className="text-sm font-normal text-teal-200">({totalCount})</span></h3>
                      <p className="text-sm text-teal-100 mt-1.5 opacity-80 font-medium">Manage your team</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingItem(null); setShowTeamForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Team Member
                  </button>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white border border-gray-200 border-l-4 border-l-teal-500 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-teal-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setEditingItem(member); setShowTeamForm(true); }}
                    >
                      {/* Avatar + name + role */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12 flex-shrink-0 shadow-sm border-2 border-white">
                          {member.image && <AvatarImage src={member.image} alt={member.name} />}
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-sm font-semibold">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{member.name}</h4>
                          <p className="text-xs text-teal-600 font-medium truncate">{member.role}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5">
                        {member.department && (
                          <p className="text-xs text-slate-500"><span className="font-medium text-slate-600">Dept:</span> {member.department}</p>
                        )}
                        {member.bio && (
                          <p className="text-xs text-slate-600 line-clamp-3">{member.bio}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingItem(member); setShowTeamForm(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleBulkDeleteTeam([member.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4">
                        <Users size={26} className="text-teal-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No team members yet</p>
                      <p className="text-xs text-gray-400">Add your first team member to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
