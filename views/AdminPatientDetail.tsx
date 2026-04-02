import React from 'react';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Stethoscope, 
  Shield, 
  ClipboardList, 
  Clock, 
  MessageSquare,
  MapPin,
  Phone,
  Printer,
  Check,
  AlertTriangle,
  FileText,
  Activity,
  UserCircle,
  Calendar
} from 'lucide-react';
import { AdminPatientWorkItem } from './AdminPatientListing';

interface AdminPatientDetailProps {
  patient: AdminPatientWorkItem;
  onBack: () => void;
}

const formatDateToAmerican = (dateStr: string | undefined) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

const ReadOnlyField: React.FC<{ label: string, value: string | number | undefined }> = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</span>
    <div className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-transparent font-bold text-sm text-gray-900 min-h-[42px] flex items-center">
      {value || 'N/A'}
    </div>
  </div>
);

const ReadOnlyCheckbox: React.FC<{ label: string, checked: boolean | undefined }> = ({ label, checked }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100/50">
    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-transparent'}`}>
      <Check size={14} strokeWidth={4} />
    </div>
    <span className="text-sm font-bold text-gray-700">{label}</span>
  </div>
);

const AdminPatientDetail: React.FC<AdminPatientDetailProps> = ({ patient, onBack }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm group"
        >
          <div className="p-2 bg-white rounded-xl border border-gray-100 group-hover:border-primary/20 shadow-sm transition-all">
            <ArrowLeft size={18} />
          </div>
          <span>Back to Listing</span>
        </button>
        <div className="flex items-center space-x-3">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
            patient.urgencyLevel === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
            patient.urgencyLevel === 'Standard' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {patient.urgencyLevel} Priority
          </span>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
            patient.caseType === 'EV' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            patient.caseType === 'PA' ? 'bg-purple-50 text-purple-600 border-purple-100' :
            'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {patient.caseType} Case
          </span>
        </div>
      </div>

      {/* Single Column Stacked Layout */}
      <div className="space-y-8">
        
        {/* Section 1: Patient Information */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 1: Patient Information</h3>
              <p className="text-xl font-black text-gray-900 tracking-tight">{patient.patientName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-50">
            <ReadOnlyField label="Patient ID" value={patient.accountId} />
            <ReadOnlyField label="DOB" value={formatDateToAmerican(patient.dob)} />
            <ReadOnlyField label="Case Type" value={patient.caseType} />
            <ReadOnlyField label="EMR" value={patient.emr} />
            <ReadOnlyField label="Urgency" value={patient.urgencyLevel} />
            <ReadOnlyField label="Network" value={patient.network ? `${patient.network}-Network` : 'N/A'} />
            <ReadOnlyField label="Assigned Agent" value={patient.assignedAgent} />
          </div>
        </div>

        {/* Section 2: Clinic Information */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 2: Clinic Information</h3>
              <p className="text-lg font-black text-gray-900 tracking-tight">{patient.clinicName || 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
            <ReadOnlyField label="Address" value={patient.clinicDetails?.address} />
            <ReadOnlyField label="Phone" value={patient.clinicDetails?.phone} />
            <ReadOnlyField label="Fax" value={patient.clinicDetails?.fax} />
          </div>
        </div>

        {/* Section 3: Provider Information */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 3: Provider Information</h3>
              <p className="text-lg font-black text-gray-900 tracking-tight">{patient.provider || 'N/A'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <ReadOnlyField label="NPI" value={patient.providerDetails?.npi} />
            <ReadOnlyField label="Specialty" value={patient.providerDetails?.specialty} />
          </div>
        </div>

        {/* Section 4: Insurance Details */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Shield size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 4: Insurance Details</h3>
          </div>

          <div className="space-y-8">
            {/* Primary Insurance */}
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Primary Insurance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReadOnlyField label="Carrier" value={patient.primaryInsurance?.carrier} />
                <ReadOnlyField label="Policy ID" value={patient.primaryInsurance?.policyId} />
                <ReadOnlyField label="Group #" value={patient.primaryInsurance?.group} />
                <ReadOnlyField label="Phone" value={patient.primaryInsurance?.phone} />
              </div>
            </div>

            {/* Secondary Insurance */}
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secondary Insurance</p>
              {patient.secondaryInsurance ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ReadOnlyField label="Carrier" value={patient.secondaryInsurance.carrier} />
                  <ReadOnlyField label="Policy ID" value={patient.secondaryInsurance.policyId} />
                  <ReadOnlyField label="Group #" value={patient.secondaryInsurance.group} />
                </div>
              ) : (
                <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-300 italic">No Secondary Insurance on File</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: EV Details */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 5: EV Details</h3>
          </div>

          <div className="space-y-8">
            {/* Status Flags */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Flags</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReadOnlyCheckbox label="Pre-existing Conditions" checked={false} />
                <ReadOnlyCheckbox label="Referral Required" checked={false} />
                <ReadOnlyCheckbox label="Policy Active" checked={true} />
                <ReadOnlyCheckbox label="COB Update" checked={false} />
              </div>
            </div>

            {/* Financials */}
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Individual Financials</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReadOnlyField label="Deductible Amount" value="N/A" />
                <ReadOnlyField label="Deductible Met" value="N/A" />
                <ReadOnlyField label="Deductible Remaining" value="N/A" />
                <ReadOnlyField label="OOP Amount" value="N/A" />
                <ReadOnlyField label="OOP Met" value="N/A" />
                <ReadOnlyField label="OOP Remaining" value="N/A" />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Family Financials</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReadOnlyField label="Deductible Amount" value="N/A" />
                <ReadOnlyField label="Deductible Met" value="N/A" />
                <ReadOnlyField label="Deductible Remaining" value="N/A" />
                <ReadOnlyField label="OOP Amount" value="N/A" />
                <ReadOnlyField label="OOP Met" value="N/A" />
                <ReadOnlyField label="OOP Remaining" value="N/A" />
              </div>
            </div>

            {/* Verification Details */}
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReadOnlyField label="Agent Name" value="N/A" />
                <ReadOnlyField label="Reference Number" value="N/A" />
                <ReadOnlyField label="Verification Type" value="N/A" />
                <ReadOnlyField label="PCP On File" value="N/A" />
              </div>
            </div>

            {/* EV Summary */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EV Summary Notes</h4>
              <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100 min-h-[80px]">
                <p className="text-sm font-medium text-blue-900 leading-relaxed">
                  {patient.caseDetails?.ev || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: PA Details */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 6: PA Details</h3>
          </div>

          <div className="space-y-8">
            {/* Prior Authorization Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ReadOnlyField label="Authorization #" value="N/A" />
              <ReadOnlyField label="Status" value="N/A" />
              <ReadOnlyField label="Date Range From" value="N/A" />
              <ReadOnlyField label="Date Range To" value="N/A" />
              <ReadOnlyField label="Visit Approved" value="N/A" />
              <ReadOnlyField label="DX 1" value="N/A" />
              <ReadOnlyField label="DX 2" value="N/A" />
              <ReadOnlyField label="QA" value="N/A" />
            </div>

            {/* PA Summary */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PA Summary Notes</h4>
              <div className="p-6 bg-purple-50/30 rounded-3xl border border-purple-100 min-h-[80px]">
                <p className="text-sm font-medium text-purple-900 leading-relaxed">
                  {patient.caseDetails?.pa || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: PI Details */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 7: PI Details</h3>
          </div>

          <div className="space-y-8">
            {/* Incident Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incident Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReadOnlyField label="Date of Incident" value="N/A" />
                <ReadOnlyField label="Case Type" value="N/A" />
              </div>
            </div>

            {/* Liability Carrier */}
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liability Carrier</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReadOnlyField label="Insurance Company" value="N/A" />
                <ReadOnlyField label="Claim Number" value="N/A" />
                <ReadOnlyField label="Carrier Phone" value="N/A" />
                <ReadOnlyField label="Carrier Fax" value="N/A" />
                <ReadOnlyField label="Carrier Email" value="N/A" />
                <ReadOnlyField label="Carrier Name" value="N/A" />
              </div>
            </div>

            {/* Adjuster Information */}
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adjuster Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReadOnlyField label="Adjuster Name" value="N/A" />
                <ReadOnlyField label="Adjuster Phone" value="N/A" />
                <ReadOnlyField label="Adjuster Fax" value="N/A" />
                <ReadOnlyField label="Adjuster Email" value="N/A" />
              </div>
            </div>

            {/* Attorney Details */}
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attorney Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReadOnlyField label="Attorney Name" value="N/A" />
                <ReadOnlyField label="Attorney Phone" value="N/A" />
                <ReadOnlyField label="Attorney Email" value="N/A" />
              </div>
            </div>

            {/* PI Summary */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PI Summary Notes</h4>
              <div className="p-6 bg-orange-50/30 rounded-3xl border border-orange-100 min-h-[80px]">
                <p className="text-sm font-medium text-orange-900 leading-relaxed">
                  {patient.caseDetails?.pi || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Workflow / Status Information */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600">
              <Clock size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 8: Workflow / Status Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReadOnlyField label="Current Queue" value={patient.queueName} />
            <ReadOnlyField label="Current Disposition" value={patient.currentDisposition} />
            <ReadOnlyField label="QA Status / Stage" value="N/A" />
          </div>
        </div>

        {/* Section 9: Notes */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Section 9: Notes</h3>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 min-h-[120px]">
              {patient.lastNote ? (
                <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                  "{patient.lastNote}"
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-400 italic">N/A</p>
              )}
            </div>
            <div className="flex items-center justify-end">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Touch</p>
                <p className="text-xs font-bold text-gray-900">{formatDateToAmerican(patient.lastTouch)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPatientDetail;
