import React, { useState, useEffect } from 'react';
import { DraggableDialog } from './DraggableDialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FormDialogProps {
  show: boolean;
  onClose: () => void;
  editingItem: any;
  onSuccess: () => void;
  userRole: string;
  accessToken?: string;
}

export function MapLocationFormDialog({ show, onClose, editingItem, onSuccess, userRole, accessToken }: FormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'health',
    lat: '',
    lng: '',
    description: '',
    impact: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        category: editingItem.category || 'health',
        lat: editingItem.coordinates?.[0]?.toString() || '',
        lng: editingItem.coordinates?.[1]?.toString() || '',
        description: editingItem.description || '',
        impact: editingItem.impact || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'health',
        lat: '',
        lng: '',
        description: '',
        impact: ''
      });
    }
  }, [editingItem, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      toast.error('You do not have permission');
      return;
    }
    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error('Coordinates must be valid numbers');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        coordinates: [latNum, lngNum],
        description: formData.description,
        impact: formData.impact
      };

      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/map-locations/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/map-locations`;
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken || publicAnonKey}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success(editingItem ? 'Location updated' : 'Location added');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableDialog open={show} onClose={onClose} title={editingItem ? 'Edit Map Location' : 'Add Map Location'} headerColor="#2f5496">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-2">Location Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Kigumba Healthcare Initiative"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          >
            <option value="health">Healthcare (Blue)</option>
            <option value="education">Education (Emerald)</option>
            <option value="wash">WASH (Cyan)</option>
            <option value="livelihood">Livelihoods (Amber)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Latitude *</label>
            <input
              type="text"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              required
              placeholder="e.g. 1.8156"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Longitude *</label>
            <input
              type="text"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              required
              placeholder="e.g. 32.0084"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Tip: You can find coordinates by right-clicking anywhere on <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Google Maps</a>.
        </p>
        <div>
          <label className="block text-sm mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Impact Stat (Optional)</label>
          <input
            type="text"
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            placeholder="e.g. 1,200+ patients treated monthly"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all">
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </DraggableDialog>
  );
}
