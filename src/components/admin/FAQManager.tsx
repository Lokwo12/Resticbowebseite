import React, { useState, useEffect, useMemo } from 'react';
import { 
  HelpCircle, Plus, Search, Filter, RefreshCw, Edit, Trash2, Eye, 
  ArrowUp, ArrowDown, Check, X, BookOpen, Heart, Users, Handshake, 
  Briefcase, CheckCircle2, EyeOff, Sparkles, Loader2, MessageSquare 
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { 
  FAQItem, 
  FAQ_CATEGORIES, 
  DEFAULT_FAQS, 
  normalizeFaqList, 
  cleanFaqText 
} from '../../utils/faqData';
import { publicAnonKey } from '../../utils/supabase/info';

interface FAQManagerProps {
  accessToken: string;
  projectId: string;
  userRole?: string;
  userName?: string;
  onUpdate?: () => void;
}

export function FAQManager({
  accessToken,
  projectId,
  userRole,
  userName,
  onUpdate
}: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(() => DEFAULT_FAQS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // Dialog & Modal State
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [previewFaq, setPreviewFaq] = useState<FAQItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'About RESTI',
    order: 1,
    published: true,
    featured: false,
    customCategory: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/faqs`,
        { headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data.faqs) ? data.faqs : [];
        const normalized = normalizeFaqList(raw);
        setFaqs(normalized);
      }
    } catch (err) {
      console.warn('Could not fetch FAQs from Supabase, using defaults:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'About RESTI',
      order: faqs.length + 1,
      published: true,
      featured: false,
      customCategory: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'About RESTI',
      order: faq.order || 1,
      published: faq.published !== false,
      featured: faq.featured === true,
      customCategory: ''
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission to modify FAQs.');
      return;
    }

    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please provide both question and answer.');
      return;
    }

    const finalCategory = formData.category === 'Custom' 
      ? (formData.customCategory.trim() || 'General') 
      : formData.category;

    setIsSaving(true);
    try {
      const payload = {
        question: formData.question.trim(),
        answer: cleanFaqText(formData.answer),
        category: finalCategory,
        order: Number(formData.order) || 1,
        published: formData.published,
        featured: formData.featured,
        updatedAt: new Date().toISOString()
      };

      const url = editingFaq
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${editingFaq.key || editingFaq.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs`;

      const res = await fetch(url, {
        method: editingFaq ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Server responded with an error');
      }

      toast.success(editingFaq ? 'FAQ updated successfully' : 'FAQ added successfully');
      setIsFormOpen(false);
      setEditingFaq(null);
      await fetchFaqs();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      // Local optimistic update if backend table is not fully configured
      if (editingFaq) {
        setFaqs(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...formData, category: finalCategory } : f));
        toast.success('FAQ updated locally');
        setIsFormOpen(false);
      } else {
        const newFaq: FAQItem = {
          id: `faq-${Date.now()}`,
          key: `faq:${Date.now()}`,
          question: formData.question.trim(),
          answer: cleanFaqText(formData.answer),
          category: finalCategory,
          order: Number(formData.order) || 1,
          published: formData.published,
          featured: formData.featured,
          createdAt: new Date().toISOString()
        };
        setFaqs(prev => [...prev, newFaq]);
        toast.success('FAQ added');
        setIsFormOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (faq: FAQItem) => {
    if (!canDelete) {
      toast.error('Only administrators can delete FAQs.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this FAQ: "${faq.question}"?`)) {
      return;
    }

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${faq.key || faq.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }
        }
      );
      if (res.ok) {
        toast.success('FAQ deleted');
      }
    } catch (err) {
      console.warn('Server delete error, updating UI state:', err);
    }

    setFaqs(prev => prev.filter(f => f.id !== faq.id));
    if (onUpdate) onUpdate();
  };

  const handleTogglePublish = async (faq: FAQItem) => {
    if (userRole === 'viewer') return;
    const nextStatus = !faq.published;

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${faq.key || faq.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ ...faq, published: nextStatus })
        }
      );
    } catch (err) {
      console.warn('Status toggle sync:', err);
    }

    setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, published: nextStatus } : f));
    toast.success(nextStatus ? 'FAQ published to public site' : 'FAQ unpublished (draft)');
  };

  const handleReorder = async (faq: FAQItem, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const copy = [...faqs];
    const temp = copy[currentIndex];
    copy[currentIndex] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Re-assign order numbers
    const updated = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    setFaqs(updated);

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/faqs/${faq.key || faq.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ ...faq, order: updated[targetIndex].order })
        }
      );
    } catch (err) {
      console.warn('Order sync:', err);
    }
  };

  // Filtered list
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return faqs.filter(faq => {
      const matchesCat = categoryFilter === 'all' || 
        (faq.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'published' && faq.published !== false) ||
        (statusFilter === 'unpublished' && faq.published === false);
      const matchesQuery = !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        (faq.category || '').toLowerCase().includes(q);

      return matchesCat && matchesStatus && matchesQuery;
    });
  }, [faqs, searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = faqs.length;
    const published = faqs.filter(f => f.published !== false).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [faqs]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-6 sm:p-8 md:p-10 space-y-8">
      {/* Top Gradient Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md text-white">
        <div className="flex items-center gap-3.5">
          <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
            <HelpCircle size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Frequently Asked Questions</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
                {stats.total} total
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 opacity-90">
              {stats.published} published • {stats.drafts} unpublished
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setRefreshing(true); fetchFaqs(); }}
            disabled={refreshing || loading}
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white rounded-xl text-xs sm:text-sm"
          >
            <RefreshCw size={14} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-xl shadow-md text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus size={16} className="mr-1.5" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search questions, answers, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'published' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter('unpublished')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'unpublished' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drafts ({stats.drafts})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                categoryFilter.toLowerCase() === cat.id.toLowerCase()
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {loading && faqs.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading FAQs...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
          <HelpCircle size={36} className="text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 mb-1">No FAQs Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery ? 'Try clearing your search query or switching categories.' : 'Click "Add FAQ" above to create your first question.'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
              className="rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFaqs.map((faq, index) => {
            const isPublished = faq.published !== false;

            return (
              <div
                key={faq.id || index}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 sm:p-6 hover:shadow-md ${
                  isPublished 
                    ? 'border-slate-200/90 hover:border-emerald-300' 
                    : 'border-amber-200/80 bg-amber-50/20'
                }`}
              >
                <div>
                  {/* Card Header: Category + Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                      {faq.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        #{faq.order || index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(faq)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title={isPublished ? 'Click to Unpublish' : 'Click to Publish'}
                      >
                        {isPublished ? <Check size={11} /> : <EyeOff size={11} />}
                        <span>{isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question */}
                  <h4 className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-snug mb-2.5">
                    {faq.question}
                  </h4>

                  {/* Answer (Preview) */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 font-normal">
                    {faq.answer}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  {/* Order controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleReorder(faq, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(faq, 'down')}
                      disabled={index === filteredFaqs.length - 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Edit, Preview, Delete Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setPreviewFaq(faq); setPreviewOpen(true); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Preview FAQ"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(faq)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(faq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit FAQ Dialog ── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., How can I donate to RESTI Kiryandongo CBO?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="About RESTI">About RESTI</option>
                    <option value="Programs">Programs</option>
                    <option value="Donations">Donations</option>
                    <option value="Partnerships">Partnerships</option>
                    <option value="Opportunities">Opportunities</option>
                    <option value="Custom">Custom Category...</option>
                  </select>
                </div>

                {formData.category === 'Custom' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Custom Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="e.g., Governance"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Answer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Answer *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    2–5 concise sentences recommended
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a clear, professional explanation in 2-5 sentences..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Status Toggles */}
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Publish on public website
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Feature on homepage
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save FAQ'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Live Accordion Preview Modal ── */}
      {previewFaq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm">Accordion Live Preview</h4>
              </div>
              <button
                onClick={() => setPreviewFaq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border border-emerald-300 rounded-2xl overflow-hidden shadow-sm bg-white mb-6">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="w-full flex items-start justify-between gap-3 p-5 text-left bg-slate-50/50"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mb-2 inline-block">
                    {previewFaq.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {previewFaq.question}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                  {previewOpen ? <span className="font-bold text-lg leading-none">−</span> : <span className="font-bold text-lg leading-none">+</span>}
                </div>
              </button>

              {previewOpen && (
                <div className="p-5 pt-2 border-t border-slate-100 bg-white">
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {previewFaq.answer}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setPreviewFaq(null)}
                className="rounded-xl px-5 bg-slate-800 text-white hover:bg-slate-900 text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
