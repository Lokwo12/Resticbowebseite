import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Heart, BookOpen, DollarSign, MapPin, 
  ShieldCheck, Award, Target, Plus, Trash2, Save, RefreshCw, 
  ExternalLink, Sparkles, CheckCircle2, Info, AlertCircle, FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export interface ImpactHighlight {
  id: string;
  title: string;
  description: string;
  metric: string;
}

export interface SettlementZone {
  id: string;
  name: string;
  description: string;
  beneficiaries: string;
}

export interface FullImpactData {
  // Page Header
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  
  // Core Metrics
  peopleServed: number;
  peopleServedLabel: string;
  peopleServedBadge: string;

  programsActive: number;
  programsActiveLabel: string;
  programsActiveBadge: string;

  volunteersActive: number;
  volunteersActiveLabel: string;
  volunteersActiveBadge: string;

  fundsRaised: number;
  fundsRaisedLabel: string;
  fundsRaisedBadge: string;

  communitiesReached: number;
  communitiesReachedLabel: string;
  communitiesReachedBadge: string;

  successRate: number;
  successRateLabel: string;
  successRateBadge: string;

  // Fundraising progress campaign
  fundraisingGoal: number;
  fundraisingCampaign: string;
  fundraisingTitle: string;
  fundraisingDescription: string;

  // Highlights / Key Achievements
  highlightsTitle: string;
  highlightsSubtitle: string;
  highlights: ImpactHighlight[];

  // Field Coverage
  zonesTitle: string;
  zonesSubtitle: string;
  zones: SettlementZone[];

  // Call to Action
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export const DEFAULT_IMPACT_DATA: FullImpactData = {
  heroBadge: 'Verified Community Impact',
  heroTitle: 'Live Impact & Accountability Dashboard',
  heroSubtitle: 'Tracking real, measurable outcomes across refugee settlements and host communities in Kiryandongo District, Uganda.',
  
  peopleServed: 24850,
  peopleServedLabel: 'People Directly Supported',
  peopleServedBadge: 'Refugees & host community members',

  programsActive: 6,
  programsActiveLabel: 'Active Flagship Programs',
  programsActiveBadge: 'Livelihoods, Education, WASH & Health',

  volunteersActive: 145,
  volunteersActiveLabel: 'Community Volunteers',
  volunteersActiveBadge: 'Local peer educators & village coordinators',

  fundsRaised: 310000000,
  fundsRaisedLabel: 'Program Funds Mobilized (UGX)',
  fundsRaisedBadge: '90% directly deployed to field projects',

  communitiesReached: 18,
  communitiesReachedLabel: 'Settlement Zones Reached',
  communitiesReachedBadge: 'Across Kiryandongo District',

  successRate: 97,
  successRateLabel: 'Program Success Rate',
  successRateBadge: 'Verified milestone completion',

  fundraisingGoal: 450000000,
  fundraisingCampaign: 'Community Resilience Fund',
  fundraisingTitle: 'Support RESTI’s Community Impact',
  fundraisingDescription: 'Your support helps RESTI CBO strengthen livelihoods, skills development, WASH, environmental protection, and community-led initiatives in Kiryandongo District, Uganda.',

  highlightsTitle: 'Where Your Support Creates Change',
  highlightsSubtitle: 'Simple, tangible results delivered directly into the hands of families who need it most in Kiryandongo.',
  highlights: [
    {
      id: 'hl-1',
      title: 'Clean Water & Boreholes',
      description: 'Rehabilitating community boreholes and water distribution stations to provide safe, clean water for thousands daily.',
      metric: '12 Boreholes Restored'
    },
    {
      id: 'hl-2',
      title: 'Women Livelihoods & Tailoring',
      description: 'Providing hands-on vocational tailoring certification, sewing machines, and seed capital for refugee single mothers.',
      metric: '180+ Women Certified'
    },
    {
      id: 'hl-3',
      title: 'Youth Education & Digital Skills',
      description: 'Equipping adolescents with digital computer literacy, exam fees, scholastic materials, and academic mentorship.',
      metric: '850+ Students Supported'
    },
    {
      id: 'hl-4',
      title: 'Village Savings & Loans (VSLA)',
      description: 'Grassroots micro-savings circles giving families the financial tools to launch self-sustaining micro-businesses.',
      metric: '42 Savings Circles'
    }
  ],

  zonesTitle: 'Our Field Settlement Zones',
  zonesSubtitle: 'RESTI works on the ground directly inside settlement clusters and host villages in Kiryandongo District.',
  zones: [
    {
      id: 'z-1',
      name: 'Ranch 1 Settlement Clusters',
      description: 'Village savings circles, climate-smart agriculture tools, and seed distributions for refugee households.',
      beneficiaries: '7,400+ Supported'
    },
    {
      id: 'z-2',
      name: 'Ranch 37 Settlement Zones',
      description: 'Deep borehole water access points, sanitation kits, and preventive community health training.',
      beneficiaries: '5,900+ Supported'
    },
    {
      id: 'z-3',
      name: 'Bweyale Town & Host Hubs',
      description: 'Youth digital inclusion center, secondary school scholarships, and cross-community peace sporting events.',
      beneficiaries: '6,800+ Supported'
    },
    {
      id: 'z-4',
      name: 'Panyadoli Hills & Environs',
      description: 'Women tailoring micro-cooperatives, counseling desks, and peaceful coexistence community dialogues.',
      beneficiaries: '4,750+ Supported'
    }
  ],

  ctaTitle: 'Support Our Community Programs',
  ctaSubtitle: 'Every contribution goes directly to empowering refugees and host families in Kiryandongo District.',
  ctaButtonText: 'Donate Now',
  ctaButtonLink: '/donate'
};

interface ImpactDashboardManagerProps {
  impactStats?: any;
  onUpdate?: () => void;
  accessToken?: string;
  userRole?: string;
}

export function ImpactDashboardManager({ impactStats, onUpdate, accessToken, userRole }: ImpactDashboardManagerProps) {
  const [formData, setFormData] = useState<FullImpactData>(DEFAULT_IMPACT_DATA);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'hero' | 'highlights' | 'zones' | 'campaign'>('metrics');

  useEffect(() => {
    if (impactStats) {
      setFormData(prev => ({
        ...prev,
        ...impactStats,
        highlights: Array.isArray(impactStats.highlights) && impactStats.highlights.length > 0 
          ? impactStats.highlights 
          : prev.highlights,
        zones: Array.isArray(impactStats.zones) && impactStats.zones.length > 0 
          ? impactStats.zones 
          : prev.zones
      }));
    }
  }, [impactStats]);

  const handleNumberChange = (field: keyof FullImpactData, val: string) => {
    const num = parseInt(val, 10);
    setFormData(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const handleSave = async () => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to modify settings.');
      return;
    }
    setSaving(true);
    try {
      // 1. Save to impact-stats endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/impact-stats`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${accessToken || publicAnonKey}` 
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        let errMsg = 'Failed to save impact dashboard settings';
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.details || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      toast.success('Live Impact Dashboard updated successfully!', {
        description: 'All changes are now active on the public website.'
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update impact dashboard');
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    const newHighlight: ImpactHighlight = {
      id: `hl-${Date.now()}`,
      title: 'New Achievement',
      description: 'Describe the outcome or services delivered in Kiryandongo...',
      metric: '100+ Beneficiaries'
    };
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight]
    }));
  };

  const updateHighlight = (index: number, field: keyof ImpactHighlight, value: string) => {
    const updated = [...formData.highlights];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, highlights: updated }));
  };

  const deleteHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const addZone = () => {
    const newZone: SettlementZone = {
      id: `z-${Date.now()}`,
      name: 'New Settlement Zone',
      description: 'Summary of ongoing activities in this settlement area...',
      beneficiaries: '1,000+ Supported'
    };
    setFormData(prev => ({
      ...prev,
      zones: [...prev.zones, newZone]
    }));
  };

  const updateZone = (index: number, field: keyof SettlementZone, value: string) => {
    const updated = [...formData.zones];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, zones: updated }));
  };

  const deleteZone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm shrink-0">
            <BarChart3 size={30} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">Live Impact Dashboard</h3>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 opacity-90 font-medium">
              Manage numbers, highlights, settlement zones, and content shown on <span className="underline font-mono">/impact-dashboard</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="/impact-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs md:text-sm font-semibold text-white border border-white/20 transition-all cursor-pointer"
          >
            <span>View Live Page</span>
            <ExternalLink size={14} />
          </a>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial bg-white text-emerald-800 hover:bg-emerald-50 shadow-md font-bold px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
          >
            <Save size={16} className={saving ? 'animate-spin mr-2' : 'mr-2'} />
            {saving ? 'Saving Changes...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* ── NAVIGATION PILLS ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Key Impact Metrics (6)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Page Header & Intro
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('highlights')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'highlights'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Impact Highlights ({formData.highlights.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Settlement Zones ({formData.zones.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'campaign'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Call to Action & Campaign
        </button>
      </div>

      {/* ── TAB 1: KEY METRICS ── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Key Numerical Impact Stats</h4>
              <p className="text-xs text-slate-500">Edit the 6 high-level numbers, labels, and explanatory notes shown at the top of the dashboard.</p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200">
              6 Core Counters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Metric 1: People Served */}
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                <Users size={18} />
                <span>1. People Served</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number Count</label>
                <input
                  type="number"
                  min={0}
                  value={formData.peopleServed}
                  onChange={(e) => handleNumberChange('peopleServed', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.peopleServedLabel}
                  onChange={(e) => setFormData({ ...formData, peopleServedLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="People Directly Supported"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.peopleServedBadge}
                  onChange={(e) => setFormData({ ...formData, peopleServedBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Refugees & host community members"
                />
              </div>
            </div>

            {/* Metric 2: Active Programs */}
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-700 font-bold text-sm">
                <BookOpen size={18} />
                <span>2. Active Programs</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number Count</label>
                <input
                  type="number"
                  min={0}
                  value={formData.programsActive}
                  onChange={(e) => handleNumberChange('programsActive', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.programsActiveLabel}
                  onChange={(e) => setFormData({ ...formData, programsActiveLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Active Flagship Programs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.programsActiveBadge}
                  onChange={(e) => setFormData({ ...formData, programsActiveBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Livelihoods, Education, WASH & Health"
                />
              </div>
            </div>

            {/* Metric 3: Active Volunteers */}
            <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
              <div className="flex items-center gap-2.5 text-purple-700 font-bold text-sm">
                <Heart size={18} />
                <span>3. Community Volunteers</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number Count</label>
                <input
                  type="number"
                  min={0}
                  value={formData.volunteersActive}
                  onChange={(e) => handleNumberChange('volunteersActive', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.volunteersActiveLabel}
                  onChange={(e) => setFormData({ ...formData, volunteersActiveLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Community Volunteers"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.volunteersActiveBadge}
                  onChange={(e) => setFormData({ ...formData, volunteersActiveBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Local peer coordinators"
                />
              </div>
            </div>

            {/* Metric 4: Funds Raised */}
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
              <div className="flex items-center gap-2.5 text-teal-700 font-bold text-sm">
                <DollarSign size={18} />
                <span>4. Program Funds Mobilized</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (in UGX)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.fundsRaised}
                  onChange={(e) => handleNumberChange('fundsRaised', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">E.g. 310,000,000 UGX (~$82,500 USD)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.fundsRaisedLabel}
                  onChange={(e) => setFormData({ ...formData, fundsRaisedLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Program Funds Mobilized"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.fundsRaisedBadge}
                  onChange={(e) => setFormData({ ...formData, fundsRaisedBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="90% directly deployed to field projects"
                />
              </div>
            </div>

            {/* Metric 5: Settlement Zones */}
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-700 font-bold text-sm">
                <MapPin size={18} />
                <span>5. Communities Reached</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number Count</label>
                <input
                  type="number"
                  min={0}
                  value={formData.communitiesReached}
                  onChange={(e) => handleNumberChange('communitiesReached', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.communitiesReachedLabel}
                  onChange={(e) => setFormData({ ...formData, communitiesReachedLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Settlement Zones Reached"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.communitiesReachedBadge}
                  onChange={(e) => setFormData({ ...formData, communitiesReachedBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Across Kiryandongo District"
                />
              </div>
            </div>

            {/* Metric 6: Success Rate */}
            <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100 space-y-3">
              <div className="flex items-center gap-2.5 text-green-700 font-bold text-sm">
                <Award size={18} />
                <span>6. Program Success Rate (%)</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Percentage (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.successRate}
                  onChange={(e) => handleNumberChange('successRate', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Label</label>
                <input
                  type="text"
                  value={formData.successRateLabel}
                  onChange={(e) => setFormData({ ...formData, successRateLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Program Success Rate"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Badge / Note</label>
                <input
                  type="text"
                  value={formData.successRateBadge}
                  onChange={(e) => setFormData({ ...formData, successRateBadge: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Verified milestone completion"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HERO & INTRO ── */}
      {activeTab === 'hero' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Page Header & Introductory Text</h4>
            <p className="text-xs text-slate-500">Configure the top banner headline, badge text, and introductory statement on the impact page.</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Top Status Badge</label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-medium"
                placeholder="Verified Community Impact"
              />
              <p className="text-[11px] text-slate-400 mt-1">Displays with a glowing green pulse dot at the very top of the page.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Page Headline / Title</label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900"
                placeholder="Live Impact & Accountability Dashboard"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Introductory Subtitle / Description</label>
              <textarea
                rows={3}
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed"
                placeholder="Tracking real, measurable outcomes across refugee settlements and host communities in Kiryandongo District, Uganda."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: IMPACT HIGHLIGHTS ── */}
      {activeTab === 'highlights' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Key Impact Highlights / Tangible Results</h4>
              <p className="text-xs text-slate-500">Showcase 3 to 4 specific tangible results (such as clean water boreholes, tailoring cohorts, or school bursaries).</p>
            </div>
            <Button
              type="button"
              onClick={addHighlight}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl w-fit"
            >
              <Plus size={15} className="mr-1.5" />
              Add Highlight
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Heading</label>
              <input
                type="text"
                value={formData.highlightsTitle}
                onChange={(e) => setFormData({ ...formData, highlightsTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Where Your Support Creates Change"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Subtitle</label>
              <input
                type="text"
                value={formData.highlightsSubtitle}
                onChange={(e) => setFormData({ ...formData, highlightsSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800"
                placeholder="Simple, tangible results delivered directly into the hands of families."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.highlights.map((hl, index) => (
              <div key={hl.id || index} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 relative hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Highlight #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteHighlight(index)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Delete highlight"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={hl.title}
                    onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                    placeholder="e.g. Clean Water & Boreholes"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Key Result / Stat Tag</label>
                  <input
                    type="text"
                    value={hl.metric}
                    onChange={(e) => updateHighlight(index, 'metric', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                    placeholder="e.g. 12 Boreholes Restored"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={hl.description}
                    onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed"
                    placeholder="Brief description of the work and who benefits..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: SETTLEMENT ZONES ── */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Field Settlement Zones (Kiryandongo District)</h4>
              <p className="text-xs text-slate-500">Manage the settlement areas and community trading centres where RESTI operates.</p>
            </div>
            <Button
              type="button"
              onClick={addZone}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl w-fit"
            >
              <Plus size={15} className="mr-1.5" />
              Add Settlement Zone
            </Button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Heading</label>
              <input
                type="text"
                value={formData.zonesTitle}
                onChange={(e) => setFormData({ ...formData, zonesTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Our Field Settlement Zones"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Subtitle</label>
              <input
                type="text"
                value={formData.zonesSubtitle}
                onChange={(e) => setFormData({ ...formData, zonesSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800"
                placeholder="RESTI works on the ground directly inside settlement clusters in Kiryandongo District."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.zones.map((zone, index) => (
              <div key={zone.id || index} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 relative hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    Zone #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteZone(index)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Delete zone"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Zone / Area Name</label>
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) => updateZone(index, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                    placeholder="e.g. Ranch 1 Settlement Clusters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Beneficiaries / Coverage</label>
                  <input
                    type="text"
                    value={zone.beneficiaries}
                    onChange={(e) => updateZone(index, 'beneficiaries', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700"
                    placeholder="e.g. 7,400+ Supported"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Focus & Activities</label>
                  <textarea
                    rows={2}
                    value={zone.description}
                    onChange={(e) => updateZone(index, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed"
                    placeholder="Brief description of activities in this settlement area..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: CAMPAIGN & CTA ── */}
      {activeTab === 'campaign' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Fundraising Campaign & Bottom Call-to-Action</h4>
            <p className="text-xs text-slate-500">Update the fundraising campaign card and bottom action button displayed on the dashboard.</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target size={16} className="text-emerald-600" />
              Bottom Call to Action Banner
            </h5>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Headline</label>
              <input
                type="text"
                value={formData.ctaTitle}
                onChange={(e) => setFormData({ ...formData, ctaTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Support Our Community Programs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CTA Subtitle / Description</label>
              <textarea
                rows={2}
                value={formData.ctaSubtitle}
                onChange={(e) => setFormData({ ...formData, ctaSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                placeholder="Every contribution goes directly to empowering refugees and host families in Kiryandongo District."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={formData.ctaButtonText}
                  onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-semibold"
                  placeholder="Donate Now"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Button Link</label>
                <input
                  type="text"
                  value={formData.ctaButtonLink}
                  onChange={(e) => setFormData({ ...formData, ctaButtonLink: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-mono"
                  placeholder="/donate"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={16} className="text-teal-600" />
              Homepage Fundraising Widget Sync
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Goal Amount (UGX)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.fundraisingGoal}
                  onChange={(e) => handleNumberChange('fundraisingGoal', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Tag</label>
                <input
                  type="text"
                  value={formData.fundraisingCampaign}
                  onChange={(e) => setFormData({ ...formData, fundraisingCampaign: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800"
                  placeholder="Community Resilience Fund"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title</label>
              <input
                type="text"
                value={formData.fundraisingTitle}
                onChange={(e) => setFormData({ ...formData, fundraisingTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                placeholder="Support RESTI’s Community Impact"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Description</label>
              <textarea
                rows={2}
                value={formData.fundraisingDescription}
                onChange={(e) => setFormData({ ...formData, fundraisingDescription: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                placeholder="Your support helps RESTI CBO strengthen livelihoods..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM STICKY SAVE BAR ── */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          All changes made here are saved directly to the database and update <span className="font-mono text-emerald-700">/impact-dashboard</span>.
        </p>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Save size={16} className={saving ? 'animate-spin mr-2' : 'mr-2'} />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
