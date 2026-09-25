import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  TrendingUp, Download, Trash2, Eye, Plus, Search, Filter, RefreshCw, 
  CheckCircle2, Clock, AlertCircle, XCircle, ChevronLeft, ChevronRight, 
  Copy, Check, FileText, Printer, ArrowUpDown, DollarSign, Calendar, 
  Mail, Phone, CreditCard, Sparkles, Building2, User, MoreVertical, 
  Edit3, Shield, Share2, X, ExternalLink, ArrowRight, Layers
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId as defaultProjectId, publicAnonKey as defaultPublicAnonKey } from '../../utils/supabase/info';
import { exportToCSV } from '../../utils/csv';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import {
  MtnMomoIcon,
  AirtelMoneyIcon,
  PayPalIcon,
  CardPaymentIcon,
  BankTransferIcon
} from '../PaymentBrandIcons';

export type DonationAdminStatus = 
  | 'paid' 
  | 'completed' 
  | 'pending_verification' 
  | 'pending' 
  | 'processing' 
  | 'failed' 
  | 'cancelled' 
  | 'rejected' 
  | 'refunded';

export interface AdminDonationRecord {
  id: string;
  key: string;
  firstName: string;
  lastName: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  currency: string;
  frequency: string;
  method: string;
  provider: string;
  status: DonationAdminStatus;
  transactionId: string;
  providerTransactionId?: string;
  createdAt: string;
  updatedAt?: string;
  message?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationMethod?: string;
  proofUrl?: string;
  proofFileName?: string;
  auditTrail?: any[];
  raw?: any;
}

export interface DonationsManagerProps {
  accessToken?: string;
  projectId?: string;
  publicAnonKey?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  logActivity?: (action: string, section: string, description: string) => Promise<void> | void;
  onDonationsCountChange?: (count: number) => void;
}

const METHOD_OPTIONS = [
  { id: 'all', label: 'All Payment Modes' },
  { id: 'card', label: 'Credit / Debit Card (Stripe)' },
  { id: 'mtn', label: 'MTN Mobile Money' },
  { id: 'airtel', label: 'Airtel Money' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'bank', label: 'Bank Wire / Transfer' },
  { id: 'cash', label: 'Cash / Offline' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'paid', label: 'Paid / Completed' },
  { id: 'pending_verification', label: 'Pending Verification' },
  { id: 'pending', label: 'Pending / In Progress' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'failed', label: 'Failed / Cancelled' },
  { id: 'refunded', label: 'Refunded' },
];

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function DonationsManager({
  accessToken,
  projectId = defaultProjectId,
  publicAnonKey = defaultPublicAnonKey,
  userName = 'Admin',
  userEmail,
  userRole,
  logActivity,
  onDonationsCountChange,
}: DonationsManagerProps) {
  const confirmDialog = useConfirm();

  const onDonationsCountChangeRef = useRef(onDonationsCountChange);
  useEffect(() => {
    onDonationsCountChangeRef.current = onDonationsCountChange;
  }, [onDonationsCountChange]);

  const isFetchingRef = useRef(false);

  // Data state
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'super-admin';
  const [donations, setDonations] = useState<AdminDonationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc'>('date_desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCharts, setShowCharts] = useState<boolean>(false);
  const [viewingDonation, setViewingDonation] = useState<AdminDonationRecord | null>(null);
  const [editingDonation, setEditingDonation] = useState<AdminDonationRecord | null>(null);
  const [receiptDonation, setReceiptDonation] = useState<AdminDonationRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    amount: '',
    currency: 'USD',
    frequency: 'once',
    method: 'card',
    status: 'paid' as DonationAdminStatus,
    transactionId: '',
    date: new Date().toISOString().slice(0, 16),
    message: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    amount: '',
    currency: 'USD',
    frequency: 'once',
    method: 'card',
    status: 'paid' as DonationAdminStatus,
    transactionId: '',
    message: '',
  });

  // =========================================================================
  // NORMALIZATION HELPER
  // =========================================================================
  const normalizeDonation = useCallback((raw: any): AdminDonationRecord => {
    const data = raw.value ? { ...raw.value, key: raw.key, id: raw.id || raw.key } : raw;

    const firstName = data.first_name || data.firstName || '';
    const lastName = data.last_name || data.lastName || '';
    const donorName = (
      [firstName, lastName].filter(Boolean).join(' ') || 
      data.donorName || 
      data.name || 
      'Anonymous'
    ).trim();

    const donorEmail = data.email || data.donorEmail || '';
    const donorPhone = data.phone || data.donorPhone || '';
    const amount = Number(data.amount) || 0;
    const currency = (data.currency || 'USD').toUpperCase();
    const frequency = data.frequency || 'once';
    const method = (data.method || data.paymentMethod || data.payment_method || 'other').toLowerCase();
    const provider = data.provider || data.payment_provider || method;
    
    let status: DonationAdminStatus = 'pending';
    const rawStatus = (data.status || '').toLowerCase();
    if (rawStatus === 'paid' || rawStatus === 'completed' || rawStatus === 'succeeded' || rawStatus === 'success') {
      status = 'paid';
    } else if (
      rawStatus === 'pending_verification' || 
      rawStatus === 'awaiting_verification' || 
      ((method === 'bank_transfer' || method === 'bank' || method.includes('wire') || method.includes('bank')) && (rawStatus === 'pending' || rawStatus === ''))
    ) {
      status = 'pending_verification';
    } else if (rawStatus === 'processing') {
      status = 'processing';
    } else if (rawStatus === 'rejected') {
      status = 'rejected';
    } else if (rawStatus === 'cancelled') {
      status = 'cancelled';
    } else if (rawStatus === 'refunded') {
      status = 'refunded';
    } else if (rawStatus === 'failed') {
      status = 'failed';
    } else {
      status = 'pending';
    }

    const transactionId = data.transaction_id || data.transactionId || data.donation_reference || data.paymentIntentId || data.id || '';
    const createdAt = data.created_at || data.timestamp || new Date().toISOString();
    const updatedAt = data.updated_at || data.updatedAt;
    const message = data.message || data.provider_response?.message || '';
    const verifiedBy = data.provider_response?.verified_by || data.verified_by || data.verifiedBy || '';
    const verifiedAt = data.provider_response?.verified_at || data.verified_at || data.verifiedAt || '';
    const verificationMethod = data.provider_response?.verification_method || data.verification_method || data.verificationMethod || '';
    const proofUrl = data.provider_response?.proof_url || data.proof_url || data.proofUrl || '';
    const proofFileName = data.provider_response?.proof_file_name || data.proof_file_name || data.proofFileName || '';
    const auditTrail = data.provider_response?.audit_trail || data.audit_trail || [];

    const id = data.id || data.key || transactionId || `rec_${Math.random().toString(36).slice(2, 10)}`;

    return {
      id,
      key: data.key || id,
      firstName,
      lastName,
      donorName,
      donorEmail,
      donorPhone,
      amount,
      currency,
      frequency,
      method,
      provider,
      status,
      transactionId,
      providerTransactionId: data.provider_transaction_id || data.providerTransactionId,
      createdAt,
      updatedAt,
      message,
      verifiedBy,
      verifiedAt,
      verificationMethod,
      proofUrl,
      proofFileName,
      auditTrail,
      raw: data,
    };
  }, []);

  // =========================================================================
  // FETCH DONATIONS (Multi-Source Resilience)
  // =========================================================================
  const fetchDonations = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      // 1. Fetch canonical PostgreSQL rows
      const { data: pgData, error: pgErr } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (pgErr) console.warn('Supabase donations query notice:', pgErr.message);

      // 2. Fetch KV store rows for legacy records
      const { data: kvData, error: kvErr } = await supabase
        .from('kv_store_2a4be611')
        .select('*')
        .like('key', 'donation:%');

      if (kvErr) console.warn('Supabase kv_store query notice:', kvErr.message);

      // 3. Fallback: Edge Function API endpoint
      let apiData: any[] = [];
      if ((!pgData || pgData.length === 0) && (!kvData || kvData.length === 0)) {
        try {
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations`,
            { headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` } }
          );
          if (res.ok) {
            const body = await res.json();
            apiData = body.donations || [];
          }
        } catch (e) {
          console.warn('API fetch error:', e);
        }
      }

      // Combine & Deduplicate
      const unified: AdminDonationRecord[] = [];
      const seen = new Set<string>();

      const addRecord = (item: any) => {
        const norm = normalizeDonation(item);
        const dedupeKey = norm.transactionId || norm.id;
        if (dedupeKey && !seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          unified.push(norm);
        }
      };

      if (pgData && Array.isArray(pgData)) {
        pgData.forEach(addRecord);
      }
      if (kvData && Array.isArray(kvData)) {
        kvData.forEach(addRecord);
      }
      if (apiData && Array.isArray(apiData)) {
        apiData.forEach(addRecord);
      }

      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDonations(unified);
      if (onDonationsCountChangeRef.current) {
        const completedOnly = unified.filter(d => d.status === 'completed' || d.status === 'paid');
        onDonationsCountChangeRef.current(completedOnly.length);
      }
    } catch (err: any) {
      console.error('Failed to load donations:', err);
      if (!isSilent) toast.error('Failed to fetch donation records');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, projectId, publicAnonKey, normalizeDonation]);

  // Initial load
  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Real-time updates subscription with debounce
  useEffect(() => {
    let debounceTimer: any = null;
    const channel = supabase
      .channel('admin_donations_realtime_stable')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchDonations(true);
        }, 1200);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchDonations]);

  // =========================================================================
  // FILTERING, SORTING & PAGINATION
  // =========================================================================
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.donorName.toLowerCase().includes(q);
        const matchesEmail = d.donorEmail.toLowerCase().includes(q);
        const matchesPhone = d.donorPhone.toLowerCase().includes(q);
        const matchesTx = d.transactionId.toLowerCase().includes(q);
        const matchesMsg = (d.message || '').toLowerCase().includes(q);
        const matchesAmount = d.amount.toString().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTx && !matchesMsg && !matchesAmount) {
          return false;
        }
      }

      if (methodFilter !== 'all') {
        const m = d.method.toLowerCase();
        if (methodFilter === 'card' && !m.includes('card') && !m.includes('stripe')) return false;
        if (methodFilter === 'mtn' && !m.includes('mtn')) return false;
        if (methodFilter === 'airtel' && !m.includes('airtel')) return false;
        if (methodFilter === 'paypal' && !m.includes('paypal')) return false;
        if (methodFilter === 'bank' && !m.includes('bank') && !m.includes('wire')) return false;
        if (methodFilter === 'cash' && !m.includes('cash')) return false;
        if (methodFilter === 'cheque' && !m.includes('cheque') && !m.includes('check')) return false;
        if (methodFilter === 'other' && (
          m.includes('card') || m.includes('stripe') || m.includes('mtn') || 
          m.includes('airtel') || m.includes('paypal') || m.includes('bank')
        )) return false;
      }

      if (statusFilter !== 'all') {
        if (d.status !== statusFilter) return false;
      }

      if (currencyFilter !== 'all') {
        if (d.currency !== currencyFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'name_asc') return a.donorName.localeCompare(b.donorName);
      return 0;
    });
  }, [donations, searchQuery, methodFilter, statusFilter, currencyFilter, sortBy]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredDonations.length / pageSize));
  const paginatedDonations = useMemo(() => {
    if (pageSize === -1) return filteredDonations;
    const start = (currentPage - 1) * pageSize;
    return filteredDonations.slice(start, start + pageSize);
  }, [filteredDonations, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, statusFilter, currencyFilter, pageSize]);

  // =========================================================================
  // METRICS & KPIS
  // =========================================================================
  const metrics = useMemo(() => {
    let totalUsd = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;
    const uniqueDonors = new Set<string>();

    donations.forEach((d) => {
      if (d.donorEmail) uniqueDonors.add(d.donorEmail.toLowerCase());
      else if (d.donorName && d.donorName !== 'Anonymous') uniqueDonors.add(d.donorName.toLowerCase());

      if (d.status === 'completed' || d.status === 'paid') {
        completedCount++;
        totalUsd += d.amount;
      } else if (d.status === 'pending' || d.status === 'pending_verification' || d.status === 'processing') {
        pendingCount++;
      } else if (d.status === 'refunded') {
        refundedCount++;
      } else if (d.status === 'failed' || d.status === 'rejected' || d.status === 'cancelled') {
        failedCount++;
      }
    });

    const avgAmount = completedCount > 0 ? totalUsd / completedCount : 0;

    return {
      totalUsd,
      completedCount,
      pendingCount,
      failedCount,
      refundedCount,
      totalCount: donations.length,
      uniqueDonorsCount: uniqueDonors.size,
      avgAmount,
    };
  }, [donations]);

  // Chart Data
  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    const byMethod: Record<string, number> = {};

    donations.forEach((d) => {
      if (d.status !== 'completed' && d.status !== 'paid') return;

      const date = new Date(d.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      byMonth[monthKey] = (byMonth[monthKey] || 0) + d.amount;

      let methodLabel = 'Other';
      const m = d.method.toLowerCase();
      if (m.includes('card') || m.includes('stripe')) methodLabel = 'Card (Stripe)';
      else if (m.includes('mtn')) methodLabel = 'MTN MoMo';
      else if (m.includes('airtel')) methodLabel = 'Airtel Money';
      else if (m.includes('paypal')) methodLabel = 'PayPal';
      else if (m.includes('bank') || m.includes('wire')) methodLabel = 'Bank Wire';
      else if (m.includes('cash')) methodLabel = 'Cash';

      byMethod[methodLabel] = (byMethod[methodLabel] || 0) + d.amount;
    });

    const monthSeries = Object.entries(byMonth).map(([month, total]) => ({
      month,
      total: parseFloat(total.toFixed(2)),
    }));

    const methodSeries = Object.entries(byMethod).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    })).sort((a, b) => b.value - a.value);

    return { monthSeries, methodSeries };
  }, [donations]);

  // =========================================================================
  // CRUD ACTIONS
  // =========================================================================

  // [CREATE]
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(createForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    const txId = createForm.transactionId.trim() || `RESTI-MAN-${Date.now().toString(36).toUpperCase()}`;
    const donationId = `donation:${crypto.randomUUID()}`;

    try {
      const { error: insertErr } = await supabase.from('donations').insert({
        id: donationId,
        first_name: createForm.firstName.trim() || 'Anonymous',
        last_name: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        amount: amt,
        currency: createForm.currency.toUpperCase(),
        frequency: createForm.frequency,
        method: createForm.method,
        provider: 'manual_admin',
        status: createForm.status,
        transaction_id: txId,
        provider_transaction_id: txId,
        created_at: createForm.date ? new Date(createForm.date).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider_response: {
          message: createForm.message.trim(),
          recorded_by: userEmail || userName || 'admin',
          verified_by: userEmail || userName || 'admin',
          verification_method: 'manual',
        },
      });

      if (insertErr) throw new Error(insertErr.message);

      await supabase.from('kv_store_2a4be611').upsert({
        key: donationId,
        value: {
          id: donationId,
          donorName: [createForm.firstName, createForm.lastName].filter(Boolean).join(' ') || 'Anonymous',
          donorEmail: createForm.email,
          donorPhone: createForm.phone,
          amount: amt,
          currency: createForm.currency.toUpperCase(),
          paymentMethod: createForm.method,
          status: createForm.status,
          transactionId: txId,
          message: createForm.message,
          timestamp: createForm.date ? new Date(createForm.date).toISOString() : new Date().toISOString(),
          recordedBy: userEmail || userName,
        },
      });

      toast.success('Donation recorded successfully!');
      if (logActivity) {
        logActivity('create', 'Donations', `Recorded ${createForm.currency} ${amt} donation for ${createForm.firstName} ${createForm.lastName}`);
      }

      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        amount: '',
        currency: 'USD',
        frequency: 'once',
        method: 'card',
        status: 'completed',
        transactionId: '',
        date: new Date().toISOString().slice(0, 16),
        message: '',
      });

      fetchDonations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record donation');
    }
  };

  // [UPDATE]
  const handleStartEdit = (d: AdminDonationRecord) => {
    setEditingDonation(d);
    setEditForm({
      firstName: d.firstName || d.donorName.split(' ')[0] || '',
      lastName: d.lastName || d.donorName.split(' ').slice(1).join(' ') || '',
      email: d.donorEmail,
      phone: d.donorPhone,
      amount: d.amount.toString(),
      currency: d.currency,
      frequency: d.frequency || 'once',
      method: d.method,
      status: d.status,
      transactionId: d.transactionId,
      message: d.message || '',
    });
  };

  const handleUpdateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;

    const amt = parseFloat(editForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    try {
      const { error: updateErr } = await supabase
        .from('donations')
        .update({
          first_name: editForm.firstName.trim(),
          last_name: editForm.lastName.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          amount: amt,
          currency: editForm.currency.toUpperCase(),
          frequency: editForm.frequency,
          method: editForm.method,
          status: editForm.status,
          transaction_id: editForm.transactionId.trim(),
          updated_at: new Date().toISOString(),
          provider_response: {
            ...(editingDonation.raw?.provider_response || {}),
            message: editForm.message.trim(),
            last_edited_by: userEmail || userName,
            last_edited_at: new Date().toISOString(),
          },
        })
        .eq('id', editingDonation.id);

      if (updateErr) throw new Error(updateErr.message);

      if (editingDonation.key) {
        await supabase
          .from('kv_store_2a4be611')
          .update({
            value: {
              ...(editingDonation.raw || {}),
              donorName: [editForm.firstName, editForm.lastName].filter(Boolean).join(' ') || 'Anonymous',
              donorEmail: editForm.email,
              donorPhone: editForm.phone,
              amount: amt,
              currency: editForm.currency.toUpperCase(),
              paymentMethod: editForm.method,
              status: editForm.status,
              transactionId: editForm.transactionId,
              message: editForm.message,
              updatedAt: new Date().toISOString(),
            },
          })
          .eq('key', editingDonation.key);
      }

      toast.success('Donation updated successfully');
      if (logActivity) {
        logActivity('update', 'Donations', `Updated donation ${editingDonation.transactionId} (${editForm.currency} ${amt})`);
      }

      setEditingDonation(null);
      if (viewingDonation?.id === editingDonation.id) {
        setViewingDonation(null);
      }
      fetchDonations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update donation');
    }
  };

  // [QUICK STATUS CHANGE]
  const handleQuickStatusChange = async (
    d: AdminDonationRecord, 
    newStatus: DonationAdminStatus
  ) => {
    if (d.status === newStatus) return;

    try {
      const { error: updateErr } = await supabase
        .from('donations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', d.id);

      if (updateErr) throw new Error(updateErr.message);

      if (d.key) {
        await supabase
          .from('kv_store_2a4be611')
          .update({
            value: { ...(d.raw || {}), status: newStatus },
          })
          .eq('key', d.key);
      }

      toast.success(`Marked as ${newStatus.toUpperCase()}`);
      if (logActivity) {
        logActivity('status_change', 'Donations', `Changed status of ${d.transactionId} to ${newStatus}`);
      }

      setDonations((prev) =>
        prev.map((item) => (item.id === d.id ? { ...item, status: newStatus } : item))
      );
      if (viewingDonation?.id === d.id) {
        setViewingDonation((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // State: Tracking in-flight verification
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // [BANK TRANSFER VERIFICATION]
  const handleVerifyTransfer = async (d: AdminDonationRecord, notes: string = '') => {
    const confirm = await confirmDialog({
      title: 'Verify Bank Transfer',
      message: `Have you confirmed receipt of ${d.currency} ${d.amount.toLocaleString()} from "${d.donorName}" in the official RESTI bank account? This will mark the donation as PAID and issue verification records.`,
      confirmText: 'Confirm & Mark Paid',
      cancelText: 'Cancel',
      destructive: false
    });
    if (!confirm) return;

    setVerifyingId(d.id);
    const nowIso = new Date().toISOString();
    const verifier = userEmail || userName || 'RESTI Admin';

    try {
      // 1. Try edge function first
      let success = false;
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations/${encodeURIComponent(d.id)}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({
            verificationNotes: notes || 'Verified against bank statement',
            sendReceipt: true
          })
        });
        if (res.ok) success = true;
      } catch (fErr) {
        console.warn('Edge function verify failed, falling back to direct DB update:', fErr);
      }

      // 2. Direct database update fallback
      if (!success) {
        const prevResp = d.raw?.provider_response || {};
        const auditTrail = Array.isArray(prevResp.audit_trail) ? [...prevResp.audit_trail] : [];
        auditTrail.push({
          action: 'verified',
          timestamp: nowIso,
          actor: verifier,
          notes: notes || 'Verified against bank statement'
        });

        const updatedResp = {
          ...prevResp,
          verified_by: verifier,
          verified_at: nowIso,
          verification_method: 'bank_statement',
          audit_trail: auditTrail
        };

        const { error: updErr } = await supabase
          .from('donations')
          .update({
            status: 'paid',
            updated_at: nowIso,
            provider_response: updatedResp
          })
          .eq('id', d.id);

        if (updErr) throw new Error(updErr.message);

        if (d.key) {
          await supabase
            .from('kv_store_2a4be611')
            .update({
              value: {
                ...(d.raw || {}),
                status: 'paid',
                verified_by: verifier,
                verified_at: nowIso,
                verification_method: 'bank_statement',
                provider_response: updatedResp,
                audit_trail: auditTrail
              }
            })
            .eq('key', d.key);
        }
      }

      toast.success(`Donation ${d.transactionId} verified and marked as PAID!`);
      if (logActivity) {
        logActivity('donation_verified', 'Donations', `Verified bank transfer ${d.transactionId} of ${d.currency} ${d.amount}`);
      }

      const updatedRecord: AdminDonationRecord = {
        ...d,
        status: 'paid',
        verifiedBy: verifier,
        verifiedAt: nowIso,
        verificationMethod: 'bank_statement'
      };

      setDonations(prev => prev.map(item => item.id === d.id ? updatedRecord : item));
      if (viewingDonation?.id === d.id) {
        setViewingDonation(updatedRecord);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify bank transfer');
    } finally {
      setVerifyingId(null);
    }
  };

  // [BANK TRANSFER REJECTION]
  const handleRejectTransfer = async (d: AdminDonationRecord) => {
    const confirm = await confirmDialog({
      title: 'Reject Bank Transfer',
      message: `Are you sure you want to mark donation ${d.transactionId} as REJECTED? It will not be marked as paid.`,
      confirmText: 'Reject Transfer',
      cancelText: 'Cancel',
      destructive: true
    });
    if (!confirm) return;

    setVerifyingId(d.id);
    const nowIso = new Date().toISOString();
    const verifier = userEmail || userName || 'RESTI Admin';

    try {
      let success = false;
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/admin/donations/${encodeURIComponent(d.id)}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({ reason: 'Transfer unverified on bank statement' })
        });
        if (res.ok) success = true;
      } catch (fErr) {
        console.warn('Edge function reject failed, using fallback:', fErr);
      }

      if (!success) {
        const prevResp = d.raw?.provider_response || {};
        const auditTrail = Array.isArray(prevResp.audit_trail) ? [...prevResp.audit_trail] : [];
        auditTrail.push({
          action: 'rejected',
          timestamp: nowIso,
          actor: verifier,
          reason: 'Unverified on bank statement'
        });

        const updatedResp = {
          ...prevResp,
          rejected_by: verifier,
          rejected_at: nowIso,
          rejection_reason: 'Unverified on bank statement',
          audit_trail: auditTrail
        };

        const { error: updErr } = await supabase
          .from('donations')
          .update({
            status: 'rejected',
            updated_at: nowIso,
            provider_response: updatedResp
          })
          .eq('id', d.id);

        if (updErr) throw new Error(updErr.message);

        if (d.key) {
          await supabase
            .from('kv_store_2a4be611')
            .update({
              value: {
                ...(d.raw || {}),
                status: 'rejected',
                provider_response: updatedResp,
                audit_trail: auditTrail
              }
            })
            .eq('key', d.key);
        }
      }

      toast.info(`Donation ${d.transactionId} marked as REJECTED`);
      if (logActivity) {
        logActivity('donation_rejected', 'Donations', `Marked ${d.transactionId} as rejected`);
      }

      const updatedRecord: AdminDonationRecord = {
        ...d,
        status: 'rejected'
      };

      setDonations(prev => prev.map(item => item.id === d.id ? updatedRecord : item));
      if (viewingDonation?.id === d.id) {
        setViewingDonation(updatedRecord);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject donation');
    } finally {
      setVerifyingId(null);
    }
  };

  // [DELETE] Single
  const handleDeleteDonation = async (d: AdminDonationRecord) => {
    if (!canDelete) {
      toast.error('Permission denied: Only Administrators can delete donation records.');
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete Donation Record?',
      message: `Are you sure you want to delete the donation of ${d.currency} ${d.amount} from "${d.donorName}"? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      destructive: true,
    });

    if (!confirmed) return;

    try {
      const { error: delErr } = await supabase.from('donations').delete().eq('id', d.id);
      if (delErr) throw new Error(delErr.message);

      if (d.key) {
        await supabase.from('kv_store_2a4be611').delete().eq('key', d.key);
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(d.id);
        return next;
      });

      if (viewingDonation?.id === d.id) setViewingDonation(null);
      if (editingDonation?.id === d.id) setEditingDonation(null);

      toast.success('Donation deleted successfully');
      if (logActivity) {
        logActivity('delete', 'Donations', `Deleted donation ${d.transactionId} (${d.currency} ${d.amount})`);
      }

      fetchDonations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete donation');
    }
  };

  // [BULK DELETE]
  const handleBulkDelete = async () => {
    if (!canDelete) {
      toast.error('Permission denied: Only Administrators can delete donation records.');
      return;
    }
    if (selectedIds.size === 0) return;

    const confirmed = await confirmDialog({
      title: `Delete ${selectedIds.size} Donation Records?`,
      message: `Are you sure you want to permanently delete ${selectedIds.size} selected donation record(s)? This action cannot be undone.`,
      confirmText: `Delete ${selectedIds.size} Records`,
      destructive: true,
    });

    if (!confirmed) return;

    const idsArray = Array.from(selectedIds);

    try {
      const { error: delErr } = await supabase.from('donations').delete().in('id', idsArray);
      if (delErr) throw new Error(delErr.message);

      await supabase.from('kv_store_2a4be611').delete().in('key', idsArray);

      toast.success(`Successfully deleted ${idsArray.length} donation records`);
      if (logActivity) {
        logActivity('bulk_delete', 'Donations', `Deleted ${idsArray.length} donation records`);
      }

      setSelectedIds(new Set());
      fetchDonations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete selected donations');
    }
  };

  // Selection
  const toggleSelectAllPage = () => {
    const pageIds = paginatedDonations.map((d) => d.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export
  const handleExportCSV = (exportAll = true) => {
    const recordsToExport = exportAll 
      ? filteredDonations 
      : filteredDonations.filter((d) => selectedIds.has(d.id));

    if (recordsToExport.length === 0) {
      toast.error('No donation records to export');
      return;
    }

    const csvData = recordsToExport.map((d) => ({
      'Record ID': d.id,
      'Transaction Reference': d.transactionId,
      'Date': new Date(d.createdAt).toLocaleString(),
      'Donor Name': d.donorName,
      'Donor Email': d.donorEmail,
      'Donor Phone': d.donorPhone,
      'Amount': d.amount,
      'Currency': d.currency,
      'Frequency': d.frequency,
      'Payment Method': d.method,
      'Provider': d.provider,
      'Status': d.status.toUpperCase(),
      'Verified By': d.verifiedBy || 'N/A',
      'Message / Purpose': d.message || '',
    }));

    exportToCSV(csvData, `resti_donations_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${csvData.length} donation records to CSV`);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Reference copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('card') || m.includes('stripe')) {
      return { 
        label: 'Card (Stripe)', 
        color: 'bg-blue-50 text-blue-900 border-blue-200', 
        customIcon: <CardPaymentIcon className="scale-75 origin-left" /> 
      };
    }
    if (m.includes('mtn')) {
      return { 
        label: 'MTN MoMo', 
        color: 'bg-amber-50 text-amber-950 border-amber-300 font-bold', 
        customIcon: <MtnMomoIcon className="h-3.5 w-auto" /> 
      };
    }
    if (m.includes('airtel')) {
      return { 
        label: 'Airtel Money', 
        color: 'bg-rose-50 text-rose-950 border-rose-200 font-bold', 
        customIcon: <AirtelMoneyIcon className="h-3.5 w-auto" /> 
      };
    }
    if (m.includes('paypal')) {
      return { 
        label: 'PayPal', 
        color: 'bg-sky-50 text-sky-950 border-sky-200', 
        customIcon: <PayPalIcon className="h-3 w-auto" /> 
      };
    }
    if (m.includes('bank') || m.includes('wire')) {
      return { 
        label: 'Bank Wire', 
        color: 'bg-emerald-50 text-emerald-950 border-emerald-200', 
        customIcon: <BankTransferIcon className="h-3.5 w-3.5 text-emerald-800" /> 
      };
    }
    if (m.includes('cash')) {
      return { label: 'Cash / Offline', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: DollarSign };
    }
    return { label: method || 'Other', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Layers };
  };

  return (
    <div className="space-y-8">
      
      {/* ===================================================================== */}
      {/* TOP HERO BANNER */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-emerald-400/10 pointer-events-none blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/15 border border-white/20 shadow-inner flex-shrink-0">
              <TrendingUp size={34} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Donations
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/40 border border-white/20 text-xs sm:text-sm font-semibold tracking-wide">
                  {donations.length} {donations.length === 1 ? 'Record' : 'Records'}
                </span>
                {refreshing && (
                  <RefreshCw size={16} className="animate-spin text-emerald-200" />
                )}
              </div>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1.5 max-w-xl font-medium">
                Comprehensive donation management, live gateway verification, instant official receipts, and financial audit logs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus size={16} className="text-emerald-700" />
              Record Donation
            </button>

            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                showCharts 
                  ? 'bg-white/30 border-white text-white' 
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              <TrendingUp size={15} />
              {showCharts ? 'Hide Analytics' : 'View Analytics'}
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
              title="Export all filtered records to CSV"
            >
              <Download size={15} />
              Export CSV
            </button>

            <button
              onClick={() => fetchDonations()}
              disabled={refreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh live database records"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KPI METRIC CARDS */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-slate-900 tracking-tight admin-kpi-stat">
            ${metrics.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> Across all completed gifts
          </div>
        </div>

        {/* Completed Transactions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-slate-900 tracking-tight admin-kpi-stat">
            {metrics.completedCount}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {metrics.totalCount > 0 ? Math.round((metrics.completedCount / metrics.totalCount) * 100) : 0}% of all entries
          </div>
        </div>

        {/* Pending In-Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending / Pledges</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-slate-900 tracking-tight admin-kpi-stat">
            {metrics.pendingCount}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            Bank wires & mobile pledges
          </div>
        </div>

        {/* Unique Donors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Unique Donors</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <div className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-slate-900 tracking-tight admin-kpi-stat">
            {metrics.uniqueDonorsCount}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Avg: ${metrics.avgAmount.toFixed(2)} / gift
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* COLLAPSIBLE ANALYTICS CHARTS */}
      {/* ===================================================================== */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800">Monthly Contribution Volume</h4>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                By Date Logged
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData.monthSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip 
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-4">Payment Methods Distribution</h4>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.methodSeries}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.methodSeries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Volume']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 space-y-2.5">
                {chartData.methodSeries.slice(0, 5).map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                      />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CONTROLS BAR: SEARCH, FILTERS, BULK ACTIONS */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search donor name, email, phone, reference ID, notes..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="UGX">UGX (USh)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
              <option value="name_asc">Donor Name (A-Z)</option>
            </select>
          </div>

        </div>

        {selectedIds.size > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(false)}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} />
                Export Selected
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 size={13} />
                Delete Selected
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MAIN DATA TABLE */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/40 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredDonations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800">
              {pageSize === -1 ? filteredDonations.length : Math.min(currentPage * pageSize, filteredDonations.length)}
            </strong> of <strong className="text-slate-800">{filteredDonations.length}</strong> matching donations
            {filteredDonations.length !== donations.length && (
              <span className="ml-1 text-slate-400"> (filtered from {donations.length} total)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All ({donations.length})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-500">Loading donation records...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">No donations match your filter</h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Try adjusting your search query, payment mode filter, or status filter to locate the records.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                  setCurrencyFilter('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={14} className="inline mr-1" />
                Record New Donation
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4 sm:px-6 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedDonations.length > 0 &&
                        paginatedDonations.every((d) => selectedIds.has(d.id))
                      }
                      onChange={toggleSelectAllPage}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Donor Details</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Transaction Reference</th>
                  <th className="py-3.5 px-4">Date Logged</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedDonations.map((d) => {
                  const methodBadge = getMethodBadge(d.method);
                  const isSelected = selectedIds.has(d.id);
                  const MethodIcon = (methodBadge as any).icon;

                  return (
                    <tr 
                      key={d.id} 
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(d.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-slate-200">
                            {d.donorName.slice(0, 2) || 'AN'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{d.donorName}</span>
                              {d.frequency === 'monthly' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Monthly
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {d.donorEmail || (d.donorPhone ? d.donorPhone : <span className="italic text-slate-400">No contact info</span>)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-base">
                          {d.currency === 'USD' ? `$${d.amount.toFixed(2)}` : `${d.amount.toLocaleString()} ${d.currency}`}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {d.currency}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${methodBadge.color}`}>
                          {(methodBadge as any).customIcon ? (
                            (methodBadge as any).customIcon
                          ) : MethodIcon ? (
                            <MethodIcon size={12} />
                          ) : null}
                          <span>{methodBadge.label}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="relative inline-block group/status">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            d.status === 'paid' || d.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800' 
                              : d.status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                              : d.status === 'pending' || d.status === 'processing'
                              ? 'bg-amber-100 text-amber-800'
                              : d.status === 'refunded'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              d.status === 'paid' || d.status === 'completed' ? 'bg-emerald-600' :
                              d.status === 'pending_verification' ? 'bg-amber-600 animate-pulse' :
                              d.status === 'pending' || d.status === 'processing' ? 'bg-amber-600' :
                              d.status === 'refunded' ? 'bg-purple-600' : 'bg-rose-600'
                            }`} />
                            {d.status === 'pending_verification' ? 'PENDING VERIFICATION' : d.status.toUpperCase()}
                          </span>

                          <div className="hidden group-hover/status:flex absolute left-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-30 flex-col gap-1 min-w-[150px]">
                            {d.status === 'pending_verification' ? (
                              <>
                                <button
                                  onClick={() => handleVerifyTransfer(d)}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 size={12} /> Verify (Mark Paid)
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(d)}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <XCircle size={12} /> Reject Transfer
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleQuickStatusChange(d, 'paid')}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 size={12} /> Mark Paid
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(d, 'pending')}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Clock size={12} /> Mark Pending
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(d, 'rejected')}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <XCircle size={12} /> Mark Rejected
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(d, 'refunded')}
                                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <AlertCircle size={12} /> Mark Refunded
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 font-bold max-w-[150px] truncate">
                            {d.transactionId || d.id.slice(-8).toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleCopy(d.transactionId || d.id, d.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Copy reference ID"
                          >
                            {copiedId === d.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {d.proofUrl && (
                          <div className="mt-1">
                            <a
                              href={d.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                              title="View uploaded proof of transfer"
                            >
                              <FileText size={11} />
                              <span>Proof Attached</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(d.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(d.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.status === 'pending_verification' && (
                            <>
                              <button
                                onClick={() => handleVerifyTransfer(d)}
                                disabled={verifyingId === d.id}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Verify bank deposit and mark as paid"
                              >
                                <CheckCircle2 size={13} />
                                Verify
                              </button>

                              <button
                                onClick={() => handleRejectTransfer(d)}
                                disabled={verifyingId === d.id}
                                className="px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Reject or flag this transfer"
                              >
                                <XCircle size={13} />
                                Reject
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => setViewingDonation(d)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View full donation details"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => setReceiptDonation(d)}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Generate and print official receipt"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            onClick={() => handleStartEdit(d)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit donation record"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteDonation(d)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="text-xs text-slate-500">
              Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE DONATION */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Record New Donation</h3>
                  <p className="text-xs text-emerald-100">Manual, cash, cheque, bank transfer or offline gift</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="p-6 sm:p-8 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="e.g. Sarah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="e.g. Jenkins"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="e.g. +256 700 000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Donation Amount *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                      placeholder="50.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <DollarSign size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="UGX">UGX (USh)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KES">KES (KSh)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    value={createForm.method}
                    onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="card">Card (Stripe)</option>
                    <option value="mtn">MTN MoMo</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash / In-Person</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={createForm.frequency}
                    onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="once">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Status *
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e: any) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={createForm.transactionId}
                    onChange={(e) => setCreateForm({ ...createForm, transactionId: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Allocation / Donor Message / Notes
                </label>
                <textarea
                  rows={2}
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  placeholder="e.g. Dedicated to Kiryandongo Girls Education Program"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Save Donation Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT DONATION */}
      {/* ===================================================================== */}
      {editingDonation && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setEditingDonation(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Edit3 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Edit Donation Record</h3>
                  <p className="text-xs text-amber-100 font-mono">Ref: {editingDonation.transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDonation(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateDonation} className="p-6 sm:p-8 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="UGX">UGX (USh)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={editForm.method}
                    onChange={(e) => setEditForm({ ...editForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="card">Card (Stripe)</option>
                    <option value="mtn">MTN MoMo</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e: any) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={editForm.frequency}
                    onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="once">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Transaction Reference ID
                </label>
                <input
                  type="text"
                  value={editForm.transactionId}
                  onChange={(e) => setEditForm({ ...editForm, transactionId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Notes / Message
                </label>
                <textarea
                  rows={2}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW DONATION DETAILS */}
      {/* ===================================================================== */}
      {viewingDonation && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setViewingDonation(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Eye size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Donation Details</h3>
                  <p className="text-xs text-slate-400 font-mono">{viewingDonation.transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDonation(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Verification Alert Banner for Pending Verification */}
              {viewingDonation.status === 'pending_verification' && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-sm">Awaiting Bank Transfer Verification</strong>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Please confirm receipt of funds in the official RESTI bank account before verifying.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerifyTransfer(viewingDonation)}
                      disabled={verifyingId === viewingDonation.id}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      Verify (Mark Paid)
                    </button>
                    <button
                      onClick={() => handleRejectTransfer(viewingDonation)}
                      disabled={verifyingId === viewingDonation.id}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 gap-4">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Confirmed Amount
                  </span>
                  <div className="text-3xl font-black text-emerald-950">
                    {viewingDonation.currency === 'USD' 
                      ? `$${viewingDonation.amount.toFixed(2)} USD` 
                      : `${viewingDonation.amount.toLocaleString()} ${viewingDonation.currency}`}
                  </div>
                  <div className="text-xs text-emerald-800 font-semibold mt-1">
                    Frequency: {viewingDonation.frequency === 'monthly' ? 'Monthly Ongoing' : 'One-Time Contribution'}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    viewingDonation.status === 'paid' || viewingDonation.status === 'completed' ? 'bg-emerald-200 text-emerald-900' :
                    viewingDonation.status === 'pending_verification' ? 'bg-amber-200 text-amber-950 border border-amber-300' :
                    viewingDonation.status === 'pending' || viewingDonation.status === 'processing' ? 'bg-amber-200 text-amber-900' :
                    viewingDonation.status === 'refunded' ? 'bg-purple-200 text-purple-900' : 'bg-rose-200 text-rose-900'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {viewingDonation.status === 'pending_verification' ? 'PENDING VERIFICATION' : viewingDonation.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => {
                      setReceiptDonation(viewingDonation);
                      setViewingDonation(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Printer size={13} /> View Official Receipt
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Donor Full Name
                  </span>
                  <p className="font-bold text-slate-800 text-base">{viewingDonation.donorName}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Payment Mode & Provider
                  </span>
                  <p className="font-bold text-slate-800 text-base capitalize">
                    {viewingDonation.method} ({viewingDonation.provider})
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Email Address
                  </span>
                  <p className="font-mono text-slate-800 break-all">
                    {viewingDonation.donorEmail ? (
                      <a href={`mailto:${viewingDonation.donorEmail}`} className="text-emerald-700 hover:underline">
                        {viewingDonation.donorEmail}
                      </a>
                    ) : 'Not provided'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Phone Number
                  </span>
                  <p className="font-mono text-slate-800">
                    {viewingDonation.donorPhone ? (
                      <a href={`tel:${viewingDonation.donorPhone}`} className="text-emerald-700 hover:underline">
                        {viewingDonation.donorPhone}
                      </a>
                    ) : 'Not provided'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Transaction ID
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-slate-800 break-all bg-white px-2 py-1 rounded border border-slate-200">
                      {viewingDonation.transactionId}
                    </span>
                    <button
                      onClick={() => handleCopy(viewingDonation.transactionId, 'modal_tx')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Timestamp
                  </span>
                  <p className="text-slate-800">
                    {new Date(viewingDonation.createdAt).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

              </div>

              {viewingDonation.message && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Donor Message / Allocation Notes
                  </span>
                  <p className="text-sm text-slate-700 italic">
                    "{viewingDonation.message}"
                  </p>
                </div>
              )}

              {(viewingDonation.verifiedBy || viewingDonation.verificationMethod) && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                  <Shield size={14} className="text-emerald-600" />
                  <span>
                    Verified via <strong>{viewingDonation.verificationMethod || 'system'}</strong> by{' '}
                    <strong>{viewingDonation.verifiedBy || 'automated webhook'}</strong>
                    {viewingDonation.verifiedAt && ` on ${new Date(viewingDonation.verifiedAt).toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* Uploaded Proof of Transfer Document */}
              {viewingDonation.proofUrl ? (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <span className="text-amber-800 font-bold uppercase tracking-wider text-[11px] block mb-2">
                    Uploaded Proof of Transfer
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-amber-200/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {viewingDonation.proofFileName || 'Bank_Transfer_Proof'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Submitted by donor as payment evidence
                        </p>
                      </div>
                    </div>
                    <a
                      href={viewingDonation.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      <ExternalLink size={13} /> View Attached Proof
                    </a>
                  </div>
                </div>
              ) : viewingDonation.method === 'bank_transfer' ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  <span>No proof file was uploaded. Verify against bank statement directly using reference <strong>{viewingDonation.transactionId}</strong>.</span>
                </div>
              ) : null}

              {/* Verification & Audit Trail */}
              {viewingDonation.auditTrail && viewingDonation.auditTrail.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] block mb-2 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    Verification & Audit Trail ({viewingDonation.auditTrail.length})
                  </span>
                  <div className="space-y-2 mt-2">
                    {viewingDonation.auditTrail.map((log: any, idx: number) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            log.action === 'verified' || log.status === 'paid' ? 'bg-emerald-500' :
                            log.action === 'rejected' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-semibold text-slate-800 capitalize">
                            {log.action ? log.action.replace('_', ' ') : 'Status update'}: <span className="font-mono text-slate-600 font-normal">{log.status || log.new_status || ''}</span>
                          </span>
                          {log.by && (
                            <span className="text-[11px] text-slate-500">by {log.by}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {log.at ? new Date(log.at).toLocaleString() : ''}
                        </div>
                        {log.reason && (
                          <div className="w-full text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 mt-1">
                            Reason: {log.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteDonation(viewingDonation)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Record
                </button>

                <div className="flex items-center gap-2">
                  {viewingDonation.status === 'pending_verification' && (
                    <>
                      <button
                        onClick={() => handleVerifyTransfer(viewingDonation)}
                        disabled={verifyingId === viewingDonation.id}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Verify (Mark Paid)
                      </button>
                      <button
                        onClick={() => handleRejectTransfer(viewingDonation)}
                        disabled={verifyingId === viewingDonation.id}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      handleStartEdit(viewingDonation);
                      setViewingDonation(null);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit Record
                  </button>

                  <button
                    onClick={() => setViewingDonation(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: OFFICIAL PRINTABLE RECEIPT */}
      {/* ===================================================================== */}
      {receiptDonation && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white"
          onClick={() => setReceiptDonation(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8 print:border-none print:shadow-none print:m-0 print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">
                  Official Printable Receipt
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setReceiptDonation(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div id="printable-admin-receipt" className="p-8 sm:p-12 text-slate-800 bg-white print:p-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-emerald-600 pb-6 mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                      R
                    </div>
                    <h2 className="text-2xl font-black font-heading tracking-tight text-slate-900">
                      RESTI-CBO
                    </h2>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Refugee Empowerment For Sustainable Transformation Initiative
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kiryandongo District, Uganda • Email: info@resticbo.org • Web: resticbo.org
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1">
                    Official Donation Receipt
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900">
                    REC-{receiptDonation.transactionId.slice(-10).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: {new Date(receiptDonation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Donor Name</span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {receiptDonation.donorName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Donor Email</span>
                  <span className="font-medium text-slate-700 block font-mono text-[11px]">
                    {receiptDonation.donorEmail || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Payment Mode</span>
                  <span className="font-bold text-slate-900 block capitalize">
                    {getMethodBadge(receiptDonation.method).label}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Description / Allocation</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">
                          Charitable Contribution to RESTI Community Programs
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {receiptDonation.message || 'Direct funding for refugee education, healthcare, and economic transformation in Kiryandongo District'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {receiptDonation.currency === 'USD' 
                          ? `$${receiptDonation.amount.toFixed(2)} USD` 
                          : `${receiptDonation.amount.toLocaleString()} ${receiptDonation.currency}`}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-emerald-50/50 border-t-2 border-emerald-600 text-slate-900 font-bold">
                    <tr>
                      <td className="py-3 px-4 text-emerald-950">Total Acknowledged & Verified</td>
                      <td className="py-3 px-4 text-right text-base text-emerald-800">
                        {receiptDonation.currency === 'USD' 
                          ? `$${receiptDonation.amount.toFixed(2)} USD` 
                          : `${receiptDonation.amount.toLocaleString()} ${receiptDonation.currency}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-100 mb-6">
                <p className="font-bold text-slate-800 mb-1">Official Non-Profit Certification:</p>
                <p>
                  RESTI certifies that no goods, services, or commercial benefits were provided in whole or part in consideration for this financial contribution. This gift is recognized in accordance with Ugandan community-based non-profit standards.
                </p>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div className="text-[11px] text-slate-400">
                  <p>Refugee Empowerment For Sustainable Transformation Initiative</p>
                  <p>Registered Community-Based Organization • Kiryandongo, Uganda</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-b border-slate-400 pb-1 px-4 mb-1">
                    <span className="font-serif italic text-sm font-bold text-slate-700">Kwaya Daniel Loborach</span>
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Authorized Executive Signature
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
