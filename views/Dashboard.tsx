
import React from 'react';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Search, Clock, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Welcome back!</h1>
          <p className="text-secondary mt-2 text-lg font-medium">Overview of your {role.toLowerCase()} workspace.</p>
        </div>
        <button 
          onClick={() => navigate('/intake')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
        >
          <FilePlus size={20} />
          <span>Select Intake</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'My Pending Items', value: '12', icon: <Clock className="text-accent" />, sub: 'Awaiting information' },
          { label: 'Completed Today', value: '08', icon: <CheckCircle2 className="text-primary" />, sub: 'Processed successfully' },
          { label: 'Attention Needed', value: '02', icon: <Search className="text-secondary" />, sub: 'Failed verification' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl">{item.icon}</div>
              <div className="text-right">
                <p className="text-4xl font-black text-primaryText">{item.value}</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-primaryText">{item.label}</h3>
            <p className="text-secondary text-sm font-medium mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
        <h2 className="text-2xl font-bold text-primaryText mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-3xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">JD</div>
                <div>
                  <p className="font-bold text-primaryText">Patient Entry (Eligibility Verification)</p>
                  <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-0.5">Reference: SAGE-992{i}</p>
                </div>
              </div>
              <div className="text-right flex items-center space-x-6">
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-primaryText">Payer Network</p>
                  <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">Provider Portal</p>
                </div>
                <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest">Pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
