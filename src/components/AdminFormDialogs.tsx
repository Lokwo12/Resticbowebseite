import React, { useState, useEffect } from 'react';
import { DraggableDialog } from './DraggableDialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, X, User, Mail, Link2, Tag, Hash, Shield, Info, FileText, Globe, Briefcase, Calendar, Heart, TrendingUp, Target, Award } from 'lucide-react';

import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface FormDialogProps {
  show: boolean;
  onClose: () => void;
  editingItem: any;
  onSuccess: () => void;
  userRole: string;
}

// Team Member Form Dialog
export function TeamFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: 'general',
    bio: '',
    image: '',
    email: '',
    linkedin: '',
    twitter: '',
    order: 999
  });

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        role: editingItem.role || '',
        department: editingItem.department || 'general',
        bio: editingItem.bio || '',
        image: editingItem.image || '',
        email: editingItem.email || '',
        linkedin: editingItem.linkedin || '',
        twitter: editingItem.twitter || '',
        order: editingItem.order || 999
      });
    } else {
      setFormData({
        name: '',
        role: '',
        department: 'general',
        bio: '',
        image: '',
        email: '',
        linkedin: '',
        twitter: '',
        order: 999
      });
    }
  }, [editingItem, show]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    setLoading(true);
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/team/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/team`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'Team member updated' : 'Team member added');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableDialog open={show} onClose={onClose} title={editingItem ? 'Edit Team Member' : 'Add Team Member'} headerColor="#2f5496">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="Full Name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                placeholder="e.g., Executive Director, Program Manager"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <div className="relative">
              <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
              >
                <option value="general">General</option>
                <option value="leadership">Leadership</option>
                <option value="operations">Operations</option>
                <option value="programs">Programs</option>
                <option value="finance">Finance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-4 text-slate-400" />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="Brief description about the team member"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
            <div className="relative">
              <Link2 size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Twitter URL</label>
            <div className="relative">
              <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image</label>
            <div className="flex gap-3 items-center">
              <label className="cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
                  <span>
                    <Upload size={16} className="mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {formData.image && (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-100" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200 hover:bg-slate-50">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
    </DraggableDialog>
  );

}

// Impact Story Form Dialog
export function StoryFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    story: '',
    image: '',
    category: 'general',
    impact: ''
  });

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        title: editingItem.title || '',
        story: editingItem.story || '',
        image: editingItem.image || '',
        category: editingItem.category || 'general',
        impact: editingItem.impact || ''
      });
    } else {
      setFormData({
        name: '',
        title: '',
        story: '',
        image: '',
        category: 'general',
        impact: ''
      });
    }
  }, [editingItem, show]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    setLoading(true);
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/stories`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'Story updated' : 'Story added');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableDialog open={show} onClose={onClose} title={editingItem ? 'Edit Impact Story' : 'Add Impact Story'} defaultWidth={720} headerColor="#2f5496">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Person's Name *</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="Name of the person"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Story Title *</label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="Title of the story"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <div className="relative">
              <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
              >
                <option value="general">General</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="community">Community</option>
                <option value="empowerment">Empowerment</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Story *</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <ReactQuill
                value={formData.story}
                onChange={(value) => setFormData({ ...formData, story: value })}
                className="bg-white border-0"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Impact Summary</label>
            <div className="relative">
              <Heart size={18} className="absolute left-3 top-4 text-slate-400" />
              <textarea
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                rows={2}
                placeholder="Brief summary of the impact achieved"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
            <div className="flex gap-3 items-center">
              <label className="cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} asChild className="rounded-xl border-slate-200 hover:bg-slate-50">
                  <span>
                    <Upload size={16} className="mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {formData.image && (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-24 w-32 object-cover rounded-lg border border-slate-100" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200 hover:bg-slate-50">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
    </DraggableDialog>
  );
}

// Impact Stats Form Dialog
export function ImpactStatsFormDialog({ show, onClose, currentStats, onSuccess, userRole }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    peopleServed: 5000,
    programsActive: 12,
    volunteersActive: 150,
    fundsRaised: 250000,
    communitiesReached: 8,
    successRate: 92
  });

  useEffect(() => {
    setFormData({
      peopleServed: currentStats?.peopleServed ?? 5000,
      programsActive: currentStats?.programsActive ?? 12,
      volunteersActive: currentStats?.volunteersActive ?? 150,
      fundsRaised: currentStats?.fundsRaised ?? 250000,
      communitiesReached: currentStats?.communitiesReached ?? 8,
      successRate: currentStats?.successRate ?? 92
    });
  }, [currentStats, show]);

  const handleNumber = (field: string, value: string) => {
    const num = parseInt(value);
    setFormData(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/impact-stats`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify(formData)
        }
      );
      if (!response.ok) throw new Error('Failed to save');
      toast.success('Impact statistics updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableDialog open={show} onClose={onClose} title="Update Impact Statistics" headerColor="#2f5496">

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">People Served</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <User size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={formData.peopleServed}
                  onChange={(e) => handleNumber('peopleServed', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Active Programs</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <FileText size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={formData.programsActive}
                  onChange={(e) => handleNumber('programsActive', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Active Volunteers</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <Heart size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={formData.volunteersActive}
                  onChange={(e) => handleNumber('volunteersActive', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 150"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Funds Raised <span className="text-slate-400 font-normal">(USD)</span></label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <TrendingUp size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={formData.fundsRaised}
                  onChange={(e) => handleNumber('fundsRaised', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 250000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Communities Reached</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <Target size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={formData.communitiesReached}
                  onChange={(e) => handleNumber('communitiesReached', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Success Rate <span className="text-slate-400 font-normal">(%)</span></label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <Award size={18} className="text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.successRate}
                  onChange={(e) => handleNumber('successRate', e.target.value)}
                  className="flex-1 bg-transparent py-3 outline-none text-slate-800 placeholder:text-slate-400"
                  placeholder="e.g. 92"
                />
              </div>
            </div>

          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200 hover:bg-slate-50">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
    </DraggableDialog>
  );
}

// ... Continue with more form dialog components in the next part