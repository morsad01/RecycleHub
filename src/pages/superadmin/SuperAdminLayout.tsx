import { ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Server, 
  ShieldCheck, 
  UserCog, 
  Settings, 
  Activity, 
  Lock,
  LogOut,
  Home,
  Users,
  ClipboardCheck,
  MessageSquareWarning
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast('Secure Session Terminated.', 'info');
    navigate('/superadmin');
  };

  const links = [
    { to: '/superadmin', label: 'Platform Health', icon: <Activity size={18} />, end: true },
    { to: '/superadmin/users', label: 'User & Seller Hub', icon: <Users size={18} /> },
    { to: '/superadmin/admins', label: 'Admin Management', icon: <UserCog size={18} /> },
    { to: '/superadmin/products', label: 'Product Moderation', icon: <ClipboardCheck size={18} /> },
    { to: '/superadmin/content', label: 'Content Moderation', icon: <MessageSquareWarning size={18} /> },
    { to: '/superadmin/roles', label: 'Role & Permissions', icon: <ShieldCheck size={18} /> },
    { to: '/superadmin/settings', label: 'System Settings', icon: <Settings size={18} /> },
    { to: '/superadmin/security', label: 'Security & Audits', icon: <Lock size={18} /> },
    { to: '/superadmin/database', label: 'Database Console', icon: <Server size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Premium Operations Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.2)]">
              <Lock className="text-red-500" size={16} />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white">Super Admin Control Center</h1>
              <p className="text-3xs font-mono text-red-500/80 uppercase tracking-widest leading-none">Ops Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-950 border border-gray-800 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              <span className="text-3xs font-mono text-gray-400">SECURE CONTEXT: {user?.email}</span>
            </div>
            <Link 
              to="/" 
              className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Home size={14} /> Back to Site
            </Link>
            <button 
              onClick={handleSignOut}
              className="text-xs font-semibold text-red-500 hover:bg-red-950/40 border border-red-950/20 hover:border-red-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <LogOut size={14} /> Terminate
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sticky top-24 shadow-2xl">
            <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">Management Options</p>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive 
                        ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                    }`
                  }
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Page Content viewport */}
        <main className="flex-1 min-w-0 bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
          <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-l from-red-500/20 to-transparent" />
          {children}
        </main>
      </div>
    </div>
  );
}
export default SuperAdminLayout;
