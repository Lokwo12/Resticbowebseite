import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, Badge, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function EventsTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowEventForm } = props;
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const { items: events, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteEvents, limit } = useAdminData('events', 'events', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Events Management */}
            {activeTab === 'events' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Calendar size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Events <span className="text-sm font-normal text-indigo-200">({totalCount})</span></h3>
                      <p className="text-sm text-indigo-100 mt-1.5 opacity-80 font-medium">Manage upcoming and past events</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowEventForm(true);
                    }}
                    className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Event
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 border-l-4 border-l-indigo-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(event);
                              setShowEventForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        {event.image && (
                          <img src={event.image} alt={event.title} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{event.title}</h4>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              event.status === 'upcoming' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                              event.status === 'ongoing' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                              event.status === 'completed' ? 'text-slate-600 bg-gray-50 border-gray-200' :
                              'text-red-600 bg-red-50 border-red-200'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"><Calendar size={11} /> {event.date}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">🕐 {event.time}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">📍 {event.location}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"><Users size={11} /> {event.capacity}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(event);
                              setShowEventForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleBulkDeleteEvents([event.id])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <Calendar size={26} className="text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No events yet</p>
                      <p className="text-xs text-gray-400">Create your first event to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
