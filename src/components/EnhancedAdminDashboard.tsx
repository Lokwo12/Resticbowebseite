import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  Mail,
  Users,
  Heart,
  Send,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  LogOut,
  TrendingUp,
  Upload,
  Image as ImageIcon,
  Download,
  ChevronDown,
  BarChart3,
  Shield,
  CheckSquare,
  Square,
  Eye,
  Reply,
  Filter,
  Settings,
  Calendar,
  Handshake,
  HelpCircle,
  BookOpen,
  Target,
  Award,
  MessageSquare,
  Bell,
  Search,
  Menu,
  X as XIcon,
  ChevronRight
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SiteSettingsTab } from './SiteSettingsTab';
import { 
  TeamFormDialog, 
  StoryFormDialog, 
  ImpactStatsFormDialog 
} from './AdminFormDialogs';
import { 
  ReportFormDialog, 
  EventFormDialog, 
  PartnerFormDialog 
} from './AdminFormDialogsExtended';
import { 
  OpportunityFormDialog, 
  FAQFormDialog, 
  ResourceFormDialog 
} from './AdminFormDialogsFinal';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

const resolveNewsDate = (value: any) => {
  const raw = value?.timestamp ?? value?.created_at ?? value?.createdAt;
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Simple Error Boundary to surface render errors in the admin UI
class ErrorBoundary extends React.Component<any, { hasError: boolean; error?: Error | null }>{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console for now
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white rounded shadow max-w-4xl mx-auto mt-8">
          <h2 className="text-lg font-semibold text-red-600 mb-2">An error occurred while rendering the admin UI</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{this.state.error?.message}</pre>
          <button className="mt-4 px-3 py-2 bg-emerald-600 text-white rounded" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type UserRole = 'super-admin' | 'admin' | 'editor' | 'viewer';

const USER_ROLES = [
  { value: 'super-admin', label: 'Super Admin', description: 'Full access to everything' },
  { value: 'admin', label: 'Admin', description: 'Manage content and users' },
  { value: 'editor', label: 'Editor', description: 'Manage content only' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access' }
];

interface Analytics {
  monthlyDonations: any[];
  paymentMethodData: any[];
  contactStatusData: any[];
  volunteerStatusData: any[];
  growthTrends: any[];
}

// Navigation menu items
const NAVIGATION_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-600' },
  { id: 'programs', label: 'Programs', icon: FileText, color: 'text-blue-600' },
  { id: 'news', label: 'News', icon: Newspaper, color: 'text-purple-600' },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon, color: 'text-pink-600' },
  { id: 'team', label: 'Team', icon: Users, color: 'text-cyan-600' },
  { id: 'stories', label: 'Stories', icon: MessageSquare, color: 'text-orange-600' },
  { id: 'impact', label: 'Impact Stats', icon: TrendingUp, color: 'text-green-600' },
  { id: 'reports', label: 'Reports', icon: Download, color: 'text-indigo-600' },
  { id: 'events', label: 'Events', icon: Calendar, color: 'text-red-600' },
  { id: 'partners', label: 'Partners', icon: Handshake, color: 'text-teal-600' },
  { id: 'opportunities', label: 'Opportunities', icon: Target, color: 'text-amber-600' },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'text-violet-600' },
  { id: 'resources', label: 'Resources', icon: BookOpen, color: 'text-lime-600' },
  { id: 'contacts', label: 'Contacts', icon: Mail, color: 'text-sky-600' },
  { id: 'volunteers', label: 'Volunteers', icon: Heart, color: 'text-rose-600' },
  { id: 'donations', label: 'Donations', icon: Heart, color: 'text-emerald-600' },
  { id: 'subscribers', label: 'Subscribers', icon: Send, color: 'text-blue-600' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
  { id: 'users', label: 'Users', icon: Shield, color: 'text-red-600', requiresUserManagement: true },
];

export function EnhancedAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data states
  const [programs, setPrograms] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const dashboardStats = useMemo(() => ({
    totalPrograms: stats?.totalPrograms ?? 0,
    totalNews: stats?.totalNews ?? 0,
    totalVolunteers: stats?.totalVolunteers ?? 0,
    totalDonationAmount: stats?.totalDonationAmount ?? 0,
    totalDonationsCount: stats?.totalDonations ?? 0,
  }), [stats]);
  
  // New data states for additional sections
  const [team, setTeam] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [impactStats, setImpactStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [faqs, setFAQs] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Selection states for bulk actions
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedFAQs, setSelectedFAQs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const normalizeUserRole = (raw: unknown): UserRole => {
    if (typeof raw !== 'string') return 'viewer';

    const normalized = raw
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .toLowerCase();

    if (['super-admin', 'superadmin', 'super-administrator'].includes(normalized)) {
      return 'super-admin';
    }

    if (['admin', 'administrator', 'admins'].includes(normalized)) {
      return 'admin';
    }

    if (['editor', 'content-editor'].includes(normalized)) {
      return 'editor';
    }

    if (['viewer', 'read-only', 'readonly', 'guest'].includes(normalized)) {
      return 'viewer';
    }

    return 'viewer';
  };

  const deriveUserRole = (user: SupabaseUser | null | undefined): UserRole => {
    if (!user) return 'viewer';

    const candidate = (user.user_metadata?.role as string | undefined)
      ?? (user.app_metadata?.role as string | undefined)
      ?? (Array.isArray(user.app_metadata?.roles) ? user.app_metadata?.roles[0] : undefined);

    return normalizeUserRole(candidate ?? 'viewer');
  };

  const [userId, setUserId] = useState<string | null>(null);
  const roleHydrationAttempted = useRef(false);

  const canManageUsers = userRole === 'super-admin' || userRole === 'admin';

  // Filter states
  const [contactFilter, setContactFilter] = useState('all');
  const [volunteerFilter, setVolunteerFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  // Add/Edit form states
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [showImpactForm, setShowImpactForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    status: 'active'
  });
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image: '',
    category: 'general'
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (!response.ok) {
        throw new Error('Failed to load site settings');
      }

      const data = await response.json();
      setSiteSettings(data.settings || null);
    } catch (err) {
      console.error('Site settings load error:', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      initializeDefaults(); // Initialize default data if needed
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSiteSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!canManageUsers && activeTab === 'users') {
      setActiveTab('overview');
    }
  }, [canManageUsers, activeTab]);

  const siteTitle = useMemo(() => {
    const name = siteSettings?.general?.siteName;
    return typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'Resti Kiryandongo CBO';
  }, [siteSettings]);

  const siteLogoUrl = useMemo(() => {
    const customLogo = siteSettings?.general?.logoUrl;
    if (typeof customLogo !== 'string') {
      return logo;
    }

    const trimmed = customLogo.trim();
    if (!trimmed || trimmed.includes('figma:asset')) {
      return logo;
    }

    return trimmed;
  }, [siteSettings]);

  const siteTagline = useMemo(() => {
    const tagline = siteSettings?.general?.tagline;
    return typeof tagline === 'string' && tagline.trim().length > 0 ? tagline.trim() : 'Admin Dashboard';
  }, [siteSettings]);

  const initializeDefaults = async () => {
    try {
      // Check if initialization is needed
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      
      // If no programs exist, initialize default data
      if (!data.programs || data.programs.length === 0) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/initialize`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${publicAnonKey}` }
          }
        );
        console.log('Default data initialized');
      }

      // Initialize default site settings if needed
      const settingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const settingsData = await settingsResponse.json();
      
      if (!settingsData.settings || !settingsData.settings.createdAt) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings/initialize`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${publicAnonKey}` }
          }
        );
        console.log('Default site settings initialized');
      }

      setSiteSettings(settingsData.settings || null);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token && session.user) {
        setIsAuthenticated(true);
        setAccessToken(session.access_token);

        const currentUser = session.user;
        setUserId(currentUser.id ?? null);

        const resolvedRole = deriveUserRole(currentUser);
        setUserRole(resolvedRole);
        roleHydrationAttempted.current = resolvedRole !== 'viewer';

        setUserName(currentUser.user_metadata?.name || currentUser.email || '');
        setUserEmail(currentUser.email || '');
      } else {
        setUserId(null);
        setUserRole('viewer');
        roleHydrationAttempted.current = false;
        setUserName('');
        setUserEmail('');
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setIsAuthenticated(true);
        setAccessToken(data.session.access_token);
        
        // Get user metadata
        if (data.user?.id) {
          setUserId(data.user.id);
        } else {
          setUserId(null);
        }

        setUserId(data.user?.id ?? null);

        const resolvedRole = deriveUserRole(data.user ?? null);
        setUserRole(resolvedRole);
        roleHydrationAttempted.current = resolvedRole !== 'viewer';
        setUserName(data.user?.user_metadata?.name || data.user?.email || '');
        setUserEmail(data.user?.email || '');
        
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      toast.success('Account created! Please login.');
      setIsSignup(false);
      setPassword('');
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAccessToken('');
    setUserRole('viewer');
    setUserName('');
    setUserEmail('');
    setUserId(null);
    roleHydrationAttempted.current = false;
    toast.info('Logged out successfully');
  };

  const normalizeCollection = (items: any, prefix: string) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item, index) => {
      const fallbackKey = `${prefix}-${index}`;

      if (!item || typeof item !== 'object') {
        return { key: fallbackKey, value: item };
      }

      if ('key' in item && 'value' in item) {
        const key = (item as any).key ?? fallbackKey;
        const rawValue = (item as any).value;
        const value =
          rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)
            ? { ...rawValue, id: rawValue.id ?? key }
            : rawValue;

        return { key, value };
      }

      const { id, key: embeddedKey, value: embeddedValue, ...rest } = item as any;
      const key = (typeof id === 'string' && id) || (typeof embeddedKey === 'string' && embeddedKey) || fallbackKey;

      if (embeddedValue !== undefined) {
        const value =
          embeddedValue && typeof embeddedValue === 'object' && !Array.isArray(embeddedValue)
            ? { ...embeddedValue, id: embeddedValue.id ?? key }
            : embeddedValue;

        return { key, value };
      }

      const value =
        rest && typeof rest === 'object' && !Array.isArray(rest)
          ? { ...rest, id: rest.id ?? key }
          : rest;

      return { key, value };
    });
  };

  const normalizeSingle = (payload: any, key: string) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return payload;
    }

    return {
      key,
      value: {
        ...payload,
        id: payload.id ?? key
      }
    };
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (userRole !== 'viewer') return;
    if (roleHydrationAttempted.current) return;
    if (!userId && !userEmail) return;

    roleHydrationAttempted.current = true;

    const syncRoleFromServer = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const users = normalizeCollection(data.users, 'admin_user');

        if ((users?.length ?? 0) === 0 && userId && userEmail) {
          try {
            const bootstrapResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/bootstrap`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId,
                  email: userEmail,
                  name: userName || userEmail.split('@')[0] || 'Super Admin'
                })
              }
            );

            if (bootstrapResponse.ok) {
              setUserRole('super-admin');
              toast.success('User management unlocked for this account.');
              if (!userName) {
                setUserName(userEmail.split('@')[0] || 'Super Admin');
              }
              return;
            }

            if (bootstrapResponse.status >= 500) {
              roleHydrationAttempted.current = false;
            }
          } catch (bootstrapError) {
            console.error('Admin bootstrap error:', bootstrapError);
            roleHydrationAttempted.current = false;
          }
        }

        const targetEmail = typeof userEmail === 'string' ? userEmail.toLowerCase() : '';

        const matchedUser = users.find((entry) => {
          const value = entry?.value || {};
          const entryId = value?.id || entry?.key;
          const entryEmail = typeof value?.email === 'string' ? value.email.toLowerCase() : '';

          if (userId && entryId === userId) {
            return true;
          }

          if (targetEmail && entryEmail && entryEmail === targetEmail) {
            return true;
          }

          return false;
        });

        if (matchedUser?.value) {
          const matchedUserData = matchedUser.value as any;
          const roleSource =
            matchedUserData?.user_metadata?.role ??
            matchedUserData?.app_metadata?.role ??
            (Array.isArray(matchedUserData?.app_metadata?.roles)
              ? matchedUserData.app_metadata.roles[0]
              : undefined) ??
            matchedUserData?.role;

          const resolvedRole = normalizeUserRole(roleSource ?? 'viewer');
          setUserRole(resolvedRole);

          if (!userName) {
            const derivedName =
              matchedUserData?.user_metadata?.name ??
              matchedUserData?.name ??
              matchedUserData?.email ??
              (typeof userEmail === 'string' ? userEmail : '');

            if (derivedName) {
              setUserName(derivedName);
            }
          }
          return;
        }

        if (users.length > 0) {
          roleHydrationAttempted.current = false;
        }
      } catch (err) {
        console.error('User role sync error:', err);
        roleHydrationAttempted.current = false;
      }
    };

    syncRoleFromServer();
  }, [isAuthenticated, userRole, userId, userEmail, userName, publicAnonKey]);

  const loadData = async () => {
    try {
      if (activeTab === 'overview') {
        const [statsRes, analyticsRes] = await Promise.all([
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stats`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          ),
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/analytics`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          )
        ]);
        
        const statsData = await statsRes.json();
        const analyticsData = await analyticsRes.json();
        
        setStats(statsData.stats);
        setAnalytics(analyticsData);
      } else if (activeTab === 'programs') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setPrograms(normalizeCollection(data.programs, 'program'));
      } else if (activeTab === 'news') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setNews(normalizeCollection(data.news, 'news'));
      } else if (activeTab === 'gallery') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setGallery(normalizeCollection(data.images, 'gallery'));
      } else if (activeTab === 'contacts') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setContacts(normalizeCollection(data.contacts, 'contact'));
      } else if (activeTab === 'volunteers') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setVolunteers(normalizeCollection(data.volunteers, 'volunteer'));
      } else if (activeTab === 'donations') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setDonations(normalizeCollection(data.donations, 'donation'));
      } else if (activeTab === 'subscribers') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/newsletter`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setSubscribers(normalizeCollection(data.subscribers, 'subscriber'));
      } else if (activeTab === 'users' && canManageUsers) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setAdminUsers(normalizeCollection(data.users, 'admin_user'));
      } else if (activeTab === 'settings') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setSiteSettings(data.settings || null);
      } else if (activeTab === 'team') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setTeam(normalizeCollection(data.team, 'team'));
      } else if (activeTab === 'stories') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setStories(normalizeCollection(data.stories, 'story'));
      } else if (activeTab === 'impact') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/impact-stats`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setImpactStats(data.stats ? normalizeSingle(data.stats, 'impact-stats') : null);
      } else if (activeTab === 'reports') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setReports(normalizeCollection(data.reports, 'report'));
      } else if (activeTab === 'events') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setEvents(normalizeCollection(data.events, 'event'));
      } else if (activeTab === 'partners') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setPartners(normalizeCollection(data.partners, 'partner'));
      } else if (activeTab === 'opportunities') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setOpportunities(normalizeCollection(data.opportunities, 'opportunity'));
      } else if (activeTab === 'faqs') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setFAQs(normalizeCollection(data.faqs, 'faq'));
      } else if (activeTab === 'resources') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setResources(normalizeCollection(data.resources, 'resource'));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    }
  };

  // Helper to perform DELETE requests and surface backend errors clearly
  const safeDelete = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } });
      let body: any = null;

      const contentType = response.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          body = await response.json();
        } else {
          body = await response.text();
        }
      } catch (e) {
        // best-effort parsing
        body = null;
      }

      if (!response.ok) {
        const msg = (body && (body.error || body.message)) || (typeof body === 'string' ? body : null) || `Request failed: ${response.status} ${response.statusText}`;
        const err: any = new Error(`${msg}`);
        // attach some debug details for easier troubleshooting
        err.details = { url, status: response.status, statusText: response.statusText, body };
        console.error('safeDelete failed', err.details);
        throw err;
      }

      return body;
    } catch (err: any) {
      console.error('safeDelete error for', url, err);
      throw err;
    }
  };

  const safeBulkDelete = async (baseUrl: string, ids: string[]) => {
    return Promise.all(ids.map(id => safeDelete(`${baseUrl}/${encodeURIComponent(id)}`)));
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // Use server-side upload endpoint to avoid client-side storage permission issues
      // (this mirrors the approach used in AdminFormDialogs and ensures the same bucket
      // and upload behavior is used across the dashboard).
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${publicAnonKey}` }, body: formDataObj }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      // server returns { url }
      return data.url;
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Program handlers
  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save program');

      toast.success(editingItem ? 'Program updated' : 'Program created');
      setShowProgramForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
      loadData();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save program');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Delete this program?')) return;

    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${encodeURIComponent(id)}`);
      toast.success('Program deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete program');
    }
  };

  const handleBulkDeletePrograms = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} programs?`)) return;

    try {
      await safeBulkDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`, ids);
      toast.success(`${ids.length} programs deleted`);
      setSelectedPrograms([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete programs');
    }
  };

  // News handlers
  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save news');

      toast.success(editingItem ? 'News updated' : 'News created');
      setShowNewsForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
      loadData();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save news');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete this news item?')) return;

    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${encodeURIComponent(id)}`);
      toast.success('News deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete news');
    }
  };

  const handleBulkDeleteNews = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} news items?`)) return;

    try {
      await safeBulkDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`, ids);
      toast.success(`${ids.length} news items deleted`);
      setSelectedNews([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete news');
    }
  };

  // Gallery handlers
  const handleSubmitGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrl: formData.image, // Backend expects imageUrl, not image
          category: formData.category
        }),
      });

      if (!response.ok) throw new Error('Failed to save gallery item');

      toast.success(editingItem ? 'Gallery updated' : 'Gallery item created');
      setShowGalleryForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
      loadData();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save gallery item');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;

    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${encodeURIComponent(id)}`);
      toast.success('Gallery item deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete gallery item');
    }
  };

  const handleBulkDeleteGallery = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} gallery items?`)) return;

    try {
      await safeBulkDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery`, ids);
      toast.success(`${ids.length} gallery items deleted`);
      setSelectedGallery([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete gallery items');
    }
  };

  // Contact handlers
  const handleUpdateContactStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleReplyContact = async (contactId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${contactId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ message: replyMessage }),
        }
      );

      if (!response.ok) throw new Error('Failed to send reply');

      toast.success('Reply sent successfully');
      setReplyMessage('');
      setViewingItem(null);
      handleUpdateContactStatus(contactId, 'responded');
    } catch (err: any) {
      console.error('Reply error:', err);
      toast.error(err.message || 'Failed to send reply');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Delete this contact message?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete contact');

      toast.success('Contact deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete contact');
    }
  };

  const handleBulkDeleteContacts = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} contact messages?`)) return;

    try {
      await Promise.all(
        ids.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          )
        )
      );

      toast.success(`${ids.length} contacts deleted`);
      setSelectedContacts([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete contacts');
    }
  };

  // Volunteer handlers
  const handleUpdateVolunteerStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Status updated');
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    if (!confirm('Delete this volunteer application?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete volunteer');

      toast.success('Volunteer deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete volunteer');
    }
  };

  const handleBulkDeleteVolunteers = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} volunteer applications?`)) return;

    try {
      await safeBulkDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers`, ids);

      toast.success(`${ids.length} volunteers deleted`);
      setSelectedVolunteers([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete volunteers');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete this team member?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team/${encodeURIComponent(id)}`);
      toast.success('Team member deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete team member');
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Delete this story?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories/${encodeURIComponent(id)}`);
      toast.success('Story deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete story');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports/${encodeURIComponent(id)}`);
      toast.success('Report deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete report');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events/${encodeURIComponent(id)}`);
      toast.success('Event deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners/${encodeURIComponent(id)}`);
      toast.success('Partner deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete partner');
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!confirm('Delete this opportunity?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities/${encodeURIComponent(id)}`);
      toast.success('Opportunity deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete opportunity');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs/${encodeURIComponent(id)}`);
      toast.success('FAQ deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete FAQ');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await safeDelete(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources/${encodeURIComponent(id)}`);
      toast.success('Resource deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete resource');
    }
  };

  // User Management Handlers
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }

    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${editingItem.value.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(userFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      toast.success(editingItem ? 'User updated successfully' : 'User created successfully');
      setShowUserForm(false);
      setEditingItem(null);
      setUserFormData({ name: '', email: '', password: '', role: 'viewer', status: 'active' });
      loadData();
    } catch (err: any) {
      console.error('User save error:', err);
      toast.error(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete user');

      toast.success('User deleted successfully');
      loadData();
    } catch (err: any) {
      console.error('Delete user error:', err);
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleBulkDeleteUsers = async (ids: string[]) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }
    if (!confirm(`Delete ${ids.length} users? This action cannot be undone.`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete users');

      toast.success(`${ids.length} users deleted`);
      setSelectedUsers([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete users');
    }
  };

  const handleBulkUpdateUserRole = async (ids: string[], role: string) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/bulk-role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids, role }),
        }
      );

      if (!response.ok) throw new Error('Failed to update roles');

      toast.success(`Role updated for ${ids.length} users`);
      setSelectedUsers([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk role update error:', err);
      toast.error(err.message || 'Failed to update roles');
    }
  };

  const handleBulkUpdateUserStatus = async (ids: string[], status: string) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/bulk-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids, status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Status updated for ${ids.length} users`);
      setSelectedUsers([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk status update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to manage users');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      if (!response.ok) throw new Error('Failed to reset password');

      toast.success('Password reset successfully');
      setShowPasswordResetDialog(false);
      setNewPassword('');
      setViewingItem(null);
    } catch (err: any) {
      console.error('Password reset error:', err);
      toast.error(err.message || 'Failed to reset password');
    }
  };

  // Filter functions
  const getFilteredContacts = () => {
    if (contactFilter === 'all') return contacts;
    return contacts.filter(c => c.value.status === contactFilter);
  };

  const getFilteredVolunteers = () => {
    if (volunteerFilter === 'all') return volunteers;
    return volunteers.filter(v => v.value.status === volunteerFilter);
  };

  const getFilteredUsers = () => {
    let filtered = adminUsers;

    // Filter by status
    if (userFilter !== 'all') {
      filtered = filtered.filter(u => u.value.status === userFilter);
    }

    // Filter by role
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(u => u.value.role === userRoleFilter);
    }

    // Search by name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.value.name?.toLowerCase().includes(query) ||
        u.value.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'editor': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl overflow-hidden shadow-2xl border-0">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-7/12 p-8 md:p-12">
              <div className="max-w-md">
                <div className="mb-8">
                  <p className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
                    Secure Admin Access
                  </p>
                  <h1 className="text-3xl md:text-4xl text-gray-900 mt-4 mb-3 leading-tight">
                    {isSignup ? 'Create your admin account' : 'Welcome back, admin'}
                  </h1>
                  <p className="text-gray-600">
                    {isSignup ? 'Set up your credentials to manage programs, stories, volunteers, and more.' : 'Sign in to manage your organization’s content and stay connected with your community.'}
                  </p>
                </div>

                <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                  {isSignup && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-lg transition shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Please wait...
                      </div>
                    ) : (
                      isSignup ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
                  >
                    {isSignup
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full md:w-5/12 bg-emerald-600/5 border-l border-emerald-100 flex items-center justify-center p-10">
              <div className="text-center space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl mx-auto w-full max-w-xs">
                  <img
                    src={siteLogoUrl}
                    alt={`${siteTitle} Logo`}
                    className="h-40 md:h-48 lg:h-56 w-auto mx-auto object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl text-emerald-700">{siteTitle}</h2>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto">{siteTagline}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Get current menu item
  const currentMenuItem = NAVIGATION_ITEMS.find(item => item.id === activeTab);
  const CurrentIcon = currentMenuItem?.icon || LayoutDashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {sidebarOpen ? <XIcon size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-4">
              <img src={siteLogoUrl} alt={`${siteTitle} Logo`} className="h-16 md:h-20 w-auto object-contain drop-shadow-sm" />
              <div className="hidden md:block">
                <h1 className="text-lg text-gray-900">{siteTitle}</h1>
                <p className="text-xs text-gray-500">{siteTagline}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-48"
              />
            </div>

            {canManageUsers && (
              <Button
                onClick={() => {
                  setActiveTab('users');
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                size="sm"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Shield size={16} />
                Manage Users
              </Button>
            )}

            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 border-l pl-3">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-900">{userName || 'Admin User'}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole.replace('-', ' ')}</p>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-emerald-500 ring-offset-2">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto mt-16`}>
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-xs uppercase text-gray-500 mb-3 px-3">Navigation</h3>
              <nav className="space-y-1">
                {NAVIGATION_ITEMS
                  .filter((item) => !item.requiresUserManagement || canManageUsers)
                  .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : item.color} />
                      <span className="text-sm">{item.label}</span>
                      {isActive && <ChevronRight size={16} className="ml-auto" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Role Info */}
            <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-emerald-600" />
                <span className="text-sm text-gray-900">Access Level</span>
              </div>
              <Badge className={`${getRoleBadgeColor(userRole)} border text-xs`}>
                {USER_ROLES.find(r => r.value === userRole)?.label || userRole}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100`}>
                <CurrentIcon size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl text-gray-900">{currentMenuItem?.label}</h2>
                <p className="text-gray-500 text-sm">Manage and monitor your {currentMenuItem?.label.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'overview' && stats && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="text-blue-600" size={24} />
                      <Badge variant="secondary">{dashboardStats.totalPrograms}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{dashboardStats.totalPrograms.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">Total Programs</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <Newspaper className="text-purple-600" size={24} />
                      <Badge variant="secondary">{dashboardStats.totalNews}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{dashboardStats.totalNews.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">News Articles</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-rose-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="text-rose-600" size={24} />
                      <Badge variant="secondary">{dashboardStats.totalVolunteers}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{dashboardStats.totalVolunteers.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">Volunteers</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="text-emerald-600" size={24} />
                      <Badge variant="secondary">{dashboardStats.totalDonationsCount}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">
                      ${dashboardStats.totalDonationAmount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">Total Donations</p>
                  </Card>
                </div>

                {/* Charts */}
                {analytics && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-emerald-600" />
                        Monthly Donations
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.monthlyDonations}>
                          <defs>
                            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip />
                          <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorDonations)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Contact Status Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.contactStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.contactStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <Heart size={20} className="text-rose-600" />
                        Volunteer Applications
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.volunteerStatusData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-600" />
                        Growth Trends
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.growthTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>
                )}

                {/* Quick Actions */}
                <Card className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                  <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button onClick={() => setActiveTab('programs')} variant="outline" className="justify-start">
                      <FileText size={16} className="mr-2" />
                      Add Program
                    </Button>
                    <Button onClick={() => setActiveTab('news')} variant="outline" className="justify-start">
                      <Newspaper size={16} className="mr-2" />
                      Add News
                    </Button>
                    <Button onClick={() => setActiveTab('gallery')} variant="outline" className="justify-start">
                      <ImageIcon size={16} className="mr-2" />
                      Add Image
                    </Button>
                    <Button onClick={() => setActiveTab('team')} variant="outline" className="justify-start">
                      <Users size={16} className="mr-2" />
                      Add Team Member
                    </Button>
                    {canManageUsers && (
                      <Button onClick={() => setActiveTab('users')} variant="outline" className="justify-start">
                        <Shield size={16} className="mr-2" />
                        Manage Users
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Programs Management */}
            {activeTab === 'programs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Programs ({programs.length})</h3>
                    <p className="text-sm text-gray-500">Manage your community programs</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowProgramForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Program
                  </Button>
                </div>

                {selectedPrograms.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedPrograms.length} selected</span>
                    <Button
                      onClick={() => handleBulkDeletePrograms(selectedPrograms)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Selected
                    </Button>
                    <Button
                      onClick={() => setSelectedPrograms([])}
                      variant="outline"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}

                <div className="grid gap-4">
                  {programs.map((program) => (
                    <Card key={program.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedPrograms.includes(program.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPrograms([...selectedPrograms, program.key]);
                            } else {
                              setSelectedPrograms(selectedPrograms.filter(id => id !== program.key));
                            }
                          }}
                          className="mt-1"
                        />
                        {program.value.image && (
                          <img src={program.value.image} alt={program.value.title} className="w-24 h-24 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg text-gray-900 mb-1">{program.value.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{program.value.description}</p>
                          <Badge>{program.value.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(program);
                              setFormData(program.value);
                              setShowProgramForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteProgram(program.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {programs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No programs yet. Create your first program!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* News Management */}
            {activeTab === 'news' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">News Articles ({news.length})</h3>
                    <p className="text-sm text-gray-500">Manage news and updates</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowNewsForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add News
                  </Button>
                </div>

                {selectedNews.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedNews.length} selected</span>
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

                <div className="grid gap-4">
                  {news.map((item) => {
                    const publishedAt = resolveNewsDate(item.value);

                    return (
                      <Card key={item.key} className="p-6 hover:shadow-lg transition">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedNews.includes(item.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNews([...selectedNews, item.key]);
                              } else {
                                setSelectedNews(selectedNews.filter(id => id !== item.key));
                              }
                            }}
                            className="mt-1"
                          />
                          {item.value.image && (
                            <img src={item.value.image} alt={item.value.title} className="w-24 h-24 object-cover rounded-lg" />
                          )}
                          <div className="flex-1">
                            <h4 className="text-lg text-gray-900 mb-1">{item.value.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{item.value.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge>{item.value.category}</Badge>
                              <span className="text-xs text-gray-400">
                                {publishedAt ? publishedAt.toLocaleDateString() : 'Date not set'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setEditingItem(item);
                                setFormData(item.value);
                                setShowNewsForm(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Edit size={14} className="mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteNews(item.key)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {news.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No news articles yet. Create your first article!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Management */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Gallery ({gallery.length})</h3>
                    <p className="text-sm text-gray-500">Manage images and media</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowGalleryForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Image
                  </Button>
                </div>

                {selectedGallery.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedGallery.length} selected</span>
                    <Button
                      onClick={() => handleBulkDeleteGallery(selectedGallery)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Selected
                    </Button>
                    <Button onClick={() => setSelectedGallery([])} variant="outline" size="sm">
                      Clear Selection
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <Card key={item.key} className="p-4 hover:shadow-lg transition">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedGallery.includes(item.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGallery([...selectedGallery, item.key]);
                            } else {
                              setSelectedGallery(selectedGallery.filter(id => id !== item.key));
                            }
                          }}
                          className="absolute top-2 left-2 z-10"
                        />
                        <img src={item.value.imageUrl || item.value.image} alt={item.value.title} className="w-full h-48 object-cover rounded-lg mb-3" />
                      </div>
                      <h4 className="text-sm text-gray-900 mb-1 truncate">{item.value.title}</h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.value.description}</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({ ...item.value, image: item.value.imageUrl || item.value.image });
                            setShowGalleryForm(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit size={12} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteGallery(item.key)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No images yet. Upload your first image!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Management */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Team Members ({team.length})</h3>
                    <p className="text-sm text-gray-500">Manage your team</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowTeamForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Team Member
                  </Button>
                </div>

                <div className="grid gap-4">
                  {team.map((member) => (
                    <Card key={member.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        {member.value.image && (
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={member.value.image} alt={member.value.name} />
                            <AvatarFallback>{member.value.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg text-gray-900 mb-1">{member.value.name}</h4>
                          <p className="text-sm text-emerald-600 mb-2">{member.value.role}</p>
                          <p className="text-sm text-gray-600">{member.value.bio}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(member.value);
                              setShowTeamForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteTeam(member.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {team.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No team members yet. Add your first team member!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Management */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Contact Messages ({getFilteredContacts().length})</h3>
                    <p className="text-sm text-gray-500">Manage incoming messages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                    </select>
                  </div>
                </div>

                {selectedContacts.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedContacts.length} selected</span>
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

                <div className="grid gap-4">
                  {getFilteredContacts().map((contact) => (
                    <Card key={contact.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts([...selectedContacts, contact.key]);
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.key));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-gray-900">{contact.value.name}</h4>
                            <Badge className={
                              contact.value.status === 'new' ? 'bg-blue-100 text-blue-700' :
                              contact.value.status === 'read' ? 'bg-gray-100 text-gray-700' :
                              'bg-green-100 text-green-700'
                            }>
                              {contact.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{contact.value.email}</p>
                          <p className="text-sm text-gray-700 mb-2">{contact.value.message}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(contact.value.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setViewingItem(contact)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => {
                              setViewingItem(contact);
                              handleUpdateContactStatus(contact.key, 'read');
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Reply size={14} className="mr-1" />
                            Reply
                          </Button>
                          <Button
                            onClick={() => handleDeleteContact(contact.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {getFilteredContacts().length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Mail size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No contact messages</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Volunteers Management */}
            {activeTab === 'volunteers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Volunteer Applications ({getFilteredVolunteers().length})</h3>
                    <p className="text-sm text-gray-500">Manage volunteer registrations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={volunteerFilter}
                      onChange={(e) => setVolunteerFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {selectedVolunteers.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedVolunteers.length} selected</span>
                    <Button
                      onClick={() => handleBulkDeleteVolunteers(selectedVolunteers)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Selected
                    </Button>
                    <Button onClick={() => setSelectedVolunteers([])} variant="outline" size="sm">
                      Clear Selection
                    </Button>
                  </div>
                )}

                <div className="grid gap-4">
                  {getFilteredVolunteers().map((volunteer) => (
                    <Card key={volunteer.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.includes(volunteer.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVolunteers([...selectedVolunteers, volunteer.key]);
                            } else {
                              setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.key));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-gray-900">{volunteer.value.name}</h4>
                            <Badge className={
                              volunteer.value.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              volunteer.value.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {volunteer.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{volunteer.value.email} • {volunteer.value.phone}</p>
                          <p className="text-sm text-gray-700 mb-2">Skills: {volunteer.value.skills}</p>
                          <span className="text-xs text-gray-400">
                            Applied: {new Date(volunteer.value.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'approved')}
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                          >
                            <Check size={14} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'rejected')}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <X size={14} className="mr-1" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleDeleteVolunteer(volunteer.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {getFilteredVolunteers().length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No volunteer applications</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Donations Management */}
            {activeTab === 'donations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Donations ({donations.length})</h3>
                    <p className="text-sm text-gray-500">View donation records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Donations</p>
                    <p className="text-2xl text-emerald-600">
                      ${donations.reduce((sum, d) => sum + (d.value.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {donations.map((donation) => (
                    <Card key={donation.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-gray-900">{donation.value.name}</h4>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              ${donation.value.amount}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{donation.value.email}</p>
                          <p className="text-sm text-gray-700">Payment: {donation.value.payment_method}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(donation.value.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {donations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No donations yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscribers Management */}
            {activeTab === 'subscribers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Newsletter Subscribers ({subscribers.length})</h3>
                    <p className="text-sm text-gray-500">Manage newsletter subscribers</p>
                  </div>
                  <Button variant="outline">
                    <Download size={16} className="mr-2" />
                    Export List
                  </Button>
                </div>

                <div className="grid gap-4">
                  {subscribers.map((subscriber) => (
                    <Card key={subscriber.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg text-gray-900">{subscriber.value.email}</p>
                          <span className="text-xs text-gray-400">
                            Subscribed: {new Date(subscriber.value.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                    </Card>
                  ))}
                  {subscribers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Send size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No subscribers yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && canManageUsers && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">User Management ({getFilteredUsers().length})</h3>
                    <p className="text-sm text-gray-500">Manage admin users and permissions</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setUserFormData({ name: '', email: '', password: '', role: 'viewer', status: 'active' });
                      setShowUserForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add User
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Filters:</span>
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="px-3 py-1.5 border rounded-lg text-sm flex-1 min-w-[200px]"
                  />
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-gray-700">{selectedUsers.length} selected</span>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleBulkDeleteUsers(selectedUsers)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete Selected
                      </Button>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkUpdateUserRole(selectedUsers, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      >
                        <option value="">Change Role...</option>
                        <option value="super-admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkUpdateUserStatus(selectedUsers, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      >
                        <option value="">Change Status...</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <Button onClick={() => setSelectedUsers([])} variant="outline" size="sm">
                      Clear Selection
                    </Button>
                  </div>
                )}

                {/* Users Table */}
                <div className="grid gap-4">
                  {getFilteredUsers().map((user) => (
                    <Card key={user.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.key]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.key));
                            }
                          }}
                          className="mt-1"
                        />
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            {getUserInitials(user.value.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{user.value.name}</h4>
                            <Badge className={getRoleBadgeColor(user.value.role)}>
                              {USER_ROLES.find(r => r.value === user.value.role)?.label}
                            </Badge>
                            <Badge className={
                              user.value.status === 'active'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }>
                              {user.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{user.value.email}</p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(user.value.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
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
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              setViewingItem(user);
                              setShowPasswordResetDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Shield size={14} className="mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.value.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {getFilteredUsers().length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                    <SiteSettingsTab settings={siteSettings} onUpdate={() => {
                      loadData();
                      fetchSiteSettings();
                    }} />
                  )}

            {/* Stories Management */}
            {activeTab === 'stories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Impact Stories ({stories.length})</h3>
                    <p className="text-sm text-gray-500">Share success stories and testimonials</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowStoryForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Story
                  </Button>
                </div>

                <div className="grid gap-4">
                  {stories.map((story) => (
                    <Card key={story.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        {story.value.image && (
                          <img src={story.value.image} alt={story.value.name} className="w-24 h-24 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{story.value.title}</h4>
                            <Badge>{story.value.category}</Badge>
                          </div>
                          <p className="text-sm text-emerald-600 mb-2">{story.value.name}</p>
                          <div className="text-sm text-gray-600 prose prose-sm" dangerouslySetInnerHTML={{ __html: story.value.story?.substring(0, 150) + '...' }} />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(story.value);
                              setShowStoryForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteStory(story.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {stories.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No impact stories yet. Share your first success story!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Impact Stats Management */}
            {activeTab === 'impact' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Impact Statistics</h3>
                    <p className="text-sm text-gray-500">Update your organization's impact numbers</p>
                  </div>
                  <Button
                    onClick={() => setShowImpactForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Edit size={16} className="mr-2" />
                    Update Stats
                  </Button>
                </div>

                {impactStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-emerald-600 mb-2">{impactStats.value?.peopleServed?.toLocaleString() || 0}</h4>
                      <p className="text-sm text-gray-600">People Served</p>
                    </Card>
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-blue-600 mb-2">{impactStats.value?.programsActive || 0}</h4>
                      <p className="text-sm text-gray-600">Active Programs</p>
                    </Card>
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-purple-600 mb-2">{impactStats.value?.volunteersActive || 0}</h4>
                      <p className="text-sm text-gray-600">Active Volunteers</p>
                    </Card>
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-green-600 mb-2">${impactStats.value?.fundsRaised?.toLocaleString() || 0}</h4>
                      <p className="text-sm text-gray-600">Funds Raised</p>
                    </Card>
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-orange-600 mb-2">{impactStats.value?.communitiesReached || 0}</h4>
                      <p className="text-sm text-gray-600">Communities Reached</p>
                    </Card>
                    <Card className="p-6 text-center">
                      <h4 className="text-3xl text-teal-600 mb-2">{impactStats.value?.successRate || 0}%</h4>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Annual Reports ({reports.length})</h3>
                    <p className="text-sm text-gray-500">Manage annual and financial reports</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowReportForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Report
                  </Button>
                </div>

                <div className="grid gap-4">
                  {reports.map((report) => (
                    <Card key={report.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{report.value.title}</h4>
                            <Badge>{report.value.year}</Badge>
                            {report.value.fileSize && <Badge variant="outline">{report.value.fileSize}</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.value.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(report.value.fileUrl, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => handleDeleteReport(report.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Download size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No reports yet. Add your first annual report!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Management */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Events ({events.length})</h3>
                    <p className="text-sm text-gray-500">Manage upcoming and past events</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowEventForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Event
                  </Button>
                </div>

                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        {event.value.image && (
                          <img src={event.value.image} alt={event.value.title} className="w-24 h-24 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{event.value.title}</h4>
                            <Badge className={
                              event.value.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                              event.value.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              event.value.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {event.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.value.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📅 {event.value.date}</span>
                            <span>🕐 {event.value.time}</span>
                            <span>📍 {event.value.location}</span>
                            <span>👥 {event.value.capacity} capacity</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(event.value);
                              setShowEventForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteEvent(event.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No events yet. Create your first event!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Partners Management */}
            {activeTab === 'partners' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Partners ({partners.length})</h3>
                    <p className="text-sm text-gray-500">Manage partner organizations</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowPartnerForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Partner
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {partners.map((partner) => (
                    <Card key={partner.key} className="p-6 hover:shadow-lg transition text-center">
                      {partner.value.logo && (
                        <img src={partner.value.logo} alt={partner.value.name} className="h-16 w-auto mx-auto mb-3 object-contain" />
                      )}
                      <h4 className="text-sm text-gray-900 mb-1">{partner.value.name}</h4>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{partner.value.description}</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => {
                            setEditingItem(partner.value);
                            setShowPartnerForm(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          onClick={() => handleDeletePartner(partner.key)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {partners.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Handshake size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No partners yet. Add your first partner organization!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opportunities Management */}
            {activeTab === 'opportunities' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Opportunities ({opportunities.length})</h3>
                    <p className="text-sm text-gray-500">Manage volunteer opportunities</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowOpportunityForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Opportunity
                  </Button>
                </div>

                <div className="grid gap-4">
                  {opportunities.map((opp) => (
                    <Card key={opp.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{opp.value.title}</h4>
                            <Badge>{opp.value.category || opp.value.type || 'General'}</Badge>
                            {opp.value.urgent && <Badge className="bg-red-100 text-red-700">Urgent</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{opp.value.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📍 {opp.value.location}</span>
                            <span>🕐 {opp.value.commitment}</span>
                            {opp.value.spotsAvailable && <span>👥 {opp.value.spotsAvailable} spots</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(opp.value);
                              setShowOpportunityForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteOpportunity(opp.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Target size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No opportunities yet. Create your first volunteer opportunity!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAQs Management */}
            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">FAQs ({faqs.length})</h3>
                    <p className="text-sm text-gray-500">Manage frequently asked questions</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowFAQForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add FAQ
                  </Button>
                </div>

                <div className="grid gap-4">
                  {faqs.map((faq) => (
                    <Card key={faq.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-gray-900">{faq.value.question}</h4>
                            <Badge>{faq.value.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{faq.value.answer}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingItem(faq.value);
                              setShowFAQForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteFAQ(faq.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {faqs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No FAQs yet. Add your first question and answer!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources Management */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-gray-900">Resources ({resources.length})</h3>
                    <p className="text-sm text-gray-500">Manage downloadable resources</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowResourceForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Resource
                  </Button>
                </div>

                <div className="grid gap-4">
                  {resources.map((resource) => (
                    <Card key={resource.key} className="p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-gray-900">{resource.value.title}</h4>
                            <Badge>{resource.value.type}</Badge>
                            {resource.value.fileSize && <Badge variant="outline">{resource.value.fileSize}</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{resource.value.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(resource.value.fileUrl, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingItem(resource.value);
                              setShowResourceForm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            onClick={() => handleDeleteResource(resource.key)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {resources.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No resources yet. Add your first downloadable resource!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Program Form Dialog */}
      <Dialog open={showProgramForm} onOpenChange={setShowProgramForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Program' : 'Add Program'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProgram} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Content</label>
              <ReactQuill
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                className="bg-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="environment">Environment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleImageUpload(e.target.files[0]);
                    if (url) setFormData({ ...formData, image: url });
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowProgramForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* News Form Dialog */}
      <Dialog open={showNewsForm} onOpenChange={setShowNewsForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit News' : 'Add News'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitNews} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Content</label>
              <ReactQuill
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                className="bg-white"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="events">Events</option>
                <option value="announcements">Announcements</option>
                <option value="success-stories">Success Stories</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleImageUpload(e.target.files[0]);
                    if (url) setFormData({ ...formData, image: url });
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowNewsForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Form Dialog */}
      <Dialog open={showGalleryForm} onOpenChange={setShowGalleryForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Image' : 'Add Image'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitGallery} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="events">Events</option>
                <option value="projects">Projects</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const url = await handleImageUpload(e.target.files[0]);
                    if (url) setFormData({ ...formData, image: url });
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
                required={!editingItem}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowGalleryForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact View/Reply Dialog */}
      {viewingItem && activeTab === 'contacts' && (
        <Dialog open={!!viewingItem} onOpenChange={() => {
          setViewingItem(null);
          setReplyMessage('');
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Contact Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">From</p>
                <p className="text-base">{viewingItem.value.name}</p>
                <p className="text-sm text-gray-600">{viewingItem.value.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Message</p>
                <p className="text-base">{viewingItem.value.message}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Received</p>
                <p className="text-sm">{new Date(viewingItem.value.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Reply</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Type your reply..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setViewingItem(null);
                  setReplyMessage('');
                }}>
                  Close
                </Button>
                <Button
                  onClick={() => handleReplyContact(viewingItem.key)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send size={16} className="mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitUser} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
                disabled={!!editingItem}
              />
              {editingItem && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              )}
            </div>
            {!editingItem && (
              <div>
                <label className="block text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
            )}
            <div>
              <label className="block text-sm mb-2">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {USER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Status</label>
              <select
                value={userFormData.status}
                onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingItem ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">User</p>
                <p className="text-base">{viewingItem.value.name}</p>
                <p className="text-sm text-gray-600">{viewingItem.value.email}</p>
              </div>
              <div>
                <label className="block text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter new password"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordResetDialog(false);
                    setNewPassword('');
                    setViewingItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleResetPassword(viewingItem.value.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialogs from AdminFormDialogs */}
      {showTeamForm && (
        <TeamFormDialog
          show={showTeamForm}
          onClose={() => {
            setShowTeamForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showStoryForm && (
        <StoryFormDialog
          show={showStoryForm}
          onClose={() => {
            setShowStoryForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showImpactForm && (
        <ImpactStatsFormDialog
          show={showImpactForm}
          onClose={() => setShowImpactForm(false)}
          currentStats={impactStats?.value}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showReportForm && (
        <ReportFormDialog
          show={showReportForm}
          onClose={() => {
            setShowReportForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showEventForm && (
        <EventFormDialog
          show={showEventForm}
          onClose={() => {
            setShowEventForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showPartnerForm && (
        <PartnerFormDialog
          show={showPartnerForm}
          onClose={() => {
            setShowPartnerForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showOpportunityForm && (
        <OpportunityFormDialog
          show={showOpportunityForm}
          onClose={() => {
            setShowOpportunityForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
          categoryOptions={siteSettings?.categories?.opportunities}
        />
      )}

      {showFAQForm && (
        <FAQFormDialog
          show={showFAQForm}
          onClose={() => {
            setShowFAQForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}

      {showResourceForm && (
        <ResourceFormDialog
          show={showResourceForm}
          onClose={() => {
            setShowResourceForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
        />
      )}
    </div>
  );
}
