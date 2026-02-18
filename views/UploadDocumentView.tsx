
import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, ChevronRight, FileText, Download, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadDocumentView: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-10 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold text-primaryText tracking-tight">Upload Successful</h1>
          <p className="text-xl text-secondary font-medium max-w-lg mx-auto leading-relaxed">Your documents have been successfully uploaded and sent to the agents.</p>
        </div>
        <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-2xl space-y-8">
          <div className="inline-block p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] mb-1">Queue Reference</p>
             <p className="text-2xl font-black text-accent">DOC-SAGE-{Math.floor(Math.random() * 90000 + 10000)}</p>
          </div>
          <div className="flex flex-col space-y-4">
             <button 
              onClick={() => navigate('/intake')}
              className="w-full py-5 bg-primary text-white rounded-[24px] font-extrabold text-xl shadow-2xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center space-x-3"
            >
              <RotateCcw size={24} />
              <span>Process Another Intake</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Upload Document</h1>
        {/* <p className="text-lg text-secondary font-medium">Securely transmit records, billing info, or payer correspondence.</p> */}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-14 rounded-[48px] border border-gray-100 shadow-xl space-y-10">
        <div className="space-y-4">
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest ml-1">Document Classification</label>
          <select 
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-[28px] outline-none font-bold text-primaryText transition-all text-xl appearance-none"
          >
            <option value="">Select Classification...</option>
            <option>Credentialing Files</option>
            <option>Payer Correspondence</option>
            <option>Medical Records Request</option>
            <option>EOB / Remittance</option>
            <option>Legal / LOP Documentation</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest ml-1">Secure File Transfer *</label>
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
            <div className="border-2 border-dashed border-gray-100 group-hover:border-primary/50 rounded-[40px] p-20 bg-gray-50 group-hover:bg-primary/5 transition-all flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-sm flex items-center justify-center text-secondary/30 group-hover:text-primary transition-all">
                <UploadCloud size={40} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-primaryText">
                  {file ? file.name : 'Choose File to Upload'}
                </p>
                <p className="text-sm text-secondary font-bold mt-1 uppercase tracking-widest">Supports PDF, PNG, JPG</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          disabled={!file}
          className={`w-full py-6 rounded-[32px] font-black text-2xl transition-all shadow-2xl flex items-center justify-center space-x-4 ${
            file ? 'bg-primary text-white hover:opacity-90 shadow-primary/30 active:scale-95' : 'bg-gray-50 text-secondary/20 cursor-not-allowed'
          }`}
        >
          <span>Upload Securely</span>
          <ChevronRight size={28} />
        </button>
      </form>

      <div className="flex items-center justify-center space-x-10 text-[10px] text-secondary font-extrabold uppercase tracking-[0.2em]">
        <span className="flex items-center space-x-2"><FileText size={14} className="text-primary" /> <span>AES-256 Encrypted</span></span>
        <span className="flex items-center space-x-2"><FileText size={14} className="text-primary" /> <span>Audit-Logged Submission</span></span>
      </div>
    </div>
  );
};

export default UploadDocumentView;
