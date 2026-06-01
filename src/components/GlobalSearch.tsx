import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Search, X, Loader, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string, title: string, desc: string, link: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // It's handled by parent usually, but we could trigger a global event.
          // Since we are inside the component, we just focus the input if it's already open.
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchTerm = `%${query}%`;
        const res: any[] = [];

        // Search Programs
        const { data: programs } = await supabase.from('programs').select('id, title, description').ilike('title', searchTerm).limit(3);
        if (programs) programs.forEach(p => res.push({ type: 'Program', title: p.title, desc: p.description || '', link: `/programs/${p.id}` }));

        // Search News
        const { data: news } = await supabase.from('news').select('id, title, excerpt').ilike('title', searchTerm).limit(3);
        if (news) news.forEach(n => res.push({ type: 'News', title: n.title, desc: n.excerpt || '', link: `/news/${n.id}` }));

        // Search Events
        const { data: events } = await supabase.from('events').select('id, title, description').ilike('title', searchTerm).limit(3);
        if (events) events.forEach(e => res.push({ type: 'Event', title: e.title, desc: e.description || '', link: `/#events` }));

        // Search Team
        const { data: team } = await supabase.from('team').select('id, name, role').ilike('name', searchTerm).limit(3);
        if (team) team.forEach(t => res.push({ type: 'Team', title: t.name, desc: t.role || '', link: `/team` }));

        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayTimer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh] animate-[scaleIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Area */}
        <div className="relative flex items-center p-4 border-b border-slate-100 bg-white z-10">
          <Search className="absolute left-6 text-emerald-500" size={24} />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search programs, news, events, people..."
            className="w-full pl-12 pr-12 py-3 text-lg outline-none text-slate-800 placeholder:text-slate-400 bg-transparent font-medium"
          />
          <button 
            onClick={onClose}
            className="absolute right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto flex-1 bg-slate-50/50 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-3">
              <Loader className="animate-spin text-emerald-500" size={20} />
              <span className="font-medium">Searching our database...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    navigate(item.link);
                    onClose();
                  }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all duration-200 gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 rounded-md group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        {item.type}
                      </span>
                      <h4 className="font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{item.title}</h4>
                    </div>
                    {item.desc && (
                      <p className="text-sm text-slate-500 line-clamp-1 group-hover:text-slate-600">{String(item.desc).replace(/<[^>]+>/g, '')}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                    <ArrowRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No exact matches found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">We couldn't find anything matching "{query}". Try double-checking your spelling or searching for a broader term.</p>
            </div>
          ) : (
            <div className="p-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Donate to Cause', link: '/#donate', icon: Heart },
                  { name: 'Volunteer With Us', link: '/volunteer', icon: ExternalLink },
                  { name: 'Read Impact Stories', link: '/stories', icon: ExternalLink },
                  { name: 'Upcoming Events', link: '/#events', icon: ExternalLink }
                ].map((l, i) => (
                  <Link 
                    key={i} 
                    to={l.link} 
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 text-slate-600 hover:text-emerald-700 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <l.icon size={14} />
                    </div>
                    <span className="font-semibold text-sm">{l.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
