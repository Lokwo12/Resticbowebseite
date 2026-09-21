import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, MessageCircle, Clock, FileText, TrendingUp, 
  MessageSquare, Download, MapPin, Newspaper, Calendar, 
  Image as ImageIcon, Handshake, Target, Heart, Mail, 
  Send, Users, Settings, Globe, BookOpen, HelpCircle, 
  Shield, Search, X, ChevronRight, Pin, PinOff, 
  PanelLeftClose, PanelLeftOpen, ExternalLink, PieChart
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: any;
  color: string;
  headerBg: string;
  accentBg: string;
  description: string;
  badgeKey?: 'liveChat' | 'contacts' | 'volunteers' | 'donations';
}

export interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export const NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    id: 'overview-group',
    title: 'Overview & Activity',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Metrics & quick actions' },
      { id: 'live-chat', label: 'Live Chat', icon: MessageCircle, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Real-time visitor chats', badgeKey: 'liveChat' },
      { id: 'activity-log', label: 'Activity Log', icon: Clock, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'System audit trails' },
    ],
  },
  {
    id: 'programs-group',
    title: 'Programs & Impact',
    items: [
      { id: 'programs', label: 'Programs', icon: FileText, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Core initiative projects' },
      { id: 'impact', label: 'Impact Stats', icon: TrendingUp, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Key performance indicators' },
      { id: 'stories', label: 'Stories & Voices', icon: MessageSquare, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Beneficiary testimonials' },
      { id: 'reports', label: 'Publications & Reports', icon: Download, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Institutional publications, reports & accountability' },
      { id: 'financials', label: 'Financial Transparency', icon: PieChart, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Fund allocations, annual figures & audits' },
      { id: 'map', label: 'Map Locations', icon: MapPin, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Field hubs & activity sites' },
    ],
  },
  {
    id: 'content-group',
    title: 'Content & Media',
    items: [
      { id: 'news', label: 'News & Press', icon: Newspaper, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Articles & press releases' },
      { id: 'events', label: 'Events & Calendar', icon: Calendar, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Workshops & community events' },
      { id: 'gallery', label: 'Photo Gallery', icon: ImageIcon, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Field photos & albums' },
      { id: 'partners', label: 'Partners & Donors', icon: Handshake, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Partner organizations' },
      { id: 'opportunities', label: 'Opportunities', icon: Target, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Jobs, tenders & internships' },
    ],
  },
  {
    id: 'audience-group',
    title: 'Audience & Inquiries',
    items: [
      { id: 'donations', label: 'Donations Portal', icon: Heart, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Donor records & contributions', badgeKey: 'donations' },
      { id: 'volunteers', label: 'Volunteers', icon: Heart, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Volunteer applications', badgeKey: 'volunteers' },
      { id: 'contacts', label: 'Messages', icon: Mail, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Contact form messages', badgeKey: 'contacts' },
      { id: 'subscribers', label: 'Subscribers', icon: Send, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Newsletter subscribers' },
      { id: 'team', label: 'Team Members', icon: Users, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Staff & leadership team' },
    ],
  },
  {
    id: 'settings-group',
    title: 'Site Management',
    items: [
      { id: 'settings', label: 'Site Customizer', icon: Settings, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Hero, financials, theme' },
      { id: 'pages', label: 'Static Pages', icon: Globe, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Static pages copy' },
      { id: 'resources', label: 'Resources & Docs', icon: BookOpen, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Public downloadable docs' },
      { id: 'faqs', label: 'FAQs & Help', icon: HelpCircle, color: 'text-slate-400', headerBg: '#1a2540', accentBg: '#2f5496', description: 'Frequently asked questions' },
    ],
  },
];

export const NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((g) => g.items);

const MIN_SIDEBAR_WIDTH = 210;
const MAX_SIDEBAR_WIDTH = 420;
const COLLAPSED_WIDTH = 68;

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  userRole: string;
  userName: string;
  getBadgeCount: (badgeKey?: string) => number;
  USER_ROLES: { value: string; label: string }[];
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export function AdminSidebar({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  userRole,
  userName,
  getBadgeCount,
  USER_ROLES,
  searchQuery,
  setSearchQuery,
}: AdminSidebarProps) {
  // --- Persistent States from LocalStorage ---
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    } catch (e) {}
    return 264;
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_pinned');
      return saved === null ? true : saved === 'true';
    } catch (e) {
      return true;
    }
  });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_open_groups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Dynamic UI runtime states
  const [internalSearch, setInternalSearch] = useState('');
  const sidebarSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const setSidebarSearch = setSearchQuery || setInternalSearch;
  const [isDragging, setIsDragging] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [hoveredTooltipItem, setHoveredTooltipItem] = useState<{ id: string; rect: DOMRect; label: string; desc: string; badge?: number } | null>(null);

  const hoverTimeoutRef = useRef<any>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(sidebarWidth);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  // Sync states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_width', sidebarWidth.toString());
    } catch (e) {}
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}
  }, [isCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_pinned', isPinned ? 'true' : 'false');
    } catch (e) {}
  }, [isPinned]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_open_groups', JSON.stringify(openGroups));
    } catch (e) {}
  }, [openGroups]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Drag Resizing Handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current;
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, dragStartWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Unpinned hover behaviors
  const handleMouseEnter = () => {
    if (!isPinned || isCollapsed) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsHoverExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned || isCollapsed) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoverExpanded(false);
        setHoveredTooltipItem(null);
      }, 150);
    }
  };

  // Group accordion actions
  const isGroupOpen = (groupId: string, items: any[]) => {
    if (sidebarSearch.trim()) return true;
    if (openGroups[groupId] !== undefined) return openGroups[groupId];
    return items.some((item) => item.id === activeTab);
  };

  const toggleGroup = (groupId: string, currentlyOpen: boolean) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !currentlyOpen,
    }));
  };

  const expandAllGroups = () => {
    const allOpen: Record<string, boolean> = {};
    NAVIGATION_GROUPS.forEach((g) => {
      allOpen[g.id] = true;
    });
    setOpenGroups(allOpen);
  };

  const collapseAllGroups = () => {
    const allClosed: Record<string, boolean> = {};
    NAVIGATION_GROUPS.forEach((g) => {
      allClosed[g.id] = false;
    });
    setOpenGroups(allClosed);
  };

  // User initials
  const getUserInitials = (name: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter navigation items by search
  const filteredGroups = NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!sidebarSearch.trim()) return true;
      const q = sidebarSearch.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        group.title.toLowerCase().includes(q)
      );
    }),
  })).filter((group) => group.items.length > 0);

  // Desktop active width calculation
  const isEffectiveCollapsed = (isCollapsed || !isPinned) && !isHoverExpanded;
  const currentRenderWidth = isEffectiveCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <>
      {/* Mobile Backdrop (< 1024px) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Desktop Flex Placeholder to dock and push main content dynamically */}
      <div
        className="hidden lg:block shrink-0 transition-[width] ease-in-out relative"
        style={{
          width: isPinned ? (isCollapsed ? COLLAPSED_WIDTH : sidebarWidth) : COLLAPSED_WIDTH,
          transitionDuration: isDragging ? '0ms' : '200ms',
        }}
        aria-hidden="true"
      />

      {/* Actual Sidebar Container */}
      <aside
        ref={sidebarContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          admin-sidebar-nav fixed top-16 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800/90 flex flex-col shadow-2xl
          ${isDragging ? 'select-none' : ''}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-[transform,width] ease-in-out
        `}
        style={{
          width: typeof window !== 'undefined' && window.innerWidth < 1024 ? 280 : currentRenderWidth,
          transitionDuration: isDragging ? '0ms' : '200ms',
        }}
        aria-label="Admin Navigation"
      >
        {/* Top Control Bar: Quick Collapse, Pin/Unpin, Search */}
        <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/95 flex items-center justify-between gap-1.5 shrink-0">
          {!isEffectiveCollapsed ? (
            <>
              {/* Search or Quick Filter */}
              <div className="relative flex-1 min-w-0">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Filter menu..."
                  className="w-full pl-8 pr-7 py-1 bg-slate-800/90 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-700/60 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    title="Clear filter"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Pin / Unpin Button */}
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg border transition-all duration-150 shrink-0 cursor-pointer ${
                  isPinned
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700/70 hover:text-slate-200 hover:bg-slate-700'
                }`}
                title={isPinned ? 'Sidebar Pinned (Docked into layout) — Click to Unpin' : 'Sidebar Unpinned (Floating hover mode) — Click to Pin'}
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <Pin size={14} className="rotate-45" /> : <PinOff size={14} />}
              </button>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/70 hover:text-slate-200 hover:bg-slate-700 transition shrink-0 cursor-pointer"
                title="Collapse sidebar to icon rail (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
            </>
          ) : (
            /* Icon-only header controls when collapsed */
            <div className="w-full flex flex-col items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => {
                  setIsCollapsed(false);
                  setIsPinned(true);
                }}
                className="p-2 rounded-xl bg-slate-800/90 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 border border-slate-700/70 transition cursor-pointer"
                title="Expand sidebar (Ctrl+B)"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Categories Header controls when expanded */}
        {!isEffectiveCollapsed && (
          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 shrink-0">
            <span className="font-bold text-slate-400">Navigation</span>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={expandAllGroups}
                className="hover:text-emerald-400 font-semibold transition cursor-pointer"
                title="Expand all categories"
              >
                Expand
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="hover:text-emerald-400 font-semibold transition cursor-pointer"
                title="Collapse all categories"
              >
                Collapse
              </button>
            </div>
          </div>
        )}

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-2 select-none">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500">No modules match "{sidebarSearch}"</p>
              <button
                onClick={() => setSidebarSearch('')}
                className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isOpenGroup = isGroupOpen(group.id, group.items);
              const groupBadgeTotal = group.items.reduce(
                (total, item) => total + getBadgeCount(item.badgeKey),
                0
              );
              const hasActiveTab = group.items.some((item) => item.id === activeTab);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Dropdown Trigger (Hidden in compact collapsed mode) */}
                  {!isEffectiveCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id, isOpenGroup)}
                      className={`w-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-between group cursor-pointer ${
                        hasActiveTab
                          ? 'text-white bg-slate-800/70 border border-slate-700/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                      title={isOpenGroup ? `Collapse ${group.title}` : `Expand ${group.title}`}
                      aria-expanded={isOpenGroup}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-slate-500 group-hover:text-emerald-400 transition-transform duration-200 ${
                            isOpenGroup ? 'rotate-90 text-emerald-400' : ''
                          }`}
                        >
                          <ChevronRight size={13} />
                        </span>
                        <span className="truncate">{group.title}</span>
                        {groupBadgeTotal > 0 && !isOpenGroup && (
                          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {groupBadgeTotal}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-normal px-1.5 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                        {group.items.length}
                      </span>
                    </button>
                  ) : (
                    /* Subtle separator line in collapsed icon rail */
                    <div className="py-1 flex justify-center">
                      <div className="w-5 h-[1px] bg-slate-800" />
                    </div>
                  )}

                  {/* Group Navigation Items */}
                  {(isOpenGroup || isEffectiveCollapsed) && (
                    <nav
                      className={
                        isEffectiveCollapsed
                          ? 'space-y-1'
                          : 'space-y-0.5 pl-2.5 border-l border-slate-800 ml-3.5 my-1 transition-all duration-200'
                      }
                      role="menu"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const badge = getBadgeCount(item.badgeKey);

                        return (
                          <div key={item.id} className="relative group/item">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 1024) setIsOpen(false);
                              }}
                              onMouseEnter={(e) => {
                                if (isEffectiveCollapsed) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredTooltipItem({
                                    id: item.id,
                                    rect,
                                    label: item.label,
                                    desc: item.description,
                                    badge,
                                  });
                                }
                              }}
                              onMouseLeave={() => {
                                if (isEffectiveCollapsed) {
                                  setHoveredTooltipItem(null);
                                }
                              }}
                              className={`w-full flex items-center ${
                                isEffectiveCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
                              } rounded-xl transition-all duration-150 relative text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                                isActive
                                  ? 'text-white font-semibold shadow-md'
                                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                              }`}
                              style={
                                isActive
                                  ? {
                                      backgroundColor: item.accentBg || '#2f5496',
                                      boxShadow: `0 3px 12px ${item.accentBg || '#2f5496'}40`,
                                    }
                                  : {}
                              }
                              title={!isEffectiveCollapsed ? item.description : undefined}
                              aria-current={isActive ? 'page' : undefined}
                              role="menuitem"
                            >
                              {/* Left active marker indicator */}
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
                              )}

                              <div className={`flex items-center gap-2.5 min-w-0 ${isEffectiveCollapsed ? 'justify-center' : ''}`}>
                                <Icon
                                  size={17}
                                  className={`shrink-0 ${
                                    isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-emerald-400'
                                  }`}
                                />
                                {!isEffectiveCollapsed && (
                                  <span className="text-[14px] lg:text-[14.5px] font-medium truncate">{item.label}</span>
                                )}
                              </div>

                              {/* Notification badge */}
                              {badge > 0 && (
                                <span
                                  className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isEffectiveCollapsed
                                      ? 'absolute top-1 right-1 w-2.5 h-2.5 p-0 bg-emerald-400 rounded-full border border-slate-900'
                                      : isActive
                                      ? 'bg-white text-slate-900'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {!isEffectiveCollapsed && badge}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })
          )}

          {/* Super Admin Users Tab */}
          {userRole === 'super-admin' && (
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              {!isEffectiveCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Access & Security
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('users');
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center ${
                  isEffectiveCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-xl transition-all duration-150 relative text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  activeTab === 'users'
                    ? 'text-white font-semibold shadow-md bg-[#2f5496]'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title={isEffectiveCollapsed ? 'System Users (Super Admin)' : undefined}
                aria-current={activeTab === 'users' ? 'page' : undefined}
              >
                {activeTab === 'users' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
                )}
                <div className={`flex items-center gap-2.5 min-w-0 ${isEffectiveCollapsed ? 'justify-center' : ''}`}>
                  <Shield
                    size={17}
                    className={activeTab === 'users' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}
                  />
                  {!isEffectiveCollapsed && (
                    <span className="text-[14px] lg:text-[14.5px] font-medium truncate">System Users</span>
                  )}
                </div>
                {!isEffectiveCollapsed && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Super
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Quick Action Footer */}
        <div className="p-2.5 bg-slate-900 border-t border-slate-800/90 flex flex-col gap-2 shrink-0">
          {!isEffectiveCollapsed ? (
            <>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/90 border border-slate-700/60 transition shadow-sm"
              >
                <ExternalLink size={13} className="text-emerald-400" />
                <span>Preview Live Site</span>
              </a>

              <div className="flex items-center gap-2.5 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                    {getUserInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{userName || 'Admin User'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 capitalize truncate">
                      {USER_ROLES.find((r) => r.value === userRole)?.label || userRole || 'Administrator'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Preview Live Site"
              >
                <ExternalLink size={15} className="text-emerald-400" />
              </a>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Drag Resize Handle (Desktop Only, Right Border) */}
        {!isEffectiveCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="hidden lg:block absolute top-0 right-0 w-2.5 h-full cursor-col-resize select-none group z-50 hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors"
            title="Drag to resize sidebar width"
          >
            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-slate-800 group-hover:bg-emerald-500/70 group-active:bg-emerald-400 transition-colors" />
          </div>
        )}
      </aside>

      {/* Floating Tooltip for Icon-Only Navigation */}
      {isEffectiveCollapsed && hoveredTooltipItem && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{
            top: hoveredTooltipItem.rect.top,
            left: hoveredTooltipItem.rect.right + 10,
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 max-w-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">{hoveredTooltipItem.label}</span>
              {hoveredTooltipItem.badge ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500 text-slate-950 rounded-full">
                  {hoveredTooltipItem.badge}
                </span>
              ) : null}
            </div>
            {hoveredTooltipItem.desc && (
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{hoveredTooltipItem.desc}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
