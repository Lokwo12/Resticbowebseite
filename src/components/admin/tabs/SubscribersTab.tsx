import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw, Search, Check, Copy } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { useAdminData } from '../../../hooks/useAdminData';
import { useState } from 'react';
import { toast } from 'sonner';
import { exportToCSV } from '../../../utils/csv';
import { SiteSettingsTab } from '../../SiteSettingsTab';

export function SubscribersTab(props: any) {
  const {
    activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem,
    userRole, adminUsers,
    userFilter, setUserFilter,
    userRoleFilter, setUserRoleFilter,
    searchQuery, setSearchQuery,
    selectedUsers, setSelectedUsers,
    getFilteredUsers,
    handleBulkDeleteUsers, handleBulkUpdateUserRole, handleBulkUpdateUserStatus,
    setShowUserForm, setUserFormData,
    siteSettings, loadData,
    USER_ROLES,
  } = props;

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'editor': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-slate-700 border-gray-300';
    }
  };

  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const { items: subscribers, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDeleteSubscribers, limit } = useAdminData('newsletter', 'subscribers', accessToken, projectId);

  const handleSendNewsletter = async () => {
    if (totalCount === 0) { toast.error('Cannot send newsletter: You have 0 subscribers currently.'); return; }
    if (!newsletterSubject.trim()) { toast.error('Please enter a subject line for your newsletter.'); return; }
    if (!newsletterBody.trim()) { toast.error('Please enter the email body content.'); return; }
    setSendingNewsletter(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/newsletter/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({
            subject: newsletterSubject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">${newsletterBody.replace(/\n/g, '<br>')}</div>`
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send');
      toast.success(`Newsletter sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}`);
      setNewsletterSubject('');
      setNewsletterBody('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send newsletter');
    } finally {
      setSendingNewsletter(false);
    }
  };
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  
  return (
    <React.Fragment>
            {/* Subscribers Management */}
            {activeTab === 'subscribers' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Send size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Newsletter Subscribers <span className="text-sm font-normal text-indigo-200">({totalCount})</span></h3>
                      <p className="text-sm text-indigo-100 mt-1.5 opacity-80 font-medium">Manage newsletter subscribers and send blasts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToCSV(subscribers.map(s => s.value), 'subscribers.csv')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm text-white font-semibold transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">{totalCount}</p>
                      <p className="text-xs text-indigo-500 font-medium">Total Subscribers</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{totalCount}</p>
                      <p className="text-xs text-emerald-500 font-medium">Active</p>
                    </div>
                  </div>
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Send size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-violet-700">
                        {totalCount > 0
                          ? new Date(Math.max(...subscribers.map(s => new Date(s.value.created_at || 0).getTime()))).toLocaleDateString()
                          : '—'}
                      </p>
                      <p className="text-xs text-violet-500 font-medium">Latest Signup</p>
                    </div>
                  </div>
                </div>

                {/* Newsletter Blast Compose */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Send size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Send Newsletter Blast</h4>
                      <p className="text-xs text-gray-500">Compose and send to all {totalCount} subscriber{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject Line *</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly Update — May 2026"
                        value={newsletterSubject}
                        onChange={e => setNewsletterSubject(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-600">Message Body *</label>
                        <span className="text-xs text-gray-400">{newsletterBody.length} chars</span>
                      </div>
                      <textarea
                        placeholder="Write your newsletter message here (plain text)..."
                        value={newsletterBody}
                        onChange={e => setNewsletterBody(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSendNewsletter}
                      disabled={sendingNewsletter || totalCount === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-[1.01]"
                    >
                      <Send size={15} />
                      {sendingNewsletter ? 'Sending...' : `Send to ${totalCount} subscriber${totalCount !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>

                {/* Search + Bulk Actions */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by email..."
                        value={subscriberSearch}
                        onChange={e => setSubscriberSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white transition-all"
                      />
                    </div>
                    {selectedSubscribers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 font-medium">{selectedSubscribers.length} selected</span>
                        <button
                          onClick={() => handleBulkDeleteSubscribers(selectedSubscribers)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete Selected
                        </button>
                        <button
                          onClick={() => setSelectedSubscribers([])}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                        >
                          <X size={13} />
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subscriber list */}
                  <div className="space-y-2">
                    {subscribers
                      .filter(s => !subscriberSearch || s.value.email?.toLowerCase().includes(subscriberSearch.toLowerCase()))
                      .map((subscriber) => (
                        <div key={subscriber.key} className="bg-white border border-gray-200 border-l-4 border-l-indigo-400 rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedSubscribers.includes(subscriber.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubscribers(prev => [...prev, subscriber.key]);
                                } else {
                                  setSelectedSubscribers(prev => prev.filter(k => k !== subscriber.key));
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                            />
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <Mail size={14} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{subscriber.value.email}</p>
                              <p className="text-xs text-gray-400">
                                Subscribed: {subscriber.value.created_at ? new Date(subscriber.value.created_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">Active</span>
                            <button
                              title="Copy email"
                              onClick={() => { navigator.clipboard.writeText(subscriber.value.email); toast.success('Email copied'); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleBulkDeleteSubscribers([subscriber.key])}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    {subscribers.filter(s => !subscriberSearch || s.value.email?.toLowerCase().includes(subscriberSearch.toLowerCase())).length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                          <Send size={26} className="text-indigo-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mb-1">
                          {subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {subscriberSearch ? 'Try a different search term' : 'Subscribers will appear here when they sign up'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Management - Super Admin Only */}
            {activeTab === 'users' && userRole === 'super-admin' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Shield size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">User Management <span className="text-sm font-normal text-slate-300">({getFilteredUsers().length})</span></h3>
                      <p className="text-sm text-slate-300 mt-1.5 opacity-80 font-medium">Manage admin users and permissions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setUserFormData({ name: '', email: '', password: '', role: 'viewer', status: 'active' });
                      setShowUserForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-slate-800 hover:bg-slate-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add User
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-700">{adminUsers.length}</p>
                      <p className="text-xs text-slate-500 font-medium">Total Users</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{adminUsers.filter(u => u.value?.status === 'active').length}</p>
                      <p className="text-xs text-emerald-500 font-medium">Active</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">{adminUsers.filter(u => u.value?.status === 'pending').length}</p>
                      <p className="text-xs text-amber-500 font-medium">Pending</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{adminUsers.filter(u => u.value?.status === 'suspended').length}</p>
                      <p className="text-xs text-red-400 font-medium">Suspended</p>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 bg-white transition-all"
                    />
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700"
                  >
                    <option value="all">All Roles</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">{selectedUsers.length} selected</span>
                    <button
                      onClick={() => handleBulkDeleteUsers(selectedUsers)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Selected
                    </button>
                    <select
                      onChange={(e) => { if (e.target.value) { handleBulkUpdateUserRole(selectedUsers, e.target.value); e.target.value = ''; } }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">Change Role…</option>
                      <option value="super-admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <select
                      onChange={(e) => { if (e.target.value) { handleBulkUpdateUserStatus(selectedUsers, e.target.value); e.target.value = ''; } }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">Change Status…</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                )}

                {/* User cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {getFilteredUsers().map((user) => (
                    <div
                      key={user.key}
                      className="bg-white border border-gray-200 border-l-4 border-l-slate-400 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setViewingItem(user); if (props.setShowPasswordResetDialog) props.setShowPasswordResetDialog(true); }}
                    >
                      {/* Avatar + name + badges */}
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.key)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.key]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.key));
                            }
                          }}
                          className="mt-1 w-4 h-4 rounded flex-shrink-0 text-slate-600 focus:ring-slate-500"
                        />
                        <Avatar className="h-12 w-12 flex-shrink-0 shadow-sm border-2 border-white">
                          <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-700 text-white text-sm font-semibold">
                            {getUserInitials(user.value.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate mb-1.5">{user.value.name}</h4>
                          <div className="flex flex-wrap gap-1">
                            <Badge className={getRoleBadgeColor(user.value.role)}>
                              {USER_ROLES.find(r => r.value === user.value.role)?.label}
                            </Badge>
                            <Badge className={
                              user.value.status === 'active'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : user.value.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : user.value.status === 'suspended'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-gray-100 text-slate-600 border-gray-200'
                            }>
                              {user.value.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5 pl-7">
                        <p className="text-sm text-slate-600 truncate">{user.value.email}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(user.value.created_at || user.value.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(user);
                            setUserFormData({
                              name: user.value.name,
                              email: user.value.email,
                              password: '',
                              role: user.value.role,
                              status: user.value.status
                            });
                            setShowUserForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => { setViewingItem(user); if (props.setShowPasswordResetDialog) props.setShowPasswordResetDialog(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          <Shield size={13} />
                          Reset PW
                        </button>
                        <button
                          onClick={() => handleBulkDeleteUsers([user.value.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {getFilteredUsers().length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                        <Shield size={26} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No users found</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery || userFilter !== 'all' || userRoleFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first admin user to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <SiteSettingsTab settings={siteSettings} onUpdate={loadData} />
            )}


    </React.Fragment>
  );
}
