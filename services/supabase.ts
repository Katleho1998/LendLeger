import { createClient } from '@supabase/supabase-js';

// Helper to check for environment variables in various build environments (Vite, CRA, Node)
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return '';
};

// Default credentials provided for immediate functionality
const DEFAULT_URL = 'https://uizlggaryrmzbuqbkojd.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemxnZ2FyeXJtemJ1cWJrb2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNTczMDAsImV4cCI6MjA4MDgzMzMwMH0.ELfS1LsQdHV9UvFC2kvmBFmBx2MqNhYP88aOg4Djd9M';

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || getEnvVar('REACT_APP_SUPABASE_URL') || DEFAULT_URL;
const supabaseKey = getEnvVar('SUPABASE_KEY') || getEnvVar('VITE_SUPABASE_KEY') || getEnvVar('REACT_APP_SUPABASE_KEY') || DEFAULT_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing. Application running in configuration mode.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);