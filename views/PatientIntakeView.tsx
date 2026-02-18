
import React, { useState } from 'react';
import { ShieldCheck, User, Camera, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

const PatientIntakeView: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  const handleNext = () => {
    if (step === 2) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setIsEligible(true);
        setStep(3);
      }, 2000);
    } else {
      setStep(step + 1);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">All Set!</h1>
          <p className="text-gray-600 leading-relaxed">Your intake information and insurance details have been sent to <strong>Elite Orthopedics</strong>. We will notify you once your appointment is confirmed.</p>
          <button 
            onClick={() => window.location.hash = '/'}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
          >
            Exit Patient View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="font-bold text-gray-900">MedFlow</span>
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 3</div>
      </header>

      <main className="max-w-xl mx-auto p-6 pt-10">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Patient Intake</h1>
              <p className="text-lg text-gray-500 font-medium">Please provide your details to begin your check-in with Elite Orthopedics.</p>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-blue-50 border border-gray-100 space-y-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center space-x-2">
                <User className="text-blue-500" size={20} />
                <span>Identity Verification</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
                  <input className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
                  <input className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" />
              </div>
              <button 
                onClick={handleNext}
                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-blue-200 flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-3">
              <button onClick={() => setStep(1)} className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Insurance Info</h1>
              <p className="text-lg text-gray-500 font-medium">Snap a photo of your insurance card for instant verification.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-blue-50 border-2 border-dashed border-gray-100 flex flex-col items-center space-y-4 group cursor-pointer hover:border-blue-300 transition-all">
                <div className="w-20 h-20 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600">
                  <Camera size={32} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">Front of Card</p>
                  <p className="text-sm text-gray-400">Card details will be auto-scanned</p>
                </div>
              </div>
              
              <button 
                onClick={handleNext}
                disabled={loading}
                className={`w-full py-5 rounded-[24px] font-bold text-lg shadow-xl flex items-center justify-center space-x-3 transition-all ${
                  loading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-b-2 border-blue-500 rounded-full"></div>
                    <span>Verifying Coverage...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={24} />
                    <span>Scan & Verify Coverage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 text-center space-y-6">
              <div className="w-16 h-16 bg-white text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-emerald-900">Coverage Verified!</h2>
                <p className="text-emerald-700 font-medium">Your BlueCross BlueShield policy is active and covers this visit.</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-blue-50 border border-gray-100 space-y-6">
              <h3 className="font-bold text-xl text-gray-800">Final Confirmation</h3>
              <p className="text-gray-500">Ready to submit your check-in to the clinic? This will alert the intake desk that you have arrived.</p>
              <button 
                onClick={() => setStep(4)}
                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-blue-200"
              >
                Submit & Complete
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
        Powered by MedFlow Secure Systems
      </footer>
    </div>
  );
};

export default PatientIntakeView;
