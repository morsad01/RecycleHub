import { ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Menu, X, Bell, Heart, MessageCircle, Package, LayoutDashboard,
  PlusCircle, LogOut, User as UserIcon, Shield, Leaf, Globe, ChevronDown, ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { data: cartCount } = useQuery({
    queryKey: ['cart-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15_000,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
      if (!convos?.length) return 0;
      const convoIds = convos.map((c) => c.id);
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convoIds)
        .eq('is_read', false)
        .neq('sender_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = profile?.role === 'admin';

  const navLinks = user ? [
    { to: '/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={18} /> },
    { to: '/sell/new', label: t('nav.sell'), icon: <PlusCircle size={18} /> },
    { to: '/my-listings', label: t('nav.myListings'), icon: <Package size={18} /> },
    { to: '/wishlist', label: t('nav.wishlist'), icon: <Heart size={18} /> },
    { to: '/messages', label: t('nav.messages'), icon: <MessageCircle size={18} />, badge: unreadMessages },
    { to: '/orders', label: t('nav.orders'), icon: <Package size={18} /> },
  ] : [];

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isDashboardLayout = location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin');

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Skip to main content - Accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Header - Hidden in admin dashboards */}
      {!isDashboardLayout && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
                <Leaf size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-neutral-900 hidden sm:block">RecycleHub</span>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.search')}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                />
              </div>
            </form>

            {/* Right nav */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                title="Switch language"
              >
                <Globe size={18} />
                <span className="hidden sm:inline">{lang === 'en' ? 'EN' : 'বাং'}</span>
              </button>

              {user ? (
                <>
                  <Link to="/cart" className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <ShoppingCart size={20} />
                    {cartCount ? (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>

                  <Link to="/notifications" className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <Bell size={20} />
                    {unreadCount ? (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ) : null}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <Avatar src={profile?.avatar_url} name={profile?.full_name} size={32} />
                      <ChevronDown size={16} className="text-neutral-400 hidden sm:block" />
                    </button>
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-20 animate-scale-in">
                          <div className="px-4 py-2 border-b border-neutral-100">
                            <p className="text-sm font-medium text-neutral-900 truncate">{profile?.full_name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            {profile?.is_seller_verified && (
                              <Badge variant="success" className="mt-1">
                                <Shield size={12} /> {t('product.verifiedSeller')}
                              </Badge>
                            )}
                          </div>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                            <UserIcon size={16} /> {t('nav.profile')}
                          </Link>
                          <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                            <LayoutDashboard size={16} /> {t('nav.dashboard')}
                          </Link>
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                              <Shield size={16} /> {t('nav.admin')}
                            </Link>
                          )}
                          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-500 hover:bg-error-50">
                            <LogOut size={16} /> {t('nav.logout')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors">
                    {t('nav.signup')}
                  </Link>
                </div>
              )}

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
              />
            </div>
          </form>
        </div>

        {/* Desktop nav bar */}
        {user && (
          <nav className="hidden md:block border-t border-neutral-100">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 h-11">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.to) ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {link.badge ? (
                    <span className="ml-1 w-4 h-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin" className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin') ? 'text-primary-600 bg-primary-50' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                  <Shield size={18} /> {t('nav.admin')}
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </header>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-neutral-100 p-4 space-y-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {user ? (
              navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg">
                  {link.icon} {link.label}
                  {link.badge ? <span className="ml-auto w-5 h-5 rounded-full bg-error-500 text-white text-xs font-bold flex items-center justify-center">{link.badge}</span> : null}
                </Link>
              ))
            ) : (
              <>
                <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg">
                  <Search size={18} /> {t('nav.browse')}
                </Link>
                <Link to="/help" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg">
                  <Package size={18} /> {t('nav.help')}
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg">
                <Shield size={18} /> {t('nav.admin')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1">{children}</main>

      {/* Footer - Hidden in admin dashboards */}
      {!isDashboardLayout && (
        <footer className="bg-neutral-900 text-neutral-300 mt-12">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                  <Leaf size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-white">RecycleHub</span>
              </div>
              <p className="text-sm text-neutral-400">AI-powered resale marketplace for a sustainable future.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Marketplace</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-primary-400">Browse</Link></li>
                <li><Link to="/sell/new" className="hover:text-primary-400">Sell</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary-400">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/support" className="hover:text-primary-400">Help Center</Link></li>
                <li><Link to="/community-guidelines" className="hover:text-primary-400">Community Guidelines</Link></li>
                <li><Link to="/buyer-policy" className="hover:text-primary-400">Buyer Policy</Link></li>
                <li><Link to="/seller-policy" className="hover:text-primary-400">Seller Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-primary-400">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-primary-400">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-400">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-primary-400">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
            <div>
              © {new Date().getFullYear()} RecycleHub. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link to="/pricing" className="hover:text-primary-400">Pricing</Link>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
