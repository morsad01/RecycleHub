import { ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Server, 
  ShieldAlert, 
  UserCog, 
  Settings, 
  Activity, 
  Lock,
  LogOut,
  Home
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../auth/AuthContext';

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links = [
    { to: '/superadmin', label: 'Platform Health', icon: <Activity size={18} />, end: true },
    { to: '/superadmin/admins', label: 'Admin Management', icon: <UserCog size={18} /> },
    { to: '/superadmin/roles', label: 'Role Management', icon: <ShieldAlert size={18} /> },
    { to: '/superadmin/settings', label: 'System Settings', icon: <Settings size={18} /> },
    { to: '/superadmin/security', label: 'Security Center', icon: <Lock size={18} /> },
    { to: '/superadmin/database', label: 'Database Status', icon: <Server size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Smart Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="text-red-600" />
            <h1 className="text-xl font-bold text-gray-900">Super Admin Control Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Home size={16} /> Back to Site
            </Link>
            <button 
              onClick={handleSignOut}
              className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <div className="bg-gray-900 rounded-2xl shadow-card p-3 sticky top-24">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
