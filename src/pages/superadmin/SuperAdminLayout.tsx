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
  MessageSquareWarning,
  Layout,
  Image,
  BookOpen,
  Megaphone,
  FolderOpen,
  Gift,
  Mail,
  Search,
  HeartHandshake,
  Compass
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import logoImg from '../../Image/logo.jpeg';

export function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast('Secure Session Terminated.', 'info');
    navigate('/superadmin');
  };

  const coreLinks = [
    { to: '/superadmin', label: 'Platform Health', icon: <Activity size={16} />, end: true },
    { to: '/superadmin/users', label: 'User & Seller Hub', icon: <Users size={16} /> },
    { to: '/superadmin/admins', label: 'Admin Management', icon: <UserCog size={16} /> },
    { to: '/superadmin/roles', label: 'Role & Permissions', icon: <ShieldCheck size={16} /> },
    { to: '/superadmin/settings', label: 'System Settings', icon: <Settings size={16} /> },
  ];

  const complianceLinks = [
    { to: '/superadmin/products', label: 'Product Moderation', icon: <ClipboardCheck size={16} /> },
    { to: '/superadmin/content', label: 'Content Moderation', icon: <MessageSquareWarning size={16} /> },
  ];

  const cmsLinks = [
    { to: '/superadmin/homepage', label: 'Homepage Builder', icon: <Layout size={16} /> },
    { to: '/superadmin/banners', label: 'Banner Ads', icon: <Image size={16} /> },
    { to: '/superadmin/blogs', label: 'Blogs & Articles', icon: <BookOpen size={16} /> },
    { to: '/superadmin/announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
    { to: '/superadmin/media', label: 'Media Library', icon: <FolderOpen size={16} /> },
    { to: '/superadmin/seo', label: 'SEO tags', icon: <Search size={16} /> },
  ];

  const marketingLinks = [
    { to: '/superadmin/crm', label: 'Customer CRM', icon: <HeartHandshake size={16} /> },
    { to: '/superadmin/coupons', label: 'Discount Coupons', icon: <Compass size={16} /> },
    { to: '/superadmin/referrals', label: 'Referrals System', icon: <Gift size={16} /> },
    { to: '/superadmin/newsletter', label: 'Newsletters', icon: <Mail size={16} /> },
  ];

  const infrastructureLinks = [
    { to: '/superadmin/security', label: 'Security & Audits', icon: <Lock size={16} /> },
    { to: '/superadmin/database', label: 'Database Console', icon: <Server size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Premium Operations Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="ResellBD Logo" className="w-8 h-8 object-contain rounded-lg bg-white/10 p-0.5 shadow-sm" />
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sticky top-24 shadow-2xl max-h-[82vh] overflow-y-auto scrollbar-thin">
            <nav className="flex lg:flex-col gap-5">
              {/* Group 1: Core Ops */}
              <div>
                <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">Core Operations</p>
                <div className="flex lg:flex-col gap-0.5">
                  {coreLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                            : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {link.icon} {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Group 2: Compliance */}
              <div>
                <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">Compliance</p>
                <div className="flex lg:flex-col gap-0.5">
                  {complianceLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                            : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {link.icon} {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Group 3: CMS Content */}
              <div>
                <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">CMS Pages</p>
                <div className="flex lg:flex-col gap-0.5">
                  {cmsLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                            : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {link.icon} {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Group 4: CRM & Marketing */}
              <div>
                <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">CRM & Marketing</p>
                <div className="flex lg:flex-col gap-0.5">
                  {marketingLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                            : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {link.icon} {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Group 5: Infrastructure */}
              <div>
                <p className="text-4xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-3">Infrastructure</p>
                <div className="flex lg:flex-col gap-0.5">
                  {infrastructureLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                          isActive 
                            ? 'bg-red-600/90 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)] border border-red-500/20' 
                            : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                        }`
                      }
                    >
                      {link.icon} {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
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
