// Public Supabase connection values.
// The anon key is a *publishable* key (it is shipped to every browser that
// loads the app and is protected by Row Level Security), so it is safe to keep
// as a build-time fallback. Real env vars still take precedence when set.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://yeabajvdjgwaenhjnqgk.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYWJhanZkamd3YWVuaGpucWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2OTA1OTYsImV4cCI6MjA3NDI2NjU5Nn0.AXyhm-B5tBo0OvxHtEnp3DXYplgdcyiqRyKl1gwGEZw";
