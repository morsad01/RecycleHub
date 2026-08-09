// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — AUTHENTICATION CONTROLLER (LOGIN & SIGNUP)
// ════════════════════════════════════════════════════════════════════════════════

import { auth } from '../auth.js';
import { UIEngine } from '../ui.js';
import { toast } from '../toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await auth.init();
  UIEngine.init();

  const user = auth.user;
  if (user) {
    window.location.href = '/dashboard.html';
    return;
  }

  // Handle Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-submit-btn');

      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        await auth.signIn(email, password);
        toast.success('Welcome back!');
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
      } catch (err) {
        toast.error(err.message || 'Invalid email or password');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  // Handle Signup
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const btn = document.getElementById('signup-submit-btn');

      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        await auth.signUp(email, password, name);
        toast.success('Account created! Please check your email inbox to verify your account.');
        setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      } catch (err) {
        toast.error(err.message || 'Registration failed');
        btn.disabled = false;
        btn.textContent = 'Create Free Account';
      }
    });
  }
});
