
import React from 'react';
import { Building2, FileCheck, ClipboardList, TrendingUp, Users, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Active Clinics', value: '42', icon: <Building2 className="text-blue-600" />, change: '+3 this month' },
    { label: 'Pending EV Responses', value: '128', icon: <FileCheck className="text-amber-600" />, change: '-12% vs last week' },
    { label: 'Pending Prior Auths', value: '54', icon: <ClipboardList className="text-indigo-600" />, change: 'SLA At Risk: 4' },
    { label: 'Platform Users', value: '1,204', icon: <Users className="text-emerald-600" />, change: '92% Active' },
  ];

  const chartData = [
    { name: 'Mon', EV: 40, PA: 24, PI: 10 },
    { name: 'Tue', EV: 30, PA: 13, PI: 15 },
    { name: 'Wed', EV: 20, PA: 98, PI: 20 },
    { name: 'Thu', EV: 27, PA: 39, PI: 12 },
    { name: 'Fri', EV: 18, PA: 48, PI: 18 },
    { name: 'Sat', EV: 23, PA: 38, PI: 5 },
    { name: 'Sun', EV: 34, PA: 43, PI: 3 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-gray-50 p-3 rounded-2xl">{stat.icon}</div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-gray-900">Weekly Throughput</h3>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div><span className="text-xs font-bold text-gray-500">EV</span></div>
               <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div><span className="text-xs font-bold text-gray-500">PA</span></div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="EV" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="PA" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold text-xl text-gray-900">Recent Alerts</h3>
          <div className="space-y-4">
            {[
              { type: 'delay', msg: 'Elite Ortho PA #8271 delayed (24h+)', time: '2m ago' },
              { type: 'new', msg: 'New Clinic "Sunshine Rehab" added', time: '1h ago' },
              { type: 'error', msg: 'Aetna API Integration timeout (3)', time: '3h ago' },
              { type: 'delay', msg: 'EV Worklist exceeded Pod C capacity', time: '5h ago' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'delay' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{alert.msg}</p>
                  <div className="flex items-center space-x-1 mt-1 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors rounded-2xl">View All Notifications</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
