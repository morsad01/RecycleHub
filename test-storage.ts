import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.storage.getBucket('product-images');
  console.log("Get Bucket:", data, error);
  
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  console.log("List Buckets:", buckets?.map(b => b.name), bucketsErr);
}

check();
