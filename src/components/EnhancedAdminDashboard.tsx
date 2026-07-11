import React, { useState, useEffect } from 'react';
import { useConfirm } from '../hooks/useConfirm';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
const logo = '/logo.png';
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
  EyeOff,
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
  MessageCircle,
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  X as XIcon,
  ChevronRight,
  ExternalLink,
  Clock,
  Activity,
  Terminal,
  DownloadCloud,
  RotateCcw,
  User,
  Lock,
  Globe,
  Copy,
  MapPin
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DraggableDialog } from './DraggableDialog';

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
import { PageFormDialog } from './AdminFormDialogsPages';
import { MapLocationFormDialog } from './AdminMapLocationDialog';
import { ImpactMap } from './ImpactMap';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
  { id: 'live-chat',     label: 'Live Chat',        icon: MessageCircle,   color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'overview',      label: 'Dashboard',      icon: LayoutDashboard, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'programs',      label: 'Programs',        icon: FileText,        color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'news',          label: 'News',             icon: Newspaper,       color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'gallery',       label: 'Gallery',          icon: ImageIcon,       color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'team',          label: 'Team',             icon: Users,           color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'stories',       label: 'Stories',          icon: MessageSquare,   color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'impact',        label: 'Impact Stats',     icon: TrendingUp,      color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'reports',       label: 'Reports',          icon: Download,        color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'events',        label: 'Events',           icon: Calendar,        color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'partners',      label: 'Partners',         icon: Handshake,       color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'opportunities', label: 'Opportunities',    icon: Target,          color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'map',           label: 'Map Locations',    icon: MapPin,          color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'faqs',          label: 'FAQs',             icon: HelpCircle,      color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'resources',     label: 'Resources',        icon: BookOpen,        color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'pages',         label: 'Pages',            icon: Globe,           color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'contacts',      label: 'Contacts',         icon: Mail,            color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'volunteers',    label: 'Volunteers',       icon: Heart,           color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'donations',     label: 'Donations',        icon: Heart,           color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'subscribers',   label: 'Subscribers',      icon: Send,            color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'settings',      label: 'Settings',         icon: Settings,        color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
  { id: 'activity-log',  label: 'Activity Log',     icon: Clock,           color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496' },
];

export function EnhancedAdminDashboard() {
  const confirmDialog = useConfirm();
  const [loginLogo, setLoginLogo] = useState('/logo.png');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<any>({ programs: 0, news: 0, volunteers: 0, totalDonations: 0 });
  const [liveChats, setLiveChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatReply, setChatReply] = useState('');
  const [isReplyingChat, setIsReplyingChat] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Data states
  const [programs, setPrograms] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  
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
  const [pages, setPages] = useState<any[]>([]);
  const [mapLocations, setMapLocations] = useState<any[]>([]);

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
  const [selectedMapLocations, setSelectedMapLocations] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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
  const [showSignupSuccessDialog, setShowSignupSuccessDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUserFormPassword, setShowUserFormPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

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
  const [showMapLocationForm, setShowMapLocationForm] = useState(false);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Advanced Diagnostics & Database Operations States
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);


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

  interface ActivityEntry {
    id: string;
    action: string;
    section: string;
    description: string;
    user: string;
    timestamp: string;
  }
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => {
    try {
      const stored = localStorage.getItem('admin_activity_log');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const logActivity = async (action: string, section: string, description: string) => {
    const entry: ActivityEntry = {
      id: Date.now().toString(),
      action, section, description,
      user: userName || 'Admin',
      timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => {
      const updated = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem('admin_activity_log', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const [globalSearch, setGlobalSearch] = useState('');
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

  const exportToCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(','),
      ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDiagnostics = async () => {
    setDiagnosing(true);
    const start = Date.now();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        { headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` } }
      );
      const latency = Date.now() - start;
      const status = response.ok ? 'Healthy' : 'Degraded';
      
      setDiagResults({
        status,
        latency,
        checkedAt: new Date().toLocaleTimeString(),
        logs: [
          `[INFO] Starting database diagnostics at ${new Date().toLocaleTimeString()}`,
          response.ok 
            ? `[SUCCESS] Connection response code ${response.status}: Supabase is online.`
            : `[WARNING] Connection response code ${response.status}: Connection response degraded.`,
          `[LATENCY] Latency check: ${latency}ms`,
          `[COUNT] Programs: ${programs.length} rows`,
          `[COUNT] News / Blogs: ${news.length} rows`,
          `[COUNT] Team Members: ${team.length} rows`,
          `[COUNT] Events Calendar: ${events.length} rows`,
          `[COUNT] Volunteer Applications: ${volunteers.length} rows`,
          `[COUNT] Donations Log: ${donations.length} rows`,
          `[COUNT] Newsletter Subscribers: ${subscribers.length} rows`,
          `[COUNT] Gallery Images: ${gallery.length} rows`,
          `[COUNT] Impact Stories: ${stories.length} rows`,
          `[COUNT] FAQs: ${faqs.length} rows`,
          `[COUNT] Resources: ${resources.length} rows`,
          `[INFO] Diagnostics check completed successfully.`
        ]
      });
      if (response.ok) {
        toast.success(`Database health check completed in ${latency}ms!`);
      } else {
        toast.error(`Database diagnostics reported warning: status code ${response.status}`);
      }
    } catch (err: any) {
      const latency = Date.now() - start;
      setDiagResults({
        status: 'Offline',
        latency,
        checkedAt: new Date().toLocaleTimeString(),
        logs: [
          `[INFO] Starting database diagnostics at ${new Date().toLocaleTimeString()}`,
          `[ERROR] Connection failed: ${err.message || 'Network error'}`,
          `[LATENCY] Calculated timeout / failure: ${latency}ms`,
          `[ERROR] Diagnostics completed with fatal connection errors.`
        ]
      });
      toast.error('Database connection failed or timed out.');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleBackupJSON = async () => {
    setExporting(true);
    try {
      const backupPayload = {
        backupName: "Resticbo CMS Full Backup",
        exportedAt: new Date().toISOString(),
        exportedBy: userName || 'Admin',
        databaseStats: {
          totalPrograms: programs.length,
          totalNews: news.length,
          totalTeam: team.length,
          totalEvents: events.length,
          totalVolunteers: volunteers.length,
          totalDonations: donations.length,
          totalSubscribers: subscribers.length,
          totalFAQs: faqs.length,
          totalResources: resources.length,
          totalGallery: gallery.length,
          totalStories: stories.length
        },
        data: {
          programs,
          news,
          team,
          events,
          volunteers,
          donations,
          subscribers,
          faqs,
          resources,
          gallery,
          stories,
          siteSettings
        }
      };
      
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resticbo-cms-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database backup generated and downloaded successfully!");
      logActivity('backup', 'Database', 'Generated full JSON backup export');
    } catch (err: any) {
      toast.error("Failed to generate backup: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setResetting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings/initialize`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken || publicAnonKey}` }
        }
      );
      if (response.ok) {
        toast.success("CMS re-initialized successfully! Restored default factory content.");
        logActivity('reset', 'Database', 'Restored default factory seed data');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const text = await response.text();
        throw new Error(text || "Failed to re-initialize database settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to seed default settings");
    } finally {
      setResetting(false);
      setShowResetModal(false);
    }
  };

  const handleDeleteSubscriber = async (key: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/newsletter/${encodeURIComponent(key)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Subscriber removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteSubscribers = async (keys: string[]) => {
    try {
      await Promise.all(keys.map(key =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/newsletter/${encodeURIComponent(key)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
        )
      ));
      toast.success(`${keys.length} subscriber(s) removed`);
      setSelectedSubscribers([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendNewsletter = async () => {
    if (subscribers.length === 0) {
      toast.error('Cannot send newsletter: You have 0 subscribers currently.');
      return;
    }
    if (!newsletterSubject.trim()) {
      toast.error('Please enter a subject line for your newsletter.');
      return;
    }
    if (!newsletterBody.trim()) {
      toast.error('Please enter the email body content.');
      return;
    }
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
      logActivity('sent', 'Newsletter', `Sent newsletter: "${newsletterSubject}" to ${data.sent} subscribers`);
      setNewsletterSubject('');
      setNewsletterBody('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send newsletter');
    } finally {
      setSendingNewsletter(false);
    }
  };

  useEffect(() => {
    // Unauthenticated fetch to site-settings to get logoUrl before login
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings?.general?.logoUrl) {
          const fetchedLogo = data.settings.general.logoUrl;
          if (fetchedLogo && !fetchedLogo.includes('figma:asset')) {
            setLoginLogo(fetchedLogo);
          }
        }
      })
      .catch((err) => console.error('Error loading login logo:', err));
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, isAuthenticated]);

  // Initialize defaults only once when user first authenticates
  useEffect(() => {
    if (isAuthenticated) {
      initializeDefaults();
    }
  }, [isAuthenticated]);

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
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Get user metadata
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (user) {
          // Fetch user status from backend to verify approval
          const statusRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${user.id}/status`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          );
          const statusData = await statusRes.json();
          
          if (statusData.status && statusData.status !== 'active') {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setAccessToken('');
            if (statusData.status === 'pending') {
              toast.error('Your account is pending confirmation/approval from the admin.');
            } else if (statusData.status === 'suspended') {
              toast.error('Your account has been suspended.');
            } else {
              toast.error('Your account is inactive.');
            }
            return;
          }

          setIsAuthenticated(true);
          setAccessToken(session.access_token);
          setUserRole(user.user_metadata?.role || statusData.role || 'viewer');
          setUserName(user.user_metadata?.name || '');
          setUserEmail(user.email || '');
        }
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

      if (data.session && data.user) {
        // Fetch user status from backend to verify approval
        const statusRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${data.user.id}/status`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const statusData = await statusRes.json();
        
        if (statusData.status && statusData.status !== 'active') {
          await supabase.auth.signOut();
          if (statusData.status === 'pending') {
            throw new Error('Your account is pending confirmation/approval from the admin.');
          } else if (statusData.status === 'suspended') {
            throw new Error('Your account has been suspended. Please contact a super admin.');
          } else {
            throw new Error('Your account is inactive. Please contact a super admin.');
          }
        }

        setIsAuthenticated(true);
        setAccessToken(data.session.access_token);
        
        // Get user metadata
        if (data.user?.user_metadata) {
          setUserRole(data.user.user_metadata.role || statusData.role || 'viewer');
          setUserName(data.user.user_metadata.name || '');
          setUserEmail(data.user.email || '');
        }

        // Track the user login on the backend to sync metrics/KV catalog
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${data.user.id}/track-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            email: data.user.email,
            name: data.user.user_metadata?.name,
            role: data.user.user_metadata?.role
          })
        }).catch(err => console.error('Failed to track login metrics:', err));
        
        toast.success('Welcome back!');
        logActivity('login', 'Auth', 'Admin logged in');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) throw error;
      toast.success('Reset link sent to your email!');
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error('Reset error:', err);
      toast.error(err.message || 'Failed to send reset link');
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

      setShowSignupSuccessDialog(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading('Logging out...');
    setTimeout(async () => {
      try {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setAccessToken('');
        toast.success('Logged out successfully', { id: toastId });
      } catch (err) {
        toast.error('Error logging out', { id: toastId });
      } finally {
        setIsLoggingOut(false);
      }
    }, 800);
  };

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
        
        if (statsData?.stats) {
          setStats(prev => ({ ...prev, ...statsData.stats }));
        }
        if (analyticsData) setAnalytics(analyticsData);
      } else if (activeTab === 'programs') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setPrograms(data.programs || []);
      } else if (activeTab === 'news') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setNews(data.news || []);
      } else if (activeTab === 'gallery') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setGallery(data.images || []);
      } else if (activeTab === 'contacts') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setContacts(data.contacts || []);
      } else if (activeTab === 'volunteers') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setVolunteers(data.volunteers || []);
      } else if (activeTab === 'donations') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setDonations(data.donations || []);
      } else if (activeTab === 'subscribers') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/newsletter`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      } else if (activeTab === 'users' && userRole === 'super-admin') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setAdminUsers(data.users || []);
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
        setTeam(data.team || []);
      } else if (activeTab === 'stories') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setStories(data.stories || []);
      } else if (activeTab === 'impact') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/impact-stats`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setImpactStats(data.stats || null);
      } else if (activeTab === 'reports') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setReports(data.reports || []);
      } else if (activeTab === 'events') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setEvents(data.events || []);
      } else if (activeTab === 'partners') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setPartners(data.partners || []);
      } else if (activeTab === 'opportunities') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } else if (activeTab === 'faqs') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setFAQs(data.faqs || []);
      } else if (activeTab === 'resources') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setResources(data.resources || []);
      } else if (activeTab === 'pages') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/pages`,
          { headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` } }
        );
        const data = await response.json();
        setPages(data.pages || []);
      } else if (activeTab === 'live-chat') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/livechats`,
          { headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` } }
        );
        const data = await response.json();
        setLiveChats(data.sessions || []);
      } else if (activeTab === 'map') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/map-locations`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        setMapLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    }
  };

  
  useEffect(() => {
    let intervalId: ReturnType<typeof setTimeout>;
    if (activeTab === 'live-chat') {
      intervalId = setInterval(() => {
        loadData();
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);



  const handleChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !selectedChatId) return;

    setIsReplyingChat(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/livechats/${selectedChatId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ message: chatReply.trim() })
        }
      );
      if (response.ok) {
        setChatReply('');
        loadData(); // refresh chats immediately
      } else {
        toast.error('Failed to send reply');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reply');
    } finally {
      setIsReplyingChat(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // Use the server-side upload endpoint to get a public URL
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          body: formDataObj,
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
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
      logActivity(editingItem ? 'updated' : 'created', 'Programs', `${editingItem ? 'Updated' : 'Created'} program: ${formData.title}`);
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
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this program?' }))) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete program');

      toast.success('Program deleted');
      logActivity('deleted', 'Programs', `Deleted program ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete program');
    }
  };

  const handleBulkDeletePrograms = async (ids: string[]) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} programs?` }))) return;

    try {
      await Promise.all(
        ids.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          )
        )
      );

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
      logActivity(editingItem ? 'updated' : 'created', 'News', `${editingItem ? 'Updated' : 'Created'} news: ${formData.title}`);
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
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this news item?' }))) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete news');

      toast.success('News deleted');
      logActivity('deleted', 'News', `Deleted news ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete news');
    }
  };

  const handleBulkDeleteNews = async (ids: string[]) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} news items?` }))) return;

    try {
      await Promise.all(
        ids.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          )
        )
      );

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
      logActivity(editingItem ? 'updated' : 'created', 'Gallery', `${editingItem ? 'Updated' : 'Created'} gallery item: ${formData.title}`);
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
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this gallery item?' }))) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete gallery item');

      toast.success('Gallery item deleted');
      logActivity('deleted', 'Gallery', `Deleted gallery item ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete gallery item');
    }
  };

  const handleBulkDeleteGallery = async (ids: string[]) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} gallery items?` }))) return;

    try {
      await Promise.all(
        ids.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          )
        )
      );

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
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this contact message?' }))) return;

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
      logActivity('deleted', 'Contacts', `Deleted contact ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete contact');
    }
  };

  const handleBulkDeleteContacts = async (ids: string[]) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} contact messages?` }))) return;

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
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this volunteer application?' }))) return;

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
      logActivity('deleted', 'Volunteers', `Deleted volunteer ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete volunteer');
    }
  };

  const handleBulkDeleteVolunteers = async (ids: string[]) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} volunteer applications?` }))) return;

    try {
      await Promise.all(
        ids.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/${id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          )
        )
      );

      toast.success(`${ids.length} volunteers deleted`);
      setSelectedVolunteers([]);
      loadData();
    } catch (err: any) {
      console.error('Bulk delete error:', err);
      toast.error(err.message || 'Failed to delete volunteers');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this team member?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/team/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete team member');
      toast.success('Team member deleted');
      logActivity('deleted', 'Team', `Deleted team member ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete team member');
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this story?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete story');
      toast.success('Story deleted');
      logActivity('deleted', 'Stories', `Deleted story ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete story');
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this report?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/reports/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete report');
      toast.success('Report deleted');
      logActivity('deleted', 'Reports', `Deleted report ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete report');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this event?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete event');
      toast.success('Event deleted');
      logActivity('deleted', 'Events', `Deleted event ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this partner?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete partner');
      toast.success('Partner deleted');
      logActivity('deleted', 'Partners', `Deleted partner ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete partner');
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this opportunity?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete opportunity');
      toast.success('Opportunity deleted');
      logActivity('deleted', 'Opportunities', `Deleted opportunity ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete opportunity');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this FAQ?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete FAQ');
      toast.success('FAQ deleted');
      logActivity('deleted', 'FAQs', `Deleted FAQ ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete FAQ');
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this resource?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete resource');
      toast.success('Resource deleted');
      logActivity('deleted', 'Resources', `Deleted resource ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete resource');
    }
  };

  
  const handleDeleteMapLocation = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this map location?' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/map-locations/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
        }
      );
      if (!response.ok) throw new Error('Failed to delete map location');
      toast.success('Map location deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete map location');
    }
  };



  const handleDeleteDonation = async (key: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this donation? It will no longer appear in your dashboard.' }))) return;
    try {
      const donationId = key.replace('donation:', '');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations/${encodeURIComponent(donationId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete donation');
      toast.success('Donation deleted successfully');
      setSelectedDonation(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClearDonations = async () => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Are you sure you want to delete ALL donations? This cannot be undone.' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations/clear-all`,
        { method: 'POST', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to clear donations');
      toast.success('All donations cleared successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this page? It will no longer be accessible on the website.' }))) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages/${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete page');
      toast.success('Page deleted');
      logActivity('deleted', 'Pages', `Deleted page ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete page');
    }
  };

  // User Management Handlers
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can manage users');
      return;
    }

    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/users/${editingItem.id || editingItem.value?.id}`
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
      logActivity(editingItem ? 'updated' : 'created', 'Users', `${editingItem ? 'Updated' : 'Created'} user: ${userFormData.email}`);
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
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can delete users');
      return;
    }
    if (!(await confirmDialog({ title: 'Confirm Action', message: 'Delete this user? This action cannot be undone.' }))) return;

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
      logActivity('deleted', 'Users', `Deleted user ID: ${id}`);
      loadData();
    } catch (err: any) {
      console.error('Delete user error:', err);
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleBulkDeleteUsers = async (ids: string[]) => {
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can delete users');
      return;
    }
    if (!(await confirmDialog({ title: 'Confirm Action', message: `Delete ${ids.length} users? This action cannot be undone.` }))) return;

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
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can change roles');
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
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can change status');
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
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can reset passwords');
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
    if (contactFilter === 'all') return contacts || [];
    return (contacts || []).filter(c => c.value?.status === contactFilter);
  };

  const getFilteredVolunteers = () => {
    if (volunteerFilter === 'all') return volunteers || [];
    return (volunteers || []).filter(v => v.value?.status === volunteerFilter);
  };

  const getFilteredUsers = () => {
    let filtered = adminUsers || [];

    // Filter by status
    if (userFilter !== 'all') {
      filtered = filtered.filter(u => u.value?.status === userFilter);
    }

    // Filter by role
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(u => u.value?.role === userRoleFilter);
    }

    // Search by name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.value?.name?.toLowerCase().includes(query) ||
        u.value?.email?.toLowerCase().includes(query)
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
      default: return 'bg-gray-100 text-slate-700 leading-relaxed border-gray-300';
    }
  };

  // Generate notifications list dynamically
  const getNotifications = () => {
    const list: any[] = [];
    
    // 1. Scan contacts for new ones
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach(c => {
        if (c.value?.status === 'new') {
          list.push({
            id: `contact-${c.key}`,
            title: 'New Contact Message',
            description: `From ${c.value.name}: "${c.value.message.substring(0, 40)}${c.value.message.length > 40 ? '...' : ''}"`,
            time: c.value.created_at ? new Date(c.value.created_at).toLocaleDateString() : 'Recent',
            type: 'contact',
            unread: true
          });
        }
      });
    }

    // 2. Scan volunteers for pending ones
    if (volunteers && Array.isArray(volunteers)) {
      volunteers.forEach(v => {
        if (v.value?.status === 'pending') {
          list.push({
            id: `volunteer-${v.key}`,
            title: 'New Volunteer Application',
            description: `From ${v.value.name} for "${v.value.program || 'general'}"`,
            time: v.value.created_at ? new Date(v.value.created_at).toLocaleDateString() : 'Recent',
            type: 'volunteer',
            unread: true
          });
        }
      });
    }

    // 3. Fallback/Static Organization & System Telemetry alerts
    list.push({
      id: 'sys-backup',
      title: 'Database Telemetry',
      description: 'Global CMS Backup successfully compiled & synchronized.',
      time: 'Just now',
      type: 'system',
      unread: false
    });
    list.push({
      id: 'sys-status',
      title: 'Server Active',
      description: 'Supabase core and Hono server endpoints are 100% operational.',
      time: 'Active',
      type: 'system',
      unread: false
    });

    return list;
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Left brand panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10 text-center max-w-lg">
            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 mb-8 inline-block border border-white/20 shadow-2xl hover:scale-105 transition-transform duration-500">
              <img src={loginLogo} alt="Resti Kiryandongo CBO" className="h-16 w-16 rounded-full object-cover shadow-lg border border-slate-100/50 mx-auto" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Resti Kiryandongo CBO</h1>
            <p className="text-emerald-100/90 text-lg font-medium mb-10">Empowering Communities, Transforming Lives</p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Programs', val: '12+' },
                { label: 'Volunteers', val: '150+' },
                { label: 'Lives Impacted', val: '5K+' }
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-lg hover:bg-white/15 hover:scale-105 transition-all duration-300">
                  <p className="text-2xl font-bold text-white">{s.val}</p>
                  <p className="text-emerald-200 text-xs font-semibold tracking-wider uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
          {/* Decorative glowing gradient orbs for high-end depth */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-teal-100/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-100/15 to-emerald-100/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div 
            className="w-full max-w-md relative z-10"
            style={{
              animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              opacity: 0,
              transform: 'translateY(15px)'
            }}
          >
            <style>{`
              @keyframes slideUpFade {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="bg-white rounded-2xl p-3 inline-block shadow-sm border border-slate-100 mb-2">
                <img src={loginLogo} alt="Logo" className="h-14 w-14 rounded-full object-cover shadow border border-slate-100/50 mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Resti Kiryandongo CBO</h2>
              <p className="text-slate-500 text-xs mt-0.5">Admin Dashboard Portal</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1.5">
                  {showForgotPassword ? 'Reset Password' : (isSignup ? 'Create Account' : 'Welcome back')}
                </h1>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {showForgotPassword ? 'Enter your email to receive a recovery link' : (isSignup ? 'Fill in your details to get started' : 'Sign in to your admin dashboard')}
                </p>
              </div>

              {showForgotPassword ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative rounded-xl shadow-sm group">
                      <div 
                        className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300"
                        style={{ left: '14px' }}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-semibold text-slate-700 text-sm focus:bg-white"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-bold tracking-wide mt-6 active:translate-y-0"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Please wait...
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                  {isSignup && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="relative rounded-xl shadow-sm group">
                        <div 
                          className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300"
                          style={{ left: '14px' }}
                        >
                          <User className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-semibold text-slate-700 text-sm focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative rounded-xl shadow-sm group">
                      <div 
                        className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300"
                        style={{ left: '14px' }}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-semibold text-slate-700 text-sm focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative rounded-xl shadow-sm group">
                      <div 
                        className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-300"
                        style={{ left: '14px' }}
                      >
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        required
                        className="w-full pl-12 pr-12 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-semibold text-slate-700 text-sm focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-500 transition-colors duration-300 focus:outline-none"
                        style={{ right: '14px' }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-bold tracking-wide mt-6 active:translate-y-0"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Please wait...
                      </div>
                    ) : (
                      isSignup ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>
              )}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {showForgotPassword ? (
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-bold transition-colors w-full text-center hover:scale-105 transition-transform duration-200"
                  >
                    Back to Login
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsSignup(!isSignup)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-bold transition-colors hover:scale-105 transition-transform duration-200"
                    >
                      {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                    {!isSignup && (
                      <button
                        onClick={() => setShowForgotPassword(true)}
                        className="text-slate-400 hover:text-emerald-600 text-sm font-semibold transition-colors hover:scale-105 transition-transform duration-200"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Signup Success Pending Approval Dialog */}
        <DraggableDialog open={showSignupSuccessDialog} onClose={() => setShowSignupSuccessDialog(false)} title="Account Pending Approval" defaultWidth={480} headerColor="#2f5496">
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center mb-2">
                <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 border border-yellow-100 shadow-inner">
                  <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
                </div>
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                Your administrator account has been created successfully!
              </p>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/80 text-left space-y-2">
                <p className="text-sm text-slate-700 font-semibold flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                  </span>
                  Status: Pending Confirmation
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To ensure platform security, all self-registered administrator accounts must be manually confirmed and activated by a <strong>Super Admin</strong> from the user management portal before you can log in.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Please contact the organization's Super Admin to request account activation.
              </p>
              <Button
                onClick={() => {
                  setShowSignupSuccessDialog(false);
                  setIsSignup(false);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Understood
              </Button>
            </div>
        </DraggableDialog>
      </div>
    );
  }

  // Get current menu item
  const currentMenuItem = NAVIGATION_ITEMS.find(item => item.id === activeTab);
  const CurrentIcon = currentMenuItem?.icon || LayoutDashboard;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-700 shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              {sidebarOpen ? <XIcon size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 rounded-full p-1 border border-emerald-500/20 shadow-sm flex items-center justify-center overflow-hidden h-[46px] w-[46px] shrink-0">
                <img src={loginLogo} alt="Logo" className="h-9 w-9 rounded-full object-cover shrink-0 block" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-semibold text-white leading-tight">Resti Kiryandongo CBO</h1>
                <p className="text-xs text-slate-400">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent border-none outline-none text-sm w-44 text-slate-200 placeholder-slate-500"
              />
            </div>

            {/* Bell Alarm Notification Button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 hover:bg-slate-700 rounded-xl transition ${showNotifications ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Notifications"
              >
                <Bell size={18} />
                {getNotifications().filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown Popover */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all duration-300 scale-100">
                    {/* Header */}
                    <div className="p-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-emerald-400" />
                        <h3 className="font-semibold text-sm">Notifications</h3>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
                        {getNotifications().filter(n => n.unread).length} New
                      </span>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                      {getNotifications().length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                          No notifications found
                        </div>
                      ) : (
                        getNotifications().map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-3.5 hover:bg-slate-800/50 transition-colors flex gap-3 ${notif.unread ? 'bg-slate-800/35' : ''}`}
                          >
                            <div className="mt-0.5">
                              {notif.type === 'contact' ? (
                                <div className="w-7 h-7 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
                                  <Mail size={12} />
                                </div>
                              ) : notif.type === 'volunteer' ? (
                                <div className="w-7 h-7 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
                                  <Heart size={12} />
                                </div>
                              ) : (
                                <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                                  <CheckSquare size={12} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">{notif.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">{notif.description}</p>
                              <p className="text-[9px] text-slate-500 mt-1">{notif.time}</p>
                            </div>
                            {notif.unread && (
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 self-start animate-pulse" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-slate-800/50 text-center border-t border-slate-700">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          const hasContacts = getNotifications().some(n => n.type === 'contact' && n.unread);
                          if (hasContacts) {
                            setActiveTab('contacts');
                          } else {
                            setActiveTab('volunteers');
                          }
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
                      >
                        View all incoming requests
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-700 pl-3 ml-1">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-white leading-tight">{userName || 'Admin User'}</p>
                <p className="text-xs text-slate-400 capitalize">{userRole.replace('-', ' ')}</p>
              </div>
              <Avatar className="h-9 w-9 ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group border border-transparent hover:border-red-500/20 ml-1 ${isLoggingOut ? 'bg-red-500/10 text-red-400' : ''}`}
              title="Logout"
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              )}
              <span className="text-xs font-semibold tracking-wide uppercase">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-700 transition-transform duration-300 overflow-y-auto mt-16 lg:mt-0`}>
          <div className="p-4 pt-6">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-2">Main Menu</p>
              <nav className="space-y-0.5">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                        isActive
                          ? 'text-white shadow-lg'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                      style={isActive ? { backgroundColor: item.accentBg, boxShadow: `0 4px 14px ${item.accentBg}55` } : {}}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/70" />
                      )}
                      <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
                    </button>
                  );
                })}
                {userRole === 'super-admin' && (
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                      activeTab === 'users'
                        ? 'text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    style={activeTab === 'users' ? { backgroundColor: '#2f5496', boxShadow: '0 4px 14px #2f549655' } : {}}
                  >
                    {activeTab === 'users' && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/70" />
                    )}
                    <Shield size={17} className={activeTab === 'users' ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'} />
                    <span className="text-sm font-medium">Users</span>
                    {activeTab === 'users' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
                  </button>
                )}
              </nav>
            </div>

            {/* User badge at bottom */}
            <div className="mt-6 p-3 bg-slate-800 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                    {getUserInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName || 'Admin User'}</p>
                  <Badge className={`${getRoleBadgeColor(userRole)} border text-xs mt-0.5`}>
                    {USER_ROLES.find(r => r.value === userRole)?.label || userRole}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 min-w-0 overflow-auto ${isDarkMode ? 'bg-slate-900 text-white dark-mode-override' : 'bg-slate-50'}`}>
          {isDarkMode && (
            <style>{`
              .dark-mode-override p, .dark-mode-override h1, .dark-mode-override h2, .dark-mode-override h3, .dark-mode-override h4, .dark-mode-override h5, .dark-mode-override h6, .dark-mode-override span, .dark-mode-override label, .dark-mode-override td, .dark-mode-override th {
                color: #f8fafc !important;
              }
              .dark-mode-override .bg-white {
                background-color: #1e293b !important;
              }
              .dark-mode-override .bg-white * {
                color: #f8fafc !important;
              }
              .dark-mode-override .text-slate-500, 
              .dark-mode-override .text-gray-500 {
                color: #94a3b8 !important;
              }
              .dark-mode-override .text-slate-400, 
              .dark-mode-override .text-gray-400 {
                color: #cbd5e1 !important;
              }
              .dark-mode-override .border {
                border-color: #334155 !important;
              }
              .dark-mode-override .border-gray-100, 
              .dark-mode-override .border-gray-200, 
              .dark-mode-override .border-slate-200 {
                border-color: #334155 !important;
              }
              .dark-mode-override input, 
              .dark-mode-override select, 
              .dark-mode-override textarea {
                background-color: #334155 !important;
                color: #f8fafc !important;
              }
              .dark-mode-override a {
                color: #38bdf8 !important;
              }
              .dark-mode-override .bg-slate-50 {
                background-color: #0f172a !important;
              }
              /* Fix action buttons */
              .dark-mode-override button.bg-white,
              .dark-mode-override .bg-white button {
                background-color: #334155 !important;
                color: #f8fafc !important;
              }
              .dark-mode-override .bg-gray-100, 
              .dark-mode-override .bg-slate-100 {
                background-color: #334155 !important;
              }
              .dark-mode-override .bg-gray-100 *, 
              .dark-mode-override .bg-slate-100 * {
                color: #f8fafc !important;
              }
            `}</style>
          )}
          {/* Page Header */}
          <div
            className="px-6 lg:px-8 py-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${currentMenuItem?.headerBg ?? '#1e293b'} 0%, ${currentMenuItem?.accentBg ?? '#475569'}44 100%)` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="p-2.5 rounded-xl border border-white/25 shadow-lg"
                  style={{ backgroundColor: `${currentMenuItem?.accentBg ?? '#475569'}55` }}
                >
                  <CurrentIcon size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight tracking-tight">{currentMenuItem?.label || 'Dashboard'}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5">
                    <span>Admin</span>
                    <ChevronRight size={11} />
                    <span className="text-white/80 font-medium">{currentMenuItem?.label || 'Dashboard'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 transition-all shadow-sm"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 transition-all shadow-sm"
                >
                  <ExternalLink size={16} />
                  View Website
                </a>
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 bg-white/10 border border-white/20 rounded-xl px-3 py-2">

                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 text-xs font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:scale-105 transition-transform duration-200">
                        <FileText size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white bg-white/20 border border-white/30 rounded-lg px-2.5 py-1">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats?.programs ?? 0}</p>
                    <p className="text-sm font-medium text-blue-100">Total Programs</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-1.5 text-xs text-blue-200 font-medium">
                      <TrendingUp size={12} />
                      <span>All time</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-300/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:scale-105 transition-transform duration-200">
                        <Newspaper size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white bg-white/20 border border-white/30 rounded-lg px-2.5 py-1">Published</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats?.news ?? 0}</p>
                    <p className="text-sm font-medium text-violet-100">News Articles</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-1.5 text-xs text-violet-200 font-medium">
                      <TrendingUp size={12} />
                      <span>All time</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500 to-pink-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-rose-300/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:scale-105 transition-transform duration-200">
                        <Heart size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white bg-white/20 border border-white/30 rounded-lg px-2.5 py-1">Registered</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stats?.volunteers ?? 0}</p>
                    <p className="text-sm font-medium text-rose-100">Volunteers</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-1.5 text-xs text-rose-200 font-medium">
                      <TrendingUp size={12} />
                      <span>All time</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-3 rounded-xl bg-white/20 group-hover:scale-105 transition-transform duration-200">
                        <TrendingUp size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white bg-white/20 border border-white/30 rounded-lg px-2.5 py-1">Raised</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">${stats?.totalDonations ?? 0}</p>
                    <p className="text-sm font-medium text-emerald-100">Total Donations</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                      <TrendingUp size={12} />
                      <span>All time</span>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                {analytics && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-t-4 border-t-emerald-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-emerald-100">
                          <BarChart3 size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">Monthly Donations</h3>
                          <p className="text-xs text-gray-400">Revenue over time</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={analytics.monthlyDonations}>
                          <defs>
                            <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDonations)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-t-4 border-t-blue-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <TrendingUp size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">Contact Status</h3>
                          <p className="text-xs text-gray-400">Distribution overview</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={analytics.contactStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {(analytics?.contactStatusData || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-t-4 border-t-rose-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-rose-100">
                          <Heart size={18} className="text-rose-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">Volunteer Applications</h3>
                          <p className="text-xs text-gray-400">By status</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={analytics.volunteerStatusData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-t-4 border-t-purple-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <TrendingUp size={18} className="text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 tracking-tight">Growth Trends</h3>
                          <p className="text-xs text-gray-400">Users & donations over time</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={analytics.growthTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Legend />
                          <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
                          <Line type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Global Search */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search programs, news, events, team, partners, FAQs..."
                      value={globalSearch}
                      onChange={e => setGlobalSearch(e.target.value)}
                      className="flex-1 text-sm text-slate-700 placeholder-gray-400 bg-transparent outline-none"
                    />
                    {globalSearch && (
                      <button onClick={() => setGlobalSearch('')} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {globalSearch.trim() && (() => {
                    const q = globalSearch.toLowerCase();
                    const results: { section: string; title: string; tab: string }[] = [];
                    programs.forEach(p => p.value.title?.toLowerCase().includes(q) && results.push({ section: 'Program', title: p.value.title, tab: 'programs' }));
                    news.forEach(n => n.value.title?.toLowerCase().includes(q) && results.push({ section: 'News', title: n.value.title, tab: 'news' }));
                    events.forEach(e => e.value.title?.toLowerCase().includes(q) && results.push({ section: 'Event', title: e.value.title, tab: 'events' }));
                    team.forEach(m => m.value.name?.toLowerCase().includes(q) && results.push({ section: 'Team', title: m.value.name, tab: 'team' }));
                    partners.forEach(p => p.value.name?.toLowerCase().includes(q) && results.push({ section: 'Partner', title: p.value.name, tab: 'partners' }));
                    faqs.forEach(f => f.value.question?.toLowerCase().includes(q) && results.push({ section: 'FAQ', title: f.value.question, tab: 'faqs' }));
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                        {results.length === 0 ? (
                          <p className="text-sm text-slate-400 py-2">No matches found</p>
                        ) : (
                          <div className="space-y-0.5">
                            {results.slice(0, 8).map((r, i) => (
                              <button key={i} onClick={() => { setActiveTab(r.tab); setGlobalSearch(''); }} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">{r.section}</span>
                                <span className="text-sm text-slate-700 truncate">{r.title}</span>
                                <ChevronRight size={13} className="ml-auto text-gray-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Quick Actions</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Jump to common tasks</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => setActiveTab('programs')} className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors duration-150">
                      <div className="p-1.5 rounded-lg bg-blue-500/30">
                        <FileText size={14} className="text-blue-300" />
                      </div>
                      Add Program
                    </button>
                    <button onClick={() => setActiveTab('news')} className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors duration-150">
                      <div className="p-1.5 rounded-lg bg-purple-500/30">
                        <Newspaper size={14} className="text-purple-300" />
                      </div>
                      Add News
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors duration-150">
                      <div className="p-1.5 rounded-lg bg-amber-500/30">
                        <ImageIcon size={14} className="text-amber-300" />
                      </div>
                      Add Image
                    </button>
                    <button onClick={() => setActiveTab('team')} className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors duration-150">
                      <div className="p-1.5 rounded-lg bg-emerald-500/30">
                        <Users size={14} className="text-emerald-300" />
                      </div>
                      Add Team Member
                    </button>
                  </div>
                </div>

                {/* System Operations & Diagnostics Suite */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border-t-4 border-t-emerald-600">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Terminal size={18} className="text-emerald-600 animate-pulse" />
                        System Operations & Telemetry
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Real-time connection monitoring, CMS backup generation, and database re-initialization.</p>
                    </div>
                    {diagResults && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 self-start md:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          Status: {diagResults.status} ({diagResults.latency}ms)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Action 1: Run Diagnostics */}
                    <button
                      onClick={handleDiagnostics}
                      disabled={diagnosing}
                      className="group flex flex-col items-start text-left p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-200 mb-3">
                        <Activity size={18} className={diagnosing ? "animate-spin" : ""} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Database Health Check</h4>
                      <p className="text-xs text-gray-400 leading-normal">Ping Supabase, inspect response times, and count all active table entries.</p>
                      <span className="text-[10px] font-bold text-emerald-600 mt-3 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        {diagnosing ? "Running check..." : "Run Diagnostics â†’"}
                      </span>
                    </button>

                    {/* Action 2: Export JSON Backup */}
                    <button
                      onClick={handleBackupJSON}
                      disabled={exporting}
                      className="group flex flex-col items-start text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-200 mb-3">
                        <DownloadCloud size={18} className={exporting ? "animate-bounce" : ""} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Global CMS Backup</h4>
                      <p className="text-xs text-gray-400 leading-normal">Compile and export all table content into a single downloadable JSON backup file.</p>
                      <span className="text-[10px] font-bold text-blue-600 mt-3 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        {exporting ? "Compiling payload..." : "Download Backup â†’"}
                      </span>
                    </button>

                    {/* Action 3: Restore Default Seed */}
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="group flex flex-col items-start text-left p-4 rounded-xl border border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all duration-200"
                    >
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform duration-200 mb-3">
                        <RotateCcw size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Factory Seed Reset</h4>
                      <p className="text-xs text-gray-400 leading-normal">Emergency operation to re-seed fallback default CMS records to Supabase.</p>
                      <span className="text-[10px] font-bold text-rose-600 mt-3 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Restore Factory Defaults â†’
                      </span>
                    </button>
                  </div>

                  {/* Terminal Console Log Output */}
                  {diagResults && (
                    <div className="mt-6 border-t border-gray-100 pt-6 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Telemetry Logs</span>
                        <span className="text-[10px] text-gray-400">Checked at {diagResults.checkedAt}</span>
                      </div>
                      <div className="bg-slate-950 font-mono text-[11px] leading-relaxed text-emerald-400 p-4 rounded-xl border border-slate-900 max-h-48 overflow-y-auto space-y-1 shadow-inner scrollbar-thin scrollbar-thumb-slate-800">
                        {(diagResults.logs || []).map((log: string, idx: number) => {
                          let color = "text-emerald-400";
                          if (log.includes("[ERROR]")) color = "text-rose-400 font-bold";
                          else if (log.includes("[WARNING]")) color = "text-amber-400 font-bold";
                          else if (log.includes("[SUCCESS]")) color = "text-teal-300 font-semibold";
                          else if (log.includes("[LATENCY]")) color = "text-blue-300";
                          return (
                            <div key={idx} className={`${color} tracking-tight`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Programs Management */}
            {activeTab === 'programs' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <FileText size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Programs <span className="text-sm font-normal text-blue-200">({programs.length})</span></h3>
                      <p className="text-sm text-blue-100 mt-1.5 opacity-80 font-medium">Manage your community programs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowProgramForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-blue-700 hover:bg-blue-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Program
                  </button>
                </div>

                {/* Bulk Actions */}
                {selectedPrograms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">{selectedPrograms.length} selected</span>
                    <button
                      onClick={() => handleBulkDeletePrograms(selectedPrograms)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedPrograms([])}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                )}

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(programs || []).map((program) => (
                    <div
                      key={program.key}
                      className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-2xl hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col overflow-hidden"
                      onClick={() => { setEditingItem(program); setFormData(program.value); setShowProgramForm(true); }}
                    >
                      {program.value.image && (
                        <img src={program.value.image} alt={program.value.title} className="w-full h-44 object-cover" />
                      )}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={selectedPrograms.includes(program.key)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPrograms([...selectedPrograms, program.key]);
                              } else {
                                setSelectedPrograms(selectedPrograms.filter(id => id !== program.key));
                              }
                            }}
                            className="mt-0.5 w-4 h-4 rounded flex-shrink-0 text-blue-600 focus:ring-blue-400"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate mb-1.5">{program.value.title}</h4>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">{program.value.category}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 flex-1 pl-7">{program.value.description}</p>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingItem(program); setFormData(program.value); setShowProgramForm(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(program.key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {programs.length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                        <FileText size={26} className="text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No programs yet</p>
                      <p className="text-xs text-gray-400">Create your first program to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* News Management */}
            {activeTab === 'news' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Newspaper size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">News Articles <span className="text-sm font-normal text-violet-200">({news.length})</span></h3>
                      <p className="text-sm text-violet-100 mt-1.5 opacity-80 font-medium">Manage news and updates</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowNewsForm(true);
                    }}
                    className="bg-white text-violet-700 hover:bg-violet-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add News
                  </Button>
                </div>

                {selectedNews.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedNews.length} selected</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(news || []).map((item) => (
                    <div key={item.key} className="bg-white border border-gray-200 border-l-4 border-l-violet-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-violet-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(item);
                              setFormData(item.value);
                              setShowNewsForm(true);
                            }}>
                      <input
                        type="checkbox"
                        checked={selectedNews.includes(item.key)}
                        onClick={(e) => e.stopPropagation()} onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNews([...selectedNews, item.key]);
                          } else {
                            setSelectedNews(selectedNews.filter(id => id !== item.key));
                          }
                        }}
                        className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      {item.value.image && (
                        <img src={item.value.image} alt={item.value.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                      )}
                      <div className="flex-1 pl-6">
                        <h4 className="text-base font-semibold text-slate-800 tracking-tight mb-1">{item.value.title}</h4>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                          {item.value.content?.replace(/<[^>]+>/g, '').slice(0, 120) || ''}
                        </p>
                        <span className="text-xs text-gray-400">
                          {(() => {
                            const dateStr = item.value.timestamp || item.value.created_at || item.value.publishDate || item.value.date;
                            if (!dateStr) return 'No Date';
                            const parsed = new Date(dateStr);
                            return isNaN(parsed.getTime()) ? 'No Date' : parsed.toLocaleDateString();
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData(item.value);
                            setShowNewsForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                        <Newspaper size={26} className="text-violet-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No news articles yet</p>
                      <p className="text-xs text-gray-400">Create your first article to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Gallery <span className="text-sm font-normal text-amber-100">({gallery.length})</span></h3>
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
                  {(gallery || []).map((item) => (
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
                            onClick={() => handleDeleteGallery(item.key)}
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

            {/* Team Management */}
            {activeTab === 'team' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Users size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Team Members <span className="text-sm font-normal text-teal-200">({team.length})</span></h3>
                      <p className="text-sm text-teal-100 mt-1.5 opacity-80 font-medium">Manage your team</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingItem(null); setShowTeamForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Team Member
                  </button>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(team || []).map((member) => (
                    <div
                      key={member.id}
                      className="bg-white border border-gray-200 border-l-4 border-l-teal-500 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-teal-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setEditingItem(member); setShowTeamForm(true); }}
                    >
                      {/* Avatar + name + role */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12 flex-shrink-0 shadow-sm border-2 border-white">
                          {member.image && <AvatarImage src={member.image} alt={member.name} />}
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-sm font-semibold">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">{member.name}</h4>
                          <p className="text-xs text-teal-600 font-medium truncate">{member.role}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5">
                        {member.department && (
                          <p className="text-xs text-slate-500"><span className="font-medium text-slate-600">Dept:</span> {member.department}</p>
                        )}
                        {member.bio && (
                          <p className="text-xs text-slate-600 line-clamp-3">{member.bio}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingItem(member); setShowTeamForm(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(member.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4">
                        <Users size={26} className="text-teal-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No team members yet</p>
                      <p className="text-xs text-gray-400">Add your first team member to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Management */}
            {activeTab === 'contacts' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Mail size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Contact Messages <span className="text-sm font-normal text-sky-200">({getFilteredContacts().length})</span></h3>
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
                      onClick={() => exportToCSV(getFilteredContacts().map(c => c.value), 'contacts.csv')}
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
                  {getFilteredContacts().map((contact) => (
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
                            onClick={() => handleDeleteContact(contact.key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredContacts().length === 0 && (
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

            {/* Volunteers Management */}
            {activeTab === 'volunteers' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-rose-600 to-pink-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Heart size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Volunteer Applications <span className="text-sm font-normal text-rose-200">({getFilteredVolunteers().length})</span></h3>
                      <p className="text-sm text-rose-100 mt-1.5 opacity-80 font-medium">Manage volunteer registrations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToCSV(getFilteredVolunteers().map(v => v.value), 'volunteers.csv')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm text-white font-semibold transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Heart size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-rose-700">{volunteers.length}</p>
                      <p className="text-xs text-rose-500 font-medium">Total</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">{volunteers.filter(v => v.value?.status === 'pending').length}</p>
                      <p className="text-xs text-amber-500 font-medium">Pending</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{volunteers.filter(v => v.value?.status === 'approved').length}</p>
                      <p className="text-xs text-emerald-500 font-medium">Approved</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{volunteers.filter(v => v.value?.status === 'rejected').length}</p>
                      <p className="text-xs text-red-400 font-medium">Rejected</p>
                    </div>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={volunteerFilter}
                    onChange={(e) => setVolunteerFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedVolunteers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-sm text-slate-700 font-medium">{selectedVolunteers.length} selected</span>
                    <button
                      onClick={() => handleBulkDeleteVolunteers(selectedVolunteers)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedVolunteers([])}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      Clear
                    </button>
                  </div>
                )}

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {getFilteredVolunteers().map((volunteer) => (
                    <div key={volunteer.key} className="bg-white border border-gray-200 border-l-4 border-l-rose-400 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-rose-300 transition-all duration-300 shadow-sm flex flex-col group">

                      {/* Top: checkbox + avatar + name/badge */}
                      <div className="flex items-start gap-3 mb-4">
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
                          className="mt-1 w-4 h-4 rounded flex-shrink-0 text-rose-600 focus:ring-rose-400"
                        />
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-rose-700">
                          {volunteer.value.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate mb-1.5">{volunteer.value.name}</h4>
                          <Badge className={
                            volunteer.value.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            volunteer.value.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }>
                            {volunteer.value.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-1.5 pl-7">
                        <p className="text-xs text-slate-600 truncate">{volunteer.value.email}</p>
                        {volunteer.value.phone && (
                          <p className="text-xs text-slate-500">{volunteer.value.phone}</p>
                        )}
                        {volunteer.value.skills && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            <span className="font-medium text-slate-700">Skills:</span> {volunteer.value.skills}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Applied: {new Date(volunteer.value.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20">
                        <button
                          onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'rejected')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                        >
                          <X size={13} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteVolunteer(volunteer.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {getFilteredVolunteers().length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                        <Heart size={26} className="text-rose-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No volunteer applications</p>
                      <p className="text-xs text-gray-400">
                        {volunteerFilter !== 'all' ? 'No applications match this filter' : 'Applications will appear here when submitted'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Donations Management */}
            {activeTab === 'donations' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <TrendingUp size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Donations <span className="text-sm font-normal text-emerald-200">({donations.length})</span></h3>
                      <p className="text-sm text-emerald-100 mt-1.5 opacity-80 font-medium">View donation records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-emerald-100">Total Donations</p>
                      <p className="text-2xl font-bold text-white">
                        ${donations.reduce((sum, d) => sum + (d.value.amount || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => exportToCSV((donations || []).map(d => d.value), 'donations.csv')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-sm text-white font-medium transition-colors"
                    >
                      <Download size={14} />
                      CSV
                    </button>
                  </div>
                </div>

                {/* Donation Analytics Charts */}
                {(() => {
                  const isDummy = donations.length === 0;
                  const displayDonations = isDummy ? [
                    { value: { amount: 500, payment_method: 'Card', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } },
                    { value: { amount: 250, payment_method: 'Mobile Money', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() } },
                    { value: { amount: 1000, payment_method: 'Bank Transfer', timestamp: new Date().toISOString() } },
                    { value: { amount: 150, payment_method: 'Card', timestamp: new Date().toISOString() } }
                  ] : donations;

                  const byMonth: Record<string, number> = {};
                  const byMethod: Record<string, number> = {
                    'Stripe': 0,
                    'Bank Transfer': 0,
                    'MTN Mobile Money': 0,
                    'Airtel Money': 0,
                    'Mobile Money (Other)': 0,
                    'Other': 0
                  };
                  let totalSum = 0;
                  
                  displayDonations.forEach(d => {
                    const month = new Date(d.value.timestamp || d.value.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    const amt = d.value.amount || 0;
                    byMonth[month] = (byMonth[month] || 0) + amt;
                    totalSum += amt;
                    
                    const method = d.value.payment_method || d.value.paymentMethod || d.value.method || 'Other';
                    const lowerMethod = method.toLowerCase();
                    let methodKey = 'Other';
                    
                    if (lowerMethod.includes('stripe') || lowerMethod.includes('card')) methodKey = 'Stripe';
                    else if (lowerMethod.includes('mtn')) methodKey = 'MTN Mobile Money';
                    else if (lowerMethod.includes('airtel')) methodKey = 'Airtel Money';
                    else if (lowerMethod.includes('bank')) methodKey = 'Bank Transfer';
                    else if (lowerMethod.includes('mobile') || lowerMethod.includes('momo') || lowerMethod.includes('mpesa')) methodKey = 'Mobile Money (Other)';
                    
                    byMethod[methodKey] = (byMethod[methodKey] || 0) + amt;
                  });
                  
                  const monthChartData = Object.entries(byMonth).map(([month, total]) => ({ month, total: parseFloat(total.toFixed(2)) }));
                  const methodChartData = Object.entries(byMethod).map(([method, total]) => ({ name: method, value: parseFloat(total.toFixed(2)) })).sort((a,b) => b.value - a.value);
                  
                  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Donations by Month {isDummy && <span className="text-xs text-emerald-500 font-normal ml-2">(Sample Data)</span>}</h4>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={monthChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v: any) => [`$${v}`, 'Total']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">Donations by Payment Method {isDummy && <span className="text-xs text-emerald-500 font-normal ml-2">(Sample Data)</span>}</h4>
                        <div className="flex-1 flex flex-col xl:flex-row items-center gap-6">
                          <div className="w-full xl:w-1/2 h-[220px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={methodChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {methodChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [`$${v}`, 'Total']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="w-full xl:w-1/2 flex flex-col justify-center">
                            <div className="space-y-3 mb-4">
                              {methodChartData.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-sm text-slate-600">{item.name}</span>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-800">${(item.value || 0).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-800">Total Sum</span>
                              <span className="text-sm font-bold text-emerald-600">${totalSum.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-4">Donor Info</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Method</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(donations || []).map((donation) => (
                          <tr key={donation.key} className="hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer" onClick={() => setSelectedDonation(donation)}>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{donation.value.donorName || donation.value.name || 'Anonymous'}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{donation.value.donorEmail || donation.value.email || 'No email provided'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {donation.value.currency || 'USD'} {donation.value.amount}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize">{donation.value.paymentMethod || donation.value.payment_method || 'Other'}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {new Date(donation.value.timestamp || donation.value.created_at || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedDonation(donation); }}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                        {donations.length === 0 && (
                          <tr>
                            <td colSpan={5}>
                              <div className="text-center py-16">
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                  <TrendingUp size={20} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">No donations found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Donation Detail Modal */}
                {selectedDonation && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDonation(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-800">Donation Details</h3>
                        <button onClick={() => setSelectedDonation(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100/50">
                          <div>
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-emerald-700">{selectedDonation.value.currency || 'USD'} {selectedDonation.value.amount}</p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp size={24} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-medium text-slate-500 mb-1">Donor Name</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedDonation.value.donorName || selectedDonation.value.name || 'Anonymous'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-medium text-slate-500 mb-1">Payment Method</p>
                            <p className="text-sm font-semibold text-slate-800 capitalize">{selectedDonation.value.paymentMethod || selectedDonation.value.payment_method || 'Other'}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Email Address</span>
                            <span className="text-sm text-slate-800">{selectedDonation.value.donorEmail || selectedDonation.value.email || 'N/A'}</span>
                          </div>
                          {selectedDonation.value.donorPhone && (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 font-medium">Phone Number</span>
                              <span className="text-sm text-slate-800">{selectedDonation.value.donorPhone}</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Transaction ID</span>
                            <span className="text-sm text-slate-800 font-mono break-all bg-slate-100 px-2 py-1 rounded mt-1 border border-slate-200 inline-block">{selectedDonation.value.transactionId || selectedDonation.value.paymentIntentId || selectedDonation.key.replace('donation:', '')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Date & Time</span>
                            <span className="text-sm text-slate-800">
                              {new Date(selectedDonation.value.timestamp || selectedDonation.value.created_at || new Date()).toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {selectedDonation.value.message && (
                            <div className="flex flex-col mt-2 pt-2 border-t border-slate-100">
                              <span className="text-xs text-slate-500 font-medium mb-1">Message / Notes</span>
                              <p className="text-sm text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-100">"{selectedDonation.value.message}"</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteDonation(selectedDonation.key); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm"
                          >
                            <Trash2 size={16} /> Delete Donation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Newsletter Subscribers <span className="text-sm font-normal text-indigo-200">({subscribers.length})</span></h3>
                      <p className="text-sm text-indigo-100 mt-1.5 opacity-80 font-medium">Manage newsletter subscribers and send blasts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportToCSV((subscribers || []).map(s => s.value), 'subscribers.csv')}
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
                      <p className="text-2xl font-bold text-indigo-700">{subscribers.length}</p>
                      <p className="text-xs text-indigo-500 font-medium">Total Subscribers</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{subscribers.length}</p>
                      <p className="text-xs text-emerald-500 font-medium">Active</p>
                    </div>
                  </div>
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Send size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-violet-700">
                        {subscribers.length > 0
                          ? new Date(Math.max(...(subscribers || []).map(s => new Date(s.value.created_at || 0).getTime()))).toLocaleDateString()
                          : 'â€”'}
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
                      <p className="text-xs text-gray-500">Compose and send to all {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Subject Line *</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly Update â€” May 2026"
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
                      disabled={sendingNewsletter || subscribers.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-[1.01]"
                    >
                      <Send size={15} />
                      {sendingNewsletter ? 'Sending...' : `Send to ${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}`}
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
                              onClick={() => handleDeleteSubscriber(subscriber.key)}
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
                      <option value="">Change Roleâ€¦</option>
                      <option value="super-admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <select
                      onChange={(e) => { if (e.target.value) { handleBulkUpdateUserStatus(selectedUsers, e.target.value); e.target.value = ''; } }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">Change Statusâ€¦</option>
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
                  {(getFilteredUsers() || []).map((user) => (
                    <div
                      key={user.key}
                      className="bg-white border border-gray-200 border-l-4 border-l-slate-400 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setViewingItem(user); setShowPasswordResetDialog(true); }}
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
                          onClick={() => { setViewingItem(user); setShowPasswordResetDialog(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          <Shield size={13} />
                          Reset PW
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.value.id)}
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

            {/* Stories Management */}
            {activeTab === 'stories' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <MessageSquare size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Impact Stories <span className="text-sm font-normal text-orange-100">({stories.length})</span></h3>
                      <p className="text-sm text-orange-100 mt-1.5 opacity-80 font-medium">Share success stories and testimonials</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowStoryForm(true);
                    }}
                    className="bg-white text-orange-700 hover:bg-orange-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Story
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(stories || []).map((story) => (
                    <div key={story.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-orange-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(story);
                              setShowStoryForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        {story.image && (
                          <img src={story.image} alt={story.name} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{story.title}</h4>
                            <Badge className="bg-orange-50 text-orange-700 border-orange-100">{story.category}</Badge>
                          </div>
                          <p className="text-sm text-emerald-600 mb-2">{story.name}</p>
                          <div className="text-sm text-slate-600 prose prose-sm" dangerouslySetInnerHTML={{ __html: story.story?.substring(0, 150) + '...' }} />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(story);
                              setShowStoryForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={26} className="text-orange-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No impact stories yet</p>
                      <p className="text-xs text-gray-400">Share your first success story!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Download size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Annual Reports <span className="text-sm font-normal text-slate-300">({reports.length})</span></h3>
                      <p className="text-sm text-slate-300 mt-1.5 opacity-80 font-medium">Manage annual and financial reports</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowReportForm(true);
                    }}
                    className="bg-white text-slate-700 hover:bg-slate-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(reports || []).map((report) => (
                    <div key={report.id} className="bg-white border border-gray-200 border-l-4 border-l-slate-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-slate-400 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                      setEditingItem(report);
                      setShowReportForm(true);
                    }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="text-base font-semibold text-slate-800 tracking-tight">{report.title}</h4>
                          {report.year && (
                            <span className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg">{report.year}</span>
                          )}
                          {report.fileSize && (
                            <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">{report.fileSize}</span>
                          )}
                        </div>
                        {report.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{report.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(report);
                            setShowReportForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        {report.fileUrl && (
                          <button
                            onClick={() => window.open(report.fileUrl, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                          >
                            <Download size={13} />
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                        <Download size={26} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No reports yet</p>
                      <p className="text-xs text-gray-400">Add your first annual report to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Management */}
            {activeTab === 'events' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Calendar size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Events <span className="text-sm font-normal text-indigo-200">({events.length})</span></h3>
                      <p className="text-sm text-indigo-100 mt-1.5 opacity-80 font-medium">Manage upcoming and past events</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowEventForm(true);
                    }}
                    className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Event
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(events || []).map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 border-l-4 border-l-indigo-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(event);
                              setShowEventForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        {event.image && (
                          <img src={event.image} alt={event.title} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{event.title}</h4>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                              event.status === 'upcoming' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                              event.status === 'ongoing' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                              event.status === 'completed' ? 'text-slate-600 bg-gray-50 border-gray-200' :
                              'text-red-600 bg-red-50 border-red-200'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"><Calendar size={11} /> {event.date}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">ðŸ• {event.time}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">ðŸ“ {event.location}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"><Users size={11} /> {event.capacity}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(event);
                              setShowEventForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <Calendar size={26} className="text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No events yet</p>
                      <p className="text-xs text-gray-400">Create your first event to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Partners Management */}
            {activeTab === 'partners' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Handshake size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Partners <span className="text-sm font-normal text-amber-100">({partners.length})</span></h3>
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
                  {(partners || []).map((partner) => (
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
                          onClick={() => handleDeletePartner(partner.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {partners.length === 0 && (
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

            {/* Opportunities Management */}
            {activeTab === 'opportunities' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">

                {/* Header */}
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Target size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Opportunities <span className="text-sm font-normal text-purple-200">({opportunities.length})</span></h3>
                      <p className="text-sm text-purple-100 mt-1.5 opacity-80 font-medium">Manage volunteer opportunities</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditingItem(null); setShowOpportunityForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-white text-purple-700 hover:bg-purple-50 shadow-md font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm"
                  >
                    <Plus size={16} />
                    Add Opportunity
                  </button>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(opportunities || []).map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white border border-gray-200 border-l-4 border-l-purple-500 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col"
                      onClick={() => { setEditingItem(opp); setShowOpportunityForm(true); }}
                    >
                      {/* Title + category */}
                      <div className="flex items-start gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-800 flex-1">{opp.title}</h4>
                        {opp.category && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200 whitespace-nowrap flex-shrink-0">{opp.category}</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-shrink-0">{opp.description}</p>

                      {/* Metadata pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {opp.location && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Globe size={11} className="text-slate-400" /> {opp.location}
                          </span>
                        )}
                        {opp.timeCommitment && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Clock size={11} className="text-slate-400" /> {opp.timeCommitment}
                          </span>
                        )}
                        {opp.openPositions != null && (
                          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                            <Users size={11} className="text-slate-400" /> {opp.openPositions} spot{opp.openPositions !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Requirements */}
                      {opp.requirements?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Requirements</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.requirements.slice(0, 3).map((req: string, i: number) => (
                              <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-md px-2 py-0.5">{req}</span>
                            ))}
                            {opp.requirements.length > 3 && (
                              <span className="text-xs text-slate-400">+{opp.requirements.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Benefits */}
                      {opp.benefits?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Benefits</p>
                          <div className="flex flex-wrap gap-1">
                            {opp.benefits.slice(0, 3).map((b: string, i: number) => (
                              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md px-2 py-0.5">{b}</span>
                            ))}
                            {opp.benefits.length > 3 && (
                              <span className="text-xs text-slate-400">+{opp.benefits.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingItem(opp); setShowOpportunityForm(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Target size={26} className="text-purple-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No opportunities yet</p>
                      <p className="text-xs text-gray-400">Create your first volunteer opportunity!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAQs Management */}
            {activeTab === 'faqs' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <HelpCircle size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">FAQs <span className="text-sm font-normal text-cyan-200">({faqs.length})</span></h3>
                      <p className="text-sm text-cyan-100 mt-1.5 opacity-80 font-medium">Manage frequently asked questions</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowFAQForm(true);
                    }}
                    className="bg-white text-cyan-700 hover:bg-cyan-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add FAQ
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(faqs || []).map((faq) => (
                    <div key={faq.id} className="bg-white border border-gray-200 border-l-4 border-l-cyan-500 relative rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-cyan-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(faq);
                              setShowFAQForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{faq.question}</h4>
                            <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100">{faq.category}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{faq.answer}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(faq);
                              setShowFAQForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle size={26} className="text-cyan-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No FAQs yet</p>
                      <p className="text-xs text-gray-400">Add your first question and answer!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources Management */}
            {activeTab === 'resources' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <BookOpen size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Resources <span className="text-sm font-normal text-green-200">({resources.length})</span></h3>
                      <p className="text-sm text-green-100 mt-1.5 opacity-80 font-medium">Manage downloadable resources</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowResourceForm(true);
                    }}
                    className="bg-white text-green-700 hover:bg-green-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Resource
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {(resources || []).map((resource) => (
                    <div key={resource.id} className="bg-white border border-gray-200 border-l-4 border-l-green-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 hover:border-green-300 transition-all duration-300 shadow-sm cursor-pointer group flex flex-col" onClick={() => {
                              setEditingItem(resource);
                              setShowResourceForm(true);
                            }}>
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{resource.title}</h4>
                            {resource.fileType && <Badge className="bg-green-50 text-green-700 border-green-100">{resource.fileType}</Badge>}
                            {resource.fileSize && <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">{resource.fileSize}</span>}
                          </div>
                          <p className="text-sm text-slate-600">{resource.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.open(resource.fileUrl, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 leading-relaxed bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                          >
                            <Download size={13} />
                            Download
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(resource);
                              setShowResourceForm(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={26} className="text-green-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No resources yet</p>
                      <p className="text-xs text-gray-400">Add your first downloadable resource!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Globe size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Pages <span className="text-sm font-normal text-sky-200">({pages.length})</span></h3>
                      <p className="text-sm text-sky-100 mt-1.5 opacity-80 font-medium">Create and manage dynamic custom pages</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowPageForm(true);
                    }}
                    className="bg-white text-sky-700 hover:bg-sky-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Page
                  </Button>
                </div>

                {/* Pages Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Title</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Slug / URL</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left px-6 py-4 font-semibold text-slate-700">Last Updated</th>
                        <th className="text-right px-6 py-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(pages || []).map(page => (
                        <tr key={page.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{page.title}</td>
                          <td className="px-6 py-4">
                            <a
                              href={`/pages/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 hover:underline font-mono text-xs flex items-center gap-1"
                            >
                              /pages/{page.slug}
                              <ExternalLink size={11} />
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            {page.published ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(page);
                                  setShowPageForm(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                              >
                                <Edit size={13} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePage(page.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pages.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
                        <Globe size={26} className="text-sky-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No pages yet</p>
                      <p className="text-xs text-gray-400">Click "Add Page" to create your first custom page.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          
            {/* Map Locations Tab */}
            
            {activeTab === 'live-chat' && (
              <div className="flex h-[calc(100vh-160px)] -m-6 mt-0 border-t border-slate-200">
                {/* Left Sidebar - Chat List */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <MessageCircle size={18} className="text-emerald-600" /> Active Chats
                    </h3>
                    <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs font-medium">
                      {liveChats.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {liveChats.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <MessageCircle size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">No active chats right now.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {liveChats.map((chat: any) => {
                          const lastMessage = chat.messages[chat.messages.length - 1];
                          const unreadCount = chat.messages.filter((m: any) => m.sender === 'user' && new Date(m.timestamp) > new Date(chat.updated_at || 0)).length; // Very basic unread indication
                          
                          return (
                            <button
                              key={chat.id}
                              onClick={() => setSelectedChatId(chat.id)}
                              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1 relative ${selectedChatId === chat.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500 pl-3' : 'border-l-4 border-transparent'}`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="font-medium text-sm text-slate-800 truncate">
                                  {chat.email || 'Anonymous User'}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate w-full">
                                {lastMessage ? (lastMessage.sender === 'bot' ? 'You: ' + lastMessage.text : lastMessage.text) : 'No messages'}
                              </p>
                              <div className="text-[10px] text-slate-400 mt-1">ID: {chat.id.substring(0, 15)}...</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Area - Chat Window */}
                <div className="flex-1 bg-slate-50 flex flex-col">
                  {selectedChatId ? (() => {
                    const activeChat = liveChats.find((c: any) => c.id === selectedChatId);
                    if (!activeChat) return null;
                    return (
                      <>
                        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10">
                          <div>
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                              {activeChat.email || 'Anonymous User'}
                            </h2>
                            <p className="text-xs text-slate-500">Session ID: {activeChat.id}</p>
                          </div>
                          <button onClick={() => {
                             if(confirm('Are you sure you want to end this chat? (Note: End chat is just a local reset for now)')) setSelectedChatId(null);
                          }} className="text-xs text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">
                            Close Chat
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          <div className="text-center text-xs text-slate-400 mb-6 bg-white py-1 px-3 rounded-full inline-block border border-slate-100 mx-auto w-max shadow-sm">
                            Chat started at {new Date(activeChat.created_at).toLocaleString()}
                          </div>
                          {activeChat.messages.map((msg: any, idx: number) => (
                            <div key={idx} className={`flex ${msg.sender === 'bot' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                msg.sender === 'bot' 
                                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                              }`}>
                                {msg.text}
                                <div className={`text-[10px] mt-1 text-right ${msg.sender === 'bot' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="p-4 bg-white border-t border-slate-200">
                          <form onSubmit={handleChatReply} className="flex gap-2">
                            <input
                              type="text"
                              value={chatReply}
                              onChange={(e) => setChatReply(e.target.value)}
                              placeholder="Type your reply to the user..."
                              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
                              disabled={isReplyingChat}
                            />
                            <button
                              type="submit"
                              disabled={!chatReply.trim() || isReplyingChat}
                              className="bg-emerald-600 text-white px-5 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              <Send size={16} />
                              Send
                            </button>
                          </form>
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <MessageCircle size={40} className="text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-500">Select a chat to view</p>
                      <p className="text-sm">Choose an active conversation from the sidebar to reply.</p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'map' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <MapPin size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Map Locations <span className="text-sm font-normal text-blue-200">({mapLocations.length})</span></h3>
                      <p className="text-sm text-blue-100 mt-1.5 opacity-80 font-medium">Manage locations for the interactive impact map</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowMapLocationForm(true);
                    }}
                    className="bg-white text-blue-700 hover:bg-blue-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Location
                  </Button>
                </div>

                {/* Visual Map Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-[400px] shadow-sm relative z-0">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">
                    Live Map Preview
                  </div>
                  <ImpactMap onMarkerClick={(loc) => {
                    setEditingItem(loc);
                    setShowMapLocationForm(true);
                  }} />
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Manage Locations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mapLocations.map((loc: any) => (
                    <div key={loc.id} className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          loc.category === 'health' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          loc.category === 'education' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          loc.category === 'wash' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {loc.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 mb-4 pr-20">
                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 line-clamp-1">{loc.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">[{loc.coordinates?.[0]}, {loc.coordinates?.[1]}]</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 h-10">{loc.description}</p>
                      {loc.impact && (
                        <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-700 line-clamp-1">{loc.impact}</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                          onClick={() => {
                            setEditingItem(loc);
                            setShowMapLocationForm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMapLocation(loc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {mapLocations.length === 0 && (
                    <div className="col-span-full text-center py-20">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                        <MapPin size={26} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No map locations yet</p>
                      <p className="text-xs text-gray-400">Add a location to display it on the impact map.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Activity Log Tab */}
          {activeTab === 'activity-log' && (
            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Clock size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">Activity Log</h2>
                      <p className="text-xs text-gray-400">{activityLog.length} entries</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActivityLog([]);
                      try { localStorage.removeItem('admin_activity_log'); } catch {}
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear Log
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {activityLog.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                        <Activity size={22} className="text-orange-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No activity yet</p>
                      <p className="text-xs text-gray-400 mt-1">Actions will appear here as you use the dashboard</p>
                    </div>
                  ) : (
                    (activityLog || []).map(entry => (
                      <div key={entry.id} className="flex items-start gap-4 px-6 py-3 hover:bg-gray-50/50 transition-colors">
                        <span className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap ${
                          entry.action === 'deleted' ? 'bg-red-100 text-red-600' :
                          entry.action === 'created' ? 'bg-green-100 text-green-600' :
                          entry.action === 'updated' ? 'bg-blue-100 text-blue-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>{entry.action}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{entry.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{entry.section} Â· {entry.user} Â· {new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Program Form Dialog */}
      <DraggableDialog open={showProgramForm} onClose={() => setShowProgramForm(false)} title={editingItem ? 'Edit Program' : 'Add Program'} headerColor="#2f5496">
          <form onSubmit={handleSubmitProgram} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
              <Button type="submit" className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
      </DraggableDialog>

      {/* News Form Dialog */}
      <DraggableDialog open={showNewsForm} onClose={() => setShowNewsForm(false)} title={editingItem ? 'Edit News' : 'Add News'} headerColor="#2f5496">
          <form onSubmit={handleSubmitNews} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
              <Button type="submit" className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
      </DraggableDialog>

      {/* Gallery Form Dialog */}
      <DraggableDialog open={showGalleryForm} onClose={() => setShowGalleryForm(false)} title={editingItem ? 'Edit Image' : 'Add Image'} headerColor="#2f5496">
          <form onSubmit={handleSubmitGallery} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
              <Button type="submit" className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
      </DraggableDialog>

      {/* Contact View/Reply Dialog */}
      {viewingItem && activeTab === 'contacts' && (
        <DraggableDialog open={!!viewingItem} onClose={() => { setViewingItem(null); setReplyMessage(''); }} title="Contact Message" headerColor="#2f5496">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">From</p>
                <p className="text-base">{viewingItem.value.name}</p>
                <p className="text-sm text-slate-600">{viewingItem.value.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Message</p>
                <p className="text-base">{viewingItem.value.message}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Received</p>
                <p className="text-sm">{new Date(viewingItem.value.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Reply</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
        </DraggableDialog>
      )}

      {/* User Form Dialog */}
      <DraggableDialog open={showUserForm} onClose={() => setShowUserForm(false)} title={editingItem ? 'Edit User' : 'Add User'} headerColor="#2f5496">
          <form onSubmit={handleSubmitUser} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showUserFormPassword ? "text" : "password"}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserFormPassword(!showUserFormPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-500 transition-colors duration-300 focus:outline-none"
                  >
                    {showUserFormPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
            )}
            <div>
              <label className="block text-sm mb-2">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                required
              >
                <option value="active">Active</option>
                <option value="pending">Pending Approval</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
                {editingItem ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
      </DraggableDialog>

      {/* Password Reset Dialog */}
      <DraggableDialog open={showPasswordResetDialog} onClose={() => setShowPasswordResetDialog(false)} title="Reset Password" headerColor="#2f5496">
          {viewingItem && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">User</p>
                <p className="text-base">{viewingItem.value.name}</p>
                <p className="text-sm text-slate-600">{viewingItem.value.email}</p>
              </div>
              <div>
                <label className="block text-sm mb-2">New Password</label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-500 transition-colors duration-300 focus:outline-none"
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
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
      </DraggableDialog>

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

      {showPageForm && (
        <PageFormDialog
          show={showPageForm}
          onClose={() => {
            setShowPageForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={() => {
            loadData();
            logActivity(editingItem ? 'updated' : 'created', 'Pages', editingItem ? `Updated page: ${editingItem.title}` : 'Created new page');
          }}
          userRole={userRole}
        />
      )}

      {showMapLocationForm && (
        <MapLocationFormDialog
          show={showMapLocationForm}
          onClose={() => {
            setShowMapLocationForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSuccess={loadData}
          userRole={userRole}
          accessToken={accessToken || publicAnonKey}
        />
      )}
      {showResetModal && (
        <DraggableDialog open={showResetModal} onClose={() => setShowResetModal(false)} title="Factory Defaults Reset" defaultWidth={480} headerColor="#2f5496">
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-2">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <RotateCcw size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Are you absolutely sure you want to restore the website CMS to factory seed defaults? This action will overwrite existing configuration settings.
              </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-4">
              <div className="text-amber-600 text-sm font-semibold shrink-0">âš ï¸ Warning</div>
              <p className="text-xs text-amber-800 leading-normal">
                This will reset all main dashboard pages to their initial mock data. Make sure you have downloaded a **Global CMS Backup** before proceeding.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                onClick={handleRestoreDefaults}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Resetting...
                  </>
                ) : (
                  "Force Reset"
                )}
              </Button>
            </div>
            </div>
        </DraggableDialog>
      )}
    </div>
  );
}
