import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uwrdhvpayfzpajsforro.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_i1fs5ih-4FIyPNPfOZDV7Q_H019bawh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
