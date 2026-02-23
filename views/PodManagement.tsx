
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
  LayoutDashboard,
  TrendingUp,
  Activity,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  PlusCircle,
  Layout as LayoutIcon
} from 'lucide-react';
import { Pod, Clinic, ManagedUser } from '../types';

// Mock Data
const MOCK_CLINICS: Clinic[] = Array.from({ length: 20 }, (_, i) => ({
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

  // ✅ Add missing required fields (based on your Clinic type)
  medicarePtan: "",
  insuranceCredentials: [],
  systemAccess: [],

  providers: []
}));

const MOCK_USERS: ManagedUser[] = Array.from({ length: 15 }, (_, i) => ({
  id: `u-${i + 1}`,
  firstName: ['John', 'Jane', 'Alex', 'Sarah', 'Michael'][i % 5],
  lastName: ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][i % 5],
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' as any : i % 2 === 0 ? 'Management' as any : 'Agent' as any,
  department: ['Operations', 'Account Management', 'Billing', 'QA'][i % 4],
  status: 'Active',
  permissions: {}
}));

const MOCK_PODS: Pod[] = Array.from({ length: 10 }, (_, i) => ({
  id: `pod-${i + 1}`,
  name: `POD ${i + 1} - ${['Enterprise', 'Small Business', 'Regional', 'Specialty'][i % 4]}`,
  description: `Management group for ${['Enterprise', 'Small Business', 'Regional', 'Specialty'][i % 4]} clinics in the ${['Northeast', 'Southeast', 'Midwest', 'West'][i % 4]} sector.`,
  ownerId: `u-${(i % 5) + 1}`,
  clinicIds: MOCK_CLINICS.slice(i * 2, i * 2 + 3).map(c => c.id),
  userIds: MOCK_USERS.slice(i, i + 2).map(u => u.id),
  status: i === 8 ? 'Disabled' : i === 9 ? 'Archived' : 'Active',
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  organization: 'MySage Global',
  metadata: { 'Region': ['North', 'South', 'East', 'West'][i % 4], 'Priority': 'High' }
}));

const PodManagement: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>(MOCK_PODS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string, pod: Pod | null }>({ type: '', pod: null });
  const [isAddClinicsModalOpen, setIsAddClinicsModalOpen] = useState(false);
  const [isAssignUsersModalOpen, setIsAssignUsersModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [metricsAvailable, setMetricsAvailable] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredPods = pods.filter(pod => {
    const matchesSearch = pod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pod.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (pod: Pod) => {
    setSelectedPod(pod);
    setIsDrawerOpen(true);
    setActiveTab('Overview');
  };

  const handleAction = (type: string, pod: Pod) => {
    setConfirmAction({ type, pod });
    setIsConfirmModalOpen(true);
  };

  const executeAction = () => {
    showToast(`UI demo: POD ${confirmAction.type} action not persisted`);
    setIsConfirmModalOpen(false);
  };

  const handleSavePod = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("UI demo: changes not persisted");
    setIsModalOpen(false);
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
          <h1 className="text-3xl font-bold text-gray-900">POD Management</h1>
          
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center space-x-2 hover:scale-105 transition-transform font-bold"
        >
          <Plus size={20} />
          <span>Create POD</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by POD name..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[150px]">
            <option value="">All Owners</option>
            {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clinic Count:</span>
            <div className="flex items-center space-x-2">
              <input type="number" placeholder="Min" className="w-20 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold" />
              <span className="text-gray-300">-</span>
              <input type="number" placeholder="Max" className="w-20 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold" />
            </div>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
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
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">POD Name</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Owner</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest"># Clinics</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Updated At</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredPods.length > 0 ? filteredPods.map((pod) => (
              <tr 
                key={pod.id} 
                onClick={() => handleRowClick(pod)}
                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {pod.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{pod.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{pod.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2">
                    <UserCircle size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {MOCK_USERS.find(u => u.id === pod.ownerId)?.firstName} {MOCK_USERS.find(u => u.id === pod.ownerId)?.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">{pod.clinicIds.length}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(pod.status)}`}>
                    {pod.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock size={14} />
                    <span className="text-xs font-medium">{new Date(pod.updatedAt).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleAction('Archive', pod)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                    <button 
                      onClick={() => handleAction(pod.status === 'Active' ? 'Disable' : 'Enable', pod)}
                      className={`p-2 rounded-lg transition-all ${pod.status === 'Active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      title={pod.status === 'Active' ? 'Disable' : 'Enable'}
                    >
                      {pod.status === 'Active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button 
                      onClick={() => { setSelectedPod(pod); setIsModalOpen(true); }}
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
                      <AlertCircle size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">No PODs found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POD Detail Drawer */}
      {isDrawerOpen && selectedPod && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedPod.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPod.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedPod.status)}`}>
                      {selectedPod.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {selectedPod.id}</span>
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
              {['Overview', 'Clinics', 'Assigned Users', 'Activity Log', 'Metrics'].map((tab) => (
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</p>
                      <p className="text-sm font-bold text-gray-900">{selectedPod.organization || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Owner</p>
                      <div className="flex items-center space-x-2">
                        <UserCircle size={16} className="text-primary" />
                        <p className="text-sm font-bold text-gray-900">
                          {MOCK_USERS.find(u => u.id === selectedPod.ownerId)?.firstName} {MOCK_USERS.find(u => u.id === selectedPod.ownerId)?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-3xl">
                      {selectedPod.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedPod.metadata || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{key}</span>
                          <span className="text-xs font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Created: {new Date(selectedPod.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Updated: {new Date(selectedPod.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Clinics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Assigned Clinics ({selectedPod.clinicIds.length})</h3>
                    <button 
                      onClick={() => setIsAddClinicsModalOpen(true)}
                      className="text-primary hover:bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2"
                    >
                      <PlusCircle size={18} />
                      <span>Add Clinics</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedPod.clinicIds.map(cid => {
                      const clinic = MOCK_CLINICS.find(c => c.id === cid);
                      return (
                        <div key={cid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 border border-gray-100">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{clinic?.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{clinic?.city}, {clinic?.state}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => showToast("UI demo: clinic removal not persisted")}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {selectedPod.clinicIds.length === 0 && (
                      <div className="py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                        <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-bold text-gray-500">No clinics assigned to this POD</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Assigned Users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Assigned Users ({selectedPod.userIds.length})</h3>
                    <button 
                      onClick={() => setIsAssignUsersModalOpen(true)}
                      className="text-primary hover:bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2"
                    >
                      <PlusCircle size={18} />
                      <span>Assign Users</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedPod.userIds.map(uid => {
                          const user = MOCK_USERS.find(u => u.id === uid);
                          return (
                            <tr key={uid} className="group">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                  {user?.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => showToast("UI demo: user unassignment not persisted")}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Activity Log' && (
                <div className="space-y-8">
                  <h3 className="font-bold text-gray-900">Audit Timeline</h3>
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {[
                      { action: 'POD Created', actor: 'Admin User', time: '30 days ago', details: 'Initial setup' },
                      { action: 'Clinics Added', actor: 'System', time: '15 days ago', details: 'Added 3 clinics via bulk import', diff: '+3' },
                      { action: 'Owner Changed', actor: 'Admin User', time: '10 days ago', details: 'Transferred from u-5 to u-1', diff: 'u-5 → u-1' },
                      { action: 'Status Updated', actor: 'Jane Smith', time: '2 days ago', details: 'POD marked as Active', diff: 'Disabled → Active' }
                    ].map((log, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-white border-4 border-primary flex items-center justify-center z-10" />
                        <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-900">{log.action}</p>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{log.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">{log.details}</p>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2">
                              <UserCircle size={14} className="text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-600">{log.actor}</span>
                            </div>
                            {log.diff && (
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                                {log.diff}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Metrics' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Performance Overview</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-400">Live Data</span>
                      <button 
                        onClick={() => setMetricsAvailable(!metricsAvailable)}
                        className={`w-10 h-5 rounded-full transition-all relative ${metricsAvailable ? 'bg-primary' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${metricsAvailable ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {!metricsAvailable ? (
                    <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-300">
                        <TrendingUp size={32} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">Metrics Not Available Yet</p>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">Enable live data toggle or wait for the next reporting cycle to see POD performance.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                      {[
                        { label: 'Patient Volume', value: '1,284', icon: <Users className="text-blue-600" />, trend: '+12%' },
                        { label: 'Appointments', value: '452', icon: <Calendar className="text-amber-600" />, trend: '+5%' },
                        { label: 'Billing Total', value: '$142.5k', icon: <Activity className="text-emerald-600" />, trend: '+8%' },
                        { label: 'Active Clinics', value: '18/20', icon: <Building2 className="text-indigo-600" />, trend: '90%' }
                      ].map((metric, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="bg-gray-50 p-3 rounded-2xl">{metric.icon}</div>
                            <span className="text-[10px] font-bold text-primary tracking-wider">{metric.trend}</span>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{metric.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-8 border-t border-gray-100 flex items-center space-x-4">
              <button 
                onClick={() => { setIsDrawerOpen(false); setIsModalOpen(true); }}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
              >
                <Edit2 size={18} />
                <span>Edit POD</span>
              </button>
              <button 
                onClick={() => handleAction('Archive', selectedPod)}
                className="px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit POD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-900">{selectedPod ? 'Edit POD' : 'Create New POD'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSavePod} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">POD Name *</label>
                  <input 
                    required
                    type="text" 
                    defaultValue={selectedPod?.name}
                    placeholder="e.g. Northeast Regional POD"
                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Owner</label>
                  <select className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700">
                    <option value="">Select Owner...</option>
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.id} selected={selectedPod?.ownerId === u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  rows={3}
                  defaultValue={selectedPod?.description}
                  placeholder="Enter POD purpose and scope..."
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign Clinics</label>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 min-h-[100px] flex flex-wrap gap-2">
                  {selectedPod?.clinicIds.map(cid => (
                    <div key={cid} className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 flex items-center space-x-2 shadow-sm">
                      <span className="text-xs font-bold text-gray-700">{MOCK_CLINICS.find(c => c.id === cid)?.name}</span>
                      <button type="button" className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                    </div>
                  ))}
                  <button type="button" className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1">
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                  <div className="flex p-1 bg-gray-100 rounded-2xl">
                    {['Active', 'Disabled'].map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          (selectedPod?.status === s || (!selectedPod && s === 'Active')) ? 'bg-white text-primary shadow-sm' : 'text-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Organization</label>
                  <input 
                    type="text" 
                    defaultValue={selectedPod?.organization || 'MySage Global'}
                    className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {selectedPod ? 'Save Changes' : 'Create POD'}
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
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{confirmAction.type} POD?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirmAction.type.toLowerCase()} <strong>{confirmAction.pod?.name}</strong>? 
                This action can be reversed later by an administrator.
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

      {/* Add Clinics / Assign Users Modals (UI Only placeholders) */}
      {(isAddClinicsModalOpen || isAssignUsersModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddClinicsModalOpen(false); setIsAssignUsersModalOpen(false); }} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{isAddClinicsModalOpen ? 'Add Clinics to POD' : 'Assign Users to POD'}</h3>
              <button onClick={() => { setIsAddClinicsModalOpen(false); setIsAssignUsersModalOpen(false); }} className="text-gray-400 hover:text-gray-900"><X size={20}/></button>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={isAddClinicsModalOpen ? "Search clinics..." : "Search users..."}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none font-medium text-sm"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {(isAddClinicsModalOpen ? MOCK_CLINICS : MOCK_USERS).map((item: any) => (
                <label key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                      {isAddClinicsModalOpen ? <Building2 size={16}/> : <UserCircle size={16}/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{isAddClinicsModalOpen ? item.name : `${item.firstName} ${item.lastName}`}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{item.email}</p>
                    </div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary/20" />
                </label>
              ))}
            </div>
            <div className="pt-4 flex items-center space-x-4">
              <button 
                onClick={() => { showToast("UI demo: assignment not persisted"); setIsAddClinicsModalOpen(false); setIsAssignUsersModalOpen(false); }}
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20"
              >
                Confirm Selection
              </button>
              <button 
                onClick={() => { setIsAddClinicsModalOpen(false); setIsAssignUsersModalOpen(false); }}
                className="px-8 py-4 text-gray-500 font-bold"
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

export default PodManagement;
