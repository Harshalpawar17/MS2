
import React, { useState, useRef } from 'react';
import { Scan, User, Car, Briefcase, FileText, Upload, ChevronRight, CheckCircle2, Download, RotateCcw, ShieldCheck, Mail, Phone, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PersonalInjuryView: React.FC = () => {
  const navigate = useNavigate();
  const [scanned, setScanned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasAttorney, setHasAttorney] = useState<boolean | null>(null);
  const [hasMedical, setHasMedical] = useState<boolean | null>(null);
  const [refNumber] = useState(`PI-SAGE-${Math.floor(Math.random() * 90000 + 10000)}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    accidentDate: '',
    caseType: '',
    insuranceCompany: '',
    claimNumber: '',
  });

  const handleOcr = () => {
    setScanned(true);
    setFormData(prev => ({
      ...prev,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      dob: '1992-11-04',
    }));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleOcr();
    }
  };

  const isComplete = 
    formData.firstName && 
    formData.lastName && 
    formData.dob && 
    formData.accidentDate && 
    formData.caseType && 
    formData.insuranceCompany && 
    formData.claimNumber;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Intake Successful</h1>
          <p className="text-secondary font-bold uppercase tracking-widest text-sm">Reference Number: {refNumber}</p>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl space-y-6">
          <p className="text-primaryText font-medium text-lg">Personal Injury Intake has been processed for <span className="font-bold">{formData.firstName} {formData.lastName}</span>.</p>
          <div className="flex flex-col space-y-3">
            <button className="w-full py-4 bg-accent text-white rounded-2xl font-bold flex items-center justify-center space-x-2">
              <Download size={20} />
              <span>Download Intake Summary</span>
            </button>
            <button 
              onClick={() => navigate('/intake')}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center space-x-2"
            >
              <RotateCcw size={20} />
              <span>Process Another Intake</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-40">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Personal Injury</h1>
          
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={handleButtonClick} 
            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold flex items-center space-x-3 shadow-2xl shadow-primary/30 hover:opacity-90 transition-all transform active:scale-95"
          >
            <Scan size={24} />
            <span>Scan Patient ID</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
              <User size={24} className="text-primary" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">First Name *</label>
                <input 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">Last Name *</label>
                <input 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">Date of Birth *</label>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
              <Car size={24} className="text-accent" />
              <span>Incident Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">Date of Accident *</label>
                <input 
                  type="date"
                  value={formData.accidentDate}
                  onChange={e => setFormData({...formData, accidentDate: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-accent" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">Case Type *</label>
                <select 
                  value={formData.caseType}
                  onChange={e => setFormData({...formData, caseType: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-accent appearance-none"
                >
                  <option value="">Select Category...</option>
                  <option value="MVA">Motor Vehicle Incident</option>
                  <option value="SLIP">Slip and Fall</option>
                  <option value="WC">Workplace Injury</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-primaryText flex items-center space-x-3">
              <Briefcase size={24} className="text-secondary" />
              <span>Liability Carrier & Adjuster</span>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Insurance Company *</label>
                  <input value={formData.insuranceCompany} onChange={e => setFormData({...formData, insuranceCompany: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Claim Number *</label>
                  <input value={formData.claimNumber} onChange={e => setFormData({...formData, claimNumber: e.target.value})} className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Carrier Phone</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Carrier Fax</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Carrier Email</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Adjuster Phone</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Adjuster Fax</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Adjuster Email</label>
                  <input className="w-full px-3 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-xs font-bold" />
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">PI/WC Specific Claim ID</label>
                <input className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-primaryText text-lg">Does the patient have an attorney?</p>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button onClick={() => setHasAttorney(true)} className={`px-6 py-2 rounded-xl text-xs font-extrabold transition-all ${hasAttorney === true ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-gray-200'}`}>Yes</button>
                  <button onClick={() => setHasAttorney(false)} className={`px-6 py-2 rounded-xl text-xs font-extrabold transition-all ${hasAttorney === false ? 'bg-secondary text-white shadow-md' : 'text-secondary hover:bg-gray-200'}`}>No</button>
                </div>
              </div>
              {hasAttorney && (
                <div className="grid grid-cols-1 gap-4 p-8 bg-gray-50 rounded-[32px] animate-in slide-in-from-top-4 border border-gray-100">
                  <input placeholder="Attorney Full Name" className="w-full px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Law Firm Phone" className="px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                    <input placeholder="Law Firm Fax" className="px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                  </div>
                  <input placeholder="Law Firm Email Address" className="w-full px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                </div>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-primaryText text-lg">Does the patient have medical insurance?</p>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button onClick={() => setHasMedical(true)} className={`px-6 py-2 rounded-xl text-xs font-extrabold transition-all ${hasMedical === true ? 'bg-accent text-white shadow-md' : 'text-secondary hover:bg-gray-200'}`}>Yes</button>
                  <button onClick={() => setHasMedical(false)} className={`px-6 py-2 rounded-xl text-xs font-extrabold transition-all ${hasMedical === false ? 'bg-secondary text-white shadow-md' : 'text-secondary hover:bg-gray-200'}`}>No</button>
                </div>
              </div>
              {hasMedical && (
                <div className="grid grid-cols-2 gap-4 p-8 bg-gray-50 rounded-[32px] animate-in slide-in-from-top-4 border border-gray-100">
                  <input placeholder="Medical Carrier" className="px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                  <input placeholder="Policy ID" className="px-5 py-4 bg-white border-gray-100 rounded-2xl outline-none text-sm font-bold text-primaryText" />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 p-8 px-12 bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <p className="text-sm text-secondary font-extrabold uppercase tracking-[0.2em]">{!isComplete ? 'Awaiting Mandatory Fields' : 'PI Intake Ready for Submission'}</p>
        <button 
          onClick={() => setSubmitted(true)}
          disabled={!isComplete}
          className={`flex items-center space-x-3 px-16 py-5 rounded-[24px] font-bold text-xl transition-all shadow-2xl ${
            isComplete ? 'bg-primary text-white hover:opacity-90 shadow-primary/30 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Submit PI Intake</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default PersonalInjuryView;
