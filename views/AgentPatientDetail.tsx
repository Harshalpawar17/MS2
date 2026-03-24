
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Stethoscope, 
  Shield, 
  History, 
  FileText, 
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  Download,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Edit2,
  Save,
  X,
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Info,
  PlusCircle,
  Trash2
} from 'lucide-react';

interface PatientDetailProps {
  patient: any;
  onBack: () => void;
}

const AgentPatientDetail: React.FC<PatientDetailProps> = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState('Account Summary');
  const tabs = ['Account Summary', 'PA Data', 'PI', 'History/Activity Log', 'Documents', 'QA'];

  return (
    <div className="min-h-screen bg-gray-50 -m-10">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{patient.patientName}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{patient.accountId}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">DOB: {patient.dob}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    patient.urgencyLevel === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {patient.urgencyLevel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                Save Changes
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {activeTab === 'Account Summary' && <AccountSummaryTab patient={patient} />}
          {activeTab === 'PA Data' && <PADataTab patient={patient} />}
          {activeTab === 'PI' && <PITab patient={patient} />}
          {activeTab === 'History/Activity Log' && <HistoryTab />}
          {activeTab === 'Documents' && <DocumentsTab />}
          {activeTab === 'QA' && <QATab />}
        </div>
      </div>
    </div>
  );
};

// --- Tab Components ---

const AccountSummaryTab: React.FC<{ patient: any }> = ({ patient }) => {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [insuranceData, setInsuranceData] = useState({
    company: patient.insurance,
    planType: 'PPO',
    policyId: 'POL-998877',
    groupId: 'GRP-5544',
    payerId: 'PAY-123',
    effectiveDate: '2024-01-01',
    expireDate: '2025-12-31',
    processor: 'Navinet',
    isActive: true,
    relationship: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    dob: '1985-05-15'
  });

  const [showSecondary, setShowSecondary] = useState(false);
  const [secondaryData, setSecondaryData] = useState({
    company: 'United Healthcare',
    planType: 'HMO',
    policyId: 'SEC-112233',
    groupId: 'GRP-9900',
    payerId: 'PAY-456',
    effectiveDate: '2024-02-01',
    expireDate: '2025-02-01',
    processor: 'Availity',
    isActive: true,
    relationship: 'Spouse',
    firstName: 'Jane',
    lastName: 'Doe',
    dob: '1988-03-10'
  });

  const [showHistory, setShowHistory] = useState(false);
  const [insuranceHistory] = useState([
    {
      company: 'Blue Cross Blue Shield',
      planType: 'PPO',
      policyId: 'OLD-12345',
      groupId: 'GRP-1111',
      payerId: 'PAY-001',
      effectiveDate: '2022-01-01',
      expireDate: '2023-12-31',
      status: 'Previous',
      priority: 'Primary'
    },
    {
      company: 'Cigna',
      planType: 'HMO',
      policyId: 'OLD-67890',
      groupId: 'GRP-2222',
      payerId: 'PAY-002',
      effectiveDate: '2020-01-01',
      expireDate: '2021-12-31',
      status: 'Previous',
      priority: 'Secondary'
    }
  ]);

  const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${m}/${d}/${y}`;
  };

  const [expandedCoverage, setExpandedCoverage] = useState<string | null>(null);

  const assignedCoverages = [
    { 
      name: 'Chiropractic Coverage', 
      cpts: [
        { code: '98940', description: 'Spinal Adjustment (1-2 regions)' },
        { code: '98941', description: 'Spinal Adjustment (3-4 regions)' },
        { code: '98943', description: 'Extremity Adjustment' }
      ]
    },
    { 
      name: 'E/M Coverage', 
      cpts: [
        { code: '99203', description: 'New Patient Office Visit (Level 3)' },
        { code: '99213', description: 'Established Patient Office Visit (Level 3)' }
      ]
    },
    { 
      name: 'Imaging Coverage', 
      cpts: [
        { code: '72040', description: 'X-Ray Spine, Cervical (3 views)' },
        { code: '72100', description: 'X-Ray Spine, Lumbar (2-3 views)' }
      ]
    }
  ];

  const [coverageData, setCoverageData] = useState<Record<string, any>>({
    'Chiropractic Coverage': { copay: '', coinsurance: '', limit: '', limitUsed: '', authRequired: false, notes: '' },
    'E/M Coverage': { copay: '', coinsurance: '', limit: '', limitUsed: '', authRequired: false, notes: '' },
    'Imaging Coverage': { copay: '', coinsurance: '', limit: '', limitUsed: '', authRequired: false, notes: '' }
  });

  const [evWorkingData, setEvWorkingData] = useState({
    preExisting: false,
    referralRequired: false,
    policyActive: false,
    cobUpdate: false,
    contactPA: '',
    indivDeductibleAmount: '',
    indivDeductibleMet: '',
    indivDeductibleRemaining: '',
    indivOOPAmount: '',
    indivOOPMet: '',
    indivOOPRemaining: '',
    familyDeductibleAmount: '',
    familyDeductibleMet: '',
    familyDeductibleRemaining: '',
    familyOOPAmount: '',
    familyOOPMet: '',
    familyOOPRemaining: '',
    oopIncludesDeductible: false,
    deductibleCarryover: false,
    onlyOneCopay: false,
    agentName: '',
    referenceNumber: '',
    verificationType: '',
    pcpOnFile: ''
  });

  const previousNotes = [
    { text: "Patient ID uploaded, ready for verification.", user: "Sarah Miller", date: "2026-03-22 10:30 AM" },
    { text: "Insurance card front/back received.", user: "John Doe", date: "2026-03-21 02:15 PM" },
    { text: "Initial intake completed.", user: "System", date: "2026-03-20 09:00 AM" }
  ];

  return (
    <div className="space-y-8">
      {/* Basic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <InfoCard icon={User} title="Patient Info" items={[
          { label: 'Name', value: patient.patientName },
          { label: 'DOB', value: patient.dob },
          { label: 'Account ID', value: patient.accountId }
        ]} />
        <InfoCard icon={Building2} title="Clinic Info" items={[
          { label: 'Clinic', value: patient.clinicName },
          { label: 'Location', value: 'Main Branch' },
          { label: 'Program', value: patient.program }
        ]} />
        <InfoCard icon={Stethoscope} title="Provider Info" items={[
          { label: 'Name', value: patient.provider },
          { label: 'NPI', value: '1234567890' },
          { label: 'Taxonomy', value: '207R00000X' }
        ]} />
      </div>

      {/* Primary Insurance Details */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield size={20} className="text-primary" />
            <span>Insurance Details</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EditField label="Insurance Company" value={insuranceData.company} onChange={(v) => setInsuranceData({...insuranceData, company: v})} />
          <EditField label="Plan Type" value={insuranceData.planType} onChange={(v) => setInsuranceData({...insuranceData, planType: v})} />
          <EditField label="Policy ID" value={insuranceData.policyId} onChange={(v) => setInsuranceData({...insuranceData, policyId: v})} />
          <EditField label="Group ID" value={insuranceData.groupId} onChange={(v) => setInsuranceData({...insuranceData, groupId: v})} />
          <EditField label="Payer ID" value={insuranceData.payerId} onChange={(v) => setInsuranceData({...insuranceData, payerId: v})} />
          <EditField label="Effective Date" value={insuranceData.effectiveDate} type="date" onChange={(v) => setInsuranceData({...insuranceData, effectiveDate: v})} />
          <EditField label="Expiry Date" value={insuranceData.expireDate} type="date" onChange={(v) => setInsuranceData({...insuranceData, expireDate: v})} />
          <EditField label="Processor" value={insuranceData.processor} onChange={(v) => setInsuranceData({...insuranceData, processor: v})} />
          <div className="flex items-center space-x-2 pt-6">
            <input 
              type="checkbox" 
              checked={insuranceData.isActive} 
              onChange={(e) => setInsuranceData({...insuranceData, isActive: e.target.checked})}
              className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary" 
            />
            <span className="text-sm font-bold text-gray-700">Active Insurance</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Cardholder Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SelectField 
              label="Relationship" 
              value={insuranceData.relationship} 
              options={['Self', 'Spouse', 'Child', 'Other']} 
              onChange={(v) => setInsuranceData({...insuranceData, relationship: v})} 
            />
            <EditField label="First Name" value={insuranceData.firstName} onChange={(v) => setInsuranceData({...insuranceData, firstName: v})} />
            <EditField label="Last Name" value={insuranceData.lastName} onChange={(v) => setInsuranceData({...insuranceData, lastName: v})} />
            <EditField label="Date of Birth" value={insuranceData.dob} type="date" onChange={(v) => setInsuranceData({...insuranceData, dob: v})} />
          </div>
        </div>

        {showSecondary ? (
          <div className="pt-6 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Shield size={20} className="text-amber-500" />
                <span>Secondary Insurance Details</span>
              </h2>
              <button 
                onClick={() => setShowSecondary(false)}
                className="text-gray-400 hover:text-red-500 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EditField label="Insurance Company" value={secondaryData.company} onChange={(v) => setSecondaryData({...secondaryData, company: v})} />
              <EditField label="Plan Type" value={secondaryData.planType} onChange={(v) => setSecondaryData({...secondaryData, planType: v})} />
              <EditField label="Policy ID" value={secondaryData.policyId} onChange={(v) => setSecondaryData({...secondaryData, policyId: v})} />
              <EditField label="Group ID" value={secondaryData.groupId} onChange={(v) => setSecondaryData({...secondaryData, groupId: v})} />
              <EditField label="Payer ID" value={secondaryData.payerId} onChange={(v) => setSecondaryData({...secondaryData, payerId: v})} />
              <EditField label="Effective Date" value={secondaryData.effectiveDate} type="date" onChange={(v) => setSecondaryData({...secondaryData, effectiveDate: v})} />
              <EditField label="Expiry Date" value={secondaryData.expireDate} type="date" onChange={(v) => setSecondaryData({...secondaryData, expireDate: v})} />
              <EditField label="Processor" value={secondaryData.processor} onChange={(v) => setSecondaryData({...secondaryData, processor: v})} />
              <div className="flex items-center space-x-2 pt-6">
                <input 
                  type="checkbox" 
                  checked={secondaryData.isActive} 
                  onChange={(e) => setSecondaryData({...secondaryData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary" 
                />
                <span className="text-sm font-bold text-gray-700">Active Insurance</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Cardholder Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SelectField 
                  label="Relationship" 
                  value={secondaryData.relationship} 
                  options={['Self', 'Spouse', 'Child', 'Other']} 
                  onChange={(v) => setSecondaryData({...secondaryData, relationship: v})} 
                />
                <EditField label="First Name" value={secondaryData.firstName} onChange={(v) => setSecondaryData({...secondaryData, firstName: v})} />
                <EditField label="Last Name" value={secondaryData.lastName} onChange={(v) => setSecondaryData({...secondaryData, lastName: v})} />
                <EditField label="Date of Birth" value={secondaryData.dob} type="date" onChange={(v) => setSecondaryData({...secondaryData, dob: v})} />
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setShowSecondary(true)}
            className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">Secondary Insurance Warning</p>
              <p className="text-xs text-amber-700 mt-0.5">Patient has a secondary policy on file. Click to view details.</p>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <History size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
              <span>Insurance History</span>
            </div>
            {showHistory ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {showHistory && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {insuranceHistory.map((history, idx) => (
                <div key={idx} className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-bold text-gray-900">{history.company}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        history.priority === 'Primary' ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {history.priority}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {history.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DataField label="Plan Type" value={history.planType} />
                    <DataField label="Policy ID" value={history.policyId} />
                    <DataField label="Group ID" value={history.groupId} />
                    <DataField label="Payer ID" value={history.payerId} />
                    <DataField label="Effective" value={formatDate(history.effectiveDate)} />
                    <DataField label="Expired" value={formatDate(history.expireDate)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* EV Working Fields (formerly Benefit Financials) */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">EV Working Fields</h2>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Form Entry Mode
          </span>
        </div>

        {/* Status Flags - Horizontal Layout */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Status Flags</label>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.preExisting} onChange={(e) => setEvWorkingData({...evWorkingData, preExisting: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">Pre-existing Conditions</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.referralRequired} onChange={(e) => setEvWorkingData({...evWorkingData, referralRequired: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">Referral Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.policyActive} onChange={(e) => setEvWorkingData({...evWorkingData, policyActive: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">Policy Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.cobUpdate} onChange={(e) => setEvWorkingData({...evWorkingData, cobUpdate: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">COB Update</span>
            </div>
          </div>
        </div>

        {/* Form Fields - Structured Layout */}
        <div className="space-y-6">
          {/* Row 1: Contact for Prior Authorization */}
          <div className="grid grid-cols-1">
            <EditField label="Contact for Prior Authorization" value={evWorkingData.contactPA} onChange={(v) => setEvWorkingData({...evWorkingData, contactPA: v})} />
          </div>

          {/* Row 2: Agent Name, Reference Number, PCP On File */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EditField label="Agent Name" value={evWorkingData.agentName} onChange={(v) => setEvWorkingData({...evWorkingData, agentName: v})} />
            <EditField label="Reference Number" value={evWorkingData.referenceNumber} onChange={(v) => setEvWorkingData({...evWorkingData, referenceNumber: v})} />
            <EditField label="PCP On File" value={evWorkingData.pcpOnFile} onChange={(v) => setEvWorkingData({...evWorkingData, pcpOnFile: v})} />
          </div>

          {/* Row 3: Verification Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField label="Verification Type" value={evWorkingData.verificationType} options={['Phone', 'Online Portal', 'Fax', 'EVR']} onChange={(v) => setEvWorkingData({...evWorkingData, verificationType: v})} />
          </div>
        </div>

        {/* Financials Section */}
        <div className="pt-6 border-t border-gray-50 space-y-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Financial Details</h3>
          
          <div className="grid grid-cols-1 gap-8">
            {/* Individual */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Individual</h4>
              <div className="grid grid-cols-3 gap-4">
                <EditField label="Deductible ($)" value={evWorkingData.indivDeductibleAmount} onChange={(v) => setEvWorkingData({...evWorkingData, indivDeductibleAmount: v})} />
                <EditField label="Met ($)" value={evWorkingData.indivDeductibleMet} onChange={(v) => setEvWorkingData({...evWorkingData, indivDeductibleMet: v})} />
                <EditField label="Remaining ($)" value={evWorkingData.indivDeductibleRemaining} onChange={(v) => setEvWorkingData({...evWorkingData, indivDeductibleRemaining: v})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <EditField label="OOP Max ($)" value={evWorkingData.indivOOPAmount} onChange={(v) => setEvWorkingData({...evWorkingData, indivOOPAmount: v})} />
                <EditField label="Met ($)" value={evWorkingData.indivOOPMet} onChange={(v) => setEvWorkingData({...evWorkingData, indivOOPMet: v})} />
                <EditField label="Remaining ($)" value={evWorkingData.indivOOPRemaining} onChange={(v) => setEvWorkingData({...evWorkingData, indivOOPRemaining: v})} />
              </div>
            </div>

            {/* Family */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Family</h4>
              <div className="grid grid-cols-3 gap-4">
                <EditField label="Deductible ($)" value={evWorkingData.familyDeductibleAmount} onChange={(v) => setEvWorkingData({...evWorkingData, familyDeductibleAmount: v})} />
                <EditField label="Met ($)" value={evWorkingData.familyDeductibleMet} onChange={(v) => setEvWorkingData({...evWorkingData, familyDeductibleMet: v})} />
                <EditField label="Remaining ($)" value={evWorkingData.familyDeductibleRemaining} onChange={(v) => setEvWorkingData({...evWorkingData, familyDeductibleRemaining: v})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <EditField label="OOP Max ($)" value={evWorkingData.familyOOPAmount} onChange={(v) => setEvWorkingData({...evWorkingData, familyOOPAmount: v})} />
                <EditField label="Met ($)" value={evWorkingData.familyOOPMet} onChange={(v) => setEvWorkingData({...evWorkingData, familyOOPMet: v})} />
                <EditField label="Remaining ($)" value={evWorkingData.familyOOPRemaining} onChange={(v) => setEvWorkingData({...evWorkingData, familyOOPRemaining: v})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.oopIncludesDeductible} onChange={(e) => setEvWorkingData({...evWorkingData, oopIncludesDeductible: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">OOP Max Includes Deductible</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.deductibleCarryover} onChange={(e) => setEvWorkingData({...evWorkingData, deductibleCarryover: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">Deductible 1/4 Carryover</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={evWorkingData.onlyOneCopay} onChange={(e) => setEvWorkingData({...evWorkingData, onlyOneCopay: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm font-bold text-gray-700">Only One Copay (Largest)</span>
            </div>
          </div>
        </div>

        {/* Document Section */}
        <div className="pt-6 border-t border-gray-50 space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Documents</h3>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary/5 text-primary rounded-xl font-bold text-sm hover:bg-primary/10 transition-colors">
              <Upload size={16} />
              <span>Upload New Document</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
              <Eye size={16} />
              <span>View Patient Uploaded Documents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Coverage Status */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Coverage / Services (Showing clinic-selected services only)</h2>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Form Entry Mode
          </span>
        </div>

        <div className="space-y-4">
          {assignedCoverages.map((coverage) => (
            <div key={coverage.name} className="border border-gray-100 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-md">
              <button 
                onClick={() => setExpandedCoverage(expandedCoverage === coverage.name ? null : coverage.name)}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expandedCoverage === coverage.name ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <Stethoscope size={20} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{coverage.name}</span>
                </div>
                {expandedCoverage === coverage.name ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>

              <AnimatePresence>
                {expandedCoverage === coverage.name && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="p-8 border-t border-gray-50 bg-gray-50/30 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <EditField 
                          label="Copay ($)" 
                          value={coverageData[coverage.name].copay} 
                          onChange={(v) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], copay: v}})} 
                        />
                        <EditField 
                          label="Coinsurance / % Coverage" 
                          value={coverageData[coverage.name].coinsurance} 
                          onChange={(v) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], coinsurance: v}})} 
                        />
                        <EditField 
                          label="Visit Limit" 
                          value={coverageData[coverage.name].limit} 
                          onChange={(v) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], limit: v}})} 
                        />
                        <EditField 
                          label="Visit Limit Used" 
                          value={coverageData[coverage.name].limitUsed} 
                          onChange={(v) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], limitUsed: v}})} 
                        />
                        <div className="flex items-center space-x-2 pt-6">
                          <input 
                            type="checkbox" 
                            checked={coverageData[coverage.name].authRequired} 
                            onChange={(e) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], authRequired: e.target.checked}})}
                            className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary" 
                          />
                          <span className="text-sm font-bold text-gray-700">Auth Required / Prior Authorization</span>
                        </div>
                      </div>

                      <TextAreaField 
                        label="Coverage Notes" 
                        value={coverageData[coverage.name].notes} 
                        onChange={(v) => setCoverageData({...coverageData, [coverage.name]: {...coverageData[coverage.name], notes: v}})} 
                      />

                      {/* CPT Codes Section */}
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assigned CPT Codes (Read-Only)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {coverage.cpts.map((cpt) => (
                            <div key={cpt.code} className="flex items-center space-x-3 p-4 bg-white rounded-2xl border border-gray-100">
                              <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary text-[10px] font-black">
                                {cpt.code}
                              </div>
                              <span className="text-xs font-bold text-gray-700">{cpt.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Task Section - Moved to Bottom */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <CheckSquare size={20} className="text-primary" />
          <span>Complete Task</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm">
                <option>Select</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
              <textarea 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-medium text-sm min-h-[120px]"
                placeholder="Enter your notes here..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => setIsNotesModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Previous Notes
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
                Complete Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Notes Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Previous Notes</h2>
              <button onClick={() => setIsNotesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {previousNotes.map((note, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">"{note.text}"</p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-100">
                    <span>{note.user}</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setIsNotesModalOpen(false)}
                className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PADataTab: React.FC<{ patient: any }> = ({ patient }) => {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [paInsuranceData, setPaInsuranceData] = useState({
    company: patient.insurance || '',
    planType: '',
    policyId: '',
    groupId: '',
    payerId: '',
    effectiveDate: '',
    expiryDate: '',
    processor: '',
    isActive: false,
    relationship: '',
    firstName: '',
    lastName: '',
    dob: ''
  });

  const [paInfoData, setPaInfoData] = useState({
    authNumber: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    visitApproved: '',
    dx1: '',
    dx2: '',
    qa: '',
    notes: ''
  });

  const previousNotes = [
    { text: "Patient ID uploaded, ready for verification.", user: "Sarah Miller", date: "2026-03-22 10:30 AM" },
    { text: "Insurance card front/back received.", user: "John Doe", date: "2026-03-21 02:15 PM" },
    { text: "Initial intake completed.", user: "System", date: "2026-03-20 09:00 AM" }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">PA Insurance Details</h2>
          <a href="#" className="text-primary text-sm font-bold flex items-center space-x-1 hover:underline">
            <span>Complete by Portal</span>
            <ExternalLink size={14} />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EditField label="Insurance Company" value={paInsuranceData.company} onChange={(v) => setPaInsuranceData({...paInsuranceData, company: v})} />
          <EditField label="Plan Type" value={paInsuranceData.planType} onChange={(v) => setPaInsuranceData({...paInsuranceData, planType: v})} />
          <EditField label="Policy ID" value={paInsuranceData.policyId} onChange={(v) => setPaInsuranceData({...paInsuranceData, policyId: v})} />
          <EditField label="Group ID" value={paInsuranceData.groupId} onChange={(v) => setPaInsuranceData({...paInsuranceData, groupId: v})} />
          <EditField label="Payer ID" value={paInsuranceData.payerId} onChange={(v) => setPaInsuranceData({...paInsuranceData, payerId: v})} />
          <EditField label="Effective Date" value={paInsuranceData.effectiveDate} type="date" onChange={(v) => setPaInsuranceData({...paInsuranceData, effectiveDate: v})} />
          <EditField label="Expiry Date" value={paInsuranceData.expiryDate} type="date" onChange={(v) => setPaInsuranceData({...paInsuranceData, expiryDate: v})} />
          <EditField label="Processor" value={paInsuranceData.processor} onChange={(v) => setPaInsuranceData({...paInsuranceData, processor: v})} />
          <div className="flex items-center space-x-2 pt-6">
            <input 
              type="checkbox" 
              checked={paInsuranceData.isActive} 
              onChange={(e) => setPaInsuranceData({...paInsuranceData, isActive: e.target.checked})}
              className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary" 
            />
            <span className="text-sm font-bold text-gray-700">Active Insurance</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Cardholder Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SelectField 
              label="Relationship" 
              value={paInsuranceData.relationship} 
              options={['Self', 'Spouse', 'Child', 'Other']} 
              onChange={(v) => setPaInsuranceData({...paInsuranceData, relationship: v})} 
            />
            <EditField label="First Name" value={paInsuranceData.firstName} onChange={(v) => setPaInsuranceData({...paInsuranceData, firstName: v})} />
            <EditField label="Last Name" value={paInsuranceData.lastName} onChange={(v) => setPaInsuranceData({...paInsuranceData, lastName: v})} />
            <EditField label="Date of Birth" value={paInsuranceData.dob} type="date" onChange={(v) => setPaInsuranceData({...paInsuranceData, dob: v})} />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Prior Authorization Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EditField label="Authorization #" value={paInfoData.authNumber} onChange={(v) => setPaInfoData({...paInfoData, authNumber: v})} />
          <SelectField label="Status" value={paInfoData.status} options={['Approved', 'Denied', 'Pending', 'More Info Needed']} onChange={(v) => setPaInfoData({...paInfoData, status: v})} />
          <EditField label="Date Range From" value={paInfoData.dateFrom} type="date" onChange={(v) => setPaInfoData({...paInfoData, dateFrom: v})} />
          <EditField label="Date Range To" value={paInfoData.dateTo} type="date" onChange={(v) => setPaInfoData({...paInfoData, dateTo: v})} />
          <EditField label="Visit Approved" value={paInfoData.visitApproved} onChange={(v) => setPaInfoData({...paInfoData, visitApproved: v})} />
          <EditField label="DX 1" value={paInfoData.dx1} onChange={(v) => setPaInfoData({...paInfoData, dx1: v})} />
          <EditField label="DX 2" value={paInfoData.dx2} onChange={(v) => setPaInfoData({...paInfoData, dx2: v})} />
          <EditField label="QA" value={paInfoData.qa} onChange={(v) => setPaInfoData({...paInfoData, qa: v})} />
        </div>
        <div className="pt-4">
          <TextAreaField label="PA Notes" value={paInfoData.notes} onChange={(v) => setPaInfoData({...paInfoData, notes: v})} />
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <CheckSquare size={20} className="text-primary" />
          <span>Complete PA Task</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm">
                <option>Select</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
              <textarea 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-medium text-sm min-h-[120px]"
                placeholder="Enter your notes here..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => setIsNotesModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Previous Notes
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
                Complete Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Notes Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Previous Notes</h2>
              <button onClick={() => setIsNotesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {previousNotes.map((note, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-2">
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">"{note.text}"</p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-100">
                    <span>{note.user}</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setIsNotesModalOpen(false)}
                className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PITab: React.FC<{ patient: any }> = ({ patient }) => {
  const [piData, setPiData] = useState({
    firstName: patient.patientName?.split(' ')[0] || '',
    lastName: patient.patientName?.split(' ').slice(1).join(' ') || '',
    dob: patient.dob || '',
    gender: 'Male',
    dateOfIncident: '2024-02-15',
    caseType: 'Auto Incident',
    carrier: 'State Farm',
    claimNumber: 'SF-992211',
    carrierPhone: '888-555-0123',
    carrierFax: '',
    carrierEmail: '',
    carrierName: '',
    adjusterName: 'Mike Wilson',
    adjusterPhone: '888-555-0123',
    adjusterFax: '',
    adjusterEmail: '',
    caseManagerName: '',
    caseManagerEmail: '',
    caseManagerContact: '',
    specificClaimId: '',
    attorneyFirstName: '',
    attorneyLastName: '',
    attorneyPhone: '',
    attorneyFax: '',
    attorneyEmail: '',
    medInsuranceCompany: '',
    medPolicyId: '',
    medGroupId: '',
    medSubscriberName: '',
    lastDos: '',
    lastPaymentDate: '',
    totalCharges: '',
    paidToDate: '',
    accountBalance: '',
    lastPayment: '',
    lastPaymentMethod: ''
  });

  const [hasAttorney, setHasAttorney] = useState(false);
  const [isLopSent, setIsLopSent] = useState(false);
  const [hasMedicalInsurance, setHasMedicalInsurance] = useState(false);

  return (
    <div className="space-y-8">
      {/* Patient Information */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <User size={20} className="text-primary" />
          <span>Patient Information</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EditField label="First Name" value={piData.firstName} onChange={(v) => setPiData({...piData, firstName: v})} />
          <EditField label="Last Name" value={piData.lastName} onChange={(v) => setPiData({...piData, lastName: v})} />
          <EditField label="Date of Birth" value={piData.dob} type="date" onChange={(v) => setPiData({...piData, dob: v})} />
          <SelectField label="Gender" value={piData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => setPiData({...piData, gender: v})} />
        </div>
      </div>

      {/* Incident Details */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <AlertTriangle size={20} className="text-primary" />
          <span>Incident Details</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditField label="Date of Incident" value={piData.dateOfIncident} type="date" onChange={(v) => setPiData({...piData, dateOfIncident: v})} />
          <SelectField 
            label="Case Type" 
            value={piData.caseType} 
            options={['Slip and Fall', 'Worker Compensation', 'Auto Incident']} 
            onChange={(v) => setPiData({...piData, caseType: v})} 
          />
        </div>
      </div>

      {/* Liability Carrier & Adjuster */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Shield size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Liability Carrier & Adjuster</h2>
        </div>

        {/* Liability Carrier */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Liability Carrier</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SelectField 
              label="Insurance Company" 
              value={piData.carrier} 
              options={['State Farm', 'Geico', 'Progressive', 'Allstate']} 
              onChange={(v) => setPiData({...piData, carrier: v})} 
            />
            <EditField label="Claim Number" value={piData.claimNumber} onChange={(v) => setPiData({...piData, claimNumber: v})} />
            <EditField label="Carrier Phone" value={piData.carrierPhone} onChange={(v) => setPiData({...piData, carrierPhone: v})} />
            <EditField label="Carrier Fax" value={piData.carrierFax} onChange={(v) => setPiData({...piData, carrierFax: v})} />
            <EditField label="Carrier Email" value={piData.carrierEmail} onChange={(v) => setPiData({...piData, carrierEmail: v})} />
            <EditField label="Carrier Name" value={piData.carrierName} onChange={(v) => setPiData({...piData, carrierName: v})} />
          </div>
        </div>

        {/* Adjuster Information */}
        <div className="pt-6 border-t border-gray-50 space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Adjuster Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EditField label="Adjuster Name" value={piData.adjusterName} onChange={(v) => setPiData({...piData, adjusterName: v})} />
            <EditField label="Adjuster Phone" value={piData.adjusterPhone} onChange={(v) => setPiData({...piData, adjusterPhone: v})} />
            <EditField label="Adjuster Fax" value={piData.adjusterFax} onChange={(v) => setPiData({...piData, adjusterFax: v})} />
            <EditField label="Adjuster Email" value={piData.adjusterEmail} onChange={(v) => setPiData({...piData, adjusterEmail: v})} />
          </div>
        </div>
      </div>

      {/* Case Manager */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <User size={20} className="text-primary" />
          <span>Case Manager</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EditField label="Name" value={piData.caseManagerName} onChange={(v) => setPiData({...piData, caseManagerName: v})} />
          <EditField label="Email" value={piData.caseManagerEmail} onChange={(v) => setPiData({...piData, caseManagerEmail: v})} />
          <EditField label="Primary Contact" value={piData.caseManagerContact} onChange={(v) => setPiData({...piData, caseManagerContact: v})} />
        </div>
      </div>

      {/* PI / WC Specific Claim ID */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Shield size={20} className="text-primary" />
          <span>PI / WC Specific Claim ID</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EditField label="Claim ID" value={piData.specificClaimId} onChange={(v) => setPiData({...piData, specificClaimId: v})} />
        </div>
      </div>

      {/* Conditional Questions */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-bold text-gray-700">Does the patient have an attorney?</p>
            <div className="flex items-center space-x-4 mt-2">
              <button 
                onClick={() => setHasAttorney(true)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${hasAttorney ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setHasAttorney(false)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!hasAttorney ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                No
              </button>
            </div>
          </div>

          {hasAttorney && (
            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-6 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Attorney Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditField label="Attorney First Name" value={piData.attorneyFirstName} onChange={(v) => setPiData({...piData, attorneyFirstName: v})} />
                <EditField label="Attorney Last Name" value={piData.attorneyLastName} onChange={(v) => setPiData({...piData, attorneyLastName: v})} />
                <EditField label="Attorney Phone" value={piData.attorneyPhone} onChange={(v) => setPiData({...piData, attorneyPhone: v})} />
                <EditField label="Attorney Fax Number" value={piData.attorneyFax} onChange={(v) => setPiData({...piData, attorneyFax: v})} />
                <EditField label="Attorney Email" value={piData.attorneyEmail} onChange={(v) => setPiData({...piData, attorneyEmail: v})} />
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-bold text-gray-700">Was the LOP sent to the attorney?</p>
            <div className="flex items-center space-x-4 mt-2">
              <button 
                onClick={() => setIsLopSent(true)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${isLopSent ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setIsLopSent(false)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!isLopSent ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                No
              </button>
            </div>
          </div>

          {isLopSent && (
            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-6 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">LOP Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditField label="Last DOS" value={piData.lastDos} type="date" onChange={(v) => setPiData({...piData, lastDos: v})} />
                <EditField label="Last Payment Date" value={piData.lastPaymentDate} type="date" onChange={(v) => setPiData({...piData, lastPaymentDate: v})} />
                <EditField label="Total Charges" value={piData.totalCharges} onChange={(v) => setPiData({...piData, totalCharges: v})} />
                <EditField label="Paid to Date" value={piData.paidToDate} onChange={(v) => setPiData({...piData, paidToDate: v})} />
                <EditField label="Account Balance" value={piData.accountBalance} onChange={(v) => setPiData({...piData, accountBalance: v})} />
                <EditField label="Last Payment" value={piData.lastPayment} onChange={(v) => setPiData({...piData, lastPayment: v})} />
                <SelectField 
                  label="Last Payment Method" 
                  value={piData.lastPaymentMethod} 
                  options={['Cash', 'Check', 'Card', 'ACH', 'Wire', 'Other']} 
                  onChange={(v) => setPiData({...piData, lastPaymentMethod: v})} 
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm font-bold text-gray-700">Does the patient have medical insurance?</p>
            <div className="flex items-center space-x-4 mt-2">
              <button 
                onClick={() => setHasMedicalInsurance(true)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${hasMedicalInsurance ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setHasMedicalInsurance(false)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!hasMedicalInsurance ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
              >
                No
              </button>
            </div>
          </div>

          {hasMedicalInsurance && (
            <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-6 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Medical Insurance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditField label="Insurance Company" value={piData.medInsuranceCompany} onChange={(v) => setPiData({...piData, medInsuranceCompany: v})} />
                <EditField label="Policy ID" value={piData.medPolicyId} onChange={(v) => setPiData({...piData, medPolicyId: v})} />
                <EditField label="Group ID" value={piData.medGroupId} onChange={(v) => setPiData({...piData, medGroupId: v})} />
                <EditField label="Subscriber Name" value={piData.medSubscriberName} onChange={(v) => setPiData({...piData, medSubscriberName: v})} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <CheckSquare size={20} className="text-primary" />
          <span>Complete PI Task</span>
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <EditField label="Next Follow up date" value="2024-04-01" type="date" onChange={() => {}} />
              <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm">
                <option>Select Result</option>
                <option>Lien Signed</option>
                <option>Pending Attorney</option>
              </select>
            </div>
            <textarea className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-medium text-sm min-h-[100px]" placeholder="Notes..." />
          </div>
          <button className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Complete Task</button>
        </div>
      </div>
    </div>
  );
};

const HistoryTab: React.FC = () => {
  const events = [
    { type: 'Task Completed', user: 'Agent Smith', time: '2 hours ago', details: 'EV verified for Aetna PPO' },
    { type: 'Disposition Changed', user: 'System', time: '4 hours ago', details: 'Status moved from New to In Progress' },
    { type: 'Auto-assignment', user: 'System', time: '1 day ago', details: 'Assigned to Agent Smith based on workload' },
    { type: 'Field Updated', user: 'Clinic Staff', time: '1 day ago', details: 'Policy ID updated to POL-998877' },
  ];

  const majorChanges = [
    { type: 'Policy Update', timestamp: '2024-03-22 14:30', user: 'Agent Smith', description: 'Updated Policy ID from POL-123 to POL-998877' },
    { type: 'Case Type Change', timestamp: '2024-03-21 10:15', user: 'System', description: 'Automatically changed case type to Auto Incident based on intake' },
    { type: 'Attorney Assigned', timestamp: '2024-03-20 16:45', user: 'Clinic Staff', description: 'Assigned attorney John Wick to the case' },
  ];

  const allNotes = [
    { datetime: '2024-03-23 09:00', content: 'Patient called to confirm appointment.', source: 'Account Summary' },
    { datetime: '2024-03-22 11:30', content: 'Eligibility verified. Aetna PPO active.', source: 'EV' },
    { datetime: '2024-03-21 15:20', content: 'Prior auth requested for 10 visits.', source: 'PA' },
    { datetime: '2024-03-20 14:10', content: 'Attorney requested LOP status.', source: 'PI' },
  ];

  return (
    <div className="space-y-8">
      {/* Activity Log */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <History size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
        </div>
        <div className="space-y-6">
          {events.map((event, i) => (
            <div key={i} className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                <History size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">{event.type}</p>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{event.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tight">By: {event.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Major Account Changes */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Major Account Changes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Type</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User/System</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {majorChanges.map((change, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-gray-900">{change.type}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{change.timestamp}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${change.user === 'System' ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                      {change.user}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-600">{change.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Notes */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
            <MessageSquare size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">All Notes</h2>
        </div>
        <div className="space-y-4">
          {allNotes.map((note, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    note.source === 'EV' ? 'bg-green-100 text-green-600' :
                    note.source === 'PA' ? 'bg-blue-100 text-blue-600' :
                    note.source === 'PI' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {note.source}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{note.datetime}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DocumentsTab: React.FC = () => {
  const docs = [
    { name: 'Insurance_Card_Front.jpg', date: '2024-03-22', workflow: 'EV', source: 'Patient Upload', user: 'John Doe' },
    { name: 'Insurance_Card_Back.jpg', date: '2024-03-22', workflow: 'EV', source: 'Patient Upload', user: 'John Doe' },
    { name: 'Clinical_Notes_0320.pdf', date: '2024-03-20', workflow: 'PA', source: 'Clinic Upload', user: 'Sarah Miller' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Patient Documents</h2>
          <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-primary/20">
            <Upload size={18} />
            <span>Upload New Document</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Name</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflow</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded By</th>
                <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map((doc, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <FileText size={18} className="text-primary" />
                      <span className="text-sm font-bold text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{doc.date}</td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-700">{doc.workflow}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{doc.source}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{doc.user}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"><Eye size={16} /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"><Download size={16} /></button>
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

const QATab: React.FC = () => {
  const [checklist, setChecklist] = useState([
    { id: 1, question: 'Is Patient Name correct?', status: null },
    { id: 2, question: 'Is Policy ID verified?', status: null },
    { id: 3, question: 'Is Effective Date accurate?', status: null },
    { id: 4, question: 'Are Benefit Financials complete?', status: null },
    { id: 5, question: 'Is Network status confirmed?', status: null },
  ]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900">QA Validation Checklist</h2>
        <div className="space-y-4">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="text-sm font-bold text-gray-700">{item.question}</span>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all">Yes</button>
                <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">No</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900">QA Result</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Error Category</label>
            <select className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm">
              <option>No Error</option>
              <option>Data Entry Error</option>
              <option>Missing Information</option>
              <option>Incorrect Verification</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Final Notes</label>
            <textarea className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none outline-none font-medium text-sm min-h-[100px]" placeholder="Corrective steps..." />
          </div>
        </div>
        <button className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Submit QA</button>
      </div>
    </div>
  );
};

// --- Helper Components ---

const InfoCard: React.FC<{ icon: any, title: string, items: { label: string, value: string }[] }> = ({ icon: Icon, title, items }) => (
  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
    <div className="flex items-center space-x-2 text-primary">
      <Icon size={18} />
      <span className="text-sm font-black uppercase tracking-widest">{title}</span>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
          <span className="text-xs font-bold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const DataField: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
    <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>
  </div>
);

const EditField: React.FC<{ label: string, value: string, type?: string, onChange: (v: string) => void }> = ({ label, value, type = 'text', onChange }) => (
  <div>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
    />
  </div>
);

const SelectField: React.FC<{ label: string, value: string, options: string[], onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <div>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
    >
      <option value="">Select</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const TextAreaField: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
    <textarea 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
    />
  </div>
);

const CheckboxField: React.FC<{ label: string, checked: boolean, editable?: boolean, onChange?: (v: boolean) => void }> = ({ label, checked, editable, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <button 
      onClick={() => editable && onChange && onChange(!checked)}
      disabled={!editable}
      className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-200'} ${editable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  </div>
);

export default AgentPatientDetail;
