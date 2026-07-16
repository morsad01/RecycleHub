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
  const { data, error } = await supabase.storage.getBucket('product-images');
  console.log("Get Bucket:", JSON.stringify(data), error);
  
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  console.log("List Buckets:", buckets?.map(b => b.name), bucketsErr);
}

check();
