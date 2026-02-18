
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, ArrowDownAz, Calendar, Download, Building2 } from 'lucide-react';
import { MOCK_SUBMISSIONS } from '../constants';

const MySubmissionsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('All Clinics');

  const clinics = useMemo(() => {
    const list = Array.from(new Set(MOCK_SUBMISSIONS.map(s => s.clinicName))).filter(Boolean) as string[];
    return ['All Clinics', ...list];
  }, []);

  const filteredSubmissions = useMemo(() => {
    return MOCK_SUBMISSIONS.filter(sub => {
      const matchesSearch = sub.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || sub.refNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
      const matchesClinic = selectedClinic === 'All Clinics' || sub.clinicName === selectedClinic;
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && sub.dateSubmitted >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && sub.dateSubmitted <= endDate;
      }

      return matchesSearch && matchesStatus && matchesClinic && matchesDate;
    }).sort((a, b) => (a.status === 'Pending' ? -1 : 1));
  }, [searchTerm, filterStatus, selectedClinic, startDate, endDate]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Action Required': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Submissions</h1>
          {/* <p className="text-gray-500">Track and manage intake workflows for your clinic network.</p> */}
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              placeholder="Search patient name or reference number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium" 
            />
          </div>
          
          <div className="md:col-span-3 flex items-center bg-gray-50 rounded-2xl px-4 py-3">
             <Building2 className="text-gray-400 mr-3" size={18} />
             <select 
              value={selectedClinic}
              onChange={e => setSelectedClinic(e.target.value)}
              className="bg-transparent border-none outline-none w-full font-bold text-sm text-primaryText appearance-none"
             >
               {clinics.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          <div className="md:col-span-4 flex items-center space-x-2 bg-gray-50 rounded-2xl px-4 py-1">
             <Calendar className="text-gray-400" size={18} />
             <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-primaryText" 
             />
             <span className="text-gray-400 font-bold">to</span>
             <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-primaryText" 
             />
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl w-fit">
          {['All', 'Pending', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Reference #</th>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Patient Name</th>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Workflow</th>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Clinic</th>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Submitted</th>
              <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Status</th>
              <th className="px-10 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-primary/[0.02] transition-colors group cursor-pointer">
                <td className="px-10 py-7 font-mono font-bold text-primary">{sub.refNumber}</td>
                <td className="px-10 py-7 font-black text-primaryText text-lg">{sub.patientName}</td>
                <td className="px-10 py-7 text-sm font-bold text-secondary">{sub.workflow}</td>
                <td className="px-10 py-7 text-sm font-bold text-primaryText">{sub.clinicName}</td>
                <td className="px-10 py-7 text-sm font-bold text-secondary">{sub.dateSubmitted}</td>
                <td className="px-10 py-7">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusStyle(sub.status)}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-10 py-7 text-right">
                  <button className="p-2 text-secondary hover:text-primary transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubmissions.length === 0 && (
          <div className="py-32 text-center space-y-4">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Search size={32} />
            </div>
            <p className="text-secondary font-bold text-lg">No matching submissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubmissionsView;
