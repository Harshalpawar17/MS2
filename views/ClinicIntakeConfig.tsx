
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  History,
  ChevronRight,
  Info,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  X,
  Building2,
  ArrowLeft,
  Edit2
} from 'lucide-react';
import { 
  BenefitCategory, 
  CPTItem, 
  ClinicIntakeConfig, 
  UserRole 
} from '../types';
import { SYSTEM_BENEFIT_CATEGORIES, SYSTEM_CPT_MASTER } from '../constants';

const MOCK_CLINICS = [
  { id: 'clinic-1', name: 'Sage Health RCM Main' },
  { id: 'clinic-2', name: 'Elite Chiro One' },
  { id: 'clinic-3', name: 'Myodetox Rehab Center' },
  { id: 'clinic-4', name: 'Barnes Family Chiropractic' },
  { id: 'clinic-5', name: 'Core Health Centers' },
];

const ClinicIntakeConfigView: React.FC = () => {
  const [selectedClinic, setSelectedClinic] = useState<{ id: string, name: string } | null>(null);
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [config, setConfig] = useState<ClinicIntakeConfig>({
    clinicId: '',
    categories: [
      {
        id: 'cat-1',
        name: 'Chiropractic Manipulation',
        enabled: true,
        preSelected: true,
        order: 0,
        cpts: [
          {
            id: 'cpt-1',
            code: '98943',
            description: 'Extremity Adjustment',
            source: 'system',
            active: true,
            preSelected: true,
            createdBy: 'System Admin',
            createdAt: '2025-01-01T00:00:00Z',
            updatedBy: 'System Admin',
            updatedAt: '2025-01-01T00:00:00Z'
          },
          {
            id: 'cpt-2',
            code: '98940',
            description: 'Spinal Adjustment (1-2 regions)',
            source: 'system',
            active: true,
            preSelected: false,
            createdBy: 'System Admin',
            createdAt: '2025-01-01T00:00:00Z',
            updatedBy: 'System Admin',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ]
      },
      {
        id: 'cat-2',
        name: 'Office Visit / E&M',
        enabled: true,
        preSelected: false,
        order: 1,
        cpts: [
          {
            id: 'cpt-3',
            code: '99203',
            description: 'Initial Evaluation (Level 3)',
            source: 'system',
            active: true,
            preSelected: true,
            createdBy: 'System Admin',
            createdAt: '2025-01-01T00:00:00Z',
            updatedBy: 'System Admin',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ]
      }
    ],
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: 'Clinic Administrator',
    lastModifiedByEmail: 'clinicadmin@gmail.com',
    allowStaffCustomCPT: true
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClinic) {
      const savedConfig = localStorage.getItem(`clinic_config_${selectedClinic.id}`);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setSelectedCategoryId(parsed.categories[0]?.id || null);
      } else {
        // Reset to default for new clinic
        const defaultConfig = {
          ...config,
          clinicId: selectedClinic.id,
          lastModifiedAt: new Date().toISOString(),
          categories: config.categories.map(cat => ({ ...cat, cpts: [...cat.cpts] })) // deep copy
        };
        setConfig(defaultConfig);
        setSelectedCategoryId(defaultConfig.categories[0]?.id || null);
      }
    }
  }, [selectedClinic]);
  const [isDirty, setIsDirty] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddCPTModalOpen, setIsAddCPTModalOpen] = useState(false);
  const [isCustomCPTModalOpen, setIsCustomCPTModalOpen] = useState(false);
  const [cptSearchQuery, setCptSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const selectedCategory = config.categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const updatedConfig = {
      ...config,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: 'Clinic Administrator',
      lastModifiedByEmail: 'clinicadmin@gmail.com'
    };
    setConfig(updatedConfig);
    setIsDirty(false);
    showToast('Configuration saved successfully');
    localStorage.setItem(`clinic_config_${config.clinicId}`, JSON.stringify(updatedConfig));
  };

  const toggleCategoryEnabled = (id: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
    }));
    setIsDirty(true);
  };

  const toggleCategoryPreSelected = (id: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, preSelected: !c.preSelected } : c)
    }));
    setIsDirty(true);
  };

  const deleteCategory = (id: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
    if (selectedCategoryId === id) {
      setSelectedCategoryId(config.categories.find(c => c.id !== id)?.id || null);
    }
    setIsDirty(true);
    showToast('Category removed from clinic configuration');
  };

  const addCategory = (name: string) => {
    if (config.categories.some(c => c.name === name)) {
      showToast('Category already exists', 'error');
      return;
    }
    const newCat: BenefitCategory = {
      id: `cat-${Date.now()}`,
      name,
      enabled: true,
      preSelected: false,
      order: config.categories.length,
      cpts: []
    };
    setConfig(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
    setSelectedCategoryId(newCat.id);
    setIsAddCategoryModalOpen(false);
    setIsDirty(true);
  };

  const toggleCPTActive = (catId: string, cptId: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? {
        ...c,
        cpts: c.cpts.map(cpt => cpt.id === cptId ? { ...cpt, active: !cpt.active } : cpt)
      } : c)
    }));
    setIsDirty(true);
  };

  const toggleCPTPreSelected = (catId: string, cptId: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? {
        ...c,
        cpts: c.cpts.map(cpt => cpt.id === cptId ? { ...cpt, preSelected: !cpt.preSelected } : cpt)
      } : c)
    }));
    setIsDirty(true);
  };

  const removeCPT = (catId: string, cptId: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? {
        ...c,
        cpts: c.cpts.filter(cpt => cpt.id !== cptId)
      } : c)
    }));
    setIsDirty(true);
    showToast('CPT code removed');
  };

  const addSystemCPT = (systemCPT: typeof SYSTEM_CPT_MASTER[0]) => {
    if (!selectedCategoryId) return;
    const cat = config.categories.find(c => c.id === selectedCategoryId);
    if (cat?.cpts.some(cpt => cpt.code === systemCPT.code)) {
      showToast('CPT code already exists in this category', 'error');
      return;
    }
    const newCPT: CPTItem = {
      id: `cpt-${Date.now()}`,
      code: systemCPT.code,
      description: systemCPT.description,
      source: 'system',
      active: true,
      preSelected: false,
      createdBy: 'Clinic Administrator',
      createdAt: new Date().toISOString(),
      updatedBy: 'Clinic Administrator',
      updatedAt: new Date().toISOString()
    };
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === selectedCategoryId ? {
        ...c,
        cpts: [...c.cpts, newCPT]
      } : c)
    }));
    setIsDirty(true);
    showToast(`Added ${systemCPT.code}`);
  };

  const addCustomCPT = (code: string, description: string, notes?: string) => {
    if (!selectedCategoryId) return;
    const cat = config.categories.find(c => c.id === selectedCategoryId);
    if (cat?.cpts.some(cpt => cpt.code === code)) {
      showToast('CPT code already exists in this category', 'error');
      return;
    }
    const newCPT: CPTItem = {
      id: `cpt-${Date.now()}`,
      code,
      description,
      notes,
      source: 'custom',
      active: true,
      preSelected: false,
      createdBy: 'Clinic Administrator',
      createdAt: new Date().toISOString(),
      updatedBy: 'Clinic Administrator',
      updatedAt: new Date().toISOString()
    };
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === selectedCategoryId ? {
        ...c,
        cpts: [...c.cpts, newCPT]
      } : c)
    }));
    setIsDirty(true);
    setIsCustomCPTModalOpen(false);
    showToast(`Added custom CPT ${code}`);
  };

  const moveCPT = (catId: string, index: number, direction: 'up' | 'down') => {
    const cat = config.categories.find(c => c.id === catId);
    if (!cat) return;
    const newCpts = [...cat.cpts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCpts.length) return;
    [newCpts[index], newCpts[targetIndex]] = [newCpts[targetIndex], newCpts[index]];
    
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? { ...c, cpts: newCpts } : c)
    }));
    setIsDirty(true);
  };

  if (!selectedClinic) {
    return (
      <div className="max-w-4xl mx-auto py-20 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Select a Clinic</h1>
          
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-primary/5 p-10 border border-gray-100 space-y-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
              type="text"
              placeholder="Type clinic name to search..."
              className="w-full pl-16 pr-6 py-6 bg-gray-50 rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-xl"
              value={clinicSearchQuery}
              onChange={(e) => setClinicSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CLINICS.filter(c => c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase())).map(clinic => (
              <button 
                key={clinic.id}
                onClick={() => setSelectedClinic(clinic)}
                className="group p-6 bg-white border border-gray-100 rounded-[32px] hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{clinic.name}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Clinic ID: {clinic.id}</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={24} />
              </button>
            ))}
          </div>

          {MOCK_CLINICS.filter(c => c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase())).length === 0 && clinicSearchQuery.trim() !== '' && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                <Plus size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 font-bold text-lg">No existing clinic found matching "{clinicSearchQuery}"</p>
                <p className="text-sm text-gray-500">Would you like to create a new configuration for this clinic name?</p>
              </div>
              <button 
                onClick={() => setSelectedClinic({ id: `custom-${Date.now()}`, name: clinicSearchQuery })}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Create Configuration for "{clinicSearchQuery}"
              </button>
            </div>
          )}

          {MOCK_CLINICS.filter(c => c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase())).length === 0 && clinicSearchQuery.trim() === '' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Search size={32} />
              </div>
              <p className="text-gray-500 font-bold">Start typing to search or create a clinic configuration</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              if (isDirty) {
                if (window.confirm('You have unsaved changes. Are you sure you want to change clinic?')) {
                  setSelectedClinic(null);
                  setIsDirty(false);
                }
              } else {
                setSelectedClinic(null);
              }
            }}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm"
            title="Change Clinic"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">{selectedClinic.name}</h1>
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">Configuration</span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 font-medium">
              <History size={14} />
              <span>Last modified on {new Date(config.lastModifiedAt).toLocaleString()} by {config.lastModifiedBy}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-600">Allow Staff Custom CPT</span>
            <button 
              onClick={() => { setConfig(prev => ({ ...prev, allowStaffCustomCPT: !prev.allowStaffCustomCPT })); setIsDirty(true); }}
              className="text-primary transition-colors"
            >
              {config.allowStaffCustomCPT ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-300" />}
            </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all ${isDirty ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <Save size={20} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top-2">
          <AlertCircle className="text-amber-600" size={20} />
          <p className="text-sm text-amber-800 font-bold">You have unsaved changes. Please save before navigating away.</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Left Panel: Categories */}
        <div className="col-span-4 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center space-x-2">
              <Settings size={18} className="text-primary" />
              <span>Benefit Categories</span>
            </h2>
            <button 
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"
              title="Add Category"
            >
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {[...config.categories].sort((a, b) => a.order - b.order).map((cat) => (
              <div 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer ${selectedCategoryId === cat.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-50 hover:border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${cat.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={`font-bold text-sm ${selectedCategoryId === cat.id ? 'text-primary' : 'text-gray-700'}`}>{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCategoryEnabled(cat.id); }}
                      className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {cat.enabled ? <span className="text-emerald-600">Enabled</span> : <span className="text-gray-400">Disabled</span>}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCategoryPreSelected(cat.id); }}
                      className={`flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest ${cat.preSelected ? 'text-primary' : 'text-gray-400'}`}
                    >
                      {cat.preSelected ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />}
                      <span>Pre-Selected</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{cat.cpts.length} CPTs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: CPT Management */}
        <div className="col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {selectedCategory ? (
            <>
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage CPT codes and default selections for this category</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setIsAddCPTModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Add from Master</span>
                  </button>
                  <button 
                    onClick={() => setIsCustomCPTModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center space-x-2"
                  >
                    <PlusCircle size={16} />
                    <span>Add Custom CPT</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {selectedCategory.cpts.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCategory.cpts.map((cpt, index) => (
                      <div 
                        key={cpt.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center space-x-4 ${cpt.active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                      >
                        <div className="flex flex-col space-y-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => moveCPT(selectedCategory.id, index, 'up')}
                            className={`p-1 rounded hover:bg-gray-100 transition-colors ${index === 0 ? 'text-gray-200' : 'text-gray-400'}`}
                          >
                            <ChevronRight size={14} className="-rotate-90" />
                          </button>
                          <button 
                            disabled={index === selectedCategory.cpts.length - 1}
                            onClick={() => moveCPT(selectedCategory.id, index, 'down')}
                            className={`p-1 rounded hover:bg-gray-100 transition-colors ${index === selectedCategory.cpts.length - 1 ? 'text-gray-200' : 'text-gray-400'}`}
                          >
                            <ChevronRight size={14} className="rotate-90" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-black text-primary">{cpt.code}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${cpt.source === 'system' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                              {cpt.source}
                            </span>
                            {!cpt.active && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Inactive</span>}
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate">{cpt.description}</p>
                          {cpt.notes && <p className="text-[10px] text-gray-400 italic mt-1">{cpt.notes}</p>}
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                            <button 
                              onClick={() => toggleCPTActive(selectedCategory.id, cpt.id)}
                              className="text-primary"
                            >
                              {cpt.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-300" />}
                            </button>
                          </div>
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Default</span>
                            <button 
                              onClick={() => toggleCPTPreSelected(selectedCategory.id, cpt.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${cpt.preSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 hover:border-primary'}`}
                            >
                              {cpt.preSelected && <CheckCircle2 size={14} />}
                            </button>
                          </div>
                          <button 
                            onClick={() => removeCPT(selectedCategory.id, cpt.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove CPT"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Plus size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">No CPT codes configured</p>
                      <p className="text-sm text-gray-500">Add codes from the master list or create custom ones.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Info size={32} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Select a category</p>
                <p className="text-sm text-gray-500">Choose a benefit category from the left to manage its CPT codes.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddCategoryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Benefit Category</h3>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select from System Categories</p>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {SYSTEM_BENEFIT_CATEGORIES.filter(name => !config.categories.some(c => c.name === name)).map(name => (
                  <button 
                    key={name}
                    onClick={() => addCategory(name)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:text-primary font-bold text-sm transition-all border border-transparent hover:border-primary/20"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add System CPT Modal */}
      {isAddCPTModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddCPTModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add CPT from Master List</h3>
              <button onClick={() => setIsAddCPTModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search by CPT code or description..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                value={cptSearchQuery}
                onChange={(e) => setCptSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {SYSTEM_CPT_MASTER.filter(c => 
                (c.code.includes(cptSearchQuery) || c.description.toLowerCase().includes(cptSearchQuery.toLowerCase())) &&
                !selectedCategory?.cpts.some(existing => existing.code === c.code)
              ).map(cpt => (
                <button 
                  key={cpt.code}
                  onClick={() => addSystemCPT(cpt)}
                  className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-primary block mb-1">{cpt.code}</span>
                      <p className="text-sm font-bold text-gray-900">{cpt.description}</p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cpt.category}</span>
                    </div>
                    <Plus className="text-gray-300 group-hover:text-primary" size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom CPT Modal */}
      {isCustomCPTModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCustomCPTModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Custom CPT Code</h3>
              <button onClick={() => setIsCustomCPTModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addCustomCPT(
                formData.get('code') as string,
                formData.get('description') as string,
                formData.get('notes') as string
              );
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">CPT Code *</label>
                <input 
                  name="code" 
                  required 
                  placeholder="e.g. 99203"
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description *</label>
                <input 
                  name="description" 
                  required 
                  placeholder="e.g. Office Visit"
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Optional Notes</label>
                <textarea 
                  name="notes" 
                  rows={3}
                  placeholder="Additional details for intake staff..."
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" 
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Add Custom CPT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicIntakeConfigView;
