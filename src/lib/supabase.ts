import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
