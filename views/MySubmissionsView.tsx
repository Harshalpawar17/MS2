// // MySubmissionsView.tsx 2026

// import React, { useState, useMemo } from 'react';
// import { 
//   Search, 
//   ChevronRight, 
//   ChevronDown,
//   Calendar, 
//   Building2, 
//   Scale, 
//   ShieldCheck, 
//   ArrowUpDown, 
//   AlertCircle,
//   Filter,
//   FileText,
//   Download,
//   Eye,
//   CheckCircle,
//   X,
//   Edit2,
//   Save,
//   UserCircle,
//   Mail,
//   Phone,
//   Briefcase,
//   MapPin,
//   Clock,
//   Plus,
//   FileKey,
//   CreditCard,
//   Info
// } from 'lucide-react';
// import { UserRole } from '../types';

// interface SubmissionDetail {
//   patientFirstName: string;
//   patientMiddleName?: string;
//   patientLastName: string;
//   patientDob: string;
  
//   // EV Specific
//   primaryInsurance?: {
//     carrier: string;
//     policyId: string;
//     groupNumber: string;
//     subscriberName: string;
//   };
//   secondaryInsurance?: {
//     carrier: string;
//     policyId: string;
//     groupNumber: string;
//     subscriberName: string;
//   };
//   selectionPath?: 'Eligibility Check' | 'Benefit Check';
//   cptCodes?: string[];
  
//   // PA Specific
//   requestCategory?: string;
//   requestedProcedure?: string;
//   clinicalNarrative?: string;
//   approvalStatus?: string;
  
//   // WC/PI Specific
//   dateOfAccident?: string;
//   caseType?: string;
//   liabilityCarrier?: {
//     company: string;
//     claimNumber: string;
//     phone: string;
//     fax: string;
//     email: string;
//   };
//   adjusterDetails?: {
//     phone: string;
//     fax: string;
//     email: string;
//   };
//   piWcSpecificClaimId?: string;
  
//   // DOC Specific
//   documents?: {
//     name: string;
//     type: string;
//     uploadDate: string;
//   }[];
// }

// interface Submission {
//   id: string;
//   patientName: string;
//   caseId: string;
//   type: 'EV' | 'PA' | 'WC/PI' | 'DOC';
//   status: string;
//   submittedDate: string;
//   details: SubmissionDetail;
// }

// const MOCK_SUBMISSIONS: Submission[] = [
//   {
//     id: '1',
//     patientName: 'John Doe',
//     caseId: 'EV-00001',
//     type: 'EV',
//     status: 'Clinic Action Required',
//     submittedDate: '02/20/2026',
//     details: {
//       patientFirstName: 'John',
//       patientMiddleName: 'Quincy',
//       patientLastName: 'Doe',
//       patientDob: '05/15/1985',
//       primaryInsurance: {
//         carrier: 'Blue Cross Blue Shield',
//         policyId: 'BCBS123456789',
//         groupNumber: 'GRP98765',
//         subscriberName: 'John Doe'
//       },
//       selectionPath: 'Benefit Check',
//       cptCodes: ['97110', '97140']
//     }
//   },
//   {
//     id: '2',
//     patientName: 'Jane Smith',
//     caseId: 'PA-00001',
//     type: 'PA',
//     status: 'Pending',
//     submittedDate: '02/21/2026',
//     details: {
//       patientFirstName: 'Jane',
//       patientLastName: 'Smith',
//       patientDob: '11/22/1990',
//       requestCategory: 'Diagnostic Services',
//       requestedProcedure: 'MRI Lumbar Spine (72148)',
//       clinicalNarrative: 'Patient presents with chronic low back pain and radiculopathy.',
//       approvalStatus: 'Pending'
//     }
//   },
//   {
//     id: '3',
//     patientName: 'Robert Wilson',
//     caseId: 'DOC-00002',
//     type: 'DOC',
//     status: 'Completed',
//     submittedDate: '02/22/2026',
//     details: {
//       patientFirstName: 'Robert',
//       patientLastName: 'Wilson',
//       patientDob: '03/10/1975',
//       documents: [
//         { name: 'Insurance_Card_Front.jpg', type: 'EV doc', uploadDate: '02/22/2026' },
//         { name: 'Clinical_Notes.pdf', type: 'Supporting', uploadDate: '02/22/2026' }
//       ]
//     }
//   },
//   {
//     id: '4',
//     patientName: 'Emma Thompson',
//     caseId: 'WC-00001',
//     type: 'WC/PI',
//     status: 'Clinic Action Required',
//     submittedDate: '02/23/2026',
//     details: {
//       patientFirstName: 'Emma',
//       patientLastName: 'Thompson',
//       patientDob: '08/05/1982',
//       dateOfAccident: '02/10/2026',
//       caseType: 'Workers Compensation',
//       liabilityCarrier: {
//         company: 'Travelers Insurance',
//         claimNumber: 'WC-99887766',
//         phone: '(555) 111-2222',
//         fax: '(555) 111-3333',
//         email: 'claims@travelers.com'
//       },
//       adjusterDetails: {
//         phone: '(555) 111-4444',
//         fax: '(555) 111-5555',
//         email: 'j.adjuster@travelers.com'
//       },
//       piWcSpecificClaimId: 'CLAIM-ID-5544'
//     }
//   }
// ];

// interface MySubmissionsViewProps {
//   userRole: UserRole;
// }

// const MySubmissionsView: React.FC<MySubmissionsViewProps> = ({ userRole }) => {
//   const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
//   const [activeType, setActiveType] = useState<'All' | 'EV' | 'PA' | 'WC/PI' | 'DOC'>('All');
//   const [activeStatus, setActiveStatus] = useState<string>('All');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editData, setEditData] = useState<Submission | null>(null);
//   const [activeTab, setActiveTab] = useState('Overview');
//   const [toast, setToast] = useState<string | null>(null);

//   const statuses = [
//     'All', 'Pending', 'Data Entry', 'Quality Control', 
//     'Escalated to Account Management', 'Clinic Action Required'
//   ];

//   const showToast = (message: string) => {
//     setToast(message);
//     setTimeout(() => setToast(null), 3000);
//   };

//   const filteredSubmissions = useMemo(() => {
//     return submissions.filter(item => {
//       const typeMatch = activeType === 'All' || item.type === activeType;
//       const statusMatch = activeStatus === 'All' || item.status === activeStatus;
//       const searchMatch = item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
//                          item.caseId.toLowerCase().includes(searchQuery.toLowerCase());
//       return typeMatch && statusMatch && searchMatch;
//     });
//   }, [submissions, activeType, activeStatus, searchQuery]);

//   const clinicActionsCount = submissions.filter(s => s.status === 'Clinic Action Required').length;

//   const handleRowClick = (submission: Submission) => {
//     setSelectedSubmission(submission);
//     setEditData(JSON.parse(JSON.stringify(submission))); // Deep copy for editing
//     setIsDrawerOpen(true);
//     setIsEditing(false);
    
//     // Set default tab based on type
//     if (submission.type === 'EV') setActiveTab('EV');
//     else if (submission.type === 'PA') setActiveTab('PA');
//     else if (submission.type === 'WC/PI') setActiveTab('WC/PI');
//     else if (submission.type === 'DOC') setActiveTab('DOC');
//     else setActiveTab('Overview');
//   };

//   const handleSave = () => {
//     if (editData) {
//       setSubmissions(prev => prev.map(s => s.id === editData.id ? editData : s));
//       setSelectedSubmission(editData);
//       setIsEditing(false);
//       showToast("Changes saved successfully");
//     }
//   };

//   const getStatusStyle = (status: string) => {
//     switch (status) {
//       case 'Clinic Action Required': return 'bg-red-100 text-red-700 border-red-200';
//       case 'Escalated to Account Management': return 'bg-amber-100 text-amber-700 border-amber-200';
//       case 'Quality Control': return 'bg-blue-100 text-blue-700 border-blue-200';
//       case 'Data Entry': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
//       case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
//       default: return 'bg-gray-100 text-gray-700 border-gray-200';
//     }
//   };

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
//       {/* Toast */}
//       {toast && (
//         <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300">
//           <CheckCircle size={18} className="text-primary" />
//           <span className="text-sm font-bold">{toast}</span>
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
//         <div className="flex items-center space-x-4">
//           <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
//           {clinicActionsCount > 0 && (
//             <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
//               <AlertCircle size={16} className="text-red-600" />
//               <span className="text-sm font-black text-red-600 uppercase tracking-widest">Clinic Action Required ({clinicActionsCount})</span>
//               <button 
//                 onClick={() => {
//                   setActiveStatus('Clinic Action Required');
//                   showToast("Filtering for actions required");
//                 }}
//                 className="ml-2 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
//               >
//                 View Action
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Filter Bar */}
//       <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
//         <div className="flex flex-wrap items-center gap-4">
//           <div className="flex-1 min-w-[300px] relative">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//             <input 
//               type="text"
//               placeholder="Search by patient name or case ID..."
//               className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
//             {['All', 'EV', 'PA', 'WC/PI', 'DOC'].map(t => (
//               <button 
//                 key={t}
//                 onClick={() => setActiveType(t as any)}
//                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primaryText'}`}
//               >
//                 {t}
//               </button>
//             ))}
//           </div>
//           <select 
//             value={activeStatus}
//             onChange={e => setActiveStatus(e.target.value)}
//             className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[200px]"
//           >
//             {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'Submission Status' : s}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="border-b border-gray-50 bg-gray-50/50">
//               <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name</th>
//               <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case ID</th>
//               <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
//               <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
//               <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Date</th>
//               <th className="px-8 py-5"></th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-50">
//             {filteredSubmissions.length > 0 ? filteredSubmissions.map((item) => (
//               <tr 
//                 key={item.id} 
//                 onClick={() => handleRowClick(item)}
//                 className={`hover:bg-gray-50/80 cursor-pointer transition-colors group ${selectedSubmission?.id === item.id ? 'bg-primary/5' : ''}`}
//               >
//                 <td className="px-8 py-5">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
//                       {item.patientName.split(' ').map(n => n[0]).join('')}
//                     </div>
//                     <span className="text-sm font-bold text-gray-900">{item.patientName}</span>
//                   </div>
//                 </td>
//                 <td className="px-8 py-5 font-mono text-sm font-bold text-primary">{item.caseId}</td>
//                 <td className="px-8 py-5">
//                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
//                     item.type === 'EV' ? 'bg-blue-50 text-blue-700' : 
//                     item.type === 'PA' ? 'bg-purple-50 text-purple-700' :
//                     item.type === 'WC/PI' ? 'bg-orange-50 text-orange-700' :
//                     'bg-gray-50 text-gray-700'
//                   }`}>
//                     {item.type}
//                   </span>
//                 </td>
//                 <td className="px-8 py-5">
//                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyle(item.status)}`}>
//                     {item.status}
//                   </span>
//                 </td>
//                 <td className="px-8 py-5">
//                   <div className="flex items-center space-x-2 text-gray-400">
//                     <Calendar size={14} />
//                     <span className="text-xs font-medium">{item.submittedDate}</span>
//                   </div>
//                 </td>
//                 <td className="px-8 py-5 text-right">
//                   <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
//                 </td>
//               </tr>
//             )) : (
//               <tr>
//                 <td colSpan={6} className="px-8 py-20 text-center">
//                   <div className="flex flex-col items-center space-y-4">
//                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
//                       <FileText size={32} />
//                     </div>
//                     <div>
//                       <p className="text-lg font-bold text-gray-900">No submissions found</p>
//                       <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
//                     </div>
//                   </div>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Detail Drawer */}
//       {isDrawerOpen && selectedSubmission && editData && (
//         <div className="fixed inset-0 z-50 overflow-hidden">
//           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
//           <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
//             {/* Drawer Header */}
//             <div className="p-8 border-b border-gray-100 flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
//                   {selectedSubmission.patientName.split(' ').map(n => n[0]).join('')}
//                 </div>
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.patientName}</h2>
//                   <div className="flex items-center space-x-2 mt-1">
//                     <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedSubmission.status)}`}>
//                       {selectedSubmission.status}
//                     </span>
//                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedSubmission.caseId} • {selectedSubmission.type}</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 {!isEditing ? (
//                   <button 
//                     onClick={() => setIsEditing(true)}
//                     className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
//                   >
//                     <Edit2 size={24} />
//                   </button>
//                 ) : (
//                   <button 
//                     onClick={handleSave}
//                     className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
//                   >
//                     <Save size={24} />
//                   </button>
//                 )}
//                 <button 
//                   onClick={() => setIsDrawerOpen(false)}
//                   className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex border-b border-gray-100 px-8">
//               {['Overview', 'EV', 'PA', 'WC/PI', 'DOC'].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`px-6 py-4 text-sm font-bold transition-all relative ${
//                     activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
//                   }`}
//                 >
//                   {tab}
//                   {activeTab === tab && (
//                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
//                   )}
//                 </button>
//               ))}
//             </div>

//             {/* Drawer Content */}
//             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
//               {activeTab === 'Overview' && (
//                 <div className="space-y-8">
//                   <div className="grid grid-cols-2 gap-6">
//                     <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Name</p>
//                       <input 
//                         disabled={!isEditing}
//                         value={editData.details.patientFirstName}
//                         onChange={e => setEditData({...editData, details: {...editData.details, patientFirstName: e.target.value}})}
//                         className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
//                       />
//                     </div>
//                     <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Name</p>
//                       <input 
//                         disabled={!isEditing}
//                         value={editData.details.patientLastName}
//                         onChange={e => setEditData({...editData, details: {...editData.details, patientLastName: e.target.value}})}
//                         className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
//                       />
//                     </div>
//                     <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</p>
//                       <div className="flex items-center space-x-2">
//                         <Calendar size={14} className="text-gray-400" />
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.patientDob}
//                           onChange={e => setEditData({...editData, details: {...editData.details, patientDob: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
//                         />
//                       </div>
//                     </div>
//                     <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case ID</p>
//                       <div className="flex items-center space-x-2">
//                         <FileText size={14} className="text-gray-400" />
//                         <p className="text-sm font-bold text-gray-900">{selectedSubmission.caseId}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === 'EV' && (
//                 <div className="space-y-8 animate-in fade-in duration-300">
//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <ShieldCheck size={20} className="text-primary" />
//                       <span>Insurance Information</span>
//                     </h3>
//                     <div className="grid grid-cols-2 gap-6">
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Carrier</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.primaryInsurance?.carrier || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, carrier: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Policy ID</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.primaryInsurance?.policyId || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, policyId: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Group Number</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.primaryInsurance?.groupNumber || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, groupNumber: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscriber Name</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.primaryInsurance?.subscriberName || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, subscriberName: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <Filter size={20} className="text-primary" />
//                       <span>Selection Path & Codes</span>
//                     </h3>
//                     <div className="grid grid-cols-2 gap-6">
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selection Path</p>
//                         <select 
//                           disabled={!isEditing}
//                           value={editData.details.selectionPath}
//                           onChange={e => setEditData({...editData, details: {...editData.details, selectionPath: e.target.value as any}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         >
//                           <option value="Eligibility Check">Eligibility Check</option>
//                           <option value="Benefit Check">Benefit Check</option>
//                         </select>
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CPT Codes</p>
//                         <p className="text-sm font-bold text-gray-900">{editData.details.cptCodes?.join(', ') || 'None'}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === 'PA' && (
//                 <div className="space-y-8 animate-in fade-in duration-300">
//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <FileKey size={20} className="text-primary" />
//                       <span>Authorization Details</span>
//                     </h3>
//                     <div className="grid grid-cols-1 gap-6">
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request Category</p>
//                         <select 
//                           disabled={!isEditing}
//                           value={editData.details.requestCategory}
//                           onChange={e => setEditData({...editData, details: {...editData.details, requestCategory: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         >
//                           <option value="DMS/Supplies">DMS/Supplies</option>
//                           <option value="Diagnostic Services">Diagnostic Services</option>
//                         </select>
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested Procedure / CPT</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.requestedProcedure || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, requestedProcedure: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinical Narrative</p>
//                         <textarea 
//                           disabled={!isEditing}
//                           value={editData.details.clinicalNarrative || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, clinicalNarrative: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none min-h-[100px] resize-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approval Status</p>
//                         <p className="text-sm font-bold text-gray-900">{editData.details.approvalStatus}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === 'WC/PI' && (
//                 <div className="space-y-8 animate-in fade-in duration-300">
//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <Scale size={20} className="text-primary" />
//                       <span>Incidental & Case Details</span>
//                     </h3>
//                     <div className="grid grid-cols-2 gap-6">
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Accident</p>
//                         <input 
//                           disabled={!isEditing}
//                           type="date"
//                           value={editData.details.dateOfAccident || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, dateOfAccident: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Type</p>
//                         <select 
//                           disabled={!isEditing}
//                           value={editData.details.caseType}
//                           onChange={e => setEditData({...editData, details: {...editData.details, caseType: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         >
//                           <option value="Workers Compensation">Workers Compensation</option>
//                           <option value="Personal Injury">Personal Injury</option>
//                         </select>
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2 col-span-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PI/WC Specific Claim ID</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.piWcSpecificClaimId || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, piWcSpecificClaimId: e.target.value}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <Building2 size={20} className="text-primary" />
//                       <span>Liability Carrier & Adjuster</span>
//                     </h3>
//                     <div className="grid grid-cols-2 gap-6">
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2 col-span-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurance Company</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.liabilityCarrier?.company || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, company: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Claim Number</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.liabilityCarrier?.claimNumber || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, claimNumber: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carrier Phone</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.liabilityCarrier?.phone || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, phone: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                       <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
//                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjuster Email</p>
//                         <input 
//                           disabled={!isEditing}
//                           value={editData.details.adjusterDetails?.email || ''}
//                           onChange={e => setEditData({...editData, details: {...editData.details, adjusterDetails: {...editData.details.adjusterDetails!, email: e.target.value}}})}
//                           className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === 'DOC' && (
//                 <div className="space-y-8 animate-in fade-in duration-300">
//                   <div className="space-y-6">
//                     <h3 className="font-bold text-gray-900 flex items-center space-x-2">
//                       <FileText size={20} className="text-primary" />
//                       <span>Associated Documents</span>
//                     </h3>
//                     <div className="space-y-3">
//                       {editData.details.documents?.map((doc, i) => (
//                         <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group">
//                           <div className="flex items-center space-x-3">
//                             <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary">
//                               <FileText size={20} />
//                             </div>
//                             <div>
//                               <p className="text-sm font-bold text-gray-900">{doc.name}</p>
//                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{doc.type} • {doc.uploadDate}</p>
//                             </div>
//                           </div>
//                           <button className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
//                             <Eye size={18} />
//                           </button>
//                         </div>
//                       ))}
//                       <button className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center space-x-2">
//                         <Plus size={18} />
//                         <span>Upload New Document</span>
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Drawer Footer */}
//             <div className="p-8 border-t border-gray-100 flex items-center space-x-4">
//               {isEditing ? (
//                 <>
//                   <button 
//                     onClick={handleSave}
//                     className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center space-x-2"
//                   >
//                     <Save size={18} />
//                     <span>Save Changes</span>
//                   </button>
//                   <button 
//                     onClick={() => { setIsEditing(false); setEditData(JSON.parse(JSON.stringify(selectedSubmission))); }}
//                     className="px-8 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
//                   >
//                     Cancel
//                   </button>
//                 </>
//               ) : (
//                 <button 
//                   onClick={() => setIsEditing(true)}
//                   className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
//                 >
//                   <Edit2 size={18} />
//                   <span>Edit Submission</span>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MySubmissionsView;

// MySubmissionsView.tsx 2026

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronRight,
  Calendar,
  Building2,
  Scale,
  ShieldCheck,
  AlertCircle,
  Filter,
  FileText,
  Eye,
  CheckCircle,
  X,
  Edit2,
  Save,
  Plus,
  FileKey,
  Moon,
  Sun,
} from 'lucide-react';
import { UserRole } from '../types';

interface SubmissionDetail {
  patientFirstName: string;
  patientMiddleName?: string;
  patientLastName: string;
  patientDob: string;

  // EV Specific
  primaryInsurance?: {
    carrier: string;
    policyId: string;
    groupNumber: string;
    subscriberName: string;
  };
  secondaryInsurance?: {
    carrier: string;
    policyId: string;
    groupNumber: string;
    subscriberName: string;
  };
  selectionPath?: 'Eligibility Check' | 'Benefit Check';
  cptCodes?: string[];

  // PA Specific
  requestCategory?: string;
  requestedProcedure?: string;
  clinicalNarrative?: string;
  approvalStatus?: string;

  // WC/PI Specific
  dateOfAccident?: string;
  caseType?: string;
  liabilityCarrier?: {
    company: string;
    claimNumber: string;
    phone: string;
    fax: string;
    email: string;
  };
  adjusterDetails?: {
    phone: string;
    fax: string;
    email: string;
  };
  piWcSpecificClaimId?: string;

  // DOC Specific
  documents?: {
    name: string;
    type: string;
    uploadDate: string;
  }[];
}

interface Submission {
  id: string;
  patientName: string;
  caseId: string;
  type: 'EV' | 'PA' | 'WC/PI' | 'DOC';
  status: string;
  submittedDate: string;
  details: SubmissionDetail;
}

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: '1',
    patientName: 'John Doe',
    caseId: 'EV-00001',
    type: 'EV',
    status: 'Clinic Action Required',
    submittedDate: '02/20/2026',
    details: {
      patientFirstName: 'John',
      patientMiddleName: 'Quincy',
      patientLastName: 'Doe',
      patientDob: '05/15/1985',
      primaryInsurance: {
        carrier: 'Blue Cross Blue Shield',
        policyId: 'BCBS123456789',
        groupNumber: 'GRP98765',
        subscriberName: 'John Doe',
      },
      selectionPath: 'Benefit Check',
      cptCodes: ['97110', '97140'],
    },
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    caseId: 'PA-00001',
    type: 'PA',
    status: 'Pending',
    submittedDate: '02/21/2026',
    details: {
      patientFirstName: 'Jane',
      patientLastName: 'Smith',
      patientDob: '11/22/1990',
      requestCategory: 'Diagnostic Services',
      requestedProcedure: 'MRI Lumbar Spine (72148)',
      clinicalNarrative:
        'Patient presents with chronic low back pain and radiculopathy.',
      approvalStatus: 'Pending',
    },
  },
  {
    id: '3',
    patientName: 'Robert Wilson',
    caseId: 'DOC-00002',
    type: 'DOC',
    status: 'Completed',
    submittedDate: '02/22/2026',
    details: {
      patientFirstName: 'Robert',
      patientLastName: 'Wilson',
      patientDob: '03/10/1975',
      documents: [
        { name: 'Insurance_Card_Front.jpg', type: 'EV doc', uploadDate: '02/22/2026' },
        { name: 'Clinical_Notes.pdf', type: 'Supporting', uploadDate: '02/22/2026' },
      ],
    },
  },
  {
    id: '4',
    patientName: 'Emma Thompson',
    caseId: 'WC-00001',
    type: 'WC/PI',
    status: 'Clinic Action Required',
    submittedDate: '02/23/2026',
    details: {
      patientFirstName: 'Emma',
      patientLastName: 'Thompson',
      patientDob: '08/05/1982',
      dateOfAccident: '02/10/2026',
      caseType: 'Workers Compensation',
      liabilityCarrier: {
        company: 'Travelers Insurance',
        claimNumber: 'WC-99887766',
        phone: '(555) 111-2222',
        fax: '(555) 111-3333',
        email: 'claims@travelers.com',
      },
      adjusterDetails: {
        phone: '(555) 111-4444',
        fax: '(555) 111-5555',
        email: 'j.adjuster@travelers.com',
      },
      piWcSpecificClaimId: 'CLAIM-ID-5544',
    },
  },
];

interface MySubmissionsViewProps {
  userRole: UserRole;
}

const cardFieldClass =
  'rounded-3xl border border-white/50 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]';
const fieldLabelClass =
  'text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500';
const inputClass =
  'w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-100 dark:text-slate-100';
const sectionTitleClass =
  'flex items-center space-x-2 font-bold text-slate-900 dark:text-white';
const glassButtonBase =
  'rounded-xl border border-white/70 bg-white/80 backdrop-blur-md transition-all hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10';

const MySubmissionsView: React.FC<MySubmissionsViewProps> = ({ userRole }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [activeType, setActiveType] = useState<'All' | 'EV' | 'PA' | 'WC/PI' | 'DOC'>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toast, setToast] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const statuses = [
    'All',
    'Pending',
    'Completed',
    'Data Entry',
    'Quality Control',
    'Escalated to Account Management',
    'Clinic Action Required',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('ms2-theme');
    const shouldUseDark =
      savedTheme === 'dark' || document.documentElement.classList.contains('dark');

    document.documentElement.classList.toggle('dark', shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ms2-theme', next ? 'dark' : 'light');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const typeMatch = activeType === 'All' || item.type === activeType;
      const statusMatch = activeStatus === 'All' || item.status === activeStatus;
      const searchMatch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caseId.toLowerCase().includes(searchQuery.toLowerCase());

      return typeMatch && statusMatch && searchMatch;
    });
  }, [submissions, activeType, activeStatus, searchQuery]);

  const clinicActionsCount = submissions.filter(
    (s) => s.status === 'Clinic Action Required'
  ).length;

  const handleRowClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditData(JSON.parse(JSON.stringify(submission)));
    setIsDrawerOpen(true);
    setIsEditing(false);

    if (submission.type === 'EV') setActiveTab('EV');
    else if (submission.type === 'PA') setActiveTab('PA');
    else if (submission.type === 'WC/PI') setActiveTab('WC/PI');
    else if (submission.type === 'DOC') setActiveTab('DOC');
    else setActiveTab('Overview');
  };

  const handleSave = () => {
    if (editData) {
      setSubmissions((prev) => prev.map((s) => (s.id === editData.id ? editData : s)));
      setSelectedSubmission(editData);
      setIsEditing(false);
      showToast('Changes saved successfully');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Clinic Action Required':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30';
      case 'Escalated to Account Management':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
      case 'Quality Control':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30';
      case 'Data Entry':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30';
    }
  };

  return (
    <>
      <style>{`
        .ms2-submissions-shell {
          position: relative;
          overflow: hidden;
          border-radius: 2rem;
        }
        .ms2-submissions-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
        }
        .dark .ms2-submissions-bg {
          background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%);
        }
        .ms2-submissions-glow {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(circle at 90% 10%, rgba(141, 197, 63, 0.22), transparent 38%);
        }
        .dark .ms2-submissions-glow {
          background: radial-gradient(circle at 90% 10%, rgba(141, 197, 63, 0.16), transparent 38%);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
        }
        .dark .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.12);
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }
        .dark .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .glass-drawer {
          background: linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass-drawer {
          background: linear-gradient(145deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 100%);
          border-left: 1px solid rgba(255,255,255,0.08);
        }
        .ms2-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .ms2-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .ms2-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.28);
          border-radius: 9999px;
        }
        .dark .ms2-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.14);
        }
      `}</style>

      <div className="ms2-submissions-shell">
        <div className="ms2-submissions-bg" />
        <div className="ms2-submissions-glow" />

        <div className="relative z-10 space-y-8 p-6 md:p-8 animate-in fade-in duration-500">
          {toast && (
            <div className="fixed top-6 right-6 z-[100] flex items-center space-x-3 rounded-2xl bg-slate-900 px-6 py-3 text-white shadow-2xl animate-in slide-in-from-top-4 duration-300 dark:bg-slate-100 dark:text-slate-900">
              <CheckCircle size={18} className="text-primary" />
              <span className="text-sm font-bold">{toast}</span>
            </div>
          )}

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                My Submissions
              </h1>

              {clinicActionsCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">
                    <AlertCircle size={14} />
                    CLINIC ACTION REQUIRED ({clinicActionsCount})
                  </span>

                  <button
                    onClick={() => {
                      setActiveStatus('Clinic Action Required');
                      showToast('Filtering for actions required');
                    }}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-600"
                  >
                    VIEW ACTION
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="glass-panel rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Role: {String(userRole)}
              </div>

              <button
                onClick={toggleTheme}
                className={`${glassButtonBase} flex h-11 w-11 items-center justify-center text-slate-600 dark:text-slate-300`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[280px] flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by patient name or case ID..."
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-black/20 dark:text-slate-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700">
                {['All', 'EV', 'PA', 'WC/PI', 'DOC'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveType(t as 'All' | 'EV' | 'PA' | 'WC/PI' | 'DOC')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      activeType === t
                        ? 'border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white'
                        : 'text-slate-500 hover:text-primary dark:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:ml-auto sm:w-56">
                <select
                  value={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-black/20 dark:text-slate-100"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'Submission Status' : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto ms2-scrollbar">
              <table className="w-full whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/80">
                  <tr>
                    <th className="w-[30%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Patient Name
                    </th>
                    <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Case ID
                    </th>
                    <th className="w-[10%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Type
                    </th>
                    <th className="w-[25%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="w-[15%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Submitted Date
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/30">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className={`group cursor-pointer transition-colors hover:bg-white/40 dark:hover:bg-white/5 ${
                          selectedSubmission?.id === item.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold text-primary shadow-sm">
                              {item.patientName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {item.patientName}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-primary">{item.caseId}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold leading-5 ${
                              item.type === 'EV'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
                                : item.type === 'PA'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300'
                                : item.type === 'WC/PI'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-300'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase leading-5 ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1.5 text-slate-400" />
                            {item.submittedDate}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <ChevronRight
                            className="text-slate-300 transition-colors group-hover:text-primary"
                            size={18}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-slate-300 dark:bg-white/5">
                            <FileText size={32} />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              No submissions found
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isDrawerOpen && selectedSubmission && editData && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setIsDrawerOpen(false)}
              />
              <div className="glass-drawer absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between border-b border-slate-200/70 p-8 dark:border-slate-700/60">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                      {selectedSubmission.patientName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedSubmission.patientName}
                      </h2>
                      <div className="mt-1 flex items-center space-x-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(
                            selectedSubmission.status
                          )}`}
                        >
                          {selectedSubmission.status}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {selectedSubmission.caseId} • {selectedSubmission.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`${glassButtonBase} p-2 text-primary`}
                      >
                        <Edit2 size={22} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSave}
                        className={`${glassButtonBase} p-2 text-emerald-600 dark:text-emerald-300`}
                      >
                        <Save size={22} />
                      </button>
                    )}

                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className={`${glassButtonBase} p-2 text-slate-500 dark:text-slate-300`}
                    >
                      <X size={22} />
                    </button>
                  </div>
                </div>

                <div className="flex border-b border-slate-200/70 px-8 dark:border-slate-700/60">
                  {['Overview', 'EV', 'PA', 'WC/PI', 'DOC'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative px-6 py-4 text-sm font-bold transition-all ${
                        activeTab === tab
                          ? 'text-primary'
                          : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="ms2-scrollbar flex-1 overflow-y-auto p-8">
                  {activeTab === 'Overview' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className={cardFieldClass}>
                          <p className={fieldLabelClass}>First Name</p>
                          <input
                            disabled={!isEditing}
                            value={editData.details.patientFirstName}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                details: {
                                  ...editData.details,
                                  patientFirstName: e.target.value,
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className={cardFieldClass}>
                          <p className={fieldLabelClass}>Last Name</p>
                          <input
                            disabled={!isEditing}
                            value={editData.details.patientLastName}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                details: {
                                  ...editData.details,
                                  patientLastName: e.target.value,
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className={cardFieldClass}>
                          <p className={fieldLabelClass}>Date of Birth</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                              disabled={!isEditing}
                              value={editData.details.patientDob}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    patientDob: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className={cardFieldClass}>
                          <p className={fieldLabelClass}>Case ID</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <FileText size={14} className="text-slate-400" />
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {selectedSubmission.caseId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'EV' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <ShieldCheck size={20} className="text-primary" />
                          <span>Insurance Information</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Primary Carrier</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.primaryInsurance?.carrier || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    primaryInsurance: {
                                      ...(editData.details.primaryInsurance || {
                                        carrier: '',
                                        policyId: '',
                                        groupNumber: '',
                                        subscriberName: '',
                                      }),
                                      carrier: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Policy ID</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.primaryInsurance?.policyId || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    primaryInsurance: {
                                      ...(editData.details.primaryInsurance || {
                                        carrier: '',
                                        policyId: '',
                                        groupNumber: '',
                                        subscriberName: '',
                                      }),
                                      policyId: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Group Number</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.primaryInsurance?.groupNumber || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    primaryInsurance: {
                                      ...(editData.details.primaryInsurance || {
                                        carrier: '',
                                        policyId: '',
                                        groupNumber: '',
                                        subscriberName: '',
                                      }),
                                      groupNumber: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Subscriber Name</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.primaryInsurance?.subscriberName || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    primaryInsurance: {
                                      ...(editData.details.primaryInsurance || {
                                        carrier: '',
                                        policyId: '',
                                        groupNumber: '',
                                        subscriberName: '',
                                      }),
                                      subscriberName: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <Filter size={20} className="text-primary" />
                          <span>Selection Path & Codes</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Selection Path</p>
                            <select
                              disabled={!isEditing}
                              value={editData.details.selectionPath}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    selectionPath: e.target.value as
                                      | 'Eligibility Check'
                                      | 'Benefit Check',
                                  },
                                })
                              }
                              className={inputClass}
                            >
                              <option value="Eligibility Check">Eligibility Check</option>
                              <option value="Benefit Check">Benefit Check</option>
                            </select>
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>CPT Codes</p>
                            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                              {editData.details.cptCodes?.join(', ') || 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PA' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <FileKey size={20} className="text-primary" />
                          <span>Authorization Details</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6">
                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Request Category</p>
                            <select
                              disabled={!isEditing}
                              value={editData.details.requestCategory}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    requestCategory: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            >
                              <option value="DMS/Supplies">DMS/Supplies</option>
                              <option value="Diagnostic Services">Diagnostic Services</option>
                            </select>
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Requested Procedure / CPT</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.requestedProcedure || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    requestedProcedure: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Clinical Narrative</p>
                            <textarea
                              disabled={!isEditing}
                              value={editData.details.clinicalNarrative || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    clinicalNarrative: e.target.value,
                                  },
                                })
                              }
                              className={`${inputClass} min-h-[100px] resize-none`}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Approval Status</p>
                            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                              {editData.details.approvalStatus}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'WC/PI' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <Scale size={20} className="text-primary" />
                          <span>Incidental & Case Details</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Date of Accident</p>
                            <input
                              disabled={!isEditing}
                              type="date"
                              value={editData.details.dateOfAccident || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    dateOfAccident: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Case Type</p>
                            <select
                              disabled={!isEditing}
                              value={editData.details.caseType}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    caseType: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            >
                              <option value="Workers Compensation">
                                Workers Compensation
                              </option>
                              <option value="Personal Injury">Personal Injury</option>
                            </select>
                          </div>

                          <div className={`${cardFieldClass} md:col-span-2`}>
                            <p className={fieldLabelClass}>PI/WC Specific Claim ID</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.piWcSpecificClaimId || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    piWcSpecificClaimId: e.target.value,
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <Building2 size={20} className="text-primary" />
                          <span>Liability Carrier & Adjuster</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className={`${cardFieldClass} md:col-span-2`}>
                            <p className={fieldLabelClass}>Insurance Company</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.liabilityCarrier?.company || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    liabilityCarrier: {
                                      ...(editData.details.liabilityCarrier || {
                                        company: '',
                                        claimNumber: '',
                                        phone: '',
                                        fax: '',
                                        email: '',
                                      }),
                                      company: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Claim Number</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.liabilityCarrier?.claimNumber || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    liabilityCarrier: {
                                      ...(editData.details.liabilityCarrier || {
                                        company: '',
                                        claimNumber: '',
                                        phone: '',
                                        fax: '',
                                        email: '',
                                      }),
                                      claimNumber: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Carrier Phone</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.liabilityCarrier?.phone || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    liabilityCarrier: {
                                      ...(editData.details.liabilityCarrier || {
                                        company: '',
                                        claimNumber: '',
                                        phone: '',
                                        fax: '',
                                        email: '',
                                      }),
                                      phone: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className={cardFieldClass}>
                            <p className={fieldLabelClass}>Adjuster Email</p>
                            <input
                              disabled={!isEditing}
                              value={editData.details.adjusterDetails?.email || ''}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  details: {
                                    ...editData.details,
                                    adjusterDetails: {
                                      ...(editData.details.adjusterDetails || {
                                        phone: '',
                                        fax: '',
                                        email: '',
                                      }),
                                      email: e.target.value,
                                    },
                                  },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'DOC' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-6">
                        <h3 className={sectionTitleClass}>
                          <FileText size={20} className="text-primary" />
                          <span>Associated Documents</span>
                        </h3>

                        <div className="space-y-3">
                          {editData.details.documents?.map((doc, i) => (
                            <div
                              key={i}
                              className="group flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary dark:border-white/10 dark:bg-white/5">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    {doc.type} • {doc.uploadDate}
                                  </p>
                                </div>
                              </div>

                              <button className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-primary group-hover:opacity-100 dark:hover:bg-white/10">
                                <Eye size={18} />
                              </button>
                            </div>
                          ))}

                          <button className="flex w-full items-center justify-center space-x-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-bold text-slate-400 transition-all hover:border-primary/50 hover:text-primary dark:border-white/10 dark:text-slate-500">
                            <Plus size={18} />
                            <span>Upload New Document</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 border-t border-slate-200/70 p-8 dark:border-slate-700/60">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                      >
                        <Save size={18} />
                        <span>Save Changes</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditData(JSON.parse(JSON.stringify(selectedSubmission)));
                        }}
                        className="rounded-2xl border border-slate-200 px-8 py-4 font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <Edit2 size={18} />
                      <span>Edit Submission</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MySubmissionsView;