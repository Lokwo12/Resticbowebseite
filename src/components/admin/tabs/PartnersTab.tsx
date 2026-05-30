import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';

export function PartnersTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowPartnerForm } = props;
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const { items: partners, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeletePartners, limit } = useAdminData('partners', 'partners', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Partners Management */}
            {activeTab === 'partners' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Handshake size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Partners <span className="text-sm font-normal text-amber-100">({totalCount})</span></h3>
                      <p className="text-sm text-amber-100 mt-1.5 opacity-80 font-medium">Manage partner organizations</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowPartnerForm(true);
                    }}
                    className="bg-white text-amber-700 hover:bg-amber-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Partner
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {partners.map((partner) => (
                    <div key={partner.id} className="bg-white border border-gray-200 border-l-4 border-l-amber-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                      setEditingItem(partner);
                      setShowPartnerForm(true);
                    }}>
                      <div className="flex-1">
                        {partner.logo && (
                          <img src={partner.logo} alt={partner.name} className="h-14 w-auto mb-3 object-contain" />
                        )}
                        <h4 className="text-base font-semibold text-slate-800 tracking-tight mb-1">{partner.name}</h4>
                        {partner.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{partner.description}</p>
                        )}
                        {partner.website && (
                          <span className="text-xs text-amber-600 mt-1 block truncate">{partner.website}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(partner);
                            setShowPartnerForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleBulkDeletePartners([partner.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {totalCount === 0 && (
                    <div className="col-span-full text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                        <Handshake size={26} className="text-amber-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No partners yet</p>
                      <p className="text-xs text-gray-400">Add your first partner organization!</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
