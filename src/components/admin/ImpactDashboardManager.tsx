import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Droplets, TreePine, Users, HeartHandshake, 
  GraduationCap, Plus, Trash2, Save, ExternalLink, 
  Sparkles, Layers, Eye, Compass, Quote
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export interface ImpactArea {
  id: string;
  title: string;
  description: string;
  activityHighlight: string;
  icon: string;
}

export interface ImpactStory {
  id: string;
  name: string;
  role: string;
  story: string;
  quote?: string;
  linkText: string;
  linkUrl: string;
  image?: string;
}

export interface FullImpactData {
  // 1. Header / Hero Section
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroIntroP1: string;
  heroIntroP2: string;

  // 2. Areas of Impact
  areasTitle: string;
  areasSubtitle: string;
  areas: ImpactArea[];

  // 3. Stories of Change
  storiesTitle: string;
  storiesSubtitle: string;
  stories: ImpactStory[];

  // 4. Our Community Approach
  approachTitle: string;
  approachLead: string;
  approachDescription: string;

  // 5. Looking Ahead (MEAL & Accountability)
  lookingAheadTitle: string;
  lookingAheadDescription: string;
  lookingAheadNote: string;
  lookingAheadPillars: string[];

  // 6. Call to Action
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
}

export const DEFAULT_IMPACT_DATA: FullImpactData = {
  heroBadge: 'Locally Led Solutions',
  heroTitle: 'Our Impact',
  heroSubtitle: 'Creating Opportunities. Strengthening Resilience. Building Self-Reliance.',
  heroIntroP1: 'RESTI works alongside refugees and host communities in Uganda to support practical, locally led solutions that strengthen livelihoods, resilience, well-being, and peaceful coexistence.',
  heroIntroP2: 'Our impact is rooted in the participation of communities themselves. We work with people to identify priorities, develop practical solutions, build skills, and create opportunities that can contribute to lasting change.',

  areasTitle: 'Our Areas of Impact',
  areasSubtitle: 'Practical, community-driven interventions addressing real needs on the ground.',
  areas: [
    {
      id: 'area-1',
      title: 'Livelihoods & Economic Empowerment',
      description: 'We support practical skills development and livelihood opportunities that enable individuals and households to strengthen their economic resilience and work toward greater self-reliance.',
      activityHighlight: 'Our activities include skills-based initiatives such as beekeeping training, helping participants develop practical knowledge that can be applied to sustainable livelihood activities.',
      icon: 'Briefcase'
    },
    {
      id: 'area-2',
      title: 'WASH & Community Health',
      description: 'We support community efforts to improve access to water, sanitation, hygiene, and community health. Our approach promotes practical solutions that communities can participate in implementing and sustaining.',
      activityHighlight: 'Promoting community-managed water points, sanitation education, and hygiene sensitization to build healthier households.',
      icon: 'Droplets'
    },
    {
      id: 'area-3',
      title: 'Environmental Sustainability & Climate Resilience',
      description: 'We promote community awareness and locally appropriate actions that contribute to environmental protection, climate resilience, and sustainable use of natural resources.',
      activityHighlight: 'Tree planting awareness, clean energy initiatives, and soil conservation practices suitable for settlement environments.',
      icon: 'TreePine'
    },
    {
      id: 'area-4',
      title: 'Community Development',
      description: 'We support communities to identify their priorities and participate in initiatives that strengthen local capacity, cooperation, and collective action.',
      activityHighlight: 'Grassroots planning meetings, community action groups, and mutual support structures.',
      icon: 'Users'
    },
    {
      id: 'area-5',
      title: 'Social Cohesion & Peaceful Coexistence',
      description: 'We create opportunities for refugees and host communities to engage, collaborate, and address shared challenges. Through activities such as community dialogue and community cleaning, we encourage participation, cooperation, and peaceful coexistence.',
      activityHighlight: 'Joint community dialogue, intercultural cleaning drives, and shared community forums bridging refugee and host residents.',
      icon: 'HeartHandshake'
    },
    {
      id: 'area-6',
      title: 'Skills & Capacity Development',
      description: 'We provide practical learning and skills development that can help people build confidence, strengthen their capabilities, and pursue sustainable opportunities.',
      activityHighlight: 'Hands-on vocational workshops, financial literacy, and mentoring for youth and women.',
      icon: 'GraduationCap'
    }
  ],

  storiesTitle: 'Stories of Change',
  storiesSubtitle: 'Real voices reflecting the power of practical, locally led skills development.',
  stories: [
    {
      id: 'story-okello',
      name: 'Okello John',
      role: 'Beekeeping Training Beneficiary',
      story: "Okello John participated in RESTI's beekeeping skills training, gaining practical knowledge in hive management, bee handling, honey harvesting, and basic honey processing.\n\nThe training provided him with practical skills and greater confidence to explore beekeeping as a livelihood activity. His experience reflects RESTI's approach of equipping community members with practical skills that can contribute to self-reliance, resilience, and sustainable livelihoods.",
      quote: "The training provided me with practical skills and greater confidence to explore beekeeping as a livelihood activity.",
      linkText: "Read Okello's story →",
      linkUrl: '/stories'
    }
  ],

  approachTitle: 'Our Community Approach',
  approachLead: 'RESTI believes that sustainable impact begins with communities themselves.',
  approachDescription: 'We involve community members in identifying needs, developing solutions, implementing activities, and reflecting on results. By valuing local knowledge, skills, and ideas, we aim to support solutions that are locally owned and capable of continuing beyond individual projects.',

  lookingAheadTitle: 'Looking Ahead',
  lookingAheadDescription: 'As RESTI grows, we are committed to strengthening our monitoring, evaluation, accountability, and learning systems so that we can measure our results more systematically and transparently.',
  lookingAheadNote: 'Future impact reporting will include verified information on people reached, activities implemented, communities engaged, outcomes achieved, and resources invested, where appropriate and available.',
  lookingAheadPillars: [
    'People reached',
    'Activities implemented',
    'Communities engaged',
    'Outcomes achieved',
    'Resources invested'
  ],

  ctaTitle: 'Support Community-Led Impact',
  ctaSubtitle: 'Partner with RESTI to equip refugee and host community families in Uganda with practical skills and lasting self-reliance.',
  ctaPrimaryText: 'Support Our Mission',
  ctaPrimaryLink: '/donate',
  ctaSecondaryText: 'Contact Us',
  ctaSecondaryLink: '/contact'
};

export function normalizeImpactData(raw: any): FullImpactData {
  if (!raw) return DEFAULT_IMPACT_DATA;
  return {
    heroBadge: raw.heroBadge || DEFAULT_IMPACT_DATA.heroBadge,
    heroTitle: (raw.heroTitle && raw.heroTitle !== 'Live Impact & Accountability Dashboard') 
      ? raw.heroTitle 
      : DEFAULT_IMPACT_DATA.heroTitle,
    heroSubtitle: raw.heroSubtitle || DEFAULT_IMPACT_DATA.heroSubtitle,
    heroIntroP1: raw.heroIntroP1 || DEFAULT_IMPACT_DATA.heroIntroP1,
    heroIntroP2: raw.heroIntroP2 || DEFAULT_IMPACT_DATA.heroIntroP2,

    areasTitle: raw.areasTitle || DEFAULT_IMPACT_DATA.areasTitle,
    areasSubtitle: raw.areasSubtitle || DEFAULT_IMPACT_DATA.areasSubtitle,
    areas: Array.isArray(raw.areas) && raw.areas.length > 0 
      ? raw.areas 
      : DEFAULT_IMPACT_DATA.areas,

    storiesTitle: raw.storiesTitle || DEFAULT_IMPACT_DATA.storiesTitle,
    storiesSubtitle: raw.storiesSubtitle || DEFAULT_IMPACT_DATA.storiesSubtitle,
    stories: Array.isArray(raw.stories) && raw.stories.length > 0 
      ? raw.stories 
      : DEFAULT_IMPACT_DATA.stories,

    approachTitle: raw.approachTitle || DEFAULT_IMPACT_DATA.approachTitle,
    approachLead: raw.approachLead || DEFAULT_IMPACT_DATA.approachLead,
    approachDescription: raw.approachDescription || DEFAULT_IMPACT_DATA.approachDescription,

    lookingAheadTitle: raw.lookingAheadTitle || DEFAULT_IMPACT_DATA.lookingAheadTitle,
    lookingAheadDescription: raw.lookingAheadDescription || DEFAULT_IMPACT_DATA.lookingAheadDescription,
    lookingAheadNote: raw.lookingAheadNote || DEFAULT_IMPACT_DATA.lookingAheadNote,
    lookingAheadPillars: Array.isArray(raw.lookingAheadPillars) && raw.lookingAheadPillars.length > 0
      ? raw.lookingAheadPillars
      : DEFAULT_IMPACT_DATA.lookingAheadPillars,

    ctaTitle: raw.ctaTitle || DEFAULT_IMPACT_DATA.ctaTitle,
    ctaSubtitle: raw.ctaSubtitle || DEFAULT_IMPACT_DATA.ctaSubtitle,
    ctaPrimaryText: raw.ctaPrimaryText || DEFAULT_IMPACT_DATA.ctaPrimaryText,
    ctaPrimaryLink: raw.ctaPrimaryLink || DEFAULT_IMPACT_DATA.ctaPrimaryLink,
    ctaSecondaryText: raw.ctaSecondaryText || DEFAULT_IMPACT_DATA.ctaSecondaryText,
    ctaSecondaryLink: raw.ctaSecondaryLink || DEFAULT_IMPACT_DATA.ctaSecondaryLink
  };
}

const AVAILABLE_ICONS = [
  { value: 'Briefcase', label: 'Briefcase / Livelihoods' },
  { value: 'Droplets', label: 'Droplets / WASH' },
  { value: 'TreePine', label: 'Tree / Environment' },
  { value: 'Users', label: 'Users / Community' },
  { value: 'HeartHandshake', label: 'Handshake / Cohesion' },
  { value: 'GraduationCap', label: 'Graduation / Skills' },
  { value: 'Heart', label: 'Heart / Care' },
  { value: 'ShieldCheck', label: 'Shield / Protection' }
];

interface ImpactDashboardManagerProps {
  impactStats?: any;
  onUpdate?: () => void;
  accessToken?: string;
  userRole?: string;
}

export function ImpactDashboardManager({ impactStats, onUpdate, accessToken, userRole }: ImpactDashboardManagerProps) {
  const [formData, setFormData] = useState<FullImpactData>(() => normalizeImpactData(impactStats));
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'areas' | 'stories' | 'approach' | 'cta'>('hero');

  useEffect(() => {
    if (impactStats) {
      setFormData(normalizeImpactData(impactStats));
    }
  }, [impactStats]);

  const handleSave = async () => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to modify settings.');
      return;
    }

    setSaving(true);
    const token = accessToken || publicAnonKey;

    try {
      // 1. Persist directly to /admin/impact-stats
      const statsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/impact-stats`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      // 2. Also sync to site-settings
      try {
        const currentSettingsRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let currentSettings: any = {};
        if (currentSettingsRes.ok) {
          const sJson = await currentSettingsRes.json();
          currentSettings = sJson.settings || {};
        }

        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              settings: {
                ...currentSettings,
                impactDashboard: formData
              }
            })
          }
        );
      } catch (syncErr) {
        console.warn('Sync to site-settings skipped or failed:', syncErr);
      }

      if (statsRes.ok) {
        toast.success('Impact page updated successfully!', {
          description: 'All changes are now live on the public Our Impact page.'
        });
        if (onUpdate) onUpdate();
      } else {
        const errJson = await statsRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Server returned an error');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error('Failed to save changes: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Area helpers
  const handleUpdateArea = (index: number, field: keyof ImpactArea, val: string) => {
    setFormData(prev => {
      const copy = [...prev.areas];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, areas: copy };
    });
  };

  const handleAddArea = () => {
    setFormData(prev => ({
      ...prev,
      areas: [
        ...prev.areas,
        {
          id: 'area-' + Date.now(),
          title: 'New Focus Area',
          description: 'Description of the practical work in this area.',
          activityHighlight: 'Specific activities implemented alongside the community.',
          icon: 'Briefcase'
        }
      ]
    }));
  };

  const handleRemoveArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index)
    }));
  };

  // Story helpers
  const handleUpdateStory = (index: number, field: keyof ImpactStory, val: string) => {
    setFormData(prev => {
      const copy = [...prev.stories];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, stories: copy };
    });
  };

  const handleAddStory = () => {
    setFormData(prev => ({
      ...prev,
      stories: [
        ...prev.stories,
        {
          id: 'story-' + Date.now(),
          name: 'Beneficiary Name',
          role: 'Program Participant',
          story: 'Write the personal story of transformation and skills gained here...',
          quote: 'Quote from the participant...',
          linkText: "Read Story →",
          linkUrl: '/stories'
        }
      ]
    }));
  };

  const handleRemoveStory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stories: prev.stories.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Sparkles size={13} />
            Verified & Grounded Impact Content
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Our Impact Page Editor</h2>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Manage authentic, locally led content: Mission & Hero, 6 Areas of Impact, Stories of Change (Okello John), Community Approach, and MEAL Accountability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/impact-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 transition-all"
          >
            <Eye size={16} />
            View Live Page
          </a>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'hero', label: 'Hero & Mission', icon: Compass },
          { id: 'areas', label: `Areas of Impact (${formData.areas.length})`, icon: Layers },
          { id: 'stories', label: `Stories of Change (${formData.stories.length})`, icon: Quote },
          { id: 'approach', label: 'Community Approach & Looking Ahead', icon: Users },
          { id: 'cta', label: 'Call to Action', icon: Compass },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: HERO & MISSION ── */}
      {activeSubTab === 'hero' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Hero Header & Mission Statement</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The opening statements that establish RESTI's authentic work alongside refugee and host communities in Uganda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Header Badge
              </label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={e => setFormData({ ...formData, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="e.g. Locally Led Solutions"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Main Page Title
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="e.g. Our Impact"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Subtitle / Core Motto
            </label>
            <input
              type="text"
              value={formData.heroSubtitle}
              onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              placeholder="e.g. Creating Opportunities. Strengthening Resilience. Building Self-Reliance."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mission Statement - Paragraph 1
            </label>
            <textarea
              rows={3}
              value={formData.heroIntroP1}
              onChange={e => setFormData({ ...formData, heroIntroP1: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mission Statement - Paragraph 2 (Community Roots)
            </label>
            <textarea
              rows={3}
              value={formData.heroIntroP2}
              onChange={e => setFormData({ ...formData, heroIntroP2: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: AREAS OF IMPACT ── */}
      {activeSubTab === 'areas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Areas of Impact Section Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the title, subtitle, and individual focus areas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.areasTitle}
                  onChange={e => setFormData({ ...formData, areasTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.areasSubtitle}
                  onChange={e => setFormData({ ...formData, areasSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Area Cards */}
          <div className="space-y-4">
            {formData.areas.map((area, idx) => (
              <div key={area.id || idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{area.title || 'Untitled Area'}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(idx)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Area"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Area Title
                    </label>
                    <input
                      type="text"
                      value={area.title}
                      onChange={e => handleUpdateArea(idx, 'title', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Visual Icon
                    </label>
                    <select
                      value={area.icon || 'Briefcase'}
                      onChange={e => handleUpdateArea(idx, 'icon', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
                    >
                      {AVAILABLE_ICONS.map(ic => (
                        <option key={ic.value} value={ic.value}>{ic.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={area.description}
                    onChange={e => handleUpdateArea(idx, 'description', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Practical Activities & Highlights (e.g. beekeeping training, community cleaning)
                  </label>
                  <textarea
                    rows={2}
                    value={area.activityHighlight || ''}
                    onChange={e => handleUpdateArea(idx, 'activityHighlight', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                    placeholder="Describe specific community-level initiatives..."
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={handleAddArea}
              variant="outline"
              className="w-full py-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} />
              Add Another Area of Impact
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 3: STORIES OF CHANGE ── */}
      {activeSubTab === 'stories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Stories of Change Section</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Feature authentic beneficiary experiences like Okello John's beekeeping journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.storiesTitle}
                  onChange={e => setFormData({ ...formData, storiesTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.storiesSubtitle}
                  onChange={e => setFormData({ ...formData, storiesSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {formData.stories.map((story, idx) => (
              <div key={story.id || idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{story.name || 'Untitled Beneficiary'}</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                      {story.role || 'Beneficiary'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStory(idx)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Story"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Beneficiary Name
                    </label>
                    <input
                      type="text"
                      value={story.name}
                      onChange={e => handleUpdateStory(idx, 'name', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. Okello John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Role / Activity Tag
                    </label>
                    <input
                      type="text"
                      value={story.role}
                      onChange={e => handleUpdateStory(idx, 'role', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. Beekeeping Training Beneficiary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Story Narrative
                  </label>
                  <textarea
                    rows={4}
                    value={story.story}
                    onChange={e => handleUpdateStory(idx, 'story', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Button / Link Text
                    </label>
                    <input
                      type="text"
                      value={story.linkText || ''}
                      onChange={e => handleUpdateStory(idx, 'linkText', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. Read Okello's story →"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={story.linkUrl || ''}
                      onChange={e => handleUpdateStory(idx, 'linkUrl', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      placeholder="e.g. /stories"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={handleAddStory}
              variant="outline"
              className="w-full py-4 border-2 border-dashed border-amber-300 hover:border-amber-500 text-amber-800 bg-amber-50/50 hover:bg-amber-50 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} />
              Add Another Story of Change
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 4: COMMUNITY APPROACH & LOOKING AHEAD ── */}
      {activeSubTab === 'approach' && (
        <div className="space-y-6">
          {/* Community Approach Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Our Community Approach</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Explain how RESTI centers community ownership, participation, and local knowledge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={formData.approachTitle}
                onChange={e => setFormData({ ...formData, approachTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Core Philosophy / Lead Statement
              </label>
              <input
                type="text"
                value={formData.approachLead}
                onChange={e => setFormData({ ...formData, approachLead: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Approach Description
              </label>
              <textarea
                rows={4}
                value={formData.approachDescription}
                onChange={e => setFormData({ ...formData, approachDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Looking Ahead & MEAL Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Looking Ahead & Accountability (MEAL)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                State RESTI's commitment to transparent, verified monitoring, evaluation, and future reporting.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={formData.lookingAheadTitle}
                onChange={e => setFormData({ ...formData, lookingAheadTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Commitment Statement
              </label>
              <textarea
                rows={3}
                value={formData.lookingAheadDescription}
                onChange={e => setFormData({ ...formData, lookingAheadDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Future Reporting Standards Note
              </label>
              <textarea
                rows={3}
                value={formData.lookingAheadNote}
                onChange={e => setFormData({ ...formData, lookingAheadNote: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reporting Pillars (comma separated)
              </label>
              <input
                type="text"
                value={formData.lookingAheadPillars.join(', ')}
                onChange={e => setFormData({
                  ...formData,
                  lookingAheadPillars: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="People reached, Activities implemented, Communities engaged..."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: CALL TO ACTION ── */}
      {activeSubTab === 'cta' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Call to Action Banner</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Encourage visitors, partners, and donors to stand with RESTI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                CTA Headline
              </label>
              <input
                type="text"
                value={formData.ctaTitle}
                onChange={e => setFormData({ ...formData, ctaTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                CTA Subtitle
              </label>
              <input
                type="text"
                value={formData.ctaSubtitle}
                onChange={e => setFormData({ ...formData, ctaSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Button Text
              </label>
              <input
                type="text"
                value={formData.ctaPrimaryText}
                onChange={e => setFormData({ ...formData, ctaPrimaryText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Button Link
              </label>
              <input
                type="text"
                value={formData.ctaPrimaryLink}
                onChange={e => setFormData({ ...formData, ctaPrimaryLink: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secondary Button Text
              </label>
              <input
                type="text"
                value={formData.ctaSecondaryText}
                onChange={e => setFormData({ ...formData, ctaSecondaryText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secondary Button Link
              </label>
              <input
                type="text"
                value={formData.ctaSecondaryLink}
                onChange={e => setFormData({ ...formData, ctaSecondaryLink: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Footer */}
      <div className="sticky bottom-6 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-2xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-300 hidden sm:block">
            Editing verified impact content for RESTI CBO. Click save to publish.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-7 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            <Save size={16} />
            {saving ? 'Publishing...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
