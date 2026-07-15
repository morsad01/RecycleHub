import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShieldCheck, FolderTree, Flag, ShoppingCart, FileText } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl shadow-card p-3 sticky top-20">
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
  );
}
