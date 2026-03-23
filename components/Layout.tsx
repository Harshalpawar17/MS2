

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
  Layout as LayoutIcon
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
    { to: '/clinic/config', icon: <Settings size={20} />, label: 'Insurance Verification Intake Configuration' },
  ];

  const adminLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Admin Metrics' },
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

  // For Patients, we use a different layout entirely
  if (user.role === UserRole.PATIENT) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-4">
            <img 
              src="without leaf.png" 
              alt="MySage" 
              className="h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/100x40/ffffff/6D6E71?text=MySage";
              }}
            />
            <div className="h-6 w-px bg-gray-200"></div>
            <span className="text-secondary font-bold text-sm">Patient Portal</span>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="flex items-center space-x-2 text-secondary hover:text-red-600 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </header>
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  const getLinks = () => {
    if (user.role === UserRole.ADMIN) return adminLinks;
    
    if (user.role === UserRole.AGENT) return agentLinks;
    return clinicLinks;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <img 
            src="without leaf.png" 
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


// import React from 'react';
// import { Outlet, NavLink, useNavigate } from 'react-router-dom';
// import { 
//   LayoutDashboard, 
//   FilePlus, 
//   ListTodo, 
//   Settings, 
//   LogOut, 
//   Building2, 
//   UserCircle,
//   ClipboardList,
//   Scale,
//   ShieldCheck,
//   Users,
  
//   Bell,
//   ArrowLeft,
//   Cpu,
//   FileText,
//   Gavel,
//   Layout as LayoutIcon
// } from 'lucide-react';
// import { User, UserRole } from '../types';

// interface LayoutProps {
//   user: User;
//   onLogout: () => void;
// }

// const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
//   const navigate = useNavigate();

//   const handleLogoutClick = () => {
//     onLogout();
//     navigate('/');
//   };

//   const clinicLinks = [
//     { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
//     { to: '/intake', icon: <FilePlus size={20} />, label: 'Select Intake' },
//     { to: '/submissions', icon: <ClipboardList size={20} />, label: 'My Submissions' },
    
//   ];

//   const adminLinks = [
//     { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
//     { to: '/admin/add-clinic', icon: <Building2 size={20} />, label: 'Add Clinic' },
//     { to: "/admin/ClinicIntakeConfig", icon: <Cpu size={20} />, label: "EV Configuration" },
//     { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
//     { to: '/admin/pods', icon: <LayoutIcon size={20} />, label: 'POD Management' },
//     //{ to: '/intake', icon: <Settings size={20} />, label: 'Select Intake' },
//     { to: "/admin/rule-engine", icon: <Gavel size={20} />, label: "Rule Engine" },
//     { to: "/admin/workflow-engine", icon: <ClipboardList size={20} />, label: "Workflow Engine" },
    
//   ];

//   const agentLinks = [
//     { to: '/', icon: <ListTodo size={20} />, label: 'Queue' },
//     { to: '/agent', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
//     { to: '/agent/work-list', icon: <ClipboardList size={20} />, label: 'Work List' },
//   ];

//   const patientLinks = [
//     { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
//     { to: '/agent/work-list', icon: <ClipboardList size={20} />, label: 'Work List' },
    
//   ];

//   const getLinks = () => {
//     if (user.role === UserRole.ADMIN) return adminLinks;
//     if (user.role === UserRole.AGENT) return agentLinks;
//     if (user.role === UserRole.PATIENT) return patientLinks;
//     return clinicLinks;
//   };

//   return (
//     <div className="flex h-screen overflow-hidden bg-gray-50">
//       <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
//         <div className="p-6 border-b border-gray-100 flex items-center justify-center">
//           <img 
//             src="sage_healthy_rcm_logo.png" 
//             alt="MySage" 
//             className="h-12 object-contain"
//             onError={(e) => {
//               (e.target as HTMLImageElement).src = "https://placehold.co/200x60/ffffff/6D6E71?text=MySage";
//             }}
//           />
//         </div>

//         <nav className="flex-1 p-4 space-y-1">
//           {getLinks().map((link) => (
//             <NavLink
//               key={link.to}
//               to={link.to}
//               className={({ isActive }) => 
//                 `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
//                   isActive 
//                     ? 'bg-primary text-white shadow-lg shadow-primary/20' 
//                     : 'text-secondary hover:bg-gray-100 font-medium'
//                 }`
//               }
//             >
//               {({ isActive }) => (
//                 <>
//                   <div className={isActive ? 'text-white' : 'text-primary'}>{link.icon}</div>
//                   <span>{link.label}</span>
//                 </>
//               )}
//             </NavLink>
//           ))}
//         </nav>

//         <div className="p-4 border-t border-gray-100">
//           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl mb-3">
//             <div className="bg-primary/10 p-2 rounded-xl">
//               <UserCircle size={24} className="text-primary" />
//             </div>
//             <div className="flex-1 overflow-hidden">
//               <p className="text-sm font-bold text-primaryText truncate">{user.name}</p>
//               <p className="text-[10px] font-bold text-secondary uppercase tracking-tight truncate">{user.role}</p>
//             </div>
//           </div>
//           <button 
//             onClick={handleLogoutClick}
//             className="flex items-center space-x-3 w-full px-4 py-3 text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
//           >
//             <LogOut size={20} />
//             <span>Logout</span>
//           </button>
//         </div>
//       </aside>

//       <main className="flex-1 overflow-y-auto">
//         <div className="max-w-7xl mx-auto p-10">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Layout;
