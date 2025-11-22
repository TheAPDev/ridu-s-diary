import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If env vars are missing (e.g., running locally without env set), avoid
// calling createClient with empty values which throws at runtime. Instead
// export a lightweight mock with the subset of methods used across the app
// so the UI can render without crashing. In production (configured) we
// create the real Supabase client.
function makeMockChain() {
  const chain: any = {
    // .select() usually returns a Promise resolving to { data, error }
    select: async () => ({ data: [], error: null }),
    // chainable methods used in code
    order() {
      return chain;
    },
    insert() {
      return { select: async () => ({ data: [], error: null }) };
    },
    delete() {
      return { eq: async () => ({ data: null, error: null }) };
    },
    update() {
      return { eq: async () => ({ data: null, error: null }) };
    },
    eq: async () => ({ data: null, error: null }),
  };
  return chain;
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
