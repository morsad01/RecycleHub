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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Operations Topbar */}
      <header className="bg-[#111827] border-b border-[#1F2937] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="ResellBD Logo" className="w-8 h-8 object-contain rounded-lg bg-[#1E293B] p-0.5 border border-[#374151]" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Super Admin Control Center</h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider leading-none">Operations Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0B0F19] border border-[#1F2937] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-300">{user?.email}</span>
            </div>
            <Link 
              to="/" 
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] border border-[#374151] flex items-center gap-1.5 transition-colors"
            >
              <Home size={14} /> Back to Site
            </Link>
            <button 
              onClick={handleSignOut}
              className="text-xs font-semibold text-rose-400 hover:text-white bg-[#1F2937] hover:bg-rose-900/50 border border-[#374151] hover:border-rose-700/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3.5 sticky top-22 shadow-sm max-h-[85vh] overflow-y-auto scrollbar-thin">
            <nav className="flex lg:flex-col gap-4">
              {/* Group 1: Core Ops */}
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2.5">Core Operations</p>
                <div className="flex lg:flex-col gap-1">
                  {coreLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-[#1E293B] text-white border border-[#334155]' 
                            : 'text-slate-400 hover:bg-[#1A2234] hover:text-white border border-transparent'
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
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2.5">Compliance</p>
                <div className="flex lg:flex-col gap-1">
                  {complianceLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-[#1E293B] text-white border border-[#334155]' 
                            : 'text-slate-400 hover:bg-[#1A2234] hover:text-white border border-transparent'
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
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2.5">CMS Pages</p>
                <div className="flex lg:flex-col gap-1">
                  {cmsLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-[#1E293B] text-white border border-[#334155]' 
                            : 'text-slate-400 hover:bg-[#1A2234] hover:text-white border border-transparent'
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
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2.5">CRM & Marketing</p>
                <div className="flex lg:flex-col gap-1">
                  {marketingLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-[#1E293B] text-white border border-[#334155]' 
                            : 'text-slate-400 hover:bg-[#1A2234] hover:text-white border border-transparent'
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
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2.5">Infrastructure</p>
                <div className="flex lg:flex-col gap-1">
                  {infrastructureLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-[#1E293B] text-white border border-[#334155]' 
                            : 'text-slate-400 hover:bg-[#1A2234] hover:text-white border border-transparent'
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
        <main className="flex-1 min-w-0 bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
export default SuperAdminLayout;
