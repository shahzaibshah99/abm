import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rmnxlsxhrgrlqkqqhlju.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnhsc3hocmdybHFrcXFobGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMyMDMsImV4cCI6MjA4ODI3OTIwM30.6yo4QSdlwaUT-x23MHBSI67jO0S0LThCmJ97cMxKGtI';

// If only the project ID is provided, construct the full URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error("Supabase URL is invalid or missing:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
