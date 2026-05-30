import React, { useState } from 'react';
import { FileText, Plus, Trash2, Edit, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { useAdminData } from '../../../hooks/useAdminData';
import { DraggableDialog } from '../../DraggableDialog';

export function ProgramsTab(props: any) {
  const { activeTab, projectId, accessToken, setViewingItem, setFormData, setEditingItem, setShowProgramForm, formData: programFormData, showProgramForm } = props;
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { items: programs, totalCount, totalPages, page, setPage, isLoading, deleteItems: handleBulkDelete, limit, saveItem: saveProgram } = useAdminData('programs', 'programs', accessToken, projectId);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveProgram(programFormData);
  };
  
  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <React.Fragment>
      {activeTab === 'programs' && (
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/80 p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 md:p-3.5 rounded-xl bg-white/20 border border-white/30 shadow-sm flex-shrink-0">
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Programs <span className="text-sm font-normal text-blue-200">({totalCount})</span></h3>
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
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-sm text-slate-700 font-medium">{selectedItems.length} selected</span>
              <button
                onClick={() => handleBulkDelete(selectedItems)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <X size={13} />
                Clear
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {programs.map((program: any) => (
              <div key={program.key || program.id} className="group bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(program.key || program.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedItems([...selectedItems, program.key || program.id]);
                      else setSelectedItems(selectedItems.filter(id => id !== (program.key || program.id)));
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingItem(program); setFormData(program.value || program); setShowProgramForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-sm border border-slate-100"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleBulkDelete([program.key || program.id])}
                      className="p-1.5 text-slate-400 hover:text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors shadow-sm border border-slate-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                    <FileText size={24} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors line-clamp-1">{program.value?.title || program.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">{program.value?.description || program.description}</p>
                </div>
              </div>
            ))}
             {programs.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                    <FileText size={26} className="text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No programs yet</p>
                  <p className="text-xs text-gray-400">Create your first program to get started!</p>
                </div>
              )}
          </div>

          <DraggableDialog open={showProgramForm} onClose={() => setShowProgramForm(false)} title={props.editingItem ? 'Edit Program' : 'Add Program'} headerColor="#2f5496">
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" required value={programFormData.title} onChange={e => setFormData({ ...programFormData, title: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={programFormData.category} onChange={e => setFormData({ ...programFormData, category: e.target.value })} className="w-full px-4 py-2 border rounded-xl">
                  <option value="general">General</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                <textarea required value={programFormData.description} onChange={e => setFormData({ ...programFormData, description: e.target.value })} className="w-full px-4 py-2 border rounded-xl" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input type="url" value={programFormData.image} onChange={e => setFormData({ ...programFormData, image: e.target.value })} className="w-full px-4 py-2 border rounded-xl" placeholder="https://" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowProgramForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Program'}</Button>
              </div>
            </form>
          </DraggableDialog>
        </div>
      )}
    </React.Fragment>
  );
}
