import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Role *</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              placeholder="e.g., Executive Director, Program Manager"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="general">General</option>
              <option value="leadership">Leadership</option>
              <option value="operations">Operations</option>
              <option value="programs">Programs</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Brief description about the team member"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Twitter URL</label>
            <input
              type="url"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Display Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Profile Image</label>
            <div className="flex gap-3 items-center">
              <label className="cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload size={16} className="mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {formData.image && (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Impact Story' : 'Add Impact Story'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Person's Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Story Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="general">General</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="community">Community</option>
              <option value="empowerment">Empowerment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Story *</label>
            <ReactQuill
              value={formData.story}
              onChange={(value) => setFormData({ ...formData, story: value })}
              className="bg-white"
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
          <div>
            <label className="block text-sm mb-2">Impact Summary</label>
            <textarea
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              rows={2}
              placeholder="Brief summary of the impact achieved"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Image</label>
            <div className="flex gap-3 items-center">
              <label className="cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload size={16} className="mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {formData.image && (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="h-24 w-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Impact Stats Form Dialog
export function ImpactStatsFormDialog({ show, onClose, currentStats, onSuccess, userRole }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    peopleServed: currentStats?.peopleServed || 5000,
    programsActive: currentStats?.programsActive || 12,
    volunteersActive: currentStats?.volunteersActive || 150,
    fundsRaised: currentStats?.fundsRaised || 250000,
    communitiesReached: currentStats?.communitiesReached || 8,
    successRate: currentStats?.successRate || 92
  });

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
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Impact Statistics</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">People Served</label>
              <input
                type="number"
                value={formData.peopleServed}
                onChange={(e) => setFormData({ ...formData, peopleServed: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Active Programs</label>
              <input
                type="number"
                value={formData.programsActive}
                onChange={(e) => setFormData({ ...formData, programsActive: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Active Volunteers</label>
              <input
                type="number"
                value={formData.volunteersActive}
                onChange={(e) => setFormData({ ...formData, volunteersActive: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Funds Raised ($)</label>
              <input
                type="number"
                value={formData.fundsRaised}
                onChange={(e) => setFormData({ ...formData, fundsRaised: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Communities Reached</label>
              <input
                type="number"
                value={formData.communitiesReached}
                onChange={(e) => setFormData({ ...formData, communitiesReached: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Success Rate (%)</label>
              <input
                type="number"
                value={formData.successRate}
                min={0}
                max={100}
                onChange={(e) => setFormData({ ...formData, successRate: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ... Continue with more form dialog components in the next part