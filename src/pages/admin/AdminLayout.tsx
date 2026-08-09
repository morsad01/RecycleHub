import { ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShieldCheck, FolderTree, Flag, ShoppingCart, FileText, LogOut, Home } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../auth/AuthContext';
import logoImg from '../../Image/logo.jpeg';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links = [
    { to: '/admin', label: t('admin.dashboard'), icon: <LayoutDashboard size={18} />, end: true },
    { to: '/admin/users', label: t('admin.users'), icon: <Users size={18} /> },
    { to: '/admin/products', label: t('admin.products'), icon: <Package size={18} /> },
    { to: '/admin/verifications', label: t('admin.verifications'), icon: <ShieldCheck size={18} /> },
    { to: '/admin/categories', label: t('admin.categories'), icon: <FolderTree size={18} /> },
    { to: '/admin/reports', label: t('admin.reports'), icon: <Flag size={18} /> },
    { to: '/admin/orders', label: t('admin.orders'), icon: <ShoppingCart size={18} /> },
    { to: '/admin/content', label: t('admin.content'), icon: <FileText size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Smart Topbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="ResellBD Logo" className="w-9 h-9 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="text-lg font-bold text-neutral-900 leading-tight">Admin Dashboard</h1>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">ResellBD Control</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-2">
              <Home size={16} /> Back to Site
            </Link>
            <button 
              onClick={handleSignOut}
              className="text-sm font-medium text-error-600 hover:bg-error-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-card p-3 sticky top-24">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`
                  }
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
