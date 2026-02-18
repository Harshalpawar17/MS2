
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  ListTodo, 
  Settings, 
  LogOut, 
  Building2, 
  UserCircle,
  ClipboardList,
  Scale,
  ShieldCheck,
  Bell,
  FileText,
  Gavel
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
    { to: '/claims', icon: <Scale size={20} />, label: 'WC/PI Cases' },
    { to: '/ev-claims', icon: <ShieldCheck size={20} />, label: 'EV Cases' },
  ];

  const adminLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashbord' },
    { to: '/admin/add-clinic', icon: <Building2 size={20} />, label: 'Add Clinic' },
    { to: '/claims', icon: <Scale size={20} />, label: 'Cases Listing' },
    { to: '/ev-claims', icon: <ShieldCheck size={20} />, label: 'EV Cases' },
    { to: '/intake', icon: <Settings size={20} />, label: 'Select Intake' },
    { to: "/admin/rule-engine", icon: <Gavel size={20} />, label: "Rule Engine" },
    { to: "/admin/workflow-engine", icon: <ClipboardList size={20} />, label: "Workflow Engine" },
  ];

  const agentLinks = [
    { to: '/', icon: <ListTodo size={20} />, label: 'Queue' },
    { to: '/submissions', icon: <ClipboardList size={20} />, label: 'Worklist' },
    { to: '/claims', icon: <Scale size={20} />, label: 'Master Cases' },
    { to: '/ev-claims', icon: <ShieldCheck size={20} />, label: 'EV Cases' },
  ];

  const patientLinks = [
    { to: '/', icon: <Bell size={20} />, label: 'My Updates' },
    // { to: '/claims', icon: <FileText size={20} />, label: 'My Cases' },
  ];

  const getLinks = () => {
    if (user.role === UserRole.ADMIN) return adminLinks;
    if (user.role === UserRole.AGENT) return agentLinks;
    if (user.role === UserRole.PATIENT) return patientLinks;
    return clinicLinks;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <img 
            src="sage_healthy_rcm_logo.png" 
            alt="MySage" 
            className="h-12 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/200x60/ffffff/6D6E71?text=MySage";
            }}
          />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {getLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-secondary hover:bg-gray-100 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={isActive ? 'text-white' : 'text-primary'}>{link.icon}</div>
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl mb-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <UserCircle size={24} className="text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-primaryText truncate">{user.name}</p>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-tight truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="flex items-center space-x-3 w-full px-4 py-3 text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
