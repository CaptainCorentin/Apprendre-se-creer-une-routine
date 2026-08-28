import { createClient } from "@supabase/supabase-js";

// Fallback à une URL factice pour ne pas faire planter le build/prerender
// quand les variables d'env ne sont pas encore configurées (ex: build Vercel
// avant l'ajout des Environment Variables). L'app échouera normalement à
// l'exécution dans le navigateur tant que les vraies valeurs ne sont pas définies.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
