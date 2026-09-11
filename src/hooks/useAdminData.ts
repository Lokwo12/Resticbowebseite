import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { supabaseUrl } from '../utils/supabase/client';

export function useAdminData(endpoint: string, queryKey: string, accessToken: string, projectId: string) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const confirmDialog = useConfirm();
  const publicReadEndpoints = ['programs', 'news', 'gallery', 'stories', 'team', 'events', 'partners', 'reports', 'opportunities', 'faqs', 'resources', 'pages', 'newsletter'];
  const publicMutationEndpoints = ['programs', 'news', 'pages'];
  const readBasePath = publicReadEndpoints.includes(endpoint) ? '' : '/admin';
  const mutationBasePath = publicMutationEndpoints.includes(endpoint) ? '' : '/admin';

  const fetchFn = async () => {
    const offset = (page - 1) * limit;
    const res = await fetch(`${supabaseUrl}/functions/v1/make-server-2a4be611${readBasePath}/${endpoint}?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch ${queryKey}`);
    }
    return await res.json();
  };

  const { data = {}, isLoading } = useQuery({
    queryKey: [queryKey, page],
    queryFn: fetchFn,
    enabled: !!accessToken
  });

  const deleteMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      const responses = await Promise.all(keys.map(key =>
        fetch(`${supabaseUrl}/functions/v1/make-server-2a4be611${mutationBasePath}/${endpoint}/${encodeURIComponent(endpoint === 'team' && !key.startsWith('team:') ? `team:${key}` : key)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ));
      const failedResponse = responses.find(response => !response.ok);
      if (failedResponse) {
        const body = await failedResponse.json().catch(() => null);
        throw new Error(body?.error || `Failed to delete ${queryKey}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${queryKey} deleted successfully`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const deleteItems = async (keys: string[]) => {
    if ((await confirmDialog({ title: 'Confirm Action', message: `Are you sure you want to delete ${keys.length} items?` }))) {
      deleteMutation.mutate(keys);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const id = payload.id || payload.key;
      const url = id
        ? `${supabaseUrl}/functions/v1/make-server-2a4be611${mutationBasePath}/${endpoint}/${encodeURIComponent(id)}`
        : `${supabaseUrl}/functions/v1/make-server-2a4be611${mutationBasePath}/${endpoint}`;
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Failed to save ${queryKey}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(`${queryKey} saved successfully`);
    },
    onError: (err) => {
      toast.error((err as Error).message);
    }
  });

  const saveItem = (payload: any) => saveMutation.mutate(payload);

  // The backend might return { contacts: [] } or { images: [] } etc.
  const items = data[queryKey] || data.images || data.team || data.donations || data.subscribers || data.users || [];
  const totalCount = data.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return { items, totalCount, totalPages, page, setPage, isLoading, deleteItems, saveItem, limit };
}
