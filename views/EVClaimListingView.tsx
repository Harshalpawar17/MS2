
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  ChevronRight, 
  Building2, 
  ArrowUpDown, 
  X,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_EV_RECORDS } from '../constants';
import { EVRecord, EVStatus } from '../types';

const STATUS_PRIORITY: Record<EVStatus, number> = {
  'Pending': 1,
  'Action Required': 2,
  'Authorized': 3,
  'Completed': 4,
  'Denied': 5,
  'Closed': 6
};

const EVClaimListingView: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EVStatus | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<keyof EVRecord>('ev_status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof EVRecord) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    let result = MOCK_EV_RECORDS.filter(record => {
      const matchesSearch = 
        record.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.insurance_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || record.ev_status === statusFilter;
      
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && record.submitted_date >= startDate;
      if (endDate) matchesDate = matchesDate && record.submitted_date <= endDate;

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Default Sorting Logic: ev_status (priority), then insurance_order (asc), then clinic_name (asc)
    if (sortField === 'ev_status' && sortOrder === 'asc') {
      result.sort((a, b) => {
        const priorityA = STATUS_PRIORITY[a.ev_status];
        const priorityB = STATUS_PRIORITY[b.ev_status];
        if (priorityA !== priorityB) return priorityA - priorityB;
        if (a.insurance_order !== b.insurance_order) return a.insurance_order - b.insurance_order;
        return a.clinic_name.localeCompare(b.clinic_name);
      });
    } else {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return result;
  }, [searchTerm, statusFilter, startDate, endDate, sortField, sortOrder]);

  const getStatusStyle = (status: EVStatus) => {
    switch (status) {
      case 'Pending': return 'bg-blue-100 text-blue-700';
      case 'Action Required': return 'bg-amber-100 text-amber-700';
      case 'Authorized': return 'bg-emerald-100 text-emerald-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Denied': return 'bg-red-100 text-red-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = searchTerm !== '' || statusFilter !== 'All' || startDate !== '' || endDate !== '';

  const handleRowClick = (id: string) => {
    navigate(`/ev-claims/${id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-primaryText tracking-tight">Insurance Verification Cases</h1>
        
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-2">Quick Search</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                placeholder="ID, Clinic, or Payer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-transparent rounded-[24px] focus:ring-2 focus:ring-primary outline-none font-bold text-primaryText" 
              />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-2">Status</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[24px] outline-none font-bold text-primaryText appearance-none"
            >
              <option value="All">All Statuses</option>
              {Object.keys(STATUS_PRIORITY).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-2">Submitted Date Range</label>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-[24px] px-5 py-4">
              <Calendar className="text-gray-400 shrink-0" size={20} />
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs w-full text-primaryText" 
              />
              <span className="text-gray-400 font-bold">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs w-full text-primaryText" 
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center flex-wrap gap-2 pt-2">
            {searchTerm && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase flex items-center space-x-1"><span>Search: {searchTerm}</span><X size={12} className="cursor-pointer" onClick={() => setSearchTerm('')} /></span>}
            {statusFilter !== 'All' && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase flex items-center space-x-1"><span>Status: {statusFilter}</span><X size={12} className="cursor-pointer" onClick={() => setStatusFilter('All')} /></span>}
            <button onClick={clearFilters} className="text-[10px] font-black text-secondary uppercase hover:underline ml-2">Clear all</button>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-50 rounded-[32px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Submitted Date</th>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer"
                  onClick={() => handleSort('unique_id')}
                >
                  <div className="flex items-center space-x-1"><span>Unique ID</span><ArrowUpDown size={12}/></div>
                </th>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer"
                  onClick={() => handleSort('clinic_name')}
                >
                  <div className="flex items-center space-x-1"><span>Clinic Name</span><ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Requested Back Date</th>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer"
                  onClick={() => handleSort('insurance_name')}
                >
                  <div className="flex items-center space-x-1"><span>Insurance Name</span><ArrowUpDown size={12}/></div>
                </th>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer"
                  onClick={() => handleSort('insurance_order')}
                >
                  <div className="flex items-center space-x-1"><span>Order</span><ArrowUpDown size={12}/></div>
                </th>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer"
                  onClick={() => handleSort('ev_status')}
                >
                  <div className="flex items-center space-x-1"><span>Status of EV</span><ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSortedRecords.map((record) => (
                <tr key={record.unique_id} className="hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => handleRowClick(record.unique_id)}>
                  <td className="px-6 py-6 font-bold text-secondary">{record.submitted_date}</td>
                  <td className="px-6 py-6">
                    <button 
                      className="font-mono font-bold text-primary hover:underline"
                      onClick={(e) => { e.stopPropagation(); handleRowClick(record.unique_id); }}
                    >
                      {record.unique_id}
                    </button>
                  </td>
                  <td className="px-6 py-6">
                    <button 
                      className="font-black text-primaryText text-base hover:text-primary transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleRowClick(record.unique_id); }}
                    >
                      {record.clinic_name}
                    </button>
                  </td>
                  <td className="px-6 py-6 font-bold text-secondary">{record.requested_back_date}</td>
                  <td className="px-6 py-6 font-bold text-primaryText">{record.insurance_name}</td>
                  <td className="px-6 py-6 font-bold text-secondary">#{record.insurance_order}</td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusStyle(record.ev_status)}`}>
                      {record.ev_status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="bg-gray-50 w-10 h-10 rounded-xl flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={18} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EVClaimListingView;
