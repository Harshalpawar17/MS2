
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
  const [activeType, setActiveType] = useState<'All' | 'EV' | 'WCPI'>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState<string | null>(null);
  const [downloadConfirmed, setDownloadConfirmed] = useState(false);

  const statuses = [
    'All', 'Pending', 'Data Entry', 'Quality Control', 
    'Escalated to Account Management', 'Clinic Action Required', 'Completed'
  ];

  const sortedAndFiltered = useMemo(() => {
    const combined = [
      ...MOCK_EV_RECORDS.map(r => ({ ...r, type: 'EV', patient_name: 'Patient Name Loading...', id: r.unique_id })),
      ...MOCK_CLAIMS.map(c => ({ ...c, type: 'WCPI', id: c.claim_id }))
    ];

    return combined
      .filter(item => {
        const typeMatch = activeType === 'All' || item.type === activeType;
        // Fixed: Use type assertion to access 'status' or 'ev_status' on the union type to resolve property missing error
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primaryText tracking-tight">Case Management</h1>
          
        </div>
      </div>

      {/* Pinned Clinic Actions Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black text-secondary uppercase tracking-[0.3em] ml-2 flex items-center space-x-2">
          <AlertCircle size={14} className="text-red-500" />
          <span>Clinic Actions Required</span>
        </h2>
        {clinicActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicActions.map(action => (
              <div key={action.id} className="bg-red-50/50 border border-red-100 p-6 rounded-3xl flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-red-500"><AlertCircle size={20}/></div>
                  <div>
                    <p className="font-black text-primaryText">{action.patient_name}</p>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{action.type} • {action.id}</p>
                  </div>
                </div>
                <button onClick={() => toggleAccordion(action.id)} className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all">View Action</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl text-center">
            <p className="text-secondary font-bold text-sm">No actions today – your queue is clear!</p>
          </div>
        )}
      </section>

      {/* Submissions List Section */}
      <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-50 pb-8">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {['All', 'EV', 'WCPI'].map(t => (
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
              onChange={e => setActiveStatus(e.target.value)}
              className="bg-gray-50 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary outline-none ring-1 ring-gray-100"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
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
                      <td colSpan={6} className="px-12 py-10 animate-in slide-in-from-top-4 duration-300">
                        {item.type === 'EV' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Summary Section */}
                            <div className="lg:col-span-8 space-y-6">
                              <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                <div>
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Verified Specialty</p>
                                  <p className="text-xl font-black text-primaryText">{(item as any).provider_taxonomy === 'Chiro' ? 'Chiropractic' : 'Physical Therapy'} Benefits</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest">EHR Number</p>
                                  <p className="text-lg font-bold text-primary">{(item as any).ehr_number}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {[
                                  { label: 'Copay', val: (item as any).benefits?.copay },
                                  { label: 'Coinsurance', val: (item as any).benefits?.coinsurance },
                                  { label: 'Deductible', val: (item as any).benefits?.deductible_applies ? 'Applies' : 'Not Applies' },
                                  { label: 'Visit Limit', val: (item as any).benefits?.visit_limit },
                                  { label: 'Auth Required', val: (item as any).benefits?.auth_required ? 'YES' : 'NO' },
                                ].map(b => (
                                  <div key={b.label} className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-tighter mb-1">{b.label}</p>
                                    <p className="font-bold text-primaryText">{b.val}</p>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-primaryText mb-4 flex items-center space-x-2">
                                  <FileText size={16} className="text-primary" />
                                  <span>PDF Verification Record</span>
                                </h4>
                                <div className="aspect-[4/3] bg-gray-200 rounded-2xl flex items-center justify-center relative group overflow-hidden">
                                  {!showPdfPreview ? (
                                    <button 
                                      onClick={() => setShowPdfPreview(item.id)}
                                      className="bg-white px-8 py-3 rounded-2xl font-bold shadow-lg flex items-center space-x-2 hover:scale-105 transition-all"
                                    >
                                      <Eye size={18} />
                                      <span>Preview Full PDF</span>
                                    </button>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                                      <p className="font-bold">PDF Rendering View...</p>
                                      <div className="mt-4 flex space-x-3">
                                        <button 
                                          onClick={() => {
                                            if (confirm("HIPAA Warning: Ensure you are on a secure workstation before downloading health records. Confirm download?")) {
                                              alert("Downloading record...");
                                            }
                                          }}
                                          className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold"
                                        >
                                          Download Record
                                        </button>
                                        <button onClick={() => setShowPdfPreview(null)} className="bg-white text-secondary px-6 py-2 rounded-xl text-xs font-bold">Close Preview</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="lg:col-span-4 space-y-6">
                              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Internal Routing</p>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-secondary">Assigned Pod:</span>
                                    <span className="text-primaryText">Pod A</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-secondary">Assigned Agent:</span>
                                    <span className="text-primaryText">Agent Smith</span>
                                  </div>
                                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                     <button className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Escalate Case</button>
                                     <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Change Status</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100">
                               <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Visits Used</p>
                               <p className="text-3xl font-black text-primaryText">{(item as any).visits_used}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100">
                               <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Case Balance</p>
                               <p className="text-3xl font-black text-primaryText">${(item as any).case_total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-center">
                               <button className="bg-primary text-white px-8 py-3 rounded-2xl font-bold">Open Full Case Manager</button>
                            </div>
                          </div>
                        )}
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



// import React, { useState, useMemo } from 'react';
// import { Search, Filter, ChevronRight, ArrowDownAz, Calendar, Download, Building2 } from 'lucide-react';
// import { MOCK_SUBMISSIONS } from '../constants';

// const MySubmissionsView: React.FC = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed'>('All');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [selectedClinic, setSelectedClinic] = useState('All Clinics');

//   const clinics = useMemo(() => {
//     const list = Array.from(new Set(MOCK_SUBMISSIONS.map(s => s.clinicName))).filter(Boolean) as string[];
//     return ['All Clinics', ...list];
//   }, []);

//   const filteredSubmissions = useMemo(() => {
//     return MOCK_SUBMISSIONS.filter(sub => {
//       const matchesSearch = sub.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || sub.refNumber.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
//       const matchesClinic = selectedClinic === 'All Clinics' || sub.clinicName === selectedClinic;
      
//       let matchesDate = true;
//       if (startDate) {
//         matchesDate = matchesDate && sub.dateSubmitted >= startDate;
//       }
//       if (endDate) {
//         matchesDate = matchesDate && sub.dateSubmitted <= endDate;
//       }

//       return matchesSearch && matchesStatus && matchesClinic && matchesDate;
//     }).sort((a, b) => (a.status === 'Pending' ? -1 : 1));
//   }, [searchTerm, filterStatus, selectedClinic, startDate, endDate]);

//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'Pending': return 'bg-amber-100 text-amber-700';
//       case 'Completed': return 'bg-emerald-100 text-emerald-700';
//       case 'Action Required': return 'bg-red-100 text-red-700';
//       default: return 'bg-gray-100 text-gray-600';
//     }
//   };

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Submissions</h1>
//           {/* <p className="text-gray-500">Track and manage intake workflows for your clinic network.</p> */}
//         </div>
//         <div className="flex items-center space-x-3">
//           <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
//             <Download size={18} />
//             <span>Export Results</span>
//           </button>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
//           <div className="md:col-span-5 relative">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//             <input 
//               placeholder="Search patient name or reference number..."
//               value={searchTerm}
//               onChange={e => setSearchTerm(e.target.value)}
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium" 
//             />
//           </div>
          
//           <div className="md:col-span-3 flex items-center bg-gray-50 rounded-2xl px-4 py-3">
//              <Building2 className="text-gray-400 mr-3" size={18} />
//              <select 
//               value={selectedClinic}
//               onChange={e => setSelectedClinic(e.target.value)}
//               className="bg-transparent border-none outline-none w-full font-bold text-sm text-primaryText appearance-none"
//              >
//                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
//              </select>
//           </div>

//           <div className="md:col-span-4 flex items-center space-x-2 bg-gray-50 rounded-2xl px-4 py-1">
//              <Calendar className="text-gray-400" size={18} />
//              <input 
//               type="date" 
//               value={startDate}
//               onChange={e => setStartDate(e.target.value)}
//               className="bg-transparent border-none outline-none text-xs font-bold text-primaryText" 
//              />
//              <span className="text-gray-400 font-bold">to</span>
//              <input 
//               type="date" 
//               value={endDate}
//               onChange={e => setEndDate(e.target.value)}
//               className="bg-transparent border-none outline-none text-xs font-bold text-primaryText" 
//              />
//           </div>
//         </div>

//         <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl w-fit">
//           {['All', 'Pending', 'Completed'].map((s) => (
//             <button
//               key={s}
//               onClick={() => setFilterStatus(s as any)}
//               className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-gray-200'}`}
//             >
//               {s}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
//         <table className="w-full text-left">
//           <thead className="bg-gray-50/50 border-b border-gray-100">
//             <tr>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Reference #</th>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Patient Name</th>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Workflow</th>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Clinic</th>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Submitted</th>
//               <th className="px-10 py-6 text-xs font-bold text-secondary uppercase tracking-widest">Status</th>
//               <th className="px-10 py-6 text-right"></th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-50">
//             {filteredSubmissions.map((sub) => (
//               <tr key={sub.id} className="hover:bg-primary/[0.02] transition-colors group cursor-pointer">
//                 <td className="px-10 py-7 font-mono font-bold text-primary">{sub.refNumber}</td>
//                 <td className="px-10 py-7 font-black text-primaryText text-lg">{sub.patientName}</td>
//                 <td className="px-10 py-7 text-sm font-bold text-secondary">{sub.workflow}</td>
//                 <td className="px-10 py-7 text-sm font-bold text-primaryText">{sub.clinicName}</td>
//                 <td className="px-10 py-7 text-sm font-bold text-secondary">{sub.dateSubmitted}</td>
//                 <td className="px-10 py-7">
//                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusStyle(sub.status)}`}>
//                     {sub.status}
//                   </span>
//                 </td>
//                 <td className="px-10 py-7 text-right">
//                   <button className="p-2 text-secondary hover:text-primary transition-colors">
//                     <ChevronRight size={20} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {filteredSubmissions.length === 0 && (
//           <div className="py-32 text-center space-y-4">
//             <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
//               <Search size={32} />
//             </div>
//             <p className="text-secondary font-bold text-lg">No matching submissions found.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MySubmissionsView;

