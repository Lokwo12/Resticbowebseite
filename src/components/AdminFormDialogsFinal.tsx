import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
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

// Volunteer Opportunity Form Dialog
export function OpportunityFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [],
    timeCommitment: '',
    location: '',
    category: 'general',
    openPositions: 1,
    benefits: []
  });
  const [requirementInput, setRequirementInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        requirements: editingItem.requirements || [],
        timeCommitment: editingItem.timeCommitment || '',
        location: editingItem.location || '',
        category: editingItem.category || 'general',
        openPositions: editingItem.openPositions || 1,
        benefits: editingItem.benefits || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        requirements: [],
        timeCommitment: '',
        location: '',
        category: 'general',
        openPositions: 1,
        benefits: []
      });
    }
  }, [editingItem, show]);

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({ ...formData, requirements: [...formData.requirements, requirementInput.trim()] });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({ ...formData, benefits: [...formData.benefits, benefitInput.trim()] });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({ ...formData, benefits: formData.benefits.filter((_, i) => i !== index) });
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
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/opportunities`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'Opportunity updated' : 'Opportunity added');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle>{editingItem ? 'Edit Opportunity' : 'Add Opportunity'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Opportunity Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Requirements</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                placeholder="Add a requirement"
                className="flex-1 px-4 py-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement}>Add</Button>
            </div>
            <div className="space-y-1">
              {formData.requirements.map((req: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                  <span className="flex-1 text-sm">{req}</span>
                  <button type="button" onClick={() => removeRequirement(index)} className="text-red-500 text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Time Commitment *</label>
              <input
                type="text"
                value={formData.timeCommitment}
                onChange={(e) => setFormData({ ...formData, timeCommitment: e.target.value })}
                required
                placeholder="e.g., 5 hours/week"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              >
                <option value="general">General</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="community">Community</option>
                <option value="fundraising">Fundraising</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Open Positions</label>
              <input
                type="number"
                value={formData.openPositions}
                onChange={(e) => setFormData({ ...formData, openPositions: parseInt(e.target.value) })}
                min={1}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Benefits</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="Add a benefit"
                className="flex-1 px-4 py-2 border rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" onClick={addBenefit}>Add</Button>
            </div>
            <div className="space-y-1">
              {formData.benefits.map((benefit: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                  <span className="flex-1 text-sm">{benefit}</span>
                  <button type="button" onClick={() => removeBenefit(index)} className="text-red-500 text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// FAQ Form Dialog
export function FAQFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    order: 999
  });

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        question: editingItem.question || '',
        answer: editingItem.answer || '',
        category: editingItem.category || 'general',
        order: editingItem.order || 999
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        order: 999
      });
    }
  }, [editingItem, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    setLoading(true);
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'FAQ updated' : 'FAQ added');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle>{editingItem ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Question *</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Answer *</label>
            <ReactQuill
              value={formData.answer}
              onChange={(value) => setFormData({ ...formData, answer: value })}
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
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              >
                <option value="general">General</option>
                <option value="donations">Donations</option>
                <option value="volunteering">Volunteering</option>
                <option value="programs">Programs</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Resource Form Dialog
export function ResourceFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'PDF',
    fileSize: '',
    category: 'general'
  });

  // Update form data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        fileUrl: editingItem.fileUrl || '',
        fileType: editingItem.fileType || 'PDF',
        fileSize: editingItem.fileSize || '',
        category: editingItem.category || 'general'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'PDF',
        fileSize: '',
        category: 'general'
      });
    }
  }, [editingItem, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    setLoading(true);
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/resources`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'Resource updated' : 'Resource added');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-[2rem] p-8 border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle>{editingItem ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Resource Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">File URL *</label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              required
              placeholder="https://example.com/document.pdf"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Upload your file to a hosting service and paste the URL here</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">File Type</label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              >
                <option value="PDF">PDF</option>
                <option value="DOC">DOC</option>
                <option value="XLS">XLS</option>
                <option value="PPT">PPT</option>
                <option value="ZIP">ZIP</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">File Size (optional)</label>
              <input
                type="text"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                placeholder="e.g., 1.5 MB"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            >
              <option value="general">General</option>
              <option value="reports">Reports</option>
              <option value="guidelines">Guidelines</option>
              <option value="forms">Forms</option>
              <option value="presentations">Presentations</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}