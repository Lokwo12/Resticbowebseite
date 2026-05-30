import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, Badge, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function GalleryTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowGalleryForm } = props;
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const { items: gallery, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteGallery, limit } = useAdminData('gallery', 'gallery', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Gallery Management */}
            {activeTab === 'gallery' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <ImageIcon size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Gallery <span className="text-sm font-normal text-amber-100">({totalCount})</span></h3>
                      <p className="text-sm text-amber-100 mt-1.5 opacity-80 font-medium">Manage images and media</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowGalleryForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-amber-700 hover:bg-amber-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Image
                  </button>
                </div>

                {/* Bulk Actions */}
                {selectedGallery.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">{selectedGallery.length} selected</span>
                    <button
                      onClick={() => handleBulkDeleteGallery(selectedGallery)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedGallery([])}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                )}

                {/* Image grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div
                      key={item.key}
                      className="bg-white border border-gray-200 border-l-4 border-l-amber-400 rounded-xl hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col overflow-hidden"
                      onClick={() => { setEditingItem(item); setFormData({ ...item.value, image: item.value.imageUrl || item.value.image }); setShowGalleryForm(true); }}
                    >
                      <div className="relative">
                        <img src={item.value.imageUrl || item.value.image} alt={item.value.title} className="w-full h-40 object-cover" />
                        <input
                          type="checkbox"
                          checked={selectedGallery.includes(item.key)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGallery([...selectedGallery, item.key]);
                            } else {
                              setSelectedGallery(selectedGallery.filter(id => id !== item.key));
                            }
                          }}
                          className="absolute top-2 left-2 z-10 w-4 h-4 rounded text-amber-600 focus:ring-amber-400"
                        />
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h4 className="text-xs font-semibold text-slate-800 truncate mb-1">{item.value.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 flex-1">{item.value.description}</p>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingItem(item); setFormData({ ...item.value, image: item.value.imageUrl || item.value.image }); setShowGalleryForm(true); }}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleBulkDeleteGallery([item.key])}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={26} className="text-amber-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No images yet</p>
                      <p className="text-xs text-gray-400">Upload your first image to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
