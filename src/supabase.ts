import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log("[SUPABASE] URL:", url ? "✓ configured" : "✗ missing");
console.log("[SUPABASE] ANON_KEY:", anon ? "✓ configured" : "✗ missing");

if (!url || !anon) {
  console.error("[SUPABASE] Missing environment variables!");
}

export const supabase = createClient(url, anon);