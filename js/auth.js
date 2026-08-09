// ════════════════════════════════════════════════════════════════════════════════
// RESELLBD — AUTHENTICATION & USER MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase-client.js';
import { toast } from './toast.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.profile = null;
    this.initialized = false;
    this.listeners = [];
  }

  async init() {
    if (this.initialized) return this.user;

    const { data: { session } } = await supabase.auth.getSession();
    this.user = session?.user || null;
    if (this.user) {
      await this.fetchProfile();
    }
    this.initialized = true;

    // Listen to real-time auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.user = session?.user || null;
      if (this.user) {
        await this.fetchProfile();
      } else {
        this.profile = null;
      }
      this.notifyListeners();
    });

    return this.user;
  }

  async fetchProfile() {
    if (!this.user) return null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle();
      this.profile = data;
      return data;
    } catch {
      return null;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    if (this.initialized) callback(this.user, this.profile);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach((l) => l(this.user, this.profile));
  }

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    await this.fetchProfile();
    this.notifyListeners();
    return data;
  }

  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login.html`,
      },
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await supabase.auth.signOut();
    this.user = null;
    this.profile = null;
    this.notifyListeners();
    window.location.href = '/index.html';
  }

  requireAuth(redirectUrl = window.location.pathname) {
    if (!this.user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(redirectUrl)}`;
      return false;
    }
    return true;
  }
}

export const auth = new AuthManager();
