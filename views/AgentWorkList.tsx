
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Building2, 
  UserCircle, 
  Clock, 
  AlertCircle,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Activity,
  Calendar,
  MoreVertical,
  X,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Info,
  PlusCircle,
  Trash2,
  Edit2,
  Download,
  RotateCcw,
  History,
  Tag,
  ExternalLink,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Lock,
  Eye,
  Layout,
  UploadCloud
} from 'lucide-react';
import AgentPatientDetail from './AgentPatientDetail';

interface PatientWorkItem {
  id: string;
  patientName: string;
  accountId: string;
  caseType: 'EV' | 'PA' | 'PI' | 'Document';
  insurance: string;
  queueName: string;
  currentDisposition: string;
  emr: string;
  urgencyLevel: 'Urgent' | 'Standard' | 'Low';
  network: 'In' | 'Out';
  due: string;
  lastTouch: string;
  lastNote: string;
  provider: string;
  portfolio: string;
  clinicName: string;
  program: string;
  dob: string;
}

const MOCK_WORK_LIST: PatientWorkItem[] = [
  {
    id: '1',
    patientName: 'John Doe',
    accountId: 'ACC-1001',
    caseType: 'EV',
    insurance: 'Aetna PPO',
    queueName: 'Verification Queue',
    currentDisposition: 'New',
    emr: 'eClinicalWorks',
    urgencyLevel: 'Urgent',
    network: 'In',
    due: '2026-03-23T14:00:00Z',
    lastTouch: '2026-03-22T10:00:00Z',
    lastNote: 'Patient ID uploaded',
    provider: 'Dr. Smith',
    portfolio: 'Portfolio A',
    clinicName: 'Sage Health RCM Main',
    program: 'EV Program',
    dob: '1985-05-15'
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    accountId: 'ACC-1002',
    caseType: 'PA',
    insurance: 'BCBS',
    queueName: 'Auth Queue',
    currentDisposition: 'In Progress',
    emr: 'AthenaHealth',
    urgencyLevel: 'Standard',
    network: 'Out',
    due: '2026-03-24T09:00:00Z',
    lastTouch: '2026-03-23T08:30:00Z',
    lastNote: 'Waiting for clinicals',
    provider: 'Dr. Jones',
    portfolio: 'Portfolio B',
    clinicName: 'Elite Chiro One',
    program: 'PA Program',
    dob: '1990-08-22'
  },
  {
    id: '3',
    patientName: 'Robert Brown',
    accountId: 'ACC-1003',
    caseType: 'PI',
    insurance: 'State Farm',
    queueName: 'PI Queue',
    currentDisposition: 'Pending Attorney',
    emr: 'ChiroTouch',
    urgencyLevel: 'Low',
    network: 'In',
    due: '2026-03-25T17:00:00Z',
    lastTouch: '2026-03-21T15:45:00Z',
    lastNote: 'Attorney info requested',
    provider: 'Dr. Miller',
    portfolio: 'Portfolio C',
    clinicName: 'Myodetox Rehab Center',
    program: 'PI Program',
    dob: '1978-11-30'
  }
];

const AgentWorkList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientWorkItem | null>(null);
  const [filters, setFilters] = useState({
    provider: 'All',
    portfolio: 'All',
    clinicName: 'All',
    program: 'All'
  });

  const filteredList = useMemo(() => {
    return MOCK_WORK_LIST.filter(item => {
      const matchesSearch = 
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.insurance.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvider = filters.provider === 'All' || item.provider === filters.provider;
      const matchesPortfolio = filters.portfolio === 'All' || item.portfolio === filters.portfolio;
      const matchesClinic = filters.clinicName === 'All' || item.clinicName === filters.clinicName;
      const matchesProgram = filters.program === 'All' || item.program === filters.program;

      return matchesSearch && matchesProvider && matchesPortfolio && matchesClinic && matchesProgram;
    });
  }, [searchQuery, filters]);

  if (selectedPatient) {
    return <AgentPatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work List</h1>
          
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Patient Name, ID, Insurance, Provider..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none"
            value={filters.provider}
            onChange={(e) => setFilters({...filters, provider: e.target.value})}
          >
            <option value="All">All Providers</option>
            <option value="Dr. Smith">Dr. Smith</option>
            <option value="Dr. Jones">Dr. Jones</option>
            <option value="Dr. Miller">Dr. Miller</option>
          </select>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none"
            value={filters.portfolio}
            onChange={(e) => setFilters({...filters, portfolio: e.target.value})}
          >
            <option value="All">All Portfolios</option>
            <option value="Portfolio A">Portfolio A</option>
            <option value="Portfolio B">Portfolio B</option>
            <option value="Portfolio C">Portfolio C</option>
          </select>
          <select 
            className="px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-700 border-none"
            value={filters.clinicName}
            onChange={(e) => setFilters({...filters, clinicName: e.target.value})}
          >
            <option value="All">All Clinics</option>
            <option value="Sage Health RCM Main">Sage Health RCM Main</option>
            <option value="Elite Chiro One">Elite Chiro One</option>
            <option value="Myodetox Rehab Center">Myodetox Rehab Center</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            <select 
              className="px-4 py-2 bg-gray-50 rounded-xl outline-none font-bold text-xs text-gray-700 border-none"
              value={filters.program}
              onChange={(e) => setFilters({...filters, program: e.target.value})}
            >
              <option value="All">All Programs</option>
              <option value="EV Program">EV Program</option>
              <option value="PA Program">PA Program</option>
              <option value="PI Program">PI Program</option>
            </select>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setFilters({ provider: 'All', portfolio: 'All', clinicName: 'All', program: 'All' }); }}
            className="px-4 py-2 text-primary hover:bg-primary/5 rounded-xl font-bold text-sm transition-colors flex items-center space-x-2"
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name / ID</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Type</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurance</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Queue</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disposition</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider/Clinic</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">EMR</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Touch</th>
              <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Note</th>
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
                  <p className="text-xs font-bold text-gray-900">{item.provider}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{item.clinicName}</p>
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
                  <p className="text-xs font-bold text-gray-900">{new Date(item.due).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(item.lastTouch).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">{item.lastNote}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentWorkList;
