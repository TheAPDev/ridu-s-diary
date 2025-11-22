import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If env vars are missing (e.g., running locally without env set), avoid
// calling createClient with empty values which throws at runtime. Instead
// export a lightweight mock with the subset of methods used across the app
// so the UI can render without crashing. In production (configured) we
// create the real Supabase client.
function makeMockChain(tableName?: string) {
  // localStorage-backed mock so data persists across refreshes during local dev
  const storageKey = (t: string) => `writing_app_mock_${t}`;

  const readTable = (t: string) => {
    try {
      const raw = localStorage.getItem(storageKey(t));
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  };

  const writeTable = (t: string, rows: any[]) => {
    try {
      localStorage.setItem(storageKey(t), JSON.stringify(rows));
    } catch (err) {
      // ignore storage errors for environments that don't support localStorage
    }
  };

  const makeBuilder = (table?: string) => {
    const builder: any = {
      _op: null,
      _table: table,
      _insertItems: null,
      _payload: null,
      _eq: null,
      _single: false,
      _selectAfterInsert: false,
    };

    const chain: any = {
      select(columns?: string) {
        builder._columns = columns;
        if (builder._op === 'insert') builder._selectAfterInsert = true;
        else builder._op = 'select';
        return chain;
      },
      order() { return chain; },
      insert(items: any) { builder._op = 'insert'; builder._insertItems = items; return chain; },
      update(payload: any) { builder._op = 'update'; builder._payload = payload; return chain; },
      delete() { builder._op = 'delete'; return chain; },
      eq(col: string, val: any) { builder._eq = [col, val]; return chain; },
      single() { builder._single = true; return chain; },
      then(onFulfilled: (res: any) => any) {
        return (async () => {
          try {
            const tableName = builder._table || table || '';
            let rows = readTable(tableName);

            if (builder._op === 'insert' && builder._insertItems) {
              const itemsArray: any[] = Array.isArray(builder._insertItems) ? builder._insertItems : [builder._insertItems];
              const inserted = itemsArray.map((it: any) => {
                const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
                  ? (crypto as any).randomUUID()
                  : `${Date.now()}${Math.floor(Math.random() * 1000)}`;
                const now = new Date().toISOString();
                return { id, created_at: now, updated_at: now, ...it };
              });
              rows = [...inserted, ...rows];
              writeTable(tableName, rows);
              const data = builder._single ? inserted[0] : inserted;
              return onFulfilled({ data, error: null });
            }

            if (builder._op === 'select') {
              let result = rows;
              if (builder._eq) {
                const [col, val] = builder._eq;
                result = rows.filter((r: any) => r[col] === val);
              }
              return onFulfilled({ data: result, error: null });
            }

            if (builder._op === 'update' && builder._payload) {
              if (!builder._eq) return onFulfilled({ data: null, error: new Error('No predicate for update') });
              const [col, val] = builder._eq;
              let updated: any = null;
              rows = rows.map((r: any) => {
                if (r[col] === val) {
                  updated = { ...r, ...builder._payload, updated_at: new Date().toISOString() };
                  return updated;
                }
                return r;
              });
              writeTable(tableName, rows);
              const data = builder._single ? updated : null;
              return onFulfilled({ data, error: null });
            }

            if (builder._op === 'delete') {
              if (!builder._eq) return onFulfilled({ data: null, error: new Error('No predicate for delete') });
              const [col, val] = builder._eq;
              rows = rows.filter((r: any) => r[col] !== val);
              writeTable(tableName, rows);
              return onFulfilled({ data: null, error: null });
            }

            return onFulfilled({ data: [], error: null });
          } catch (err) {
            return onFulfilled({ data: null, error: err });
          }
        })();
      },
      catch() { return chain; },
    };

    return chain;
  };

  return makeBuilder(tableName);
}

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: (_: string) => makeMockChain(),
    } as any;

export type Event = {
  id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
};

export type Chapter = {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order: number;
  created_at: string;
  updated_at: string;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  notes: string;
  created_at: string;
  updated_at: string;
};
