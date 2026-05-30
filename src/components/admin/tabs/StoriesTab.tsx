import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function StoriesTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowStoryForm } = props;
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const { items: stories, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteStories, limit } = useAdminData('stories', 'stories', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Stories Management */}
            {activeTab === 'stories' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <MessageSquare size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Impact Stories <span className="text-sm font-normal text-orange-100">({totalCount})</span></h3>
                      <p className="text-sm text-orange-100 mt-1.5 opacity-80 font-medium">Share success stories and testimonials</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowStoryForm(true);
                    }}
                    className="bg-white text-orange-700 hover:bg-orange-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Story
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {stories.map((story) => (
                    <div key={story.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-orange-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(story);
                              setShowStoryForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        {story.image && (
                          <img src={story.image} alt={story.name} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{story.title}</h4>
                            <Badge className="bg-orange-50 text-orange-700 border-orange-100">{story.category}</Badge>
                          </div>
                          <p className="text-sm text-emerald-600 mb-2">{story.name}</p>
                          <div className="text-sm text-slate-600 prose prose-sm" dangerouslySetInnerHTML={{ __html: story.story?.substring(0, 150) + '...' }} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(story);
                              setShowStoryForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleBulkDeleteStories([story.id])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={26} className="text-orange-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No impact stories yet</p>
                      <p className="text-xs text-gray-400">Share your first success story!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
