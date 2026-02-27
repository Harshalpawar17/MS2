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
  CheckCircle,
  X,
  Edit2,
  Save,
  UserCircle,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Clock,
  Plus,
  FileKey,
  CreditCard,
  Info
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
        subscriberName: 'John Doe'
      },
      selectionPath: 'Benefit Check',
      cptCodes: ['97110', '97140']
    }
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
      clinicalNarrative: 'Patient presents with chronic low back pain and radiculopathy.',
      approvalStatus: 'Pending'
    }
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
        { name: 'Clinical_Notes.pdf', type: 'Supporting', uploadDate: '02/22/2026' }
      ]
    }
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
        email: 'claims@travelers.com'
      },
      adjusterDetails: {
        phone: '(555) 111-4444',
        fax: '(555) 111-5555',
        email: 'j.adjuster@travelers.com'
      },
      piWcSpecificClaimId: 'CLAIM-ID-5544'
    }
  }
];

interface MySubmissionsViewProps {
  userRole: UserRole;
}

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

  const statuses = [
    'All', 'Pending', 'Data Entry', 'Quality Control', 
    'Escalated to Account Management', 'Clinic Action Required'
  ];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(item => {
      const typeMatch = activeType === 'All' || item.type === activeType;
      const statusMatch = activeStatus === 'All' || item.status === activeStatus;
      const searchMatch = item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.caseId.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [submissions, activeType, activeStatus, searchQuery]);

  const clinicActionsCount = submissions.filter(s => s.status === 'Clinic Action Required').length;

  const handleRowClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEditData(JSON.parse(JSON.stringify(submission))); // Deep copy for editing
    setIsDrawerOpen(true);
    setIsEditing(false);
    
    // Set default tab based on type
    if (submission.type === 'EV') setActiveTab('EV');
    else if (submission.type === 'PA') setActiveTab('PA');
    else if (submission.type === 'WC/PI') setActiveTab('WC/PI');
    else if (submission.type === 'DOC') setActiveTab('DOC');
    else setActiveTab('Overview');
  };

  const handleSave = () => {
    if (editData) {
      setSubmissions(prev => prev.map(s => s.id === editData.id ? editData : s));
      setSelectedSubmission(editData);
      setIsEditing(false);
      showToast("Changes saved successfully");
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle size={18} className="text-primary" />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          {clinicActionsCount > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-sm font-black text-red-600 uppercase tracking-widest">Clinic Action Required ({clinicActionsCount})</span>
              <button 
                onClick={() => {
                  setActiveStatus('Clinic Action Required');
                  showToast("Filtering for actions required");
                }}
                className="ml-2 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                View Action
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by patient name or case ID..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            {['All', 'EV', 'PA', 'WC/PI', 'DOC'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveType(t as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primaryText'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <select 
            value={activeStatus}
            onChange={e => setActiveStatus(e.target.value)}
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none min-w-[200px]"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'Submission Status' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case ID</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Date</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSubmissions.length > 0 ? filteredSubmissions.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => handleRowClick(item)}
                className={`hover:bg-gray-50/80 cursor-pointer transition-colors group ${selectedSubmission?.id === item.id ? 'bg-primary/5' : ''}`}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {item.patientName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.patientName}</span>
                  </div>
                </td>
                <td className="px-8 py-5 font-mono text-sm font-bold text-primary">{item.caseId}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    item.type === 'EV' ? 'bg-blue-50 text-blue-700' : 
                    item.type === 'PA' ? 'bg-purple-50 text-purple-700' :
                    item.type === 'WC/PI' ? 'bg-orange-50 text-orange-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar size={14} />
                    <span className="text-xs font-medium">{item.submittedDate}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <FileText size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">No submissions found</p>
                      <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {isDrawerOpen && selectedSubmission && editData && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedSubmission.patientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.patientName}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedSubmission.status)}`}>
                      {selectedSubmission.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedSubmission.caseId} • {selectedSubmission.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    <Edit2 size={24} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <Save size={24} />
                  </button>
                )}
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-8">
              {['Overview', 'EV', 'PA', 'WC/PI', 'DOC'].map((tab) => (
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
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'Overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Name</p>
                      <input 
                        disabled={!isEditing}
                        value={editData.details.patientFirstName}
                        onChange={e => setEditData({...editData, details: {...editData.details, patientFirstName: e.target.value}})}
                        className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
                      />
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Name</p>
                      <input 
                        disabled={!isEditing}
                        value={editData.details.patientLastName}
                        onChange={e => setEditData({...editData, details: {...editData.details, patientLastName: e.target.value}})}
                        className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
                      />
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</p>
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-400" />
                        <input 
                          disabled={!isEditing}
                          value={editData.details.patientDob}
                          onChange={e => setEditData({...editData, details: {...editData.details, patientDob: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:opacity-100"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case ID</p>
                      <div className="flex items-center space-x-2">
                        <FileText size={14} className="text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">{selectedSubmission.caseId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'EV' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <ShieldCheck size={20} className="text-primary" />
                      <span>Insurance Information</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Carrier</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.primaryInsurance?.carrier || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, carrier: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Policy ID</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.primaryInsurance?.policyId || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, policyId: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Group Number</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.primaryInsurance?.groupNumber || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, groupNumber: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscriber Name</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.primaryInsurance?.subscriberName || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, primaryInsurance: {...editData.details.primaryInsurance!, subscriberName: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <Filter size={20} className="text-primary" />
                      <span>Selection Path & Codes</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selection Path</p>
                        <select 
                          disabled={!isEditing}
                          value={editData.details.selectionPath}
                          onChange={e => setEditData({...editData, details: {...editData.details, selectionPath: e.target.value as any}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        >
                          <option value="Eligibility Check">Eligibility Check</option>
                          <option value="Benefit Check">Benefit Check</option>
                        </select>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CPT Codes</p>
                        <p className="text-sm font-bold text-gray-900">{editData.details.cptCodes?.join(', ') || 'None'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'PA' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <FileKey size={20} className="text-primary" />
                      <span>Authorization Details</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request Category</p>
                        <select 
                          disabled={!isEditing}
                          value={editData.details.requestCategory}
                          onChange={e => setEditData({...editData, details: {...editData.details, requestCategory: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        >
                          <option value="DMS/Supplies">DMS/Supplies</option>
                          <option value="Diagnostic Services">Diagnostic Services</option>
                        </select>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested Procedure / CPT</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.requestedProcedure || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, requestedProcedure: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinical Narrative</p>
                        <textarea 
                          disabled={!isEditing}
                          value={editData.details.clinicalNarrative || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, clinicalNarrative: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none min-h-[100px] resize-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approval Status</p>
                        <p className="text-sm font-bold text-gray-900">{editData.details.approvalStatus}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'WC/PI' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <Scale size={20} className="text-primary" />
                      <span>Incidental & Case Details</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date of Accident</p>
                        <input 
                          disabled={!isEditing}
                          type="date"
                          value={editData.details.dateOfAccident || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, dateOfAccident: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Type</p>
                        <select 
                          disabled={!isEditing}
                          value={editData.details.caseType}
                          onChange={e => setEditData({...editData, details: {...editData.details, caseType: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        >
                          <option value="Workers Compensation">Workers Compensation</option>
                          <option value="Personal Injury">Personal Injury</option>
                        </select>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2 col-span-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PI/WC Specific Claim ID</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.piWcSpecificClaimId || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, piWcSpecificClaimId: e.target.value}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <Building2 size={20} className="text-primary" />
                      <span>Liability Carrier & Adjuster</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2 col-span-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurance Company</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.liabilityCarrier?.company || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, company: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Claim Number</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.liabilityCarrier?.claimNumber || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, claimNumber: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carrier Phone</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.liabilityCarrier?.phone || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, liabilityCarrier: {...editData.details.liabilityCarrier!, phone: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjuster Email</p>
                        <input 
                          disabled={!isEditing}
                          value={editData.details.adjusterDetails?.email || ''}
                          onChange={e => setEditData({...editData, details: {...editData.details, adjusterDetails: {...editData.details.adjusterDetails!, email: e.target.value}}})}
                          className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'DOC' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <FileText size={20} className="text-primary" />
                      <span>Associated Documents</span>
                    </h3>
                    <div className="space-y-3">
                      {editData.details.documents?.map((doc, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{doc.type} • {doc.uploadDate}</p>
                            </div>
                          </div>
                          <button className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <Eye size={18} />
                          </button>
                        </div>
                      ))}
                      <button className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center space-x-2">
                        <Plus size={18} />
                        <span>Upload New Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-8 border-t border-gray-100 flex items-center space-x-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>Save Changes</span>
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setEditData(JSON.parse(JSON.stringify(selectedSubmission))); }}
                    className="px-8 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
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
  );
};

export default MySubmissionsView;