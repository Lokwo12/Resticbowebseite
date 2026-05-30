import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, Badge, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function NewsTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowNewsForm } = props;
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const { items: news, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteNews, limit } = useAdminData('news', 'news', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* News Management */}
            {activeTab === 'news' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Newspaper size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">News Articles <span className="text-sm font-normal text-violet-200">({totalCount})</span></h3>
                      <p className="text-sm text-violet-100 mt-1.5 opacity-80 font-medium">Manage news and updates</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowNewsForm(true);
                    }}
                    className="bg-white text-violet-700 hover:bg-violet-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add News
                  </Button>
                </div>

                {selectedNews.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedNews.length} selected</span>
                    <Button
                      onClick={() => handleBulkDeleteNews(selectedNews)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Selected
                    </Button>
                    <Button onClick={() => setSelectedNews([])} variant="outline" size="sm">
                      Clear Selection
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {news.map((item) => (
                    <div key={item.key} className="bg-white border border-gray-200 border-l-4 border-l-violet-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-violet-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(item);
                              setFormData(item.value);
                              setShowNewsForm(true);
                            }}>
                      <input
                        type="checkbox"
                        checked={selectedNews.includes(item.key)}
                        onClick={(e) => e.stopPropagation()} onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNews([...selectedNews, item.key]);
                          } else {
                            setSelectedNews(selectedNews.filter(id => id !== item.key));
                          }
                        }}
                        className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      {item.value.image && (
                        <img src={item.value.image} alt={item.value.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                      )}
                      <div className="flex-1 pl-6">
                        <h4 className="text-base font-semibold text-slate-800 tracking-tight mb-1">{item.value.title}</h4>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                          {item.value.content?.replace(/<[^>]+>/g, '').slice(0, 120) || ''}
                        </p>
                        <span className="text-xs text-gray-400">
                          {(() => {
                            const dateStr = item.value.timestamp || item.value.created_at || item.value.publishDate || item.value.date;
                            if (!dateStr) return 'No Date';
                            const parsed = new Date(dateStr);
                            return isNaN(parsed.getTime()) ? 'No Date' : parsed.toLocaleDateString();
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData(item.value);
                            setShowNewsForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleBulkDeleteNews([item.key])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                        <Newspaper size={26} className="text-violet-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No news articles yet</p>
                      <p className="text-xs text-gray-400">Create your first article to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
