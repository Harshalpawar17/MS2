import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Settings,
  LogOut,
  Building2,
  UserCircle,
  ClipboardList,
  Cpu,
  Users,
  Layout as LayoutIcon,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const clinicLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/intake', icon: <FilePlus size={20} />, label: 'Select Intake' },
    { to: '/submissions', icon: <ClipboardList size={20} />, label: 'My Submissions' },
  ];

  const clinicAdminLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/intake', icon: <FilePlus size={20} />, label: 'Select Intake' },
    { to: '/submissions', icon: <ClipboardList size={20} />, label: 'My Submissions' },
    {
      to: '/clinic/config',
      icon: <Settings size={20} />,
      label: 'Insurance Verification Intake Configuration',
    },
  ];

  const adminLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Admin Metrics' },
    { to: '/admin/patients', icon: <ClipboardList size={20} />, label: 'Patient Listing' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/admin/pods', icon: <LayoutIcon size={20} />, label: 'POD Management' },
    { to: '/admin/add-clinic', icon: <Building2 size={20} />, label: 'Add Clinic' },
    { to: '/submissions', icon: <ClipboardList size={20} />, label: 'Case Management' },
    { to: '/admin/rule-engine', icon: <Cpu size={20} />, label: 'Rule Engine' },
    { to: '/intake', icon: <Settings size={20} />, label: 'System Config' },
  ];

  const agentLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/agent/work-list', icon: <ClipboardList size={20} />, label: 'Work List' },
  ];

  const getLinks = () => {
    if (user.role === UserRole.ADMIN) return adminLinks;
    if (user.role === UserRole.CLINIC_ADMIN) return clinicAdminLinks;
    if (user.role === UserRole.AGENT) return agentLinks;
    return clinicLinks;
  };

  const getNavLinkClasses = (isActive: boolean) =>
    [
      'flex items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-300',
      isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20 dark:bg-primary dark:text-white dark:shadow-primary/10'
        : 'text-secondary hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white',
    ].join(' ');

  const getNavIconClasses = (isActive: boolean) =>
    isActive ? 'text-white' : 'text-primary dark:text-primary';

  if (user.role === UserRole.PATIENT) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] text-slate-900 transition-colors duration-300 dark:bg-[#020817] dark:text-white">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/95 p-6 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-[#0b1220]/95">
          <div className="flex items-center space-x-4">
            <div>
              <img
                src="sage_healthy_rcm_logo.png"
                alt="MySage"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/100x40/ffffff/6D6E71?text=MySage';
                }}
              />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-sm font-bold text-secondary dark:text-slate-300">
              Patient Portal
            </span>
          </div>

          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8] text-slate-900 transition-colors duration-300 dark:bg-[#020817] dark:text-white">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc] transition-colors duration-300 dark:border-slate-800 dark:bg-[#0b1220]">
        <div className="flex items-center justify-center border-b border-slate-200 p-6 transition-colors duration-300 dark:border-slate-800">
          <img
            src="sage_healthy_rcm_logo.png"
            alt="MySage"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/200x60/ffffff/6D6E71?text=MySage';
            }}
          />
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {getLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => getNavLinkClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  <div className={getNavIconClasses(isActive)}>{link.icon}</div>
                  <span className="font-medium">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 transition-colors duration-300 dark:border-slate-800">
          <div className="mb-3 flex items-center space-x-3 rounded-2xl border border-slate-200 bg-white p-3 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-xl bg-primary/10 p-2 dark:bg-primary/15">
              <UserCircle size={24} className="text-primary" />
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-primaryText dark:text-white">
                {user.name}
              </p>
              <p className="truncate text-[10px] font-bold uppercase tracking-tight text-secondary dark:text-slate-400">
                {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold text-secondary transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-transparent">
        <div className="mx-auto max-w-7xl p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;