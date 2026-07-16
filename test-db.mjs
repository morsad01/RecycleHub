import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
  const { data, error } = await supabase.from('cart_items').select('*').limit(1);
  console.log("Cart Items:", data, error);
  
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles:", profiles, pErr);
}

check();
