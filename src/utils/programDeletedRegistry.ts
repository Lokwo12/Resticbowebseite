import { supabase } from './supabase/client';

const STORAGE_KEY = 'resti_deleted_programs';
const KV_KEY = 'system:deleted_programs';

let inMemoryDeletedSet: Set<string> | null = null;

export async function getDeletedProgramIds(): Promise<Set<string>> {
  const set = new Set<string>();

  // 1. Read from localStorage for immediate availability
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach(id => {
          if (id) set.add(String(id).trim().toLowerCase());
        });
      }
    }
  } catch {}

  // 2. Read from Supabase kv_store_2a4be611
  try {
    const { data, error } = await supabase
      .from('kv_store_2a4be611')
      .select('value')
      .eq('key', KV_KEY)
      .maybeSingle();

    if (error) {
      console.warn('Error reading deleted programs registry from database:', error.message);
    } else if (data?.value?.ids && Array.isArray(data.value.ids)) {
      data.value.ids.forEach((id: string) => {
        if (id) set.add(String(id).trim().toLowerCase());
      });
      // Sync back to local storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
      } catch {}
    }
  } catch (err) {
    console.warn('Exception reading deleted programs registry:', err);
  }

  inMemoryDeletedSet = set;
  return set;
}

export function getDeletedProgramIdsSync(): Set<string> {
  if (inMemoryDeletedSet) return inMemoryDeletedSet;
  const set = new Set<string>();
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach(id => {
          if (id) set.add(String(id).trim().toLowerCase());
        });
      }
    }
  } catch {}
  inMemoryDeletedSet = set;
  return set;
}

export async function recordDeletedProgramIds(idsToAdd: string[]): Promise<Set<string>> {
  const set = await getDeletedProgramIds();
  idsToAdd.forEach(id => {
    const clean = String(id || '').replace(/^program:/, '').trim().toLowerCase();
    if (clean) set.add(clean);
  });

  const arr = Array.from(set);
  inMemoryDeletedSet = set;

  // Persist locally
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}

  // Persist remotely to kv_store_2a4be611
  try {
    const { error } = await supabase
      .from('kv_store_2a4be611')
      .upsert({ key: KV_KEY, value: { ids: arr } });
    if (error) {
      console.error('Failed to persist deleted programs registry to Supabase:', error.message);
    }
  } catch (err) {
    console.error('Exception persisting deleted programs registry:', err);
  }

  return set;
}

export async function unmarkDeletedProgramId(idToRestore: string): Promise<Set<string>> {
  const set = await getDeletedProgramIds();
  const clean = String(idToRestore || '').replace(/^program:/, '').trim().toLowerCase();
  if (clean) set.delete(clean);

  const arr = Array.from(set);
  inMemoryDeletedSet = set;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}

  try {
    const { error } = await supabase
      .from('kv_store_2a4be611')
      .upsert({ key: KV_KEY, value: { ids: arr } });
    if (error) {
      console.error('Failed to update unmark deleted program registry in Supabase:', error.message);
    }
  } catch (err) {
    console.error('Exception updating unmark deleted program registry:', err);
  }

  return set;
}
