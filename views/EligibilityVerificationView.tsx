
import React, { useState, useEffect, useRef } from 'react';
import { Scan, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Download, RotateCcw, Clock, Calendar as CalendarIcon, Upload, Image as ImageIcon } from 'lucide-react';
import { CPT_CODES } from '../constants';
import { useNavigate } from 'react-router-dom';

type UrgencyType = 'Urgent' | 'Standard' | 'Other';

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr; // Already American
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

const EligibilityVerificationView: React.FC = () => {
  const navigate = useNavigate();
  const [scanned, setScanned] = useState(false);
  const [secondaryScanned, setSecondaryScanned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [path, setPath] = useState<'eligibility' | 'benefit' | null>(null);
  const [selectedCPTs, setSelectedCPTs] = useState<string[]>([]);
  const [showSecondary, setShowSecondary] = useState(false);
  const [refNumber] = useState(`EV-SAGE-${Math.floor(Math.random() * 90000 + 10000)}`);
  
  // Urgency & Time State
  const [urgency, setUrgency] = useState<UrgencyType | null>(null);
  const [requestedDateTime, setRequestedDateTime] = useState<string>('');
  const [timeError, setTimeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dob: '',
    primaryCarrier: '',
    primaryPolicyId: '',
    primaryGroup: '',
    primarySubscriber: '',
    secondaryCarrier: '',
    secondaryPolicyId: '',
    secondaryGroup: '',
    secondarySubscriber: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // Calculate times based on urgency
  useEffect(() => {
    if (!urgency) return;

    const now = new Date();
    let calculatedDate = new Date();

    if (urgency === 'Urgent') {
      calculatedDate.setHours(now.getHours() + 4);
      setTimeError(null);
    } else if (urgency === 'Standard') {
      calculatedDate.setHours(now.getHours() + 24);
      setTimeError(null);
    } else if (urgency === 'Other') {
      calculatedDate.setHours(now.getHours() + 48);
    }

    const formatted = calculatedDate.toISOString().slice(0, 16);
    setRequestedDateTime(formatted);
  }, [urgency]);

  const handleOcr = () => {
    setScanned(true);
    setFormData(prev => ({
      ...prev,
      firstName: 'Michael',
      lastName: 'Henderson',
      middleName: 'Alexander',
      dob: '1985-05-22',
      primaryCarrier: 'BlueCross BlueShield',
      primaryPolicyId: 'SAGE882711',
      primaryGroup: 'GRP-9922',
      primarySubscriber: 'Michael Henderson'
    }));
  };

  const handleSecondaryOcr = () => {
    setSecondaryScanned(true);
    setFormData(prev => ({
      ...prev,
      secondaryCarrier: 'Aetna Health',
      secondaryPolicyId: 'AET-112233',
      secondaryGroup: 'GRP-AET-01',
      secondarySubscriber: 'Michael Henderson'
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleOcr();
    }
  };

  const handleSecondaryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSecondaryOcr();
    }
  };

  const handleUrgencyChange = (val: UrgencyType) => {
    setUrgency(val);
  };

  const handleDateTimeChange = (val: string) => {
    if (urgency !== 'Other') return;
    
    const selected = new Date(val);
    const now = new Date();
    const minTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); 

    if (selected < minTime) {
      setTimeError('Requests under 24 hours must use the Standard option.');
    } else {
      setTimeError(null);
    }
    setRequestedDateTime(val);
  };

  const toggleCPT = (code: string) => {
    if (selectedCPTs.includes(code)) {
      setSelectedCPTs(selectedCPTs.filter(c => c !== code));
    } else {
      setSelectedCPTs([...selectedCPTs, code]);
    }
  };

  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.dob && 
    formData.primaryCarrier && 
    formData.primaryPolicyId && 
    formData.primaryGroup && 
    formData.primarySubscriber && 
    path &&
    (path === 'eligibility' || (urgency && !timeError && selectedCPTs.length > 0));

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    const displayDate = new Date().toLocaleDateString('en-US');
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-primaryText tracking-tight">Intake Successful</h1>
          <p className="text-secondary font-bold uppercase tracking-widest text-sm">Reference Number: {refNumber}</p>
          <p className="text-xs text-gray-400 font-bold uppercase">Submitted: {displayDate}</p>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl space-y-6">
          <p className="text-primaryText font-medium text-lg">Eligibility Verification processed for <span className="font-bold">{formData.firstName} {formData.lastName}</span>.</p>
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
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primaryText">Eligibility Verification</h1>
          
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-xs flex items-center space-x-2">
          <Scan size={16} />
          <span>SAGE OCR ENGINE</span>
        </div>
      </div>

      <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-primaryText">1. Identification & Insurance Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleOcr}
            className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center space-y-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-all group"
          >
            <CreditCard className="text-secondary group-hover:text-primary transition-colors" size={32} />
            <p className="font-bold text-primaryText">Scan Patient Card</p>
            <span className="text-xs text-secondary font-medium">Extract demographics instantly</span>
          </button>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center space-y-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
          >
            <Upload className="text-secondary group-hover:text-primary transition-colors" size={32} />
            <p className="font-bold text-primaryText">Upload Documents</p>
            <span className="text-xs text-secondary font-medium">Upload ID and Insurance Cards</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={handleFileUpload} 
            />
          </div>
        </div>

        {!scanned && (
          <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 flex items-start space-x-4 animate-pulse">
            <AlertCircle className="text-accent shrink-0" size={24} />
            <p className="text-sm font-semibold text-accent leading-relaxed">
              Demographic fields will remain hidden until identification documents are successfully processed by the system.
            </p>
          </div>
        )}
        
        {scanned && (
          <div className="flex items-center space-x-2 text-primary bg-primary/5 px-5 py-4 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={24} />
            <span className="font-bold">Demographics Extracted Successfully. Please review below.</span>
          </div>
        )}
      </section>

      {scanned && (
        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-primaryText">2. Demographic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">First Name *</label>
              <input 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-primaryText" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Middle Name</label>
              <input 
                value={formData.middleName}
                onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-primaryText" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Last Name *</label>
              <input 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-primaryText" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Date of Birth * (MM/DD/YYYY)</label>
              <input 
                type="text"
                placeholder="MM/DD/YYYY"
                value={formData.dob ? formatDateForDisplay(formData.dob) : ''}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-primaryText" 
              />
            </div>
          </div>
        </section>
      )}

      <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8">
        <h2 className="text-xl font-bold text-primaryText">3. Insurance Information</h2>
        
        {scanned ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Insurance Carrier *</label>
              <input 
                value={formData.primaryCarrier}
                onChange={(e) => setFormData({...formData, primaryCarrier: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Policy ID *</label>
              <input 
                value={formData.primaryPolicyId}
                onChange={(e) => setFormData({...formData, primaryPolicyId: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Group Number *</label>
              <input 
                value={formData.primaryGroup}
                onChange={(e) => setFormData({...formData, primaryGroup: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">Subscriber Name *</label>
              <input 
                value={formData.primarySubscriber}
                onChange={(e) => setFormData({...formData, primarySubscriber: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
              />
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-gray-50 rounded-2xl italic">
            Insurance fields hidden until demographics are processed
          </div>
        )}

        <div className="flex items-center space-x-3 pt-6 border-t border-gray-100">
          <input 
            type="checkbox" 
            id="secondaryCheck"
            checked={showSecondary}
            onChange={(e) => {
              setShowSecondary(e.target.checked);
              if (!e.target.checked) setSecondaryScanned(false);
            }}
            className="w-5 h-5 accent-primary" 
          />
          <label htmlFor="secondaryCheck" className="font-bold text-primaryText cursor-pointer">Secondary Insurance</label>
        </div>

        {showSecondary && (
          <div className="space-y-8 animate-in slide-in-from-top-4 border-l-4 border-primary/20 pl-6">
            <h3 className="font-extrabold text-primary uppercase text-xs tracking-widest">Secondary Insurance Verification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleSecondaryOcr}
                className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-all group"
              >
                <Scan className="text-secondary group-hover:text-primary transition-colors" size={28} />
                <p className="font-bold text-primaryText text-sm">Scan Secondary Card</p>
              </button>
              <div 
                onClick={() => secondaryFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <Upload className="text-secondary group-hover:text-primary transition-colors" size={28} />
                <p className="font-bold text-primaryText text-sm">Upload Secondary Doc</p>
                <input 
                  type="file" 
                  ref={secondaryFileInputRef} 
                  className="hidden" 
                  onChange={handleSecondaryFileUpload} 
                />
              </div>
            </div>

            {!secondaryScanned && (
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 flex items-center space-x-3">
                <AlertCircle className="text-accent shrink-0" size={18} />
                <p className="text-xs font-bold text-accent">
                  Secondary insurance fields will remain hidden until the secondary document is processed successfully.
                </p>
              </div>
            )}

            {secondaryScanned && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Secondary Carrier *</label>
                  <input 
                    value={formData.secondaryCarrier}
                    onChange={e => setFormData({...formData, secondaryCarrier: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Secondary Policy ID *</label>
                  <input 
                    value={formData.secondaryPolicyId}
                    onChange={e => setFormData({...formData, secondaryPolicyId: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Secondary Group Number *</label>
                  <input 
                    value={formData.secondaryGroup}
                    onChange={e => setFormData({...formData, secondaryGroup: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Secondary Subscriber Name *</label>
                  <input 
                    value={formData.secondarySubscriber}
                    onChange={e => setFormData({...formData, secondarySubscriber: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none font-bold focus:ring-2 focus:ring-primary" 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8">
        <h2 className="text-xl font-bold text-primaryText">4. Selection Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => { 
              setPath('eligibility'); 
              setSelectedCPTs([]); 
              setUrgency(null);
            }}
            className={`p-8 rounded-3xl border-2 text-left transition-all ${path === 'eligibility' ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-50 bg-gray-50 hover:bg-white'}`}
          >
            <p className="font-bold text-xl mb-1">Eligibility Check</p>
            <p className="text-sm text-secondary font-medium">Verify active coverage status with the carrier instantly.</p>
          </button>
          <button 
            onClick={() => setPath('benefit')}
            className={`p-8 rounded-3xl border-2 text-left transition-all ${path === 'benefit' ? 'border-accent bg-accent/5 shadow-lg' : 'border-gray-50 bg-gray-50 hover:bg-white'}`}
          >
            <p className="font-bold text-xl mb-1">Benefit Check</p>
            <p className="text-sm text-secondary font-medium">Detailed co-pay and deductive breakdown analysis.</p>
          </button>
        </div>

        {path === 'benefit' && (
          <div className="animate-in slide-in-from-top-4 duration-300 space-y-10 pt-6 border-t border-gray-100">
            <div className="space-y-6">
              <h3 className="font-bold text-primaryText text-lg flex items-center space-x-2">
                <Clock className="text-accent" size={20} />
                <span>Requested Backdate & Time</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Urgent', 'Standard', 'Other'] as UrgencyType[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleUrgencyChange(opt)}
                    className={`px-6 py-4 rounded-2xl border-2 font-bold transition-all text-sm ${
                      urgency === opt 
                        ? 'border-accent bg-accent text-white shadow-lg' 
                        : 'border-gray-100 bg-gray-50 text-secondary hover:border-accent/40'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {urgency && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[24px] border border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Requested Completion Date/Time</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
                      <input 
                        type="datetime-local"
                        value={requestedDateTime}
                        readOnly={urgency !== 'Other'}
                        onChange={(e) => handleDateTimeChange(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none font-bold text-primaryText focus:ring-2 focus:ring-accent transition-all ${urgency !== 'Other' ? 'cursor-not-allowed opacity-75' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-secondary leading-relaxed">
                    <InfoIcon size={16} className="text-accent mr-2 shrink-0" />
                    <span>
                      {urgency === 'Urgent' && 'Priority processing: Fixed 4-hour window.'}
                      {urgency === 'Standard' && 'Standard processing: Fixed 24-hour window.'}
                      {urgency === 'Other' && 'Custom timeline: Minimum 24-hour window required.'}
                    </span>
                  </div>
                  {timeError && (
                    <div className="md:col-span-2 text-red-600 text-xs font-bold flex items-center mt-1">
                      <AlertCircle size={14} className="mr-1" />
                      {timeError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-primaryText text-lg">Benefit Categories & CPT Codes</h3>
              <div className="space-y-4">
                {CPT_CODES.map(group => (
                  <div key={group.category} className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <div className="md:w-56 shrink-0">
                       <p className="font-black text-primaryText text-sm uppercase tracking-widest">{group.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.codes.map(code => (
                        <button 
                          key={code}
                          onClick={() => toggleCPT(code)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                            selectedCPTs.includes(code) 
                              ? 'bg-accent text-white border-accent shadow-md' 
                              : 'bg-white border-gray-200 text-secondary hover:border-accent/40'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="fixed bottom-0 right-0 left-64 bg-white/90 backdrop-blur-md border-t border-gray-200 p-6 px-10 flex items-center justify-between z-10 shadow-2xl">
        <div className="flex items-center text-sm text-secondary">
          {!isFormValid && (
            <span className="flex items-center space-x-1 text-red-600 font-bold">
              <AlertCircle size={16} />
              <span>
                {path === 'benefit' 
                  ? 'Missing Benefit Check details (Urgency, Time, CPTs).' 
                  : 'Missing required fields: Carrier, Policy ID, Group, Subscriber, and Selection Path.'}
              </span>
            </span>
          )}
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`flex items-center space-x-2 px-14 py-4 rounded-2xl font-bold transition-all shadow-xl ${
            isFormValid 
            ? 'bg-primary text-white hover:opacity-90 shadow-primary/30' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Submit Verification</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const InfoIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

export default EligibilityVerificationView;
