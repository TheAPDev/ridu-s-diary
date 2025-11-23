import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cspmhartheoizwzskdga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcG1oYXJ0aGVvaXp3enNrZGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTA3MDYsImV4cCI6MjA3OTQ2NjcwNn0.--lf46YA47sf48by9Nmb_kOAAaLMN7B9sfhXIecmYxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase connection and logic removed.
