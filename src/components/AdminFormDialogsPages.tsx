import React, { useState, useEffect } from 'react';
import { DraggableDialog } from './DraggableDialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Globe, Eye, EyeOff } from 'lucide-react';

interface FormDialogProps {
  show: boolean;
  onClose: () => void;
  editingItem: any | null;
  onSuccess: () => void;
  userRole: string;
}

interface PageFormData {
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function PageFormDialog({ show, onClose, editingItem, onSuccess, userRole }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    slug: '',
    content: '',
    published: true,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        slug: editingItem.slug || '',
        content: editingItem.content || '',
        published: editingItem.published ?? true,
      });
      setAutoSlug(false);
    } else {
      setFormData({ title: '', slug: '', content: '', published: true });
      setAutoSlug(true);
    }
  }, [editingItem, show]);

  const handleTitleChange = (value: string) => {
    const update: Partial<PageFormData> = { title: value };
    if (autoSlug && !editingItem) {
      update.slug = slugify(value);
    }
    setFormData(prev => ({ ...prev, ...update }));
  };

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Title and Slug are required');
      return;
    }

    setLoading(true);
    try {
      const id = editingItem?.id;
      const url = id
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages/${encodeURIComponent(id)}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/pages`;

      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          content: formData.content,
          published: formData.published,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save page');
      }

      toast.success(id ? 'Page updated successfully' : 'Page created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link'],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <DraggableDialog open={show} onClose={onClose} title={editingItem ? 'Edit Page' : 'Add New Page'} defaultWidth={760} headerColor="#2f5496">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="e.g. Community Guidelines"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">/pages/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                placeholder="community-guidelines"
                className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Use lowercase letters, numbers, and hyphens only. No spaces.</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, published: true }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.published
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-gray-600 hover:border-slate-300'
                }`}
              >
                <Eye size={16} />
                Published
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, published: false }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !formData.published
                    ? 'bg-slate-100 border-slate-500 text-slate-700'
                    : 'bg-slate-50 border-slate-200 text-gray-600 hover:border-slate-300'
                }`}
              >
                <EyeOff size={16} />
                Draft
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formData.published
                ? 'Visible in navigation and accessible to all visitors.'
                : 'Hidden from navigation. Only accessible via direct URL (admins only).'}
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Page Content</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <ReactQuill
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                modules={quillModules}
                className="bg-white min-h-[240px]"
                theme="snow"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
            >
              {loading ? 'Saving...' : editingItem ? 'Update Page' : 'Create Page'}
            </Button>
          </div>
        </form>
    </DraggableDialog>
  );
}
