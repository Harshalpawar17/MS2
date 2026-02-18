
import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  Search, 
  ChevronLeft, 
  Image as ImageIcon,
  MapPin,
  Trash2,
  CheckCircle2,
  Settings,
  ShieldCheck,
  ExternalLink,
  Key,
  Info,
  Lock,
  PlusCircle,
  XCircle,
  Edit2
} from 'lucide-react';
import { CLINIC_PODS, PORTFOLIOS } from '../constants';
import { Clinic, Provider, InsuranceCredential, SystemAccess } from '../types';

const INITIAL_INSURANCE_LIST = [
  'Aetna', 'American Speciality Health', 'Ambetter', 'Anthem/BCBS', 
  'Caresource', 'Cigna', 'Humana', 'Medicaid', 'Medicare', 
  'Molina/Passport', 'Optum', 'TriCare', 'UMR', 'United Healthcare', 'Wellcare'
];

const AddClinicView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'details' | 'credentials' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolioFilter, setPortfolioFilter] = useState('Select All');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const [clinics, setClinics] = useState<Clinic[]>([
    { 
      id: '1', name: 'Sage Health RCM Main', portfolio: 'Sage', pod: 'Pod A', 
      street: '123 Market St', city: 'San Francisco', state: 'CA', zip: '94103',
      email: 'main@sagehealth.com', phone: '(415) 555-0123', fax: '(415) 555-0124',
      npi: '1234567890', taxId: '99-1234567', providers: [
        { id: 'p1', fullName: 'Dr. Reagan Hyde', taxonomy: 'Chiro', npi: '9876543210' }
      ], 
      insuranceCredentials: [], systemAccess: [] 
    },
    { 
      id: '2', name: 'Elite Chiro One', portfolio: 'ChiroOne', pod: 'Pod B', 
      street: '456 Michigan Ave', city: 'Chicago', state: 'IL', zip: '60611',
      email: 'info@elitechiro.com', phone: '(312) 555-9876', fax: '(312) 555-9877',
      npi: '0987654321', taxId: '88-7654321', providers: [], 
      insuranceCredentials: [], systemAccess: [] 
    },
    { 
      id: '3', name: 'Myodetox Rehab Center', portfolio: 'Myodetox', pod: 'Pod C', 
      street: '789 Broadway', city: 'New York', state: 'NY', zip: '10003',
      email: 'ny@myodetox.com', phone: '(212) 555-4433', fax: '(212) 555-4434',
      npi: '5544332211', taxId: '77-1122334', providers: [], 
      insuranceCredentials: [], systemAccess: [] 
    }
  ]);

  const emptyFormData: Partial<Clinic> = {
    name: '',
    portfolio: PORTFOLIOS[1],
    pod: CLINIC_PODS[0],
    npi: '',
    taxId: '',
    phone: '',
    email: '',
    fax: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    providers: [{ id: '1', fullName: '', taxonomy: '', npi: '' }],
    insuranceCredentials: [],
    systemAccess: [
      { name: 'EMR', username: '', password: '' },
      { name: 'Email Correspondence with Payor', username: '', password: '' },
      { name: 'Clearinghouse', username: '', password: '' }
    ]
  };

  const [formData, setFormData] = useState<Partial<Clinic>>(emptyFormData);

  const filteredClinics = useMemo(() => {
    return clinics.filter(clinic => {
      const matchesSearch = clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           clinic.npi.includes(searchQuery) || 
                           clinic.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPortfolio = portfolioFilter === 'Select All' || clinic.portfolio === portfolioFilter;
      return matchesSearch && matchesPortfolio;
    });
  }, [clinics, searchQuery, portfolioFilter]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addProvider = () => {
    setFormData({
      ...formData,
      providers: [...(formData.providers || []), { id: Date.now().toString(), fullName: '', taxonomy: '', npi: '' }]
    });
  };

  const updateProvider = (id: string, field: keyof Provider, value: string) => {
    setFormData({
      ...formData,
      providers: formData.providers?.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const removeProvider = (id: string) => {
    if ((formData.providers?.length || 0) > 1) {
      setFormData({
        ...formData,
        providers: formData.providers?.filter(p => p.id !== id)
      });
    }
  };

  const saveClinic = () => {
    if (viewMode === 'edit' && selectedClinic) {
      setClinics(clinics.map(c => c.id === selectedClinic.id ? { ...(formData as Clinic), id: c.id, logo: logoPreview || c.logo } : c));
      setViewMode('details');
      setSelectedClinic({ ...(formData as Clinic), id: selectedClinic.id, logo: logoPreview || selectedClinic.logo });
    } else {
      const newClinic: Clinic = {
        ...(formData as Clinic),
        id: Date.now().toString(),
        logo: logoPreview || undefined
      };
      setClinics([...clinics, newClinic]);
      setViewMode('list');
      setFormData(emptyFormData);
      setLogoPreview(null);
    }
  };

  const openDetails = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setViewMode('details');
  };

  const handleEditClick = () => {
    if (selectedClinic) {
      setFormData({ ...selectedClinic });
      setLogoPreview(selectedClinic.logo || null);
      setViewMode('edit');
    }
  };

  const isFormComplete = formData.name && formData.npi && formData.taxId && formData.email;

  const addInsuranceRow = () => {
    setFormData({
      ...formData,
      insuranceCredentials: [...(formData.insuranceCredentials || []), {
        company: INITIAL_INSURANCE_LIST[0],
        providerNumber: '',
        groupNumber: '',
        portalUrl: '',
        username: '',
        password: '',
        networkStatus: 'In-Network'
      }]
    });
  };

  // Fix: Comparison error on viewMode narrowed context. Use formData.id to decide if returning to edit or add.
  if (viewMode === 'credentials') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode(formData.id ? 'edit' : 'add')} className="flex items-center space-x-2 text-secondary hover:text-primary font-bold">
            <ChevronLeft size={20} />
            <span>Back to Clinic Form</span>
          </button>
          <button onClick={() => setViewMode(formData.id ? 'edit' : 'add')} className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20">
            Done - Return to Form
          </button>
        </div>

        <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
          <div className="flex items-center space-x-3 text-primary">
            <ShieldCheck size={32} />
            <h2 className="text-3xl font-extrabold text-primaryText tracking-tight">Master Credential Reference</h2>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-[32px] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-200/50">
                <tr>
                  <th className="px-6 py-4 font-bold text-primaryText border-r border-gray-200">Clinic Information</th>
                  <th className="px-6 py-4 font-bold text-primaryText border-r border-gray-200">Group - Network Status</th>
                  <th className="px-6 py-4 font-bold text-primaryText">Clinic Address</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-t border-gray-200">
                  <td className="px-6 py-4 font-semibold text-secondary border-r border-gray-200">NPI: <span className="text-primaryText font-bold ml-2">{formData.npi || '—'}</span></td>
                  <td className="px-6 py-4 border-r border-gray-200">
                    <select className="w-full bg-yellow-50 p-2 rounded-lg border border-yellow-200 font-bold text-primaryText">
                      <option>In-Network</option>
                      <option>Out-of-Network</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 font-bold text-primaryText">{formData.street || '—'}, {formData.city || ''}</td>
                </tr>
                <tr className="bg-white border-t border-gray-200">
                  <td className="px-6 py-4 font-semibold text-secondary border-r border-gray-200">EIN: <span className="text-primaryText font-bold ml-2">{formData.taxId || '—'}</span></td>
                  <td className="px-6 py-4 border-r border-gray-200 bg-gray-50"></td>
                  <td className="px-6 py-4 font-semibold text-secondary italic">Previous Clinic Address (if Applicable)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-primaryText">Payer Network Coverage Matrix</h3>
            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 font-bold text-secondary">
                  <tr>
                    <th className="px-4 py-3 border-r border-gray-200 w-48">Insurance Company</th>
                    <th className="px-4 py-3 border-r border-gray-200">Group - Network Status</th>
                    <th className="px-4 py-3 border-r border-gray-200">Provider #1 - {formData.providers?.[0]?.fullName || 'N/A'}</th>
                    <th className="px-4 py-3">Provider #2 - {formData.providers?.[1]?.fullName || 'N/A'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {INITIAL_INSURANCE_LIST.slice(0, 10).map((company) => (
                    <tr key={company} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-bold text-primaryText border-r border-gray-200">{company}</td>
                      <td className="px-2 py-1 border-r border-gray-200">
                        <select className="w-full p-1 rounded border-none bg-transparent font-medium">
                          <option>Select...</option>
                          <option>In-Network</option>
                          <option>Out-of-Network</option>
                        </select>
                      </td>
                      <td className="px-2 py-1 border-r border-gray-200 bg-yellow-50/50">
                        <select className="w-full p-1 rounded border-none bg-transparent font-medium text-primary">
                          <option>Select...</option>
                          <option>In-Network</option>
                          <option>Out-of-Network</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select className="w-full p-1 rounded border-none bg-transparent font-medium text-primary">
                          <option>Select...</option>
                          <option>In-Network</option>
                          <option>Out-of-Network</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-primaryText">Detailed Payer Access Credentials</h3>
              <button onClick={addInsuranceRow} className="flex items-center space-x-1 text-primary font-bold text-sm bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-all">
                <PlusCircle size={16} /> <span>Add Row</span>
              </button>
            </div>
            <div className="border border-green-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-green-50 font-bold text-green-900">
                  <tr>
                    <th className="px-4 py-3 border-r border-green-100">Insurance Company</th>
                    <th className="px-4 py-3 border-r border-green-100">Provider Name / Status</th>
                    <th className="px-4 py-3 border-r border-green-100">Group Number</th>
                    <th className="px-4 py-3 border-r border-green-100">Portal URL</th>
                    <th className="px-4 py-3 border-r border-green-100">Username</th>
                    <th className="px-4 py-3">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {INITIAL_INSURANCE_LIST.slice(0, 4).map((company) => (
                    <tr key={company}>
                      <td className="px-4 py-2 font-bold text-primaryText border-r border-green-50 bg-white">{company}</td>
                      <td className="p-1 border-r border-green-50 bg-white">
                        <select className="w-full p-1.5 rounded bg-gray-50 border-none font-bold text-primary">
                          <option>In-Network</option>
                          <option>Out-of-Network</option>
                        </select>
                      </td>
                      <td className="p-1 border-r border-green-50 bg-white"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                      <td className="p-1 border-r border-green-50 bg-white"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold text-blue-600" placeholder="https://..." /></td>
                      <td className="p-1 border-r border-green-50 bg-white"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                      <td className="p-1 bg-white"><input type="password" placeholder="••••••" className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                    </tr>
                  ))}
                  {(formData.insuranceCredentials || []).map((row, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-1 border-r border-green-50">
                        <select className="w-full p-1.5 rounded bg-gray-50 border-none font-bold">
                          {INITIAL_INSURANCE_LIST.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border-r border-green-50">
                        <select className="w-full p-1.5 rounded bg-gray-50 border-none font-bold text-primary">
                          <option>In-Network</option>
                          <option>Out-of-Network</option>
                        </select>
                      </td>
                      <td className="p-1 border-r border-green-50"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                      <td className="p-1 border-r border-green-50"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold text-blue-600" /></td>
                      <td className="p-1 border-r border-green-50"><input className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                      <td className="p-1"><input type="password" placeholder="••••••" className="w-full p-1.5 rounded bg-gray-50 border-none font-bold" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-primaryText">Operational System Access</h3>
            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-200/50 font-bold text-primaryText">
                  <tr>
                    <th className="px-6 py-4 border-r border-gray-200">System Access / Type</th>
                    <th className="px-6 py-4 border-r border-gray-200">Username</th>
                    <th className="px-6 py-4">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(formData.systemAccess || []).map((sys, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-bold text-primaryText border-r border-gray-200 bg-white flex items-center space-x-2">
                        <Settings size={14} className="text-primary" />
                        <span>{sys.name}</span>
                      </td>
                      <td className="p-1 border-r border-gray-200 bg-yellow-50/30">
                        <input value={sys.username} className="w-full p-3 rounded bg-transparent border-none font-bold" placeholder="username" />
                      </td>
                      <td className="p-1 bg-yellow-50/30">
                        <input type="password" value={sys.password} className="w-full p-3 rounded bg-transparent border-none font-bold" placeholder="••••••" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (viewMode === 'details' && selectedClinic) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode('list')} className="flex items-center space-x-2 text-secondary hover:text-primary font-bold">
            <ChevronLeft size={20} />
            <span>Back to Clinic Directory</span>
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={handleEditClick}
              className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-secondary flex items-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={16} />
              <span>Edit Clinic</span>
            </button>
            <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Print Profile</button>
          </div>
        </div>

        <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-10 right-10">
            <img 
              src={selectedClinic.logo || "https://placehold.co/200x200/ffffff/8bc53d?text=Clinic+Logo"} 
              alt="Logo" 
              className="h-32 w-32 object-contain rounded-3xl border border-gray-50 p-3 bg-white shadow-md ring-8 ring-gray-50"
            />
          </div>

          <div className="p-14 space-y-12">
            <div className="space-y-3">
              <h1 className="text-5xl font-extrabold text-primaryText tracking-tight">{selectedClinic.name}</h1>
              <div className="flex items-center space-x-3 text-secondary font-bold">
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">{selectedClinic.portfolio}</span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center space-x-2">
                  <MapPin size={18} className="text-primary" />
                  <span className="text-lg">{selectedClinic.city}, {selectedClinic.state}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 pt-6">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Facility IDs</h3>
                <div className="space-y-5">
                  <div className="space-y-1"><p className="text-[10px] font-bold text-gray-400 uppercase">National Provider Identifier</p><p className="font-mono text-xl text-primaryText font-bold">{selectedClinic.npi}</p></div>
                  <div className="space-y-1"><p className="text-[10px] font-bold text-gray-400 uppercase">Employer Identification Number</p><p className="font-mono text-xl text-primaryText font-bold">{selectedClinic.taxId}</p></div>
                  <div className="space-y-1"><p className="text-[10px] font-bold text-gray-400 uppercase">Internal Pod</p><p className="font-bold text-lg text-primary">{selectedClinic.pod}</p></div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Communications</h3>
                <div className="space-y-5">
                  <div className="flex items-center space-x-4"><div className="bg-gray-50 p-2 rounded-xl text-primary"><Mail size={20}/></div><div className="space-y-0.5"><p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p><p className="font-bold text-primaryText">{selectedClinic.email}</p></div></div>
                  <div className="flex items-center space-x-4"><div className="bg-gray-50 p-2 rounded-xl text-primary"><Phone size={20}/></div><div className="space-y-0.5"><p className="text-[10px] font-bold text-gray-400 uppercase">Support Line</p><p className="font-bold text-primaryText">{selectedClinic.phone}</p></div></div>
                  <div className="flex items-center space-x-4"><div className="bg-gray-50 p-2 rounded-xl text-primary"><MapPin size={20}/></div><div className="space-y-0.5"><p className="text-[10px] font-bold text-gray-400 uppercase">Full Address</p><p className="font-bold text-primaryText leading-tight">{selectedClinic.street}<br/>{selectedClinic.city}, {selectedClinic.state} {selectedClinic.zip}</p></div></div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Medical Providers</h3>
                <div className="space-y-3">
                  {selectedClinic.providers.length > 0 ? selectedClinic.providers.map(p => (
                    <div key={p.id} className="p-4 bg-gray-50 rounded-2xl flex items-center space-x-4 group hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black text-xs">DR</div>
                      <div><p className="font-bold text-primaryText leading-none">{p.fullName}</p><p className="text-[10px] font-bold text-secondary uppercase mt-1.5 tracking-widest">{p.taxonomy}</p></div>
                    </div>
                  )) : <p className="text-xs text-secondary italic">No providers documented.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in slide-in-from-right-10 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode(viewMode === 'edit' ? 'details' : 'list')} className="flex items-center space-x-2 text-secondary hover:text-primary font-bold">
            <ChevronLeft size={20} />
            <span>Discard Changes</span>
          </button>
          <div className="flex items-center space-x-3">
            <button onClick={() => setViewMode('credentials')} className="flex items-center space-x-2 px-6 py-2.5 bg-accent/5 text-accent border border-accent/20 rounded-xl font-bold hover:bg-accent/10 transition-all shadow-sm">
              <Key size={18} />
              <span>Add / Manage Credentialing Information</span>
            </button>
            <button onClick={saveClinic} disabled={!isFormComplete} className={`px-10 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-xl ${isFormComplete ? 'bg-primary text-white hover:opacity-90 shadow-primary/20' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
              <Save size={20} />
              <span>{viewMode === 'edit' ? 'Update Clinic' : 'Save Clinic'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
                <Building2 className="text-primary" size={24} />
                <span>Clinic Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Official Clinic Name *</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sage Rehab North" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Portfolio Group *</label>
                  <select value={formData.portfolio} onChange={e => setFormData({...formData, portfolio: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary appearance-none">
                    {PORTFOLIOS.filter(p => p !== 'Select All').map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">POD Assigned *</label>
                  <select value={formData.pod} onChange={e => setFormData({...formData, pod: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary appearance-none">
                    {CLINIC_PODS.map(pod => <option key={pod}>{pod}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">NPI (10-Digit) *</label>
                  <input value={formData.npi} onChange={e => setFormData({...formData, npi: e.target.value})} placeholder="XXXXXXXXXX" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Tax ID / EIN *</label>
                  <input value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="XX-XXXXXXX" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>

            <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
                <MapPin className="text-accent" size={24} />
                <span>Fillable Address Information</span>
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Street Address (Number and Street Name)</label>
                  <input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="e.g. 123 Healthcare Blvd" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">City</label>
                    <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">State / Province</label>
                    <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="e.g. CA" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Postal / ZIP Code</label>
                    <input value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} placeholder="XXXXX" className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
                  <Users className="text-primary" size={24} />
                  <span>Provider Roster</span>
                </h3>
                <button onClick={addProvider} className="flex items-center space-x-2 text-primary hover:bg-primary/5 px-5 py-2.5 rounded-2xl transition-all font-bold text-sm border border-primary/20 bg-primary/[0.02]">
                  <Plus size={18} />
                  <span>Add New Provider</span>
                </button>
              </div>
              <div className="space-y-4">
                {(formData.providers || []).map((provider) => (
                  <div key={provider.id} className="grid grid-cols-1 md:grid-cols-11 gap-4 p-7 bg-gray-50 rounded-[32px] border border-gray-100">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[8px] font-bold text-secondary uppercase tracking-widest ml-1">Full Provider Name</label>
                      <input value={provider.fullName} onChange={e => updateProvider(provider.id, 'fullName', e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-accent text-sm font-bold" />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[8px] font-bold text-secondary uppercase tracking-widest ml-1">Specialty / Taxonomy</label>
                      <input value={provider.taxonomy} onChange={e => updateProvider(provider.id, 'taxonomy', e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-accent text-sm font-bold" />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[8px] font-bold text-secondary uppercase tracking-widest ml-1">Individual NPI</label>
                      <input value={provider.npi} onChange={e => updateProvider(provider.id, 'npi', e.target.value)} className="w-full bg-white px-4 py-3 rounded-xl outline-none border border-transparent focus:border-accent text-sm font-bold" />
                    </div>
                    <div className="md:col-span-1 flex items-end pb-1.5 justify-center">
                      <button onClick={() => removeProvider(provider.id)} className="text-secondary/40 hover:text-red-500 transition-colors p-2"><Trash2 size={22} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <h3 className="font-bold text-xl text-primaryText">Identity & Logo</h3>
              <div className="relative group border-4 border-dashed border-gray-100 rounded-[40px] aspect-square flex flex-col items-center justify-center bg-gray-50 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer overflow-hidden">
                {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-10" /> : <div className="text-center space-y-4 text-secondary/30"><ImageIcon size={64} /><p className="font-bold">Clinic Logo</p></div>}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="space-y-5 pt-4">
                 <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Email Contact *</label>
                  <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
                 <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Phone Line</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
                 <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Fax Number</label>
                  <input value={formData.fax} onChange={e => setFormData({...formData, fax: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-primaryText tracking-tight">Clinic Directory</h1>
          
        </div>
        <button onClick={() => { setFormData(emptyFormData); setViewMode('add'); }} className="bg-primary text-white px-10 py-5 rounded-[24px] font-bold flex items-center justify-center space-x-3 shadow-2xl shadow-primary/30 hover:opacity-90 transition-all">
          <Plus size={28} />
          <span className="text-lg">Add New Clinic</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-3 space-y-3">
          <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-2">Portfolio Filter</label>
          <div className="relative">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <select value={portfolioFilter} onChange={e => setPortfolioFilter(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white border border-gray-200 rounded-[28px] outline-none font-bold text-primaryText shadow-sm appearance-none">
              {PORTFOLIOS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="md:col-span-9 space-y-3">
          <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-2">Smart Search Directory</label>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by clinic name, portfolio group, location, or NPI..." className="w-full pl-14 pr-6 py-5 bg-white border border-gray-200 rounded-[28px] outline-none font-bold text-primaryText shadow-sm focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[56px] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-12 py-8 text-[10px] font-bold text-secondary uppercase tracking-widest">Clinic Identity</th>
              <th className="px-12 py-8 text-[10px] font-bold text-secondary uppercase tracking-widest">Portfolio Group</th>
              <th className="px-12 py-8 text-[10px] font-bold text-secondary uppercase tracking-widest">Facility Location</th>
              <th className="px-12 py-8 text-[10px] font-bold text-secondary uppercase tracking-widest">Onboarding Date</th>
              <th className="px-12 py-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClinics.map((clinic) => (
              <tr key={clinic.id} onClick={() => openDetails(clinic)} className="hover:bg-primary/[0.03] transition-all group cursor-pointer">
                <td className="px-12 py-9">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-white border-2 border-primary/10 rounded-[28px] flex items-center justify-center text-primary font-black text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {clinic.logo ? <img src={clinic.logo} className="w-full h-full object-contain p-2 rounded-[24px]" /> : clinic.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-primaryText text-xl group-hover:text-primary transition-colors">{clinic.name}</p>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">NPI: {clinic.npi}</p>
                    </div>
                  </div>
                </td>
                <td className="px-12 py-9">
                  <span className="px-6 py-2.5 bg-accent/5 text-accent rounded-2xl text-[10px] font-black uppercase tracking-widest border border-accent/10">
                    {clinic.portfolio}
                  </span>
                </td>
                <td className="px-12 py-9">
                  <div className="flex items-center space-x-3 text-base font-bold text-secondary">
                    <MapPin size={18} className="text-primary"/>
                    <span>{clinic.city}, {clinic.state}</span>
                  </div>
                </td>
                <td className="px-12 py-9 text-base font-bold text-secondary">
                  {new Date().toLocaleDateString()}
                </td>
                <td className="px-12 py-9 text-right">
                  <div className="bg-gray-50 w-12 h-12 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <ExternalLink size={20} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddClinicView;
