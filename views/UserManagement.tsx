
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  X, 
  Building2, 
  UserCircle, 
  Clock, 
  ChevronRight,
  Archive,
  Ban,
  CheckCircle2,
  Shield,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  AlertCircle,
  Edit2,
  Trash2,
  Lock,
  Eye,
  Download,
  FileText,
  History,
  Layout
} from 'lucide-react';
import { ManagedUser, UserRole, Clinic, Pod } from '../types';

// Mock Data
const MOCK_CLINICS: Clinic[] = Array.from({ length: 10 }, (_, i) => ({
  id: `c-${i + 1}`,
  name: `Clinic ${i + 1} - ${['North', 'South', 'East', 'West'][i % 4]} Region`,
  portfolio: 'General',
  pod: `POD ${Math.floor(i / 5) + 1}`,
  street: `${100 + i} Main St`,
  city: 'New York',
  state: 'NY',
  zip: '10001',
  email: `clinic${i + 1}@example.com`,
  phone: `(555) 000-${1000 + i}`,
  fax: `(555) 000-${2000 + i}`,
  npi: `12345678${i.toString().padStart(2, '0')}`,
  taxId: `98-76543${i.toString().padStart(2, '0')}`,
  medicarePtan: '',
  medicaidId: "",   
  insuranceCredentials: [],
  systemAccess: [],
  providers: []
}));

const MOCK_PODS: Pod[] = Array.from({ length: 5 }, (_, i) => ({
  id: `pod-${i + 1}`,
  name: `POD ${i + 1} - ${['Enterprise', 'Small Business', 'Regional', 'Specialty'][i % 4]}`,
  description: `Management group ${i + 1}`,
  accountManagerId: `u-1`,
  clinicIds: [],
  userIds: [],
  status: 'Active',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
}));

const MODULES = [
  'Dashboard', 'Patient Records', 'Scheduling', 'Billing', 'QA', 
  'Front Desk', 'Provider Tools', 'Account Management', 'Admin Console', 'Messaging', 'Reports'
];

const ROLE_TEMPLATES: Record<string, Record<string, 'None' | 'Read' | 'Write' | 'Admin'>> = {
  'Admin': MODULES.reduce((acc, mod) => ({ ...acc, [mod]: 'Admin' }), {}),
  'Agent': MODULES.reduce((acc, mod) => ({ ...acc, [mod]: mod === 'QA' || mod === 'Reports' ? 'Read' : 'Write' }), {}),
  'Manager': MODULES.reduce((acc, mod) => ({ ...acc, [mod]: 'Write' }), {}),
  'Frontdesk': MODULES.reduce((acc, mod) => ({ ...acc, [mod]: ['Scheduling', 'Front Desk', 'Patient Records'].includes(mod) ? 'Write' : 'None' }), {}),
};

const MOCK_MANAGED_USERS: ManagedUser[] = Array.from({ length: 20 }, (_, i) => ({
  id: `u-${i + 1}`,
  firstName: ['John', 'Jane', 'Alex', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica'][i % 8],
  lastName: ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson'][i % 8],
  email: `${['john', 'jane', 'alex', 'sarah', 'michael', 'emily', 'david', 'jessica'][i % 8]}.${i + 1}@example.com`,
  role: [UserRole.ADMIN, UserRole.AGENT, UserRole.MANAGEMENT, UserRole.CLINIC_STAFF, UserRole.CLINIC][i % 5],
  department: ['Operations', 'EV', 'PA', 'QA', 'AR', 'Account Management', 'Billing', 'Provider', 'Charges & Payments', 'Front Desk'][i % 10],
  status: i === 15 ? 'Disabled' : i === 18 ? 'Archived' : 'Active',
  lastLogin: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  organization: 'MySage Global',
  clinicIds: i % 4 === 0 ? ['c-1', 'c-2'] : [],
  podIds: i % 3 === 0 ? ['pod-1'] : [],
  permissions: ROLE_TEMPLATES['Agent'],
  title: ['Senior Agent', 'Manager', 'Specialist', 'Coordinator'][i % 4],
  phone: `(555) 123-${4000 + i}`
}));

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(MOCK_MANAGED_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string, user: ManagedUser | null }>({ type: '', user: null });
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [userType, setUserType] = useState<UserRole>(UserRole.AGENT);
  const [department, setDepartment] = useState('');
  const [permissions, setPermissions] = useState<Record<string, any>>(ROLE_TEMPLATES['Agent']);

  const DEPT_TO_TEMPLATE: Record<string, string> = {
    'Operations': 'Admin',
    'EV': 'Agent',
    'PA': 'Agent',
    'QA': 'Agent',
    'AR': 'Agent',
    'Account Management': 'Manager',
    'Billing': 'Agent',
    'Provider': 'Agent',
    'Charges & Payments': 'Agent',
    'Front Desk': 'Frontdesk'
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRowClick = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setActiveTab('Overview');
  };

  const handleAction = (type: string, user: ManagedUser) => {
    setConfirmAction({ type, user });
    setIsConfirmModalOpen(true);
  };

  const executeAction = () => {
    showToast(`UI demo: User ${confirmAction.type} action not persisted`);
    setIsConfirmModalOpen(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("UI demo: changes not persisted");
    setIsModalOpen(false);
  };

  const applyTemplate = (templateName: string) => {
    if (ROLE_TEMPLATES[templateName]) {
      setPermissions(ROLE_TEMPLATES[templateName]);
      showToast(`Applied ${templateName} template`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'Disabled': return 'bg-amber-100 text-amber-700';
      case 'Archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="text-primary" />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => showToast("UI demo: Role Templates modal")}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center space-x-2"
          >
            <Shield size={18} />
            <span>Role Templates</span>
          </button>
          <button 
            onClick={() => { setSelectedUser(null); setUserType(UserRole.AGENT); setDepartment(''); setPermissions(ROLE_TEMPLATES['Agent']); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center space-x-2 hover:scale-105 transition-transform font-bold"
          >
            <Plus size={20} />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[150px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">User Type</option>
            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[150px]">
            <option value="">Department</option>
            {['Operations', 'EV', 'PA', 'QA', 'AR', 'Account Management', 'Billing', 'Provider', 'Charges & Payments', 'Front Desk'].map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            <select 
              className="px-4 py-2 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-700 border-none min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Archived">Archived</option>
            </select>
            <select className="px-4 py-2 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-700 border-none min-w-[120px]">
              <option value="">Location</option>
              {['New York', 'Los Angeles', 'Chicago', 'Miami', 'Remote'].map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setRoleFilter('All'); setStatusFilter('All'); }}
            className="px-4 py-2 text-primary hover:bg-primary/5 rounded-xl font-bold text-sm transition-colors flex items-center space-x-2"
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Type</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                onClick={() => handleRowClick(user)}
                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2">
                    <Shield size={14} className="text-primary" />
                    <span className="text-sm font-bold text-gray-700">{user.role}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-sm font-medium text-gray-500">{user.department}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock size={14} />
                    <span className="text-xs font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleAction('Archive', user)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                    <button 
                      onClick={() => handleAction(user.status === 'Active' ? 'Disable' : 'Enable', user)}
                      className={`p-2 rounded-lg transition-all ${user.status === 'Active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      title={user.status === 'Active' ? 'Disable' : 'Enable'}
                    >
                      {user.status === 'Active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button 
                      onClick={() => { setSelectedUser(user); setUserType(user.role); setDepartment(user.department); setPermissions(user.permissions); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Users size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">No users found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Drawer */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedUser.role} • {selectedUser.department}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-8">
              {['Overview', 'Permissions', 'Security & Audit'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-bold transition-all relative ${
                    activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'Overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Title</p>
                      <div className="flex items-center space-x-2">
                        <Briefcase size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{selectedUser.title || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</p>
                      <div className="flex items-center space-x-2">
                        <Building2 size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{selectedUser.organization || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Scoping & Access</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">Assigned Clinics</p>
                            <p className="text-xs text-gray-500">{selectedUser.clinicIds?.length || 0} clinics assigned</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Layout size={18} className="text-primary" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">Assigned PODs</p>
                            <p className="text-xs text-gray-500">{selectedUser.podIds?.length || 0} PODs assigned</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start space-x-4">
                    <AlertCircle className="text-blue-600 mt-1" size={20} />
                    <p className="text-sm text-blue-800 font-medium leading-relaxed">
                      Users are scoped by organization, clinic, or provider. This enforcement is handled server-side, but the UI reflects current scoping rules.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'Permissions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Module Permissions Matrix</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Applied Template: {selectedUser.role}</span>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Access Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {MODULES.map(mod => (
                          <tr key={mod}>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{mod}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                selectedUser.permissions[mod] === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                                selectedUser.permissions[mod] === 'Write' ? 'bg-emerald-100 text-emerald-700' :
                                selectedUser.permissions[mod] === 'Read' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {selectedUser.permissions[mod] || 'None'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Security & Audit' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Login History</h3>
                      <button className="text-primary text-xs font-bold hover:underline flex items-center space-x-1">
                        <Download size={14} />
                        <span>Export Logs</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { event: 'Login Success', time: '2 hours ago', ip: '192.168.1.45', device: 'Chrome / macOS' },
                        { event: 'Login Success', time: '1 day ago', ip: '192.168.1.45', device: 'Chrome / macOS' },
                        { event: 'Login Failed', time: '3 days ago', ip: '45.12.89.2', device: 'Safari / iOS', status: 'fail' }
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'fail' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              <Lock size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{log.event}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{log.device} • {log.ip}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Sensitive Actions</h3>
                    <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {[
                        { action: 'Role Changed', actor: 'Admin User', time: '10 days ago', details: 'Agent → Management' },
                        { action: 'Permissions Modified', actor: 'Admin User', time: '10 days ago', details: 'Added Billing Write access' },
                        { action: 'Account Enabled', actor: 'System', time: '30 days ago', details: 'Initial onboarding' }
                      ].map((action, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-white border-4 border-primary flex items-center justify-center z-10" />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-gray-900">{action.action}</p>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{action.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{action.details}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">By: {action.actor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-8 border-t border-gray-100 flex items-center space-x-4">
              <button 
                onClick={() => { setIsDrawerOpen(false); setUserType(selectedUser.role); setDepartment(selectedUser.department); setPermissions(selectedUser.permissions); setIsModalOpen(true); }}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
              >
                <Edit2 size={18} />
                <span>Edit User</span>
              </button>
              <button 
                onClick={() => handleAction('Archive', selectedUser)}
                className="px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-8 pb-8 px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[calc(100svh-4rem)] overflow-y-auto bg-white rounded-[40px] shadow-2xl">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-900">{selectedUser ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-10">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <UserCircle className="text-primary" size={20} />
                  <span>Basic Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">First Name *</label>
                    <input required type="text" defaultValue={selectedUser?.firstName} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Name *</label>
                    <input required type="text" defaultValue={selectedUser?.lastName} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address *</label>
                    <input required type="email" defaultValue={selectedUser?.email} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input type="tel" defaultValue={selectedUser?.phone} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                  </div>
                </div>
              </div>

              {/* Role & Department */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Briefcase className="text-primary" size={20} />
                  <span>Role & Scoping</span>
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Type *</label>
                    <select 
                      required 
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as UserRole)}
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                    >
                      {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Department *</label>
                    <select 
                      required 
                      value={department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setDepartment(newDept);
                        if (DEPT_TO_TEMPLATE[newDept]) {
                          applyTemplate(DEPT_TO_TEMPLATE[newDept]);
                        }
                      }}
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                    >
                      <option value="">Select Department...</option>
                      {['Operations', 'EV', 'PA', 'QA', 'AR', 'Account Management', 'Billing', 'Provider', 'Charges & Payments', 'Front Desk'].map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                </div>

                {/* Conditional Sections */}
                {userType === UserRole.CLINIC && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center space-x-2">
                      <Building2 size={16} />
                      <span>Provider Credentials</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Provider ID (NPI)" className="px-4 py-2 bg-white rounded-xl outline-none text-sm font-bold" />
                      <input placeholder="Credentials (MD, PT, etc.)" className="px-4 py-2 bg-white rounded-xl outline-none text-sm font-bold" />
                    </div>
                  </div>
                )}

                {(userType === UserRole.CLINIC_STAFF) && (
                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
                      <Building2 size={16} />
                      <span>Clinic Assignment</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <select className="px-4 py-2 bg-white rounded-xl outline-none text-sm font-bold">
                        <option>Select Primary Clinic...</option>
                        {MOCK_CLINICS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl">
                        <input type="checkbox" id="active-session" className="rounded text-primary" />
                        <label htmlFor="active-session" className="text-xs font-bold text-gray-600">Active clinic per session</label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                    <span>POD Assignment</span>
                    <div className="group relative">
                      <AlertCircle size={12} className="text-gray-300 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                        Assigning POD grants access to all clinics inside it (UI only)
                      </div>
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    {MOCK_PODS.map(pod => (
                      <label key={pod.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 cursor-pointer hover:border-primary transition-all">
                        <input type="checkbox" className="rounded text-primary" defaultChecked={selectedUser?.podIds?.includes(pod.id)} />
                        <span className="text-xs font-bold text-gray-700">{pod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Shield className="text-primary" size={20} />
                    <span>Permissions Matrix</span>
                  </h3>
                </div>
                
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module</th>
                        {['None', 'Read', 'Write', 'Admin'].map(level => (
                          <th key={level} className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{level}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MODULES.map(mod => (
                        <tr key={mod}>
                          <td className="px-6 py-4 text-sm font-bold text-gray-700">{mod}</td>
                          {['None', 'Read', 'Write', 'Admin'].map(level => (
                            <td key={level} className="px-6 py-4 text-center">
                              <input 
                                type="radio" 
                                name={`perm-${mod}`} 
                                checked={permissions[mod] === level}
                                onChange={() => setPermissions({ ...permissions, [mod]: level })}
                                className="w-4 h-4 text-primary focus:ring-primary/20" 
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 text-gray-500 font-bold hover:text-gray-900 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)} />
          <div className="relative w-full max-md bg-white rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{confirmAction.type} User?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirmAction.type.toLowerCase()} <strong>{confirmAction.user?.firstName} {confirmAction.user?.lastName}</strong>? 
                This will restrict their access to the platform.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={executeAction}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
              >
                Confirm
              </button>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
