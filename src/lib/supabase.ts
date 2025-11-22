import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If env vars are missing (e.g., running locally without env set), avoid
// calling createClient with empty values which throws at runtime. Instead
// export a lightweight mock with the subset of methods used across the app
// so the UI can render without crashing. In production (configured) we
// create the real Supabase client.
function makeMockChain(tableName?: string) {
  const builder: any = {
    _op: null,
    _table: tableName,
    _insertItems: null,
    _payload: null,
    _eq: null,
    _single: false,
  };

  const chain = {
    select(columns?: string) {
      builder._op = 'select';
      builder._columns = columns;
      return chain;
    },
    order() {
      // ignore ordering in mock
      return chain;
    },
    insert(items: any) {
      builder._op = 'insert';
      builder._insertItems = items;
      return chain;
    },
    update(payload: any) {
      builder._op = 'update';
      builder._payload = payload;
      return chain;
    },
    delete() {
      builder._op = 'delete';
      return chain;
    },
    eq(col: string, val: any) {
      builder._eq = [col, val];
      return chain;
    },
    single() {
      builder._single = true;
      return chain;
    },
    // make the builder then-able so `await supabase.from(...).select()` works
    then(onFulfilled: (res: any) => any) {
      return (async () => {
        try {
          let res: any = { data: [], error: null };

          if (builder._op === 'insert' && builder._insertItems) {
            // echo back inserted items and give them ids
            const itemsArray: any[] = Array.isArray(builder._insertItems) ? builder._insertItems : [builder._insertItems];
            const inserted = itemsArray.map((it: any, i: number) => ({ ...it, id: (Date.now() + i).toString() }));
            res = { data: inserted, error: null };
          } else if (builder._op === 'select') {
            res = { data: [], error: null };
          } else if (builder._op === 'update' || builder._op === 'delete') {
            res = { data: null, error: null };
          }

          return onFulfilled(res);
        } catch (err) {
          return onFulfilled({ data: null, error: err });
        }
      })();
    },
    catch() {
      // noop for mock
      return chain as any;
    },
  };

  return chain as any;
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
