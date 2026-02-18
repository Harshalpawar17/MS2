
import React, { useState } from 'react';
import { Search, Info, ExternalLink, FileText, Upload, AlertTriangle, ArrowRight, Download, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PriorAuthorizationView: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patientFound, setPatientFound] = useState<boolean | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refNumber] = useState(`PA-SAGE-${Math.floor(Math.random() * 90000 + 10000)}`);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      // Logic: Search "John" finds the patient
      setPatientFound(searchTerm.toLowerCase().includes('john'));
    }, 800);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

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
          <p className="text-primaryText font-medium text-lg">Prior Authorization processed for <span className="font-bold">John Doe</span>.</p>
          <div className="flex flex-col space-y-3">
            <button className="w-full py-4 bg-accent text-white rounded-2xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all">
              <Download size={20} />
              <span>Download Intake Summary</span>
            </button>
            <button 
              onClick={() => navigate('/intake')}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all"
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
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-primaryText">Prior Authorization</h1>
        
      </div>

      <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <h2 className="text-xl font-bold text-primaryText">1. Patient Lookup</h2>
        <p className="text-secondary font-medium">Verify existing Eligibility for the current calendar year before proceeding.</p>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search by Patient Name (e.g. John)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-3xl outline-none transition-all text-xl font-bold text-primaryText"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={24} />
          <button 
            onClick={handleSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-accent text-white px-8 py-2.5 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all"
          >
            Search
          </button>
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {patientFound === false && (
          <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] flex items-start space-x-5 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="text-red-500 mt-1 shrink-0" size={32} />
            <div className="space-y-4">
              <div>
                <p className="text-red-900 font-bold text-lg">No valid Eligibility Verification found</p>
                <p className="text-red-700 font-medium">Patient "{searchTerm}" does not have an active Eligibility Verification for {new Date().getFullYear()}.</p>
              </div>
              <button 
                onClick={() => navigate('/intake/ev')}
                className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-red-700 transition-all shadow-xl shadow-red-200"
              >
                <span>Start Eligibility Verification</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {patientFound === true && !showForm && (
          <div className="animate-in fade-in slide-in-from-top-4 p-10 bg-primary/5 rounded-[40px] border border-primary/20 space-y-8 text-center">
            <div className="w-20 h-20 bg-white text-primary rounded-[28px] flex items-center justify-center mx-auto shadow-sm border border-primary/10">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-primaryText">John Doe – Valid EV on file</p>
              <p className="text-secondary font-bold uppercase text-xs tracking-[0.2em] mt-2">Active for Calendar Year {new Date().getFullYear()}</p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/30 hover:opacity-90 transform active:scale-95 transition-all"
            >
              Proceed to PA Intake
            </button>
          </div>
        )}

        {showForm && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-12 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primaryText text-xl">Authorization Details</h3>
                  <button 
                    onClick={() => setShowResourceModal(true)}
                    className="flex items-center space-x-1.5 text-sm text-accent hover:underline font-bold"
                  >
                    <ExternalLink size={16} />
                    <span>Resource Library (Required Forms)</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-widest">Request Category</label>
                    <select className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent appearance-none">
                      <option>Select Category...</option>
                      <option>Diagnostic Services</option>
                      <option>DME / Supplies</option>
                      
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-widest">Requested Procedure / CPT</label>
                    <input className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent" placeholder="e.g. 72148" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-widest">Clinical Narrative</label>
                    <textarea rows={5} className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent resize-none" placeholder="Enter clinical justification..." />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="font-bold text-primaryText text-xl">Clinical Attachments</h3>
                <div className="border-2 border-dashed border-gray-100 rounded-[40px] p-16 flex flex-col items-center justify-center space-y-5 bg-gray-50 group hover:bg-accent/5 hover:border-accent/40 transition-all">
                  <Upload className="text-secondary/30 group-hover:text-accent transition-colors" size={48} />
                  <div className="text-center">
                    <p className="font-extrabold text-primaryText text-lg">Upload clinical records</p>
                    <p className="text-xs text-secondary font-bold mt-1 uppercase tracking-widest">Max file size: 25MB</p>
                  </div>
                  <button className="bg-white border border-gray-100 px-8 py-3 rounded-2xl font-bold shadow-sm text-sm hover:border-accent/40 transition-colors">Select Documents</button>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSubmit}
                className="bg-accent text-white px-16 py-5 rounded-[24px] font-bold text-xl shadow-2xl shadow-accent/30 hover:opacity-90 transition-all flex items-center space-x-3"
              >
                <span>Submit Authorization</span>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </section>

      {showResourceModal && (
        <div className="fixed inset-0 bg-primaryText/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-2xl text-primaryText">Resource Library</h3>
              <button onClick={() => setShowResourceModal(false)} className="text-secondary hover:text-primaryText font-extrabold text-2xl">×</button>
            </div>
            <div className="p-12 space-y-8">
              <p className="text-secondary font-medium text-lg leading-relaxed">Download and complete required fillable PDF forms. Data for <span className="text-primaryText font-bold">John Doe</span> will be pre-filled where possible.</p>
              <div className="space-y-4">
                {['General Payer Form V3', 'Diagnostic Specialty Supplement', 'DME Vendor Authorization'].map(form => (
                  <div key={form} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-accent/30 transition-all group cursor-pointer">
                    <div className="flex items-center space-x-5">
                      <div className="bg-white p-4 rounded-2xl shadow-sm text-accent"><FileText size={24} /></div>
                      <span className="font-extrabold text-primaryText text-lg">{form}</span>
                    </div>
                    <button className="text-accent font-bold hover:underline">Download</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default PriorAuthorizationView;
