// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — USER PROFILE CONTROLLER
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from '../supabase-client.js';
import { auth } from '../auth.js';
import { UIEngine } from '../ui.js';
import { toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  if (!auth.requireAuth()) return;

  const user = auth.user;
  const profile = auth.profile;

  document.getElementById('prof-email').value = user.email || '';
  if (profile) {
    document.getElementById('prof-name').value = profile.full_name || '';
    document.getElementById('prof-phone').value = profile.phone || '';
    document.getElementById('prof-city').value = profile.city || '';
    document.getElementById('prof-address').value = profile.address || '';
  }

  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-prof-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const full_name = document.getElementById('prof-name').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      const city = document.getElementById('prof-city').value.trim();
      const address = document.getElementById('prof-address').value.trim();

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name,
          phone,
          city,
          address,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await auth.fetchProfile();
      toast.success('Profile updated successfully!');

    } catch (err) {
      toast.error('Could not save profile: ' + (err.message || 'Error'));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile Changes';
    }
  });
});
