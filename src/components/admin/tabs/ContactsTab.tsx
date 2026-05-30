import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw, Reply } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';
import { exportToCSV } from '../../../utils/csv';

export function ContactsTab(props: any) {
  const [contactFilter, setContactFilter] = useState('all');
  const getFilteredContacts = () => { if (contactFilter === 'all') return props.contacts; return props.contacts.filter((c:any) => c.value?.status === contactFilter); };
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, handleUpdateContactStatus } = props;
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const { items: contacts, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteContacts, limit } = useAdminData('contacts', 'contacts', accessToken, projectId);
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Contacts Management */}
            {activeTab === 'contacts' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Mail size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Contact Messages <span className="text-sm font-normal text-sky-200">({((contactFilter === 'all') ? contacts : contacts.filter((c:any) => c.value?.status === contactFilter)).length})</span></h3>
                      <p className="text-sm text-sky-100 mt-1.5 opacity-80 font-medium">Manage incoming messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm text-white"
                    >
                      <option value="all" className="text-slate-800 tracking-tight">All Status</option>
                      <option value="new" className="text-slate-800 tracking-tight">New</option>
                      <option value="read" className="text-slate-800 tracking-tight">Read</option>
                      <option value="responded" className="text-slate-800 tracking-tight">Responded</option>
                    </select>
                    <button
                      onClick={() => exportToCSV(((contactFilter === 'all') ? contacts : contacts.filter((c:any) => c.value?.status === contactFilter)).map(c => c.value), 'contacts.csv')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </div>

                {selectedContacts.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedContacts.length} selected</span>
                    <Button
                      onClick={() => handleBulkDeleteContacts(selectedContacts)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Selected
                    </Button>
                    <Button onClick={() => setSelectedContacts([])} variant="outline" size="sm">
                      Clear Selection
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {((contactFilter === 'all') ? contacts : contacts.filter((c:any) => c.value?.status === contactFilter)).map((contact) => (
                    <div key={contact.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-sky-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-sky-300 transition-all duration-300 shadow-sm">
                      <div className="flex flex-col h-full gap-5">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.key)}
                           onClick={(e) => e.stopPropagation()} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts([...selectedContacts, contact.key]);
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.key));
                            }
                          }}
                          className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-slate-800 tracking-tight">{contact.value.name}</h4>
                            <Badge className={
                              contact.value.status === 'new' ? 'bg-blue-100 text-blue-700' :
                              contact.value.status === 'read' ? 'bg-gray-100 text-slate-700 leading-relaxed' :
                              'bg-green-100 text-green-700'
                            }>
                              {contact.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{contact.value.email}</p>
                          <p className="text-sm text-slate-700 leading-relaxed mb-2">{contact.value.message}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(contact.value.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setViewingItem(contact)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                          >
                            <Eye size={13} />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setViewingItem(contact);
                              handleUpdateContactStatus(contact.key, 'read');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <Reply size={13} />
                            Reply
                          </button>
                          <button
                            onClick={() => handleBulkDeleteContacts([contact.key])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {((contactFilter === 'all') ? contacts : contacts.filter((c:any) => c.value?.status === contactFilter)).length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
                        <Mail size={26} className="text-sky-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No contact messages</p>
                      <p className="text-xs text-gray-400">Messages will appear here when received</p>
                    </div>
                  )}
                </div>
              </div>
            )}


    </React.Fragment>
  );
}
