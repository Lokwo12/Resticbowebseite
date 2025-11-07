import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js@2';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import logo from 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png';
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
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('make-2a4be611-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { signedUrl } } = await supabase.storage
        .from('make-2a4be611-images')
        .createSignedUrl(fileName, 31536000);

      return signedUrl;
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
        body: JSON.stringify(formData),
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/team/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/stories/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/reports/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/partners/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs/${id}`,
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
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/resources/${id}`,
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
        <Card className="w-full max-w-md p-8 shadow-2xl border-0">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white rounded-full p-4 shadow-lg mb-4">
                <img src={logo} alt="Resti Kiryandongo CBO Logo" className="h-20 w-auto" />
              </div>
              <div>
                <h2 className="text-2xl text-emerald-700">Resti Kiryandongo CBO</h2>
                <p className="text-sm text-gray-600">Community Based Organization</p>
              </div>
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              {isSignup ? 'Create your admin account' : 'Sign in to manage your website'}
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

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-emerald-600 hover:text-emerald-700 text-sm transition"
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
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
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-lg text-gray-900">Resti Kiryandongo CBO</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
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
                {NAVIGATION_ITEMS.map((item) => {
                  // Hide users tab if not super-admin
                  if (item.id === 'users' && userRole !== 'super-admin') return null;
                  
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
                      <Badge variant="secondary">{stats.programs}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{stats.programs}</h3>
                    <p className="text-sm text-gray-600">Total Programs</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <Newspaper className="text-purple-600" size={24} />
                      <Badge variant="secondary">{stats.news}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{stats.news}</h3>
                    <p className="text-sm text-gray-600">News Articles</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-rose-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <Heart className="text-rose-600" size={24} />
                      <Badge variant="secondary">{stats.volunteers}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">{stats.volunteers}</h3>
                    <p className="text-sm text-gray-600">Volunteers</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="text-emerald-600" size={24} />
                      <Badge variant="secondary">${stats.totalDonations}</Badge>
                    </div>
                    <h3 className="text-2xl text-gray-900 mb-1">${stats.totalDonations}</h3>
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
                  </div>
                </Card>
              </div>
            )}

            {/* Placeholder for other tabs - will add detailed content in next message */}
            {activeTab !== 'overview' && (
              <div className="text-center py-12">
                <CurrentIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Content management interface for {currentMenuItem?.label} will appear here</p>
                <p className="text-sm text-gray-400 mt-2">The full content management UI is being prepared...</p>
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
    </div>
  );
}
