import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const url = 'https://neqjmodldfqtyhlshozk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcWptb2RsZGZxdHlobHNob3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDExNDExOCwiZXhwIjoyMDk5NjkwMTE4fQ.oFWO3dEMch1bem8rY1wOoXL6zEZvQwVijj_Xp9qmXFQ';

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  console.log('Creating Super Admin account...');
  
  const email = 'morsadulislam0011@gmail.com';
  const password = 'Fahim@123';

  // 1. Check if user already exists or create new one
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  let userId;
  const existingUser = users?.find(u => u.email === email);
  
  if (existingUser) {
    console.log('User already exists, updating password and fetching ID...');
    userId = existingUser.id;
    // Ensure the password is set correctly
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: password, email_confirm: true });
  } else {
    console.log('Creating new user in Auth...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Bypass email confirmation
      user_metadata: { full_name: 'Morsadul Islam (Super Admin)' }
    });
    
    if (createError) {
      console.error('Failed to create user:', createError.message);
      return;
    }
    userId = newUser.user.id;
    
    // Wait a second for the trigger to create the profile row
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 2. Update the role in profiles table to 'super_admin'
  console.log(`Updating profile role to super_admin for user ID: ${userId}...`);
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to update profile role:', profileError.message);
  } else {
    console.log('SUCCESS! Super Admin account is ready.');
  }
}

createSuperAdmin();
