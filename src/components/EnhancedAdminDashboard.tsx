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
  Filter
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SiteSettingsTab } from './SiteSettingsTab';

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

export function EnhancedAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

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

  // Selection states for bulk actions
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);

  // Filter states
  const [contactFilter, setContactFilter] = useState('all');
  const [volunteerFilter, setVolunteerFilter] = useState('all');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  // Add/Edit form states
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
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
  }, [isAuthenticated, activeTab]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
        setUserRole(session.user.user_metadata?.role || 'viewer');
        setIsAuthenticated(true);
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

      setAccessToken(data.session.access_token);
      setUserRole(data.user.user_metadata?.role || 'viewer');
      setIsAuthenticated(true);
      toast.success('Welcome back! 👋');
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
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          body: formDataObj
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setFormData({ ...formData, image: data.url });
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${editingItem.key}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          image: formData.image,
          category: formData.category
        }),
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

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${editingItem.key}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          image: formData.image
        }),
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

  const handleSubmitGallery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${editingItem.key}`
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
          image: formData.image,
          category: formData.category
        }),
      });

      if (!response.ok) throw new Error('Failed to save gallery item');

      toast.success(editingItem ? 'Gallery item updated' : 'Gallery item added');
      setShowGalleryForm(false);
      setEditingItem(null);
      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
      loadData();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save gallery item');
    }
  };

  const handleReplyToContact = async () => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!replyMessage.trim() || !viewingItem) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${viewingItem.key}/reply`,
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
      setShowReplyDialog(false);
      setReplyMessage('');
      setViewingItem(null);
      loadData();
    } catch (err: any) {
      console.error('Reply error:', err);
      toast.error(err.message || 'Failed to send reply');
    }
  };

  const handleDeleteContact = async (key: string) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!confirm('Delete this contact message?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${key}`,
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

  const handleDeleteVolunteer = async (key: string) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!confirm('Delete this volunteer application?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/${key}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete volunteer');

      toast.success('Volunteer application deleted');
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete volunteer');
    }
  };

  const handleUpdateVolunteerStatus = async (key: string, status: string) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/${key}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Volunteer ${status}`);
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleUpdateContactStatus = async (key: string, status: string) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/${key}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Contact marked as ${status}`);
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleBulkDelete = async (type: 'programs' | 'news' | 'gallery', ids: string[]) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${ids.length} items?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/${type === 'gallery' ? 'admin/gallery' : type}/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete items');

      toast.success(`${ids.length} items deleted`);
      if (type === 'programs') setSelectedPrograms([]);
      else if (type === 'news') setSelectedNews([]);
      else setSelectedGallery([]);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete items');
    }
  };

  const handleBulkUpdateStatus = async (type: 'contacts' | 'volunteers', ids: string[], status: string) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/${type}/bulk-update`,
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

      toast.success(`${ids.length} items updated`);
      if (type === 'contacts') setSelectedContacts([]);
      else setSelectedVolunteers([]);
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleBulkDeleteContacts = async (ids: string[]) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${ids.length} contacts?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/contacts/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete contacts');

      toast.success(`${ids.length} contacts deleted`);
      setSelectedContacts([]);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete contacts');
    }
  };

  const handleBulkDeleteVolunteers = async (ids: string[]) => {
    if (userRole === 'viewer') {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${ids.length} volunteer applications?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/volunteers/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete volunteers');

      toast.success(`${ids.length} volunteer applications deleted`);
      setSelectedVolunteers([]);
      loadData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete volunteers');
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0].value);
    const csv = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => 
          JSON.stringify(item.value[header] || '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
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

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center mb-6">
              <img src={logo} alt="Resti Kiryandongo CBO Logo" className="h-24 w-auto mb-3" />
              <div>
                <h2 className="text-xl text-emerald-700">Resti Kiryandongo</h2>
                <p className="text-sm text-gray-600">Community Based Organization</p>
              </div>
            </div>
            <h1 className="text-2xl text-gray-900 mb-2">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-emerald-600 hover:underline text-sm"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Resti Kiryandongo CBO</p>
                  <Badge variant="outline" className="text-xs">
                    {USER_ROLES.find(r => r.value === userRole)?.label || userRole}
                  </Badge>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 flex-wrap">
            <TabsTrigger value="overview">
              <BarChart3 size={16} className="mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="programs">
              <FileText size={16} className="mr-2" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="news">
              <Newspaper size={16} className="mr-2" />
              News
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <ImageIcon size={16} className="mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Mail size={16} className="mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="volunteers">
              <Users size={16} className="mr-2" />
              Volunteers
            </TabsTrigger>
            <TabsTrigger value="donations">
              <Heart size={16} className="mr-2" />
              Donations
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Send size={16} className="mr-2" />
              Newsletter
            </TabsTrigger>
            {userRole === 'super-admin' && (
              <TabsTrigger value="users">
                <Shield size={16} className="mr-2" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="settings">
              <Edit size={16} className="mr-2" />
              Site Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="overview">
            {stats && (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Heart className="text-emerald-600" size={24} />
                      </div>
                      <Badge variant="secondary">{stats.totalDonations}</Badge>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Total Donations</h3>
                    <p className="text-2xl text-gray-900">${stats.totalDonationAmount.toLocaleString()}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="text-blue-600" size={24} />
                      </div>
                      <Badge variant="destructive">{stats.newContacts}</Badge>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Contact Messages</h3>
                    <p className="text-2xl text-gray-900">{stats.totalContacts}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="text-purple-600" size={24} />
                      </div>
                      <Badge variant="default">{stats.pendingVolunteers}</Badge>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Volunteers</h3>
                    <p className="text-2xl text-gray-900">{stats.totalVolunteers}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Send className="text-orange-600" size={24} />
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Subscribers</h3>
                    <p className="text-2xl text-gray-900">{stats.totalSubscribers}</p>
                  </Card>
                </div>

                {analytics && (
                  <>
                    {/* Monthly Donations Chart */}
                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6">Donation Trends (Last 12 Months)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.monthlyDonations}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
                          <Bar dataKey="count" fill="#3b82f6" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Payment Methods & Status Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <h3 className="text-lg text-gray-900 mb-6">Payment Methods</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={analytics.paymentMethodData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => entry.name}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {analytics.paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg text-gray-900 mb-6">Contact Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={analytics.contactStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => entry.name}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {analytics.contactStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </div>

                    {/* Growth Trends */}
                    <Card className="p-6">
                      <h3 className="text-lg text-gray-900 mb-6">Growth Trends</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.growthTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="contacts" stroke="#3b82f6" name="Contacts" />
                          <Line type="monotone" dataKey="volunteers" stroke="#8b5cf6" name="Volunteers" />
                          <Line type="monotone" dataKey="donations" stroke="#10b981" name="Donations" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl text-gray-900">Programs</h2>
                  {selectedPrograms.length > 0 && (
                    <Badge variant="secondary">{selectedPrograms.length} selected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedPrograms.length > 0 && userRole !== 'viewer' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBulkDelete('programs', selectedPrograms)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Selected
                    </Button>
                  )}
                  <Button onClick={() => exportToCSV(programs, 'programs')}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                  {userRole !== 'viewer' && (
                    <Button onClick={() => {
                      setShowProgramForm(true);
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                    }}>
                      <Plus size={16} className="mr-2" />
                      Add Program
                    </Button>
                  )}
                </div>
              </div>

              {programs.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No programs yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {programs.map((program) => (
                    <Card key={program.key} className="p-6">
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
                          <img
                            src={program.value.image}
                            alt={program.value.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg text-gray-900 mb-2">{program.value.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{program.value.description}</p>
                          <div className="flex gap-2">
                            <Badge>{program.value.category}</Badge>
                            <Badge variant="outline">
                              {new Date(program.value.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                        {userRole !== 'viewer' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(program);
                                setFormData({
                                  title: program.value.title,
                                  description: program.value.description,
                                  content: '',
                                  image: program.value.image || '',
                                  category: program.value.category
                                });
                                setShowProgramForm(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Delete this program?')) return;
                                try {
                                  await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs/${program.key}`,
                                    {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${publicAnonKey}` },
                                    }
                                  );
                                  toast.success('Program deleted');
                                  loadData();
                                } catch (err) {
                                  toast.error('Failed to delete program');
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl text-gray-900">News & Updates</h2>
                  {selectedNews.length > 0 && (
                    <Badge variant="secondary">{selectedNews.length} selected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedNews.length > 0 && userRole !== 'viewer' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBulkDelete('news', selectedNews)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Selected
                    </Button>
                  )}
                  <Button onClick={() => exportToCSV(news, 'news')}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                  {userRole !== 'viewer' && (
                    <Button onClick={() => {
                      setShowNewsForm(true);
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'general' });
                    }}>
                      <Plus size={16} className="mr-2" />
                      Add News
                    </Button>
                  )}
                </div>
              </div>

              {news.length === 0 ? (
                <Card className="p-12 text-center">
                  <Newspaper className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No news articles yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <Card key={item.key} className="p-6">
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
                          <img
                            src={item.value.image}
                            alt={item.value.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg text-gray-900 mb-2">{item.value.title}</h3>
                          <div 
                            className="text-gray-600 text-sm mb-3 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: item.value.content }}
                          />
                          <Badge variant="outline">
                            {new Date(item.value.timestamp).toLocaleDateString()}
                          </Badge>
                        </div>
                        {userRole !== 'viewer' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setFormData({
                                  title: item.value.title,
                                  description: '',
                                  content: item.value.content,
                                  image: item.value.image || '',
                                  category: 'general'
                                });
                                setShowNewsForm(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Delete this news?')) return;
                                try {
                                  await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/news/${item.key}`,
                                    {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${publicAnonKey}` },
                                    }
                                  );
                                  toast.success('News deleted');
                                  loadData();
                                } catch (err) {
                                  toast.error('Failed to delete news');
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl text-gray-900">Gallery</h2>
                  {selectedGallery.length > 0 && (
                    <Badge variant="secondary">{selectedGallery.length} selected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedGallery.length > 0 && userRole !== 'viewer' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBulkDelete('gallery', selectedGallery)}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Selected
                    </Button>
                  )}
                  <Button onClick={() => exportToCSV(gallery, 'gallery')}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                  {userRole !== 'viewer' && (
                    <Button onClick={() => {
                      setShowGalleryForm(true);
                      setEditingItem(null);
                      setFormData({ title: '', description: '', content: '', image: '', category: 'event' });
                    }}>
                      <Plus size={16} className="mr-2" />
                      Add Image
                    </Button>
                  )}
                </div>
              </div>

              {gallery.length === 0 ? (
                <Card className="p-12 text-center">
                  <ImageIcon className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No gallery images yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery.map((item) => (
                    <Card key={item.key} className="overflow-hidden">
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
                        {item.value.image && (
                          <img
                            src={item.value.image}
                            alt={item.value.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-gray-900 mb-1">{item.value.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{item.value.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge>{item.value.category}</Badge>
                          {userRole !== 'viewer' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item);
                                  setFormData({
                                    title: item.value.title,
                                    description: item.value.description,
                                    content: '',
                                    image: item.value.image || '',
                                    category: item.value.category
                                  });
                                  setShowGalleryForm(true);
                                }}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm('Delete this image?')) return;
                                  try {
                                    await fetch(
                                      `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/gallery/${item.key}`,
                                      {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${publicAnonKey}` },
                                      }
                                    );
                                    toast.success('Gallery item deleted');
                                    loadData();
                                  } catch (err) {
                                    toast.error('Failed to delete gallery item');
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl text-gray-900">Contact Messages</h2>
                  {selectedContacts.length > 0 && (
                    <Badge variant="secondary">{selectedContacts.length} selected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={contactFilter}
                    onChange={(e) => setContactFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  {selectedContacts.length > 0 && userRole !== 'viewer' && (
                    <>
                      <Button onClick={() => handleBulkUpdateStatus('contacts', selectedContacts, 'read')}>
                        <Eye size={16} className="mr-2" />
                        Mark Read
                      </Button>
                      <Button onClick={() => handleBulkUpdateStatus('contacts', selectedContacts, 'resolved')}>
                        <Check size={16} className="mr-2" />
                        Mark Resolved
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleBulkDeleteContacts(selectedContacts)}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                  <Button onClick={() => exportToCSV(getFilteredContacts(), 'contacts')}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {getFilteredContacts().length === 0 ? (
                <Card className="p-12 text-center">
                  <Mail className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No contact messages</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {getFilteredContacts().map((contact) => (
                    <Card key={contact.key} className="p-6">
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
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-gray-900">{contact.value.name}</h3>
                              <p className="text-sm text-gray-500">{contact.value.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={
                                contact.value.status === 'new' ? 'destructive' :
                                contact.value.status === 'read' ? 'default' : 'secondary'
                              }>
                                {contact.value.status || 'new'}
                              </Badge>
                              <Badge variant="outline">
                                {new Date(contact.value.timestamp).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{contact.value.message}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setViewingItem(contact);
                                setShowContactDialog(true);
                              }}
                            >
                              <Eye size={16} className="mr-2" />
                              View
                            </Button>
                            {userRole !== 'viewer' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setViewingItem(contact);
                                    setShowReplyDialog(true);
                                  }}
                                >
                                  <Reply size={16} className="mr-2" />
                                  Reply
                                </Button>
                                {contact.value.status !== 'resolved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateContactStatus(contact.key, 'resolved')}
                                  >
                                    <Check size={16} className="mr-2" />
                                    Resolve
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteContact(contact.key)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl text-gray-900">Volunteer Applications</h2>
                  {selectedVolunteers.length > 0 && (
                    <Badge variant="secondary">{selectedVolunteers.length} selected</Badge>
                  )}
                </div>
                <div className="flex gap-2">
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
                  {selectedVolunteers.length > 0 && userRole !== 'viewer' && (
                    <>
                      <Button onClick={() => handleBulkUpdateStatus('volunteers', selectedVolunteers, 'approved')}>
                        <Check size={16} className="mr-2" />
                        Approve Selected
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleBulkUpdateStatus('volunteers', selectedVolunteers, 'rejected')}
                      >
                        <X size={16} className="mr-2" />
                        Reject Selected
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleBulkDeleteVolunteers(selectedVolunteers)}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                  <Button onClick={() => exportToCSV(getFilteredVolunteers(), 'volunteers')}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {getFilteredVolunteers().length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No volunteer applications</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {getFilteredVolunteers().map((volunteer) => (
                    <Card key={volunteer.key} className="p-6">
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
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-gray-900">{volunteer.value.name}</h3>
                              <p className="text-sm text-gray-500">{volunteer.value.email} • {volunteer.value.phone}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={
                                volunteer.value.status === 'pending' ? 'default' :
                                volunteer.value.status === 'approved' ? 'secondary' : 'destructive'
                              }>
                                {volunteer.value.status || 'pending'}
                              </Badge>
                              <Badge variant="outline">
                                {new Date(volunteer.value.timestamp).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div>
                              <span className="text-gray-500">Interests:</span>
                              <span className="text-gray-900 ml-1">{volunteer.value.interests || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Availability:</span>
                              <span className="text-gray-900 ml-1">{volunteer.value.availability || 'Not specified'}</span>
                            </div>
                          </div>
                          {volunteer.value.message && (
                            <p className="text-gray-600 text-sm mb-3">{volunteer.value.message}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setViewingItem(volunteer);
                                setShowVolunteerDialog(true);
                              }}
                            >
                              <Eye size={16} className="mr-2" />
                              View Details
                            </Button>
                            {userRole !== 'viewer' && (
                              <>
                                {volunteer.value.status !== 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'approved')}
                                  >
                                    <Check size={16} className="mr-2" />
                                    Approve
                                  </Button>
                                )}
                                {volunteer.value.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateVolunteerStatus(volunteer.key, 'rejected')}
                                  >
                                    <X size={16} className="mr-2" />
                                    Reject
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteVolunteer(volunteer.key)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl text-gray-900">Donations</h2>
                <Button onClick={() => exportToCSV(donations, 'donations')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>

              {donations.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No donations yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <Card key={donation.key} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-gray-900 mb-1">{donation.value.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{donation.value.email}</p>
                          <div className="flex gap-2 text-sm">
                            <Badge>${donation.value.amount}</Badge>
                            <Badge variant="outline">{donation.value.paymentMethod}</Badge>
                            <Badge variant="outline">
                              {new Date(donation.value.timestamp).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Newsletter Tab */}
          <TabsContent value="subscribers">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl text-gray-900">Newsletter Subscribers</h2>
                <Button onClick={() => exportToCSV(subscribers, 'subscribers')}>
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              </div>

              {subscribers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Send className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No subscribers yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribers.map((subscriber) => (
                    <Card key={subscriber.key} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Send className="text-emerald-600" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm">{subscriber.value.email}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(subscriber.value.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          {userRole === 'super-admin' && (
            <TabsContent value="users">
              <div className="space-y-6">
                <h2 className="text-2xl text-gray-900">Admin Users</h2>
                {adminUsers.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Shield className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">No admin users</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((user) => (
                      <Card key={user.id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-gray-900 mb-1">{user.user_metadata?.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                            <Badge>{user.user_metadata?.role || 'viewer'}</Badge>
                          </div>
                          <Badge variant="outline">
                            {new Date(user.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <SiteSettingsTab 
              settings={siteSettings} 
              onUpdate={() => loadData()} 
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Program Form Dialog */}
      {showProgramForm && (
        <Dialog open={showProgramForm} onOpenChange={setShowProgramForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Program' : 'Add New Program'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitProgram} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="education">Education</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="development">Community Development</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="flex-1"
                  />
                  {uploadingImage && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {formData.image && (
                  <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowProgramForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'} Program
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* News Form Dialog with Rich Text Editor */}
      {showNewsForm && (
        <Dialog open={showNewsForm} onOpenChange={setShowNewsForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit News' : 'Add New News'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitNews} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Content</label>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  className="bg-white"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Featured Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="flex-1"
                  />
                  {uploadingImage && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {formData.image && (
                  <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowNewsForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'} News
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Gallery Form Dialog */}
      {showGalleryForm && (
        <Dialog open={showGalleryForm} onOpenChange={setShowGalleryForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitGallery} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="event">Event</option>
                  <option value="project">Project</option>
                  <option value="community">Community</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    required={!editingItem}
                    className="flex-1"
                  />
                  {uploadingImage && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {formData.image && (
                  <img src={formData.image} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGalleryForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Add'} Gallery Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact View Dialog */}
      {showContactDialog && viewingItem && (
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contact Message Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-gray-900">{viewingItem.value.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-gray-900">{viewingItem.value.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date</label>
                <p className="text-gray-900">{new Date(viewingItem.value.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge>{viewingItem.value.status || 'new'}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Message</label>
                <p className="text-gray-900 mt-1">{viewingItem.value.message}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Volunteer View Dialog */}
      {showVolunteerDialog && viewingItem && (
        <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Volunteer Application Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-gray-900">{viewingItem.value.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-900">{viewingItem.value.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="text-gray-900">{viewingItem.value.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date Applied</label>
                <p className="text-gray-900">{new Date(viewingItem.value.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge>{viewingItem.value.status || 'pending'}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Interests</label>
                <p className="text-gray-900">{viewingItem.value.interests || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Availability</label>
                <p className="text-gray-900">{viewingItem.value.availability || 'Not specified'}</p>
              </div>
              {viewingItem.value.message && (
                <div>
                  <label className="text-sm text-gray-500">Message</label>
                  <p className="text-gray-900 mt-1">{viewingItem.value.message}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
      {showReplyDialog && viewingItem && (
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to {viewingItem.value.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">To</label>
                <p className="text-gray-900">{viewingItem.value.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Original Message</label>
                <p className="text-gray-600 text-sm mt-1 p-3 bg-gray-50 rounded">{viewingItem.value.message}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Type your reply here..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => {
                  setShowReplyDialog(false);
                  setReplyMessage('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleReplyToContact} disabled={!replyMessage.trim()}>
                  <Send size={16} className="mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
