import {
  Heart,
  Users,
  Target,
  Award,
  ShieldCheck,
  Shield,
  Scale,
  Globe,
  Lightbulb,
  Handshake,
  HeartHandshake,
  Sparkles,
  Compass,
  CheckCircle2,
  Leaf,
  Eye,
  Smile,
  Landmark,
  BookOpen,
  Layers,
  Zap,
  Star,
  TrendingUp,
  Anchor,
  type LucideIcon
} from 'lucide-react';

export interface CoreValueIconOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const AVAILABLE_CORE_VALUE_ICONS: CoreValueIconOption[] = [
  { id: 'Users', label: 'People & Community', icon: Users },
  { id: 'Target', label: 'Mission & Purpose', icon: Target },
  { id: 'ShieldCheck', label: 'Stewardship & Trust', icon: ShieldCheck },
  { id: 'Scale', label: 'Integrity & Ethics', icon: Scale },
  { id: 'Handshake', label: 'Partnership & Accountability', icon: Handshake },
  { id: 'HeartHandshake', label: 'Compassion & Service', icon: HeartHandshake },
  { id: 'Heart', label: 'Dignity & Care', icon: Heart },
  { id: 'Award', label: 'Excellence & Quality', icon: Award },
  { id: 'Globe', label: 'Inclusivity & Global Reach', icon: Globe },
  { id: 'Lightbulb', label: 'Innovation & Empowerment', icon: Lightbulb },
  { id: 'Sparkles', label: 'Transformation', icon: Sparkles },
  { id: 'Compass', label: 'Guidance & Direction', icon: Compass },
  { id: 'CheckCircle2', label: 'Reliability & Standards', icon: CheckCircle2 },
  { id: 'Leaf', label: 'Sustainability & Environment', icon: Leaf },
  { id: 'Eye', label: 'Transparency & Vision', icon: Eye },
  { id: 'Smile', label: 'Well-being & Hope', icon: Smile },
  { id: 'Landmark', label: 'Institutional Strength', icon: Landmark },
  { id: 'BookOpen', label: 'Education & Learning', icon: BookOpen },
  { id: 'Layers', label: 'Holistic Approach', icon: Layers },
  { id: 'Zap', label: 'Proactive Action', icon: Zap },
  { id: 'Star', label: 'Dedication', icon: Star },
  { id: 'TrendingUp', label: 'Growth & Impact', icon: TrendingUp },
  { id: 'Anchor', label: 'Resilience & Stability', icon: Anchor },
  { id: 'Shield', label: 'Protection', icon: Shield },
];

export const CORE_VALUE_ICONS_MAP: Record<string, LucideIcon> = {
  Users,
  Target,
  ShieldCheck,
  Scale,
  Handshake,
  HeartHandshake,
  Heart,
  Award,
  Globe,
  Lightbulb,
  Sparkles,
  Compass,
  CheckCircle2,
  Leaf,
  Eye,
  Smile,
  Landmark,
  BookOpen,
  Layers,
  Zap,
  Star,
  TrendingUp,
  Anchor,
  Shield,
};

export function resolveCoreValueIcon(iconName?: string, title?: string, index: number = 0): LucideIcon {
  if (iconName && CORE_VALUE_ICONS_MAP[iconName]) {
    return CORE_VALUE_ICONS_MAP[iconName];
  }

  if (title) {
    const t = title.toLowerCase();
    if (t.includes('people') || t.includes('communit') || t.includes('team')) return Users;
    if (t.includes('commit') || t.includes('target') || t.includes('goal') || t.includes('impact')) return Target;
    if (t.includes('steward') || t.includes('protect') || t.includes('shield') || t.includes('trust')) return ShieldCheck;
    if (t.includes('integrity') || t.includes('ethic') || t.includes('fair') || t.includes('justice') || t.includes('serve with')) return Scale;
    if (t.includes('accountab') || t.includes('partner') || t.includes('collaborat')) return Handshake;
    if (t.includes('compassion') || t.includes('care') || t.includes('heart') || t.includes('dignity')) return Heart;
    if (t.includes('excel') || t.includes('award') || t.includes('quality')) return Award;
    if (t.includes('sustain') || t.includes('green') || t.includes('nature')) return Leaf;
    if (t.includes('vision') || t.includes('transpar') || t.includes('honest')) return Eye;
    if (t.includes('growth') || t.includes('empower')) return TrendingUp;
  }

  const defaultCycle = [Users, Target, ShieldCheck, Scale, Handshake, Heart, Award, Globe];
  return defaultCycle[index % defaultCycle.length];
}

export const VALUE_CARD_THEMES = [
  {
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-emerald-500/25',
    accentBorder: 'group-hover:border-emerald-300',
    titleHover: 'group-hover:text-emerald-800',
    accentDot: 'bg-emerald-500',
  },
  {
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200/80 group-hover:bg-teal-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-teal-500/25',
    accentBorder: 'group-hover:border-teal-300',
    titleHover: 'group-hover:text-teal-800',
    accentDot: 'bg-teal-500',
  },
  {
    iconBg: 'bg-sky-50 text-sky-700 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-sky-500/25',
    accentBorder: 'group-hover:border-sky-300',
    titleHover: 'group-hover:text-sky-800',
    accentDot: 'bg-sky-500',
  },
  {
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-amber-500/25',
    accentBorder: 'group-hover:border-amber-300',
    titleHover: 'group-hover:text-amber-800',
    accentDot: 'bg-amber-500',
  },
  {
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-indigo-500/25',
    accentBorder: 'group-hover:border-indigo-300',
    titleHover: 'group-hover:text-indigo-800',
    accentDot: 'bg-indigo-500',
  },
  {
    iconBg: 'bg-rose-50 text-rose-700 border-rose-200/80 group-hover:bg-rose-600 group-hover:text-white',
    badgeGlow: 'group-hover:shadow-rose-500/25',
    accentBorder: 'group-hover:border-rose-300',
    titleHover: 'group-hover:text-rose-800',
    accentDot: 'bg-rose-500',
  },
];
