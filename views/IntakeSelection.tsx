
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ShieldCheck, FileKey, UserPlus, UploadCloud } from 'lucide-react';

// const IntakeSelection: React.FC = () => {
//   const navigate = useNavigate();

//   const options = [
//     { 
//       label: 'Eligibility Verification', 
//       icon: <ShieldCheck size={32} />, 
//       path: '/intake/ev',
//       color: 'bg-primary',
//       shadow: 'shadow-primary/10'
//     },
//     { 
//       label: 'Prior Authorization', 
//       icon: <FileKey size={32} />, 
//       path: '/intake/pa',
//       color: 'bg-accent',
//       shadow: 'shadow-accent/10'
//     },
//     { 
//       label: 'Personal Injury', 
//       icon: <UserPlus size={32} />, 
//       path: '/intake/pi',
//       color: 'bg-primary',
//       shadow: 'shadow-primary/10'
//     },
//     { 
//       label: 'Upload Document', 
//       icon: <UploadCloud size={32} />, 
//       path: '/intake/upload',
//       color: 'bg-secondary',
//       shadow: 'shadow-secondary/10'
//     },
//   ];

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
//       <div className="flex flex-col space-y-2">
//         <h1 className="text-3xl font-bold text-primaryText">Select Intake</h1>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {options.map((opt) => (
//           <button
//             key={opt.label}
//             onClick={() => navigate(opt.path)}
//             className={`group relative p-8 bg-white border border-gray-100 rounded-[32px] text-left hover:border-primary/50 hover:shadow-2xl transition-all duration-300 ${opt.shadow}`}
//           >
//             <div className={`w-14 h-14 ${opt.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
//               {opt.icon}
//             </div>
//             <h3 className="text-xl font-bold text-primaryText mb-2">{opt.label}</h3>
//             <div className={`w-10 h-1 bg-gray-100 group-hover:${opt.color} transition-colors duration-300 rounded-full`}></div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default IntakeSelection;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ClipboardCheck,
  Bandage,
  CloudUpload,
  Sun,
  Moon,
} from 'lucide-react';

type IntakeOption = {
  key: string;
  titleLines: string[];
  path: string;
  icon: React.ReactNode;
  iconWrapClass: string;
};

const THEME_STORAGE_KEY = 'ms2-theme';

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const IntakeSelection: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDarkMode]);

  const options: IntakeOption[] = [
    {
      key: 'ev',
      titleLines: ['Eligibility', 'Verification'],
      path: '/intake/ev',
      icon: <ShieldCheck size={42} strokeWidth={2.4} />,
      iconWrapClass:
        'bg-[#e9efdf] text-[#9ac53b] dark:bg-[#21301a] dark:text-[#b7e35d]',
    },
    {
      key: 'pa',
      titleLines: ['Prior', 'Authorization'],
      path: '/intake/pa',
      icon: <ClipboardCheck size={42} strokeWidth={2.4} />,
      iconWrapClass:
        'bg-[#dfe9f8] text-[#3d6ee8] dark:bg-[#162742] dark:text-[#7da2ff]',
    },
    {
      key: 'pi',
      titleLines: ['Personal Injury'],
      path: '/intake/pi',
      icon: <Bandage size={42} strokeWidth={2.4} />,
      iconWrapClass:
        'bg-[#ddf2e3] text-[#1cad57] dark:bg-[#183125] dark:text-[#56d48a]',
    },
    {
      key: 'upload',
      titleLines: ['Upload', 'Document'],
      path: '/intake/upload',
      icon: <CloudUpload size={42} strokeWidth={2.4} />,
      iconWrapClass:
        'bg-[#e4e8f1] text-[#4a5970] dark:bg-[#222c3a] dark:text-[#9fb0c8]',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-110px)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-[#eef2f1] px-6 py-8 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-[#0f172a] md:px-10 md:py-10 xl:px-12 xl:py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 h-[280px] w-[280px] rounded-full bg-[#dcecd5] opacity-80 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute right-[28%] top-0 h-full w-[180px] bg-white/25 blur-3xl dark:bg-white/5" />
        <div className="absolute bottom-[-80px] left-[20%] h-[220px] w-[220px] rounded-full bg-white/20 blur-3xl dark:bg-slate-600/10" />
      </div>

      <div className="relative z-10">
        <div className="mb-10 flex items-start justify-end">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#5d6b82] shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9ac53b] focus:ring-offset-2 dark:bg-[#1e293b] dark:text-slate-200 dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:focus:ring-offset-[#0f172a]"
          >
            {isDarkMode ? <Moon size={26} strokeWidth={2.2} /> : <Sun size={26} strokeWidth={2.2} />}
          </button>
        </div>

        <div className="mx-auto max-w-6xl">
          <h1 className="mb-14 text-center text-4xl font-bold tracking-tight text-[#1f2d4b] dark:text-white md:text-5xl">
            Select Intake
          </h1>

          <div className="grid grid-cols-1 justify-items-center gap-8 md:grid-cols-2 xl:grid-cols-4">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => navigate(option.path)}
                className="group flex h-[285px] w-full max-w-[305px] flex-col items-center justify-center rounded-[34px] bg-white px-8 text-center shadow-[0_14px_38px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)] focus:outline-none focus:ring-2 focus:ring-[#9ac53b] focus:ring-offset-2 dark:bg-[#111827] dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] dark:focus:ring-offset-[#0f172a]"
              >
                <div
                  className={`mb-8 flex h-[116px] w-[116px] items-center justify-center rounded-[32px] transition-transform duration-300 group-hover:scale-105 ${option.iconWrapClass}`}
                >
                  {option.icon}
                </div>

                <div className="space-y-1">
                  {option.titleLines.map((line) => (
                    <div
                      key={line}
                      className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1f2d4b] dark:text-white"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeSelection;