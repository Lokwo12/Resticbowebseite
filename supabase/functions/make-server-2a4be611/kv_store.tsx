import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// Helper to determine which SQL table to use based on key prefix
const getTableInfo = (key: string) => {
  if (key.startsWith('admin_user:')) return { table: 'admin_users', id: key.split(':')[1] || key };
  if (key.startsWith('program:')) return { table: 'programs', id: key.split(':')[1] || key };
  if (key.startsWith('news:')) return { table: 'news', id: key.split(':')[1] || key };
  if (key.startsWith('contact:')) return { table: 'contacts', id: key.split(':')[1] || key };
  if (key.startsWith('volunteer:')) return { table: 'volunteers', id: key.split(':')[1] || key };
  if (key.startsWith('donation:')) return { table: 'donations', id: key.split(':')[1] || key };
  if (key.startsWith('newsletter:')) return { table: 'newsletters', id: key.split(':')[1] || key };
  if (key.startsWith('gallery:')) return { table: 'gallery', id: key.split(':')[1] || key };
  if (key.startsWith('story:')) return { table: 'stories', id: key.split(':')[1] || key };
  if (key.startsWith('team:')) return { table: 'team', id: key.split(':')[1] || key };
  if (key.startsWith('event:')) return { table: 'events', id: key.split(':')[1] || key };
  if (key.startsWith('partner:')) return { table: 'partners', id: key.split(':')[1] || key };
  if (key.startsWith('report:')) return { table: 'reports', id: key.split(':')[1] || key };
  if (key.startsWith('opportunity:')) return { table: 'opportunities', id: key.split(':')[1] || key };
  if (key.startsWith('faq:')) return { table: 'faqs', id: key.split(':')[1] || key };
  if (key.startsWith('resource:')) return { table: 'resources', id: key.split(':')[1] || key };
  if (key.startsWith('page:')) return { table: 'pages', id: key.split(':')[1] || key };
  if (key === 'site_settings' || key.startsWith('site_settings:')) return { table: 'site_settings', id: 'global' };
  return { table: 'kv_store_2a4be611', id: key }; // Fallback to raw KV
};

// Map JS camelCase to SQL snake_case for inserts
const mapToSql = (table: string, id: string, val: any) => {
  if (table === 'kv_store_2a4be611') return { key: id, value: val };
  if (table === 'site_settings') return { id: 'global', settings: val };
  
  const mapped: any = { id, ...val };
  // Handle specific snake_case conversions based on schema
  if (val.createdAt) { mapped.created_at = val.createdAt; delete mapped.createdAt; }
  if (val.updatedAt) { mapped.updated_at = val.updatedAt; delete mapped.updatedAt; }
  if (val.firstName) { mapped.first_name = val.firstName; delete mapped.firstName; }
  if (val.lastName) { mapped.last_name = val.lastName; delete mapped.lastName; }
  if (val.publishDate) { mapped.publish_date = val.publishDate; delete mapped.publishDate; }
  if (val.timeCommitment) { mapped.time_commitment = val.timeCommitment; delete mapped.timeCommitment; }
  if (val.openPositions) { mapped.open_positions = val.openPositions; delete mapped.openPositions; }
  if (val.fileUrl) { mapped.file_url = val.fileUrl; delete mapped.fileUrl; }
  if (val.fileType) { mapped.file_type = val.fileType; delete mapped.fileType; }
  if (val.fileSize) { mapped.file_size = val.fileSize; delete mapped.fileSize; }
  if (val.transactionId) { mapped.transaction_id = val.transactionId; delete mapped.transactionId; }
  
  return mapped;
};

// Map SQL snake_case back to JS camelCase for reads
const mapToJs = (table: string, prefix: string, row: any) => {
  if (table === 'kv_store_2a4be611') return { key: row.key, value: row.value };
  if (table === 'site_settings') return { key: 'site_settings', value: row.settings };
  
  const val: any = { ...row };
  if (row.created_at) { val.createdAt = row.created_at; delete val.created_at; }
  if (row.updated_at) { val.updatedAt = row.updated_at; delete val.updated_at; }
  if (row.first_name) { val.firstName = row.first_name; delete val.first_name; }
  if (row.last_name) { val.lastName = row.last_name; delete val.last_name; }
  if (row.publish_date) { val.publishDate = row.publish_date; delete val.publish_date; }
  if (row.time_commitment) { val.timeCommitment = row.time_commitment; delete val.time_commitment; }
  if (row.open_positions) { val.openPositions = row.open_positions; delete val.open_positions; }
  if (row.file_url) { val.fileUrl = row.file_url; delete val.file_url; }
  if (row.file_type) { val.fileType = row.file_type; delete val.file_type; }
  if (row.file_size) { val.fileSize = row.file_size; delete val.file_size; }
  if (row.transaction_id) { val.transactionId = row.transaction_id; delete val.transaction_id; }
  
  delete val.id; // Usually id is combined into the key
  
  // Clean up nulls that weren't in the original KV data
  for (const k of Object.keys(val)) {
    if (val[k] === null) delete val[k];
  }
  
  const originalKey = prefix.endsWith(':') ? `${prefix}${row.id}` : prefix;
  return { key: originalKey, value: { id: row.id, ...val } };
};

export const set = async (key: string, value: any): Promise<void> => {
  const supabase = client();
  const info = getTableInfo(key);
  const sqlData = mapToSql(info.table, info.id, value);
  const { error } = await supabase.from(info.table).upsert(sqlData);
  if (error) throw new Error(error.message);
};

export const get = async (key: string): Promise<any> => {
  const supabase = client();
  const info = getTableInfo(key);
  
  if (info.table === 'kv_store_2a4be611') {
    const { data, error } = await supabase.from(info.table).select("value").eq("key", key).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  }
  
  const { data, error } = await supabase.from(info.table).select("*").eq("id", info.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  
  const prefix = key.includes(':') ? key.split(':')[0] + ':' : key;
  return mapToJs(info.table, prefix, data).value;
};

export const del = async (key: string): Promise<void> => {
  const supabase = client();
  const info = getTableInfo(key);
  
  if (info.table === 'kv_store_2a4be611') {
    const { error } = await supabase.from(info.table).delete().eq("key", key);
    if (error) throw new Error(error.message);
    return;
  }
  
  const { error } = await supabase.from(info.table).delete().eq("id", info.id);
  if (error) throw new Error(error.message);
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = client();
  const info = getTableInfo(prefix);
  
  if (info.table === 'kv_store_2a4be611') {
    const { data, error } = await supabase.from(info.table).select("key, value").like("key", prefix + "%");
    if (error) throw new Error(error.message);
    return data ?? [];
  }
  
  const { data, error } = await supabase.from(info.table).select("*");
  if (error) throw new Error(error.message);
  if (!data) return [];
  
  return data.map(row => mapToJs(info.table, prefix, row));
};

export const getPaginatedByPrefix = async (prefix: string, limit: number, offset: number, options?: { orderBy?: string, orderDirection?: 'asc'|'desc' }): Promise<{data: any[], count: number}> => {
  const supabase = client();
  const info = getTableInfo(prefix);
  
  let query = supabase.from(info.table).select("*", { count: 'exact' });
  
  if (info.table === 'kv_store_2a4be611') {
    query = supabase.from(info.table).select("key, value", { count: 'exact' }).like("key", prefix + "%");
  }
  
  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
  } else if (info.table !== 'kv_store_2a4be611' && info.table !== 'site_settings') {
    query = query.order('created_at', { ascending: false });
  }
  
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  
  if (info.table === 'kv_store_2a4be611') {
    return { data: data ?? [], count: count || 0 };
  }
  
  return { 
    data: (data || []).map(row => mapToJs(info.table, prefix, row)),
    count: count || 0
  };
};

export const mset = async (keysOrEntries: any, values?: any[]): Promise<void> => {
  let entries = values ? keysOrEntries.map((k: string, i: number) => ({ key: k, value: values[i] })) : keysOrEntries;
  for (const entry of entries) {
    await set(entry.key, entry.value);
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return await Promise.all(keys.map(k => get(k)));
};

export const mdel = async (keys: string[]): Promise<void> => {
  for (const key of keys) {
    await del(key);
  }
};