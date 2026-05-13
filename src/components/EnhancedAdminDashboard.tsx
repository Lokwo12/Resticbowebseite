import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
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
  ChevronRight,
  ExternalLink
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
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-600' },
];

export function EnhancedAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [userRole, setUserRole] = useState('');
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
        setIsAuthenticated(true);
        setAccessToken(session.access_token);
        
        // Get user metadata
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (user?.user_metadata) {
          setUserRole(user.user_metadata.role || 'viewer');
          setUserName(user.user_metadata.name || '');
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

      if (data.session) {
        setIsAuthenticated(true);
        setAccessToken(data.session.access_token);
        
        // Get user metadata
        if (data.user?.user_metadata) {
          setUserRole(data.user.user_metadata.role || 'viewer');
          setUserName(data.user.user_metadata.name || '');
          setUserEmail(data.user.email || '');
        }
        
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
    toast.info('Logged out successfully');
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
        
        setStats(statsData.stats);
        setAnalytics(analyticsData);
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
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete program');

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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete news');

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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete gallery item');

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
    if (!confirm('Delete this team member?')) return;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/team/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete team member');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete story');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/reports/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete report');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/events/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete event');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/partners/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete partner');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete opportunity');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete FAQ');
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!response.ok) throw new Error('Failed to delete resource');
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
    if (userRole !== 'super-admin') {
      toast.error('Only super admins can delete users');
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
    if (contactFilter === 'all') return contacts;
    return contacts.filter(c => c.value?.status === contactFilter);
  };

  const getFilteredVolunteers = () => {
    if (volunteerFilter === 'all') return volunteers;
    return volunteers.filter(v => v.value?.status === volunteerFilter);
  };

  const getFilteredUsers = () => {
    let filtered = adminUsers;

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
      <div className="min-h-screen flex">
        {/* Left brand panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 flex-col items-center justify-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 inline-block border border-white/20">
              <img src={logo} alt="Resti Kiryandongo CBO" className="h-24 w-auto mx-auto" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Resti Kiryandongo CBO</h1>
            <p className="text-emerald-100 text-lg mb-8">Community Based Organization</p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[{label:'Programs',val:'12+'},{label:'Volunteers',val:'150+'},{label:'Lives Impacted',val:'5K+'}].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-2xl font-bold text-white">{s.val}</p>
                  <p className="text-emerald-200 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-emerald-700">Resti Kiryandongo CBO</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
                  {isSignup ? 'Create Account' : 'Welcome back'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isSignup ? 'Fill in your details to get started' : 'Sign in to your admin dashboard'}
                </p>
              </div>

              <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-6">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 leading-relaxed mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 leading-relaxed mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 leading-relaxed mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl transition shadow-lg font-medium mt-2"
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

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
                >
                  {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
              <div className="bg-emerald-500/20 rounded-xl p-1.5">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
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

            <button className="relative p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900"></span>
            </button>

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
              className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition ml-1"
              title="Logout"
            >
              <LogOut size={18} />
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                      activeTab === 'users'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
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
        <div className="flex-1 min-w-0 overflow-auto bg-slate-50">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 lg:px-8 py-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 shadow-lg">
                  <CurrentIcon size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{currentMenuItem?.label || 'Dashboard'}</h2>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <span>Admin</span>
                    <ChevronRight size={13} />
                    <span className="text-slate-300">{currentMenuItem?.label || 'Dashboard'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 transition-all shadow-sm"
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
            {activeTab === 'overview' && stats && (
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
                    <p className="text-3xl font-bold text-white mb-1">{stats.programs}</p>
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
                    <p className="text-3xl font-bold text-white mb-1">{stats.news}</p>
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
                    <p className="text-3xl font-bold text-white mb-1">{stats.volunteers}</p>
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
                    <p className="text-3xl font-bold text-white mb-1">${stats.totalDonations}</p>
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
                            {analytics.contactStatusData.map((entry, index) => (
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
              </div>
            )}

            {/* Programs Management */}
            {activeTab === 'programs' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
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
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowProgramForm(true);
                    }}
                    className="bg-white text-blue-700 hover:bg-blue-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Program
                  </Button>
                </div>

                {selectedPrograms.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedPrograms.length} selected</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {programs.map((program) => (
                    <div key={program.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-blue-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(program);
                              setFormData(program.value);
                              setShowProgramForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        <input
                          type="checkbox"
                          checked={selectedPrograms.includes(program.key)}
                           onClick={(e) => e.stopPropagation()} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPrograms([...selectedPrograms, program.key]);
                            } else {
                              setSelectedPrograms(selectedPrograms.filter(id => id !== program.key));
                            }
                          }}
                          className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        {program.value.image && (
                          <img src={program.value.image} alt={program.value.title} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-800 tracking-tight mb-1">{program.value.title}</h4>
                          <p className="text-sm text-slate-600 mb-2">{program.value.description}</p>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-100">{program.value.category}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(program);
                              setFormData(program.value);
                              setShowProgramForm(true);
                            }}
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {programs.length === 0 && (
                    <div className="text-center py-24">
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
                  {news.map((item) => (
                    <div key={item.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-violet-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-violet-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(item);
                              setFormData(item.value);
                              setShowNewsForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
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
                          <img src={item.value.image} alt={item.value.title} className="w-full h-48 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-800 tracking-tight mb-1">{item.value.title}</h4>
                          <p className="text-sm text-slate-600 mb-2">{item.value.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-violet-50 text-violet-700 border-violet-100">{item.value.category}</Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(item.value.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
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
                          </button>
                        </div>
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
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                      setShowGalleryForm(true);
                    }}
                    className="bg-white text-amber-700 hover:bg-amber-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Image
                  </Button>
                </div>

                {selectedGallery.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedGallery.length} selected</span>
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
                    <div key={item.key} className="bg-white border border-gray-200 border-t-4 border-t-amber-500 rounded-xl p-4 hover:shadow-md hover:border-amber-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                      setEditingItem(null);
                      setShowTeamForm(true);
                    }}>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedGallery.includes(item.key)}
                           onClick={(e) => e.stopPropagation()} onChange={(e) => {
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
                      <h4 className="text-sm text-slate-800 tracking-tight mb-1 truncate">{item.value.title}</h4>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-2">{item.value.description}</p>
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({ ...item.value, image: item.value.imageUrl || item.value.image });
                            setShowGalleryForm(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGallery(item.key)}
                          className="flex items-center justify-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
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
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowTeamForm(true);
                    }}
                    className="bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Team Member
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {team.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-teal-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-teal-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(member);
                              setShowTeamForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        {member.image && (
                          <Avatar className="h-20 w-20 mb-2 shadow-sm border-2 border-white">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-800 tracking-tight mb-1">{member.name}</h4>
                          <p className="text-sm text-emerald-600 mb-2">{member.role}</p>
                          <p className="text-sm text-gray-500 mb-1">Department: {member.department}</p>
                          <p className="text-sm text-slate-600">{member.bio}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(member);
                              setShowTeamForm(true);
                            }}
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <div className="text-center py-24">
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
                  <div className="flex items-center gap-2">
                    <select
                      value={volunteerFilter}
                      onChange={(e) => setVolunteerFilter(e.target.value)}
                      className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm text-white"
                    >
                      <option value="all" className="text-slate-800 tracking-tight">All Status</option>
                      <option value="pending" className="text-slate-800 tracking-tight">Pending</option>
                      <option value="approved" className="text-slate-800 tracking-tight">Approved</option>
                      <option value="rejected" className="text-slate-800 tracking-tight">Rejected</option>
                    </select>
                  </div>
                </div>

                {selectedVolunteers.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedVolunteers.length} selected</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {getFilteredVolunteers().map((volunteer) => (
                    <div key={volunteer.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-rose-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-rose-300 transition-all duration-300 shadow-sm">
                      <div className="flex flex-col h-full gap-5">
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.includes(volunteer.key)}
                           onClick={(e) => e.stopPropagation()} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVolunteers([...selectedVolunteers, volunteer.key]);
                            } else {
                              setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.key));
                            }
                          }}
                          className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg text-slate-800 tracking-tight">{volunteer.value.name}</h4>
                            <Badge className={
                              volunteer.value.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              volunteer.value.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {volunteer.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{volunteer.value.email} • {volunteer.value.phone}</p>
                          <p className="text-sm text-slate-700 leading-relaxed mb-2">Skills: {volunteer.value.skills}</p>
                          <span className="text-xs text-gray-400">
                            Applied: {new Date(volunteer.value.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredVolunteers().length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                        <Heart size={26} className="text-rose-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No volunteer applications</p>
                      <p className="text-xs text-gray-400">Applications will appear here when submitted</p>
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
                  <div className="text-right">
                    <p className="text-sm text-emerald-100">Total Donations</p>
                    <p className="text-2xl font-bold text-white">
                      ${donations.reduce((sum, d) => sum + (d.value.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {donations.map((donation) => (
                    <div key={donation.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-emerald-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{donation.value.name}</h4>
                            <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                              ${donation.value.amount}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{donation.value.email}</p>
                          <p className="text-sm text-slate-700 leading-relaxed">Payment: {donation.value.payment_method}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(donation.value.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {donations.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <TrendingUp size={26} className="text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No donations yet</p>
                      <p className="text-xs text-gray-400">Donation records will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscribers Management */}
            {activeTab === 'subscribers' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
                <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                      <Send size={32} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Newsletter Subscribers <span className="text-sm font-normal text-indigo-200">({subscribers.length})</span></h3>
                      <p className="text-sm text-indigo-100 mt-1.5 opacity-80 font-medium">Manage newsletter subscribers</p>
                    </div>
                  </div>
                  <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0">
                    <Download size={16} className="mr-2" />
                    Export List
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-indigo-500 rounded-2xl px-7 py-6 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 tracking-tight">{subscriber.value.email}</p>
                          <span className="text-xs text-gray-400">
                            Subscribed: {new Date(subscriber.value.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">Active</span>
                      </div>
                    </div>
                  ))}
                  {subscribers.length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <Send size={26} className="text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No subscribers yet</p>
                      <p className="text-xs text-gray-400">Subscribers will appear here when they sign up</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Management - Super Admin Only */}
            {activeTab === 'users' && userRole === 'super-admin' && (
              <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
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
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setUserFormData({ name: '', email: '', password: '', role: 'viewer', status: 'active' });
                      setShowUserForm(true);
                    }}
                    className="bg-white text-slate-800 hover:bg-slate-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add User
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <span className="text-sm text-slate-600">Filters:</span>
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
                    <span className="text-sm text-slate-700 leading-relaxed">{selectedUsers.length} selected</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {getFilteredUsers().map((user) => (
                    <div key={user.key} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-slate-400 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => {
                              setViewingItem(user);
                              setShowPasswordResetDialog(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.key)}
                           onClick={(e) => e.stopPropagation()} onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.key]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.key));
                            }
                          }}
                          className="absolute top-4 left-4 z-10 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <Avatar className="h-16 w-16 mb-2 shadow-sm border-2 border-white">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            {getUserInitials(user.value.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg text-slate-800 tracking-tight">{user.value.name}</h4>
                            <Badge className={getRoleBadgeColor(user.value.role)}>
                              {USER_ROLES.find(r => r.value === user.value.role)?.label}
                            </Badge>
                            <Badge className={
                              user.value.status === 'active'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-gray-100 text-slate-700 leading-relaxed border-gray-300'
                            }>
                              {user.value.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{user.value.email}</p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(user.value.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => {
                              setViewingItem(user);
                              setShowPasswordResetDialog(true);
                            }}
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredUsers().length === 0 && (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                        <Shield size={26} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">No users found</p>
                      <p className="text-xs text-gray-400">Add your first admin user to get started</p>
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
                  {stories.map((story) => (
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
                  {reports.map((report) => (
                    <div key={report.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-slate-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-slate-400 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                      setEditingItem(null);
                      setShowEventForm(true);
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{report.title}</h4>
                            <span className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-gray-100 border border-gray-200 rounded-lg">{report.year}</span>
                            {report.fileSize && <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">{report.fileSize}</span>}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.open(report.fileUrl, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 leading-relaxed bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                          >
                            <Download size={13} />
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                  {events.map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-indigo-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
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
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">🕐 {event.time}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">📍 {event.location}</span>
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {partners.map((partner) => (
                    <div key={partner.id} className="bg-white border border-gray-200 border-t-4 border-t-amber-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-amber-300 transition-all duration-200 text-center shadow-sm cursor-pointer group" onClick={() => {
                            setEditingItem(partner);
                            setShowPartnerForm(true);
                          }}>
                      {partner.logo && (
                        <img src={partner.logo} alt={partner.name} className="h-16 w-auto mx-auto mb-3 object-contain" />
                      )}
                      <h4 className="text-sm text-slate-800 tracking-tight mb-1">{partner.name}</h4>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{partner.description}</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setEditingItem(partner);
                            setShowPartnerForm(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
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
                  <Button
                    onClick={() => {
                      setEditingItem(null);
                      setShowOpportunityForm(true);
                    }}
                    className="bg-white text-purple-700 hover:bg-purple-50 shadow-md font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Opportunity
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-purple-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(opp);
                              setShowOpportunityForm(true);
                            }}>
                      <div className="flex flex-col h-full gap-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{opp.title}</h4>
                            <Badge className="bg-purple-50 text-purple-700 border-purple-100">{opp.type}</Badge>
                            {opp.urgent && <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">Urgent</span>}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{opp.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">📍 {opp.location}</span>
                            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">🕐 {opp.commitment}</span>
                            {opp.spotsAvailable && <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"><Users size={11} /> {opp.spotsAvailable} spots</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingItem(opp);
                              setShowOpportunityForm(true);
                            }}
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && (
                    <div className="text-center py-24">
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
                  {faqs.map((faq) => (
                    <div key={faq.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-cyan-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-cyan-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
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
                  {resources.map((resource) => (
                    <div key={resource.id} className="bg-white border border-gray-200 relative border-t-4 border-l-0 overflow-hidden border-l-green-500 rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:border-green-300 transition-all duration-300 shadow-sm cursor-pointer group" onClick={() => {
                              setEditingItem(resource);
                              setShowResourceForm(true);
                            }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-800 tracking-tight">{resource.title}</h4>
                            <Badge className="bg-green-50 text-green-700 border-green-100">{resource.type}</Badge>
                            {resource.fileSize && <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">{resource.fileSize}</span>}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{resource.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 w-full relative z-20" onClick={(e) => e.stopPropagation()}>
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
      <Dialog open={showProgramForm} onOpenChange={setShowProgramForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-2">
            <DialogTitle>{editingItem ? 'Edit Program' : 'Add Program'}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* News Form Dialog */}
      <Dialog open={showNewsForm} onOpenChange={setShowNewsForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-2">
            <DialogTitle>{editingItem ? 'Edit News' : 'Add News'}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Gallery Form Dialog */}
      <Dialog open={showGalleryForm} onOpenChange={setShowGalleryForm}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-2">
            <DialogTitle>{editingItem ? 'Edit Image' : 'Add Image'}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Contact View/Reply Dialog */}
      {viewingItem && activeTab === 'contacts' && (
        <Dialog open={!!viewingItem} onOpenChange={() => {
          setViewingItem(null);
          setReplyMessage('');
        }}>
          <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
            <DialogHeader className="mb-2">
              <DialogTitle>Contact Message</DialogTitle>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      )}

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-2">
            <DialogTitle>{editingItem ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
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
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
                <option value="inactive">Inactive</option>
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
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <DialogContent className="max-w-xl bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
          <DialogHeader className="mb-2">
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">User</p>
                <p className="text-base">{viewingItem.value.name}</p>
                <p className="text-sm text-slate-600">{viewingItem.value.email}</p>
              </div>
              <div>
                <label className="block text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
