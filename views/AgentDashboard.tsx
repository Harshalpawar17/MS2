
import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'My Work List', value: '24', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Completed Today', value: '12', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pending Review', value: '8', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Urgent Tasks', value: '4', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your current workload.</p>
        </div>
        <button 
          onClick={() => navigate('/agent/work-list')}
          className="bg-primary text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center space-x-2 hover:scale-105 transition-transform font-bold"
        >
          <ClipboardList size={20} />
          <span>Go to Work List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Users size={20} className="text-primary" />
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">EV Completed for John Doe</p>
                  <p className="text-xs text-gray-400">2 hours ago • Eligibility Verification</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Success</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <AlertCircle size={20} className="text-amber-500" />
            <span>Urgent Notifications</span>
          </h2>
          <div className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">PA Expiring Soon: Jane Smith</p>
                  <p className="text-xs text-amber-600">Due in 4 hours • Prior Authorization</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
