import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, Badge, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw, BarChart3, Award } from 'lucide-react';
import { Button } from '../../ui/button';

export function ImpactStatsTab(props: any) {
  const { 
    news, setNews, selectedNews, setSelectedNews, handleBulkDeleteNews, handleDeleteNews, setShowNewsForm,
    gallery, setGallery, selectedGallery, setSelectedGallery, handleBulkDeleteGallery, handleDeleteGallery, setShowGalleryForm,
    team, setTeam, selectedTeam, setSelectedTeam, handleBulkDeleteTeam, handleDeleteTeam, setShowTeamForm,
    contacts, setContacts, selectedContacts, setSelectedContacts, handleBulkDeleteContacts, handleDeleteContact,
    volunteers, setVolunteers, selectedVolunteers, setSelectedVolunteers, handleBulkDeleteVolunteers, handleDeleteVolunteer,
    donations, setDonations, selectedDonations, setSelectedDonations, handleBulkDeleteDonations, handleDeleteDonation,
    subscribers, setSubscribers, selectedSubscribers, setSelectedSubscribers, handleBulkDeleteSubscribers, handleDeleteSubscriber,
    stories, setStories, selectedStories, setSelectedStories, handleBulkDeleteStories, handleDeleteStory, setShowStoryForm,
    events, setEvents, selectedEvents, setSelectedEvents, handleBulkDeleteEvents, handleDeleteEvent, setShowEventForm,
    partners, setPartners, selectedPartners, setSelectedPartners, handleBulkDeletePartners, handleDeletePartner, setShowPartnerForm,
    reports, setReports, selectedReports, setSelectedReports, handleBulkDeleteReports, handleDeleteReport, setShowReportForm,
    opportunities, setOpportunities, selectedOpportunities, setSelectedOpportunities, handleBulkDeleteOpportunities, handleDeleteOpportunity, setShowOpportunityForm,
    faqs, setFaqs, selectedFaqs, setSelectedFaqs, handleBulkDeleteFaqs, handleDeleteFaq, setShowFAQForm,
    resources, setResources, selectedResources, setSelectedResources, handleBulkDeleteResources, handleDeleteResource, setShowResourceForm,
    pages, setPages, selectedPages, setSelectedPages, handleBulkDeletePages, handleDeletePage, setShowPageForm,
    stats, setStats, analytics, setAnalytics,
    impactStats, setImpactStats,
    showImpactForm, setShowImpactForm,
    setEditingItem, setFormData, setViewingItem,
    activeTab, projectId, accessToken
  } = props;
  
  return (
    <React.Fragment>
            {/* Impact Stats Management */}
            {activeTab === 'impact' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <BarChart3 size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Impact Statistics</h3>
                      <p className="text-sm text-emerald-100 mt-1.5 opacity-80 font-medium">Update your organization's impact numbers</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowImpactForm(true)}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Edit size={16} className="mr-2" />
                    Update Stats
                  </Button>
                </div>

                {impactStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3">
                        <Users size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-700 mb-1">{impactStats?.peopleServed?.toLocaleString() || 0}</p>
                      <p className="text-xs font-medium text-gray-500">People Served</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
                        <FileText size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-blue-700 mb-1">{impactStats?.programsActive || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Active Programs</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center mx-auto mb-3">
                        <Heart size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-purple-700 mb-1">{impactStats?.volunteersActive || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Active Volunteers</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-green-700 mb-1">${impactStats?.fundsRaised?.toLocaleString() || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Funds Raised</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center mx-auto mb-3">
                        <Target size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-orange-600 mb-1">{impactStats?.communitiesReached || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Communities Reached</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center mx-auto mb-3">
                        <Award size={32} className="text-white" />
                      </div>
                      <p className="text-3xl font-bold text-teal-700 mb-1">{impactStats?.successRate || 0}%</p>
                      <p className="text-xs font-medium text-gray-500">Success Rate</p>
                    </div>
                  </div>
                )}
              </div>
            )}


    </React.Fragment>
  );
}
