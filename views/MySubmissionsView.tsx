// MySubmissionsView.tsx 2026

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Calendar, 
  Building2, 
  Scale, 
  ShieldCheck, 
  ArrowUpDown, 
  AlertCircle,
  Filter,
  FileText,
  Download,
  Eye,
  CheckCircle
} from 'lucide-react';
import { MOCK_EV_RECORDS, MOCK_CLAIMS } from '../constants';
import { EVRecord, Claim, UserRole, SubmissionStatus } from '../types';

interface MySubmissionsViewProps {
  userRole: UserRole;
}

const MySubmissionsView: React.FC<MySubmissionsViewProps> = ({ userRole }) => {
  const [activeType, setActiveType] = useState<'All' | 'EV' | 'WC/PI' | 'DOC'>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState<string | null>(null);
  const [downloadConfirmed, setDownloadConfirmed] = useState(false);

  const statuses = [
    'All', 'Pending', 'Data Entry', 'Quality Control', 
    'Escalated to Account Management', 'Clinic Action Required', 'Completed'
  ];

  const sortedAndFiltered = useMemo(() => {
    const combined = [
      ...MOCK_EV_RECORDS.map(r => ({ ...r, type: 'EV', patient_name: 'Patient Name Loading...', id: r.unique_id })),
      ...MOCK_CLAIMS.map(c => ({ ...c, type: 'WC/PI', id: c.claim_id })),
      {
        id: 'DOC-00001',
        patient_name: 'Robert Wilson',
        type: 'DOC',
        status: 'Pending',
        date_received: '05/14/2025',
        ehr_number: 'EHR-7721',
        provider_taxonomy: 'PT',
        benefits: {
          copay: '$30',
          coinsurance: '15%',
          deductible_applies: true,
          visit_limit: '20 visits',
          auth_required: false
        }
      },
      {
        id: 'DOC-00002',
        patient_name: 'Emma Thompson',
        type: 'DOC',
        status: 'Clinic Action Required',
        date_received: '05/15/2025',
        ehr_number: 'EHR-1122',
        provider_taxonomy: 'Chiro',
        benefits: {
          copay: '$25',
          coinsurance: '10%',
          deductible_applies: false,
          visit_limit: 'Unlimited',
          auth_required: true
        }
      }
    ];

    return combined
      .filter(item => {
        if (focusedId) return item.id === focusedId;
        const typeMatch = activeType === 'All' || item.type === activeType;
        const statusMatch = activeStatus === 'All' || (item as any).status === activeStatus || (item as any).ev_status === activeStatus;
        return typeMatch && statusMatch;
      })
      .sort((a, b) => {
        const nameA = a.patient_name.toLowerCase();
        const nameB = b.patient_name.toLowerCase();
        if (sortOrder === 'asc') return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
      });
  }, [activeType, activeStatus, sortOrder]);

  const clinicActions = sortedAndFiltered.filter(item => 
    (item as any).status === 'Clinic Action Required' || (item as any).ev_status === 'Clinic Action Required'
  );

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Clinic Action Required': return 'bg-red-100 text-red-700 border-red-200';
      case 'Escalated to Account Management': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Quality Control': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Data Entry': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primaryText tracking-tight">Case Management</h1>
        </div>

        {/* Pinned Clinic Actions Section - Moved to top-right */}
        {clinicActions.length > 0 && (
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 max-w-md animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center space-x-2">
                <AlertCircle size={14} />
                <span>Clinic Actions Required ({clinicActions.length})</span>
              </h2>
            </div>
            <div className="space-y-2">
              {clinicActions.slice(0, 2).map(action => (
                <div key={action.id} className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-primaryText truncate max-w-[120px]">{action.patient_name}</p>
                      <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{action.type} • {action.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setFocusedId(action.id);
                      setExpandedId(action.id);
                      // Scroll to table
                      document.getElementById('submissions-list')?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="bg-white px-3 py-1.5 rounded-lg text-[9px] font-black text-red-600 border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all whitespace-nowrap"
                  >
                    View Action
                  </button>
                </div>
              ))}
              {clinicActions.length > 2 && (
                <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest pt-1">
                  + {clinicActions.length - 2} more actions
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submissions List Section */}
      <section id="submissions-list" className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50 pb-8">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {['All', 'EV', 'WC/PI', 'DOC'].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveType(t as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primaryText'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <select 
              value={activeStatus}
              onChange={e => { setActiveStatus(e.target.value); setFocusedId(null); }}
              className="bg-gray-50 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary outline-none ring-1 ring-gray-100"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {focusedId && (
              <button 
                onClick={() => setFocusedId(null)}
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                Clear Focus
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-secondary">
             <Filter size={14} />
             <span>Showing {sortedAndFiltered.length} Cases</span>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th 
                  className="px-6 py-5 font-bold text-secondary uppercase tracking-widest cursor-pointer group"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Patient Name</span>
                    <ArrowUpDown size={12} className="group-hover:text-primary transition-colors" />
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Case ID</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Type</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 font-bold text-secondary uppercase tracking-widest text-right">Submitted</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedAndFiltered.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    onClick={() => toggleAccordion(item.id)}
                    className={`hover:bg-primary/[0.02] transition-all group cursor-pointer ${expandedId === item.id ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <td className="px-6 py-6 font-black text-primaryText text-base">{item.patient_name}</td>
                    <td className="px-6 py-6 font-mono font-bold text-primary">{item.id}</td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${item.type === 'EV' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyle((item as any).status || (item as any).ev_status)}`}>
                        {(item as any).status || (item as any).ev_status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-secondary">
                      {(item as any).date_received || (item as any).submitted_date}
                    </td>
                    <td className="px-6 py-6 text-right">
                      {expandedId === item.id ? <ChevronDown size={20} className="text-primary"/> : <ChevronRight size={20} className="text-gray-300 group-hover:text-primary"/>}
                    </td>
                  </tr>
                  
                  {/* Accordion Detail Row */}
                  {expandedId === item.id && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={6} className="px-12 py-8 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 relative">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Case Information */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest border-b border-gray-50 pb-2">Case Information</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Verified Specialty</p>
                                  <p className="text-xs font-black text-primaryText">{(item as any).provider_taxonomy === 'Chiro' ? 'Chiropractic' : 'Physical Therapy'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">EHR Number</p>
                                  <p className="text-xs font-black text-primary">{(item as any).ehr_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Assigned Pod</p>
                                  <p className="text-xs font-black text-primaryText">Pod A</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Assigned Agent</p>
                                  <p className="text-xs font-black text-primaryText">Agent Smith</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Status</p>
                                  <p className="text-xs font-black text-primaryText">{(item as any).status || (item as any).ev_status}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Submitted Date</p>
                                  <p className="text-xs font-black text-primaryText">{(item as any).date_received || (item as any).submitted_date}</p>
                                </div>
                              </div>
                            </div>

                            {/* Benefit Highlights */}
                            <div className="lg:col-span-2 space-y-4">
                              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest border-b border-gray-50 pb-2">Benefit Highlights</h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                  { label: 'Copay', val: (item as any).benefits?.copay || 'N/A' },
                                  { label: 'Coinsurance', val: (item as any).benefits?.coinsurance || 'N/A' },
                                  { label: 'Deductible', val: (item as any).benefits?.deductible_applies !== undefined ? ((item as any).benefits?.deductible_applies ? 'Applies' : 'No') : 'N/A' },
                                  { label: 'Visit Limit', val: (item as any).benefits?.visit_limit || 'N/A' },
                                  { label: 'Auth Required', val: (item as any).benefits?.auth_required !== undefined ? ((item as any).benefits?.auth_required ? 'YES' : 'NO') : 'N/A' },
                                ].map(b => (
                                  <div key={b.label} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-center">
                                    <p className="text-[8px] font-black text-secondary uppercase tracking-tighter mb-1">{b.label}</p>
                                    <p className="text-[10px] font-bold text-primaryText">{b.val}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Preview Button - Bottom Right */}
                          <div className="absolute bottom-6 right-8">
                            <button 
                              onClick={() => alert("HIPAA Warning: Ensure you are on a secure workstation before viewing health records. Confirm preview?")}
                              className="bg-primary text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center space-x-2"
                            >
                              <Eye size={14} />
                              <span>Preview Full PDF</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MySubmissionsView;
