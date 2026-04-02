
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Building2, 
  UserCircle, 
  Clock, 
  X,
  ArrowUpDown,
  MoreVertical,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import AdminPatientDetail from './AdminPatientDetail';

export interface AdminPatientWorkItem {
  id: string;
  patientName: string;
  accountId: string;
  caseType: 'EV' | 'PA' | 'PI' | 'Document';
  insurance: string;
  queueName: string;
  currentDisposition: string;
  assignedAgent: string;
  provider: string;
  clinicName: string;
  emr: string;
  urgencyLevel: 'Urgent' | 'Standard' | 'Low';
  network: 'In' | 'Out';
  due: string;
  lastTouch: string;
  lastNote: string;
  dob: string;
  // Additional details for the detail view
  primaryInsurance: {
    carrier: string;
    policyId: string;
    group: string;
    phone: string;
  };
  secondaryInsurance?: {
    carrier: string;
    policyId: string;
    group: string;
  };
  clinicDetails: {
    address: string;
    phone: string;
    fax: string;
  };
  providerDetails: {
    npi: string;
    specialty: string;
  };
  caseDetails: {
    ev: string;
    pa: string;
    pi: string;
  };
}

export const MOCK_ADMIN_WORK_LIST: AdminPatientWorkItem[] = [
  {
    id: '1',
    patientName: 'John Doe',
    accountId: 'ACC-1001',
    caseType: 'EV',
    insurance: 'Aetna PPO',
    queueName: 'Verification Queue',
    currentDisposition: 'New',
    assignedAgent: 'Agent Smith',
    provider: 'Dr. Smith',
    clinicName: 'Sage Health RCM Main',
    emr: 'eClinicalWorks',
    urgencyLevel: 'Urgent',
    network: 'In',
    due: '2026-03-23T14:00:00Z',
    lastTouch: '2026-03-22T10:00:00Z',
    lastNote: 'Patient ID uploaded. Waiting for insurance callback.',
    dob: '1985-05-15',
    primaryInsurance: {
      carrier: 'Aetna PPO',
      policyId: 'AET-992211',
      group: 'GRP-100',
      phone: '800-555-0123'
    },
    clinicDetails: {
      address: '123 Main St, New York, NY 10001',
      phone: '212-555-0199',
      fax: '212-555-0198'
    },
    providerDetails: {
      npi: '1234567890',
      specialty: 'Physical Therapy'
    },
    caseDetails: {
      ev: 'Eligibility verified for 2026. Deductible $500, Met $200.',
      pa: 'Prior authorization not required for initial evaluation.',
      pi: 'N/A'
    }
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    accountId: 'ACC-1002',
    caseType: 'PA',
    insurance: 'BCBS',
    queueName: 'Auth Queue',
    currentDisposition: 'In Progress',
    assignedAgent: 'Agent Johnson',
    provider: 'Dr. Jones',
    clinicName: 'Elite Chiro One',
    emr: 'AthenaHealth',
    urgencyLevel: 'Standard',
    network: 'Out',
    due: '2026-03-24T09:00:00Z',
    lastTouch: '2026-03-23T08:30:00Z',
    lastNote: 'Waiting for clinicals from the provider.',
    dob: '1990-08-22',
    primaryInsurance: {
      carrier: 'BCBS',
      policyId: 'BCB-883322',
      group: 'GRP-200',
      phone: '800-555-0456'
    },
    clinicDetails: {
      address: '456 Oak Ave, Chicago, IL 60601',
      phone: '312-555-0288',
      fax: '312-555-0287'
    },
    providerDetails: {
      npi: '0987654321',
      specialty: 'Chiropractic'
    },
    caseDetails: {
      ev: 'Eligibility active. Out-of-network benefits apply.',
      pa: 'PA submitted on 03/20. Pending payer review.',
      pi: 'N/A'
    }
  },
  {
    id: '3',
    patientName: 'Robert Brown',
    accountId: 'ACC-1003',
    caseType: 'PI',
    insurance: 'State Farm',
    queueName: 'PI Queue',
    currentDisposition: 'Pending Attorney',
    assignedAgent: 'Agent Miller',
    provider: 'Dr. Miller',
    clinicName: 'Myodetox Rehab Center',
    emr: 'ChiroTouch',
    urgencyLevel: 'Low',
    network: 'In',
    due: '2026-03-25T17:00:00Z',
    lastTouch: '2026-03-21T15:45:00Z',
    lastNote: 'Attorney info requested via email.',
    dob: '1978-11-30',
    primaryInsurance: {
      carrier: 'State Farm',
      policyId: 'SF-774433',
      group: 'N/A',
      phone: '800-555-0789'
    },
    secondaryInsurance: {
      carrier: 'Medicare',
      policyId: 'MED-112233',
      group: 'N/A'
    },
    clinicDetails: {
      address: '789 Pine Rd, Los Angeles, CA 90001',
      phone: '213-555-0377',
      fax: '213-555-0376'
    },
    providerDetails: {
      npi: '1122334455',
      specialty: 'Rehabilitation'
    },
    caseDetails: {
      ev: 'N/A',
      pa: 'N/A',
      pi: 'Personal injury case. LOP received from attorney. Adjuster sarah.connor@statefarm.com'
    }
  }
];

const formatDateToAmerican = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

const AdminPatientListing: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<AdminPatientWorkItem | null>(null);
  const [filters, setFilters] = useState({
    caseType: 'All',
    urgency: 'All',
    network: 'All'
  });

  const filteredList = useMemo(() => {
    return MOCK_ADMIN_WORK_LIST.filter(item => {
      const matchesSearch = 
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.insurance.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assignedAgent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clinicName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCaseType = filters.caseType === 'All' || item.caseType === filters.caseType;
      const matchesUrgency = filters.urgency === 'All' || item.urgencyLevel === filters.urgency;
      const matchesNetwork = filters.network === 'All' || item.network === filters.network;

      return matchesSearch && matchesCaseType && matchesUrgency && matchesNetwork;
    });
  }, [searchQuery, filters]);

  if (selectedPatient) {
    return <AdminPatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Listing</h1>
          
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Name, ID, Insurance, Agent, Provider..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none"
            value={filters.caseType}
            onChange={(e) => setFilters({...filters, caseType: e.target.value})}
          >
            <option value="All">All Case Types</option>
            <option value="EV">EV</option>
            <option value="PA">PA</option>
            <option value="PI">PI</option>
          </select>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none"
            value={filters.urgency}
            onChange={(e) => setFilters({...filters, urgency: e.target.value})}
          >
            <option value="All">All Urgency</option>
            <option value="Urgent">Urgent</option>
            <option value="Standard">Standard</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            <select 
              className="px-4 py-2 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-700 border-none"
              value={filters.network}
              onChange={(e) => setFilters({...filters, network: e.target.value})}
            >
              <option value="All">All Networks</option>
              <option value="In">In-Network</option>
              <option value="Out">Out-of-Network</option>
            </select>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setFilters({ caseType: 'All', urgency: 'All', network: 'All' }); }}
            className="px-4 py-2 text-primary hover:bg-primary/5 rounded-xl font-bold text-sm transition-colors flex items-center space-x-2"
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1800px]">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name / ID</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Type</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurance</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Queue</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disposition</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned To</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinic</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">EMR</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Touch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredList.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => setSelectedPatient(item)}
                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.patientName}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{item.accountId}</p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    item.caseType === 'EV' ? 'bg-blue-100 text-blue-700' :
                    item.caseType === 'PA' ? 'bg-purple-100 text-purple-700' :
                    item.caseType === 'PI' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.caseType}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm font-bold text-gray-700">{item.insurance}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-900">{item.queueName}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-[10px] text-gray-400 font-medium">{item.currentDisposition}</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCircle size={14} className="text-primary" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">{item.assignedAgent}</p>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-900">{item.provider}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-900">{item.clinicName}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-900">{item.emr}</p>
                </td>
                <td className="px-6 py-5">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    item.urgencyLevel === 'Urgent' ? 'text-red-500' :
                    item.urgencyLevel === 'Standard' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>
                    {item.urgencyLevel}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    item.network === 'In' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.network}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-900">{formatDateToAmerican(item.due)}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-[10px] text-gray-400 font-medium">{formatDateToAmerican(item.lastTouch)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPatientListing;
