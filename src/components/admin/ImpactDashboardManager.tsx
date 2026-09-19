import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Heart, BookOpen, DollarSign, MapPin, 
  Award, Target, Plus, Trash2, Save, ExternalLink, 
  CheckCircle2, Sparkles, FileText, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export interface ImpactHighlight {
  id: string;
  title: string;
  description: string;
  metric: string;
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

  // Key Achievements / Highlights
  highlightsTitle: string;
  highlightsSubtitle: string;
  highlights: ImpactHighlight[];

  // Call to Action
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export const DEFAULT_IMPACT_DATA: FullImpactData = {
  heroBadge: 'Verified Community Impact',
  heroTitle: 'Our Impact',
  heroSubtitle: 'Direct, measurable results empowering refugee and host families across Kiryandongo District, Uganda.',
  
  peopleServed: 24850,
  peopleServedLabel: 'People Directly Supported',
  peopleServedBadge: 'Refugees & host community families',

  programsActive: 6,
  programsActiveLabel: 'Active Community Programs',
  programsActiveBadge: 'Livelihoods, Education, WASH & Health',

  volunteersActive: 145,
  volunteersActiveLabel: 'Community Volunteers',
  volunteersActiveBadge: 'Grassroots leaders & peer educators',

  fundsRaised: 310000000,
  fundsRaisedLabel: 'Program Funds Deployed (UGX)',
  fundsRaisedBadge: '90% directly deployed to field projects',

  communitiesReached: 18,
  communitiesReachedLabel: 'Villages & Settlement Zones',
  communitiesReachedBadge: 'Across Kiryandongo District',

  successRate: 97,
  successRateLabel: 'Program Success Rate',
  successRateBadge: 'Verified milestone completion',

  highlightsTitle: 'Key Community Achievements',
  highlightsSubtitle: 'Specific, tangible outcomes delivered directly into the hands of families who need it most.',
  highlights: [
    {
      id: 'hl-1',
      title: 'Clean Water & Boreholes',
      description: 'Rehabilitating community boreholes and water points to provide safe, clean water for thousands daily.',
      metric: '12 Boreholes Restored'
    },
    {
      id: 'hl-2',
      title: 'Women Livelihoods & Tailoring',
      description: 'Providing vocational tailoring certification, sewing machines, and seed capital for refugee single mothers.',
      metric: '180+ Women Certified'
    },
    {
      id: 'hl-3',
      title: 'Youth Education & Digital Skills',
      description: 'Equipping adolescents with digital computer literacy, exam fees, scholastic supplies, and academic mentorship.',
      metric: '850+ Students Supported'
    },
    {
      id: 'hl-4',
      title: 'Village Savings & Loans (VSLA)',
      description: 'Grassroots micro-savings circles giving families the financial tools to launch self-sustaining micro-businesses.',
      metric: '42 Savings Circles'
    }
  ],

  ctaTitle: 'Support Our Work in Kiryandongo',
  ctaSubtitle: 'Every contribution directly empowers vulnerable refugee and host families with essential tools for dignity and self-reliance.',
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

  useEffect(() => {
    if (impactStats) {
      setFormData(prev => ({
        ...prev,
        ...impactStats,
        heroTitle: impactStats.heroTitle || (impactStats.title && impactStats.title !== 'Live Impact & Accountability Dashboard' ? impactStats.title : prev.heroTitle),
        heroSubtitle: impactStats.heroSubtitle || impactStats.description || prev.heroSubtitle,
        heroBadge: impactStats.heroBadge || impactStats.badge || prev.heroBadge,
        highlights: Array.isArray(impactStats.highlights) && impactStats.highlights.length > 0 
          ? impactStats.highlights 
          : prev.highlights
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

      // 2. Also sync to site-settings for full consistency
      try {
        const getSettingsRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (getSettingsRes.ok) {
          const settingsJson = await getSettingsRes.json();
          const currentSettings = settingsJson.settings || {};
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
            {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${accessToken || publicAnonKey}` 
              },
              body: JSON.stringify({
                settings: {
                  ...currentSettings,
                  impactDashboard: {
                    ...formData,
                    title: formData.heroTitle,
                    description: formData.heroSubtitle,
                    badge: formData.heroBadge
                  }
                }
              })
            }
          );
        }
      } catch (siteErr) {
        console.warn('Sync to site-settings warning:', siteErr);
      }

      toast.success('Impact Dashboard updated successfully!', {
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
      description: 'Summary of results delivered in Kiryandongo District...',
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

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-white/20 border border-white/30 shadow-sm shrink-0">
            <BarChart3 size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">Impact Dashboard Editor</h3>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 opacity-90 font-medium">
              Directly edit the headlines, metrics, achievements, and call to action shown on <span className="underline font-mono">/impact-dashboard</span>
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
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: PRECISE HEADLINE & INTRO ── */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sparkles size={18} className="text-emerald-600" />
          <h4 className="text-base font-bold text-slate-900">1. Page Title & Intro</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Page Title</label>
            <input
              type="text"
              value={formData.heroTitle}
              onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              placeholder="Our Impact"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Status Badge</label>
            <input
              type="text"
              value={formData.heroBadge}
              onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              placeholder="Verified Community Impact"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Concise Description</label>
          <textarea
            rows={2}
            value={formData.heroSubtitle}
            onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            placeholder="Direct, measurable results empowering refugee and host families across Kiryandongo District, Uganda."
          />
        </div>
      </div>

      {/* ── SECTION 2: 6 CORE IMPACT COUNTERS ── */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-emerald-600" />
            <h4 className="text-base font-bold text-slate-900">2. Key Numerical Counters</h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">Direct numerical metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* People Served */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Users size={17} />
              <span>People Served</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Number</label>
              <input
                type="number"
                min={0}
                value={formData.peopleServed}
                onChange={(e) => handleNumberChange('peopleServed', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.peopleServedLabel}
                onChange={(e) => setFormData({ ...formData, peopleServedLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.peopleServedBadge}
                onChange={(e) => setFormData({ ...formData, peopleServedBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Active Programs */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <BookOpen size={17} />
              <span>Active Programs</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Number</label>
              <input
                type="number"
                min={0}
                value={formData.programsActive}
                onChange={(e) => handleNumberChange('programsActive', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.programsActiveLabel}
                onChange={(e) => setFormData({ ...formData, programsActiveLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.programsActiveBadge}
                onChange={(e) => setFormData({ ...formData, programsActiveBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Communities Reached */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <MapPin size={17} />
              <span>Villages / Zones</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Number</label>
              <input
                type="number"
                min={0}
                value={formData.communitiesReached}
                onChange={(e) => handleNumberChange('communitiesReached', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.communitiesReachedLabel}
                onChange={(e) => setFormData({ ...formData, communitiesReachedLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.communitiesReachedBadge}
                onChange={(e) => setFormData({ ...formData, communitiesReachedBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Community Volunteers */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
              <Heart size={17} />
              <span>Community Volunteers</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Number</label>
              <input
                type="number"
                min={0}
                value={formData.volunteersActive}
                onChange={(e) => handleNumberChange('volunteersActive', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.volunteersActiveLabel}
                onChange={(e) => setFormData({ ...formData, volunteersActiveLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.volunteersActiveBadge}
                onChange={(e) => setFormData({ ...formData, volunteersActiveBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Funds Raised */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
              <DollarSign size={17} />
              <span>Funds Deployed (UGX)</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                min={0}
                value={formData.fundsRaised}
                onChange={(e) => handleNumberChange('fundsRaised', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.fundsRaisedLabel}
                onChange={(e) => setFormData({ ...formData, fundsRaisedLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.fundsRaisedBadge}
                onChange={(e) => setFormData({ ...formData, fundsRaisedBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              <Award size={17} />
              <span>Success Rate (%)</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Percentage (0 - 100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.successRate}
                onChange={(e) => handleNumberChange('successRate', e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Label</label>
              <input
                type="text"
                value={formData.successRateLabel}
                onChange={(e) => setFormData({ ...formData, successRateLabel: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtitle Note</label>
              <input
                type="text"
                value={formData.successRateBadge}
                onChange={(e) => setFormData({ ...formData, successRateBadge: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: KEY ACHIEVEMENTS (4 PRECISE CARDS) ── */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <div>
              <h4 className="text-base font-bold text-slate-900">3. Key Impact Achievements</h4>
              <p className="text-xs text-slate-500">Showcase tangible accomplishments delivered to families in Kiryandongo.</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={addHighlight}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl w-fit"
          >
            <Plus size={14} className="mr-1" />
            Add Achievement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.highlights.map((hl, index) => (
            <div key={hl.id || index} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 relative shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Achievement #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => deleteHighlight(index)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                  title="Remove achievement"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={hl.title}
                  onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                  placeholder="e.g. Clean Water & Boreholes"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Result Tag / Metric</label>
                <input
                  type="text"
                  value={hl.metric}
                  onChange={(e) => updateHighlight(index, 'metric', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                  placeholder="e.g. 12 Boreholes Restored"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={hl.description}
                  onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed"
                  placeholder="Brief summary of what was achieved..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: CALL TO ACTION ── */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Heart size={18} className="text-emerald-600" />
          <h4 className="text-base font-bold text-slate-900">4. Call to Action Banner</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">CTA Headline</label>
            <input
              type="text"
              value={formData.ctaTitle}
              onChange={(e) => setFormData({ ...formData, ctaTitle: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              placeholder="Support Our Work in Kiryandongo"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Button Text</label>
            <input
              type="text"
              value={formData.ctaButtonText}
              onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
              placeholder="Donate Now"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">CTA Description</label>
          <textarea
            rows={2}
            value={formData.ctaSubtitle}
            onChange={(e) => setFormData({ ...formData, ctaSubtitle: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
            placeholder="Every contribution directly empowers vulnerable refugee and host families..."
          />
        </div>
      </div>

      {/* ── BOTTOM SAVE BAR ── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          All changes saved here directly update <span className="font-mono text-emerald-700 font-semibold">/impact-dashboard</span>.
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
