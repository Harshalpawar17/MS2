
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Download, 
  Building2, 
  Scale, 
  Clock, 
  User, 
  Briefcase,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ArrowUpDown
} from 'lucide-react';
import { MOCK_CLAIMS } from '../constants';
import { UserRole, Claim } from '../types';

interface WCPIClaimsListingViewProps {
  userRole: UserRole;
}

const WCPIClaimsListingView: React.FC<WCPIClaimsListingViewProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Claim>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const statuses = ['Open', 'Pending Info', 'Authorized', 'Denied', 'Closed'];
  const types = ['WorkerComp', 'PersonalInjury'];

  const handleSort = (field: keyof Claim) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredClaims = useMemo(() => {
    return MOCK_CLAIMS.filter(claim => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        claim.claim_id.toLowerCase().includes(search) ||
        claim.patient_name.toLowerCase().includes(search) ||
        claim.insurer_or_third_party.toLowerCase().includes(search) ||
        claim.policy_or_claim_number.toLowerCase().includes(search);
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(claim.status);
      const matchesType = typeFilter.length === 0 || typeFilter.includes(claim.claim_type);

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchTerm, statusFilter, typeFilter, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700';
      case 'Authorized': return 'bg-emerald-100 text-emerald-700';
      case 'Denied': return 'bg-red-100 text-red-700';
      case 'Pending Info': return 'bg-amber-100 text-amber-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const paginatedClaims = filteredClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primaryText tracking-tight flex items-center space-x-3">
            <Scale className="text-primary" size={36} />
            <span>PI Cases Listing</span>
          </h1>
          
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
            <Download size={18} />
            <span>Export Cases</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
              placeholder="Search Case ID, Patient, Insurer, or Policy #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border-transparent rounded-[24px] focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-primaryText" 
            />
          </div>
          <div className="lg:col-span-3">
            <select 
              className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[24px] outline-none font-bold text-primaryText appearance-none"
              onChange={e => setTypeFilter(e.target.value === 'All Types' ? [] : [e.target.value])}
            >
              <option>All Types</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="lg:col-span-3">
            <select 
              className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[24px] outline-none font-bold text-primaryText appearance-none"
              onChange={e => setStatusFilter(e.target.value === 'All Statuses' ? [] : [e.target.value])}
            >
              <option>All Statuses</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-50 rounded-[32px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer" onClick={() => handleSort('claim_id')}>
                  <div className="flex items-center space-x-1"><span>Case ID</span><ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer" onClick={() => handleSort('patient_name')}>
                  <div className="flex items-center space-x-1"><span>Patient</span><ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Type</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Insurer / #</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Injury Date</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest text-right">Case Total</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedClaims.map((claim) => (
                <tr key={claim.claim_id} className="hover:bg-primary/[0.02] transition-colors group cursor-pointer">
                  <td className="px-6 py-6 font-mono font-bold text-primary">{claim.claim_id}</td>
                  <td className="px-6 py-6 font-black text-primaryText text-base">{claim.patient_name}</td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${claim.claim_type === 'WorkerComp' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                      {claim.claim_type}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-0.5">
                      <p className="font-bold text-primaryText">{claim.insurer_or_third_party}</p>
                      <p className="text-[10px] font-bold text-secondary uppercase">{claim.policy_or_claim_number}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-secondary font-bold">{claim.date_of_injury}</td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusBadge(claim.status)}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right font-black text-primaryText">
                    ${claim.case_total.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="p-2 text-secondary hover:text-primary transition-colors"><ChevronRight size={20}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-gray-50">
          <div className="text-sm font-bold text-secondary">
            Showing <span className="text-primaryText">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredClaims.length)}</span> of <span className="text-primaryText">{filteredClaims.length}</span> records
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
             <div className="flex items-center space-x-2">
               <span className="text-xs font-bold text-secondary">Records per page:</span>
               <select 
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-gray-50 border-none outline-none font-bold text-xs p-1.5 rounded-lg"
               >
                 <option value={25}>25</option>
                 <option value={50}>50</option>
                 <option value={100}>100</option>
               </select>
             </div>
             <div className="flex items-center space-x-2">
               <button className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-secondary hover:bg-gray-100 disabled:opacity-50">Prev</button>
               <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">Next</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WCPIClaimsListingView;
