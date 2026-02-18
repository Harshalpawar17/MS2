
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileKey, UserPlus, UploadCloud } from 'lucide-react';

const IntakeSelection: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    { 
      label: 'Eligibility Verification', 
      icon: <ShieldCheck size={32} />, 
      path: '/intake/ev',
      color: 'bg-primary',
      shadow: 'shadow-primary/10'
    },
    { 
      label: 'Prior Authorization', 
      icon: <FileKey size={32} />, 
      path: '/intake/pa',
      color: 'bg-accent',
      shadow: 'shadow-accent/10'
    },
    { 
      label: 'Personal Injury', 
      icon: <UserPlus size={32} />, 
      path: '/intake/pi',
      color: 'bg-primary',
      shadow: 'shadow-primary/10'
    },
    { 
      label: 'Upload Document', 
      icon: <UploadCloud size={32} />, 
      path: '/intake/upload',
      color: 'bg-secondary',
      shadow: 'shadow-secondary/10'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-primaryText">Select Intake</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => navigate(opt.path)}
            className={`group relative p-8 bg-white border border-gray-100 rounded-[32px] text-left hover:border-primary/50 hover:shadow-2xl transition-all duration-300 ${opt.shadow}`}
          >
            <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {opt.icon}
            </div>
            <h3 className="text-xl font-bold text-primaryText mb-2">{opt.label}</h3>
            <div className={`w-10 h-1 bg-gray-100 group-hover:${opt.color} transition-colors duration-300 rounded-full`}></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntakeSelection;
