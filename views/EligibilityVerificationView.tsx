
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Scan,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Clock,
  Calendar as CalendarIcon,
  Upload,
  ShieldCheck,
  ClipboardCheck,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { CPT_CODES } from '../constants';
import { useNavigate } from 'react-router-dom';

type UrgencyType = 'Urgent' | 'Standard' | 'Other';

const THEME_STORAGE_KEY = 'ms2-theme';

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

const formatDateTimeLocal = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const glassCardClass =
  'rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.32)]';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#8dc53f] focus:ring-2 focus:ring-[#8dc53f]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#8dc53f]';

const labelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400';

const EligibilityVerificationView: React.FC = () => {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [scanned, setScanned] = useState(false);
  const [secondaryScanned, setSecondaryScanned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [path, setPath] = useState<'eligibility' | 'benefit' | null>(null);
  const [selectedCPTs, setSelectedCPTs] = useState<string[]>([]);
  const [showSecondary, setShowSecondary] = useState(false);
  const [refNumber] = useState(`EV-SAGE-${Math.floor(Math.random() * 90000 + 10000)}`);
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

  useEffect(() => {
    if (!urgency) return;

    const now = new Date();
    const calculatedDate = new Date(now);

    if (urgency === 'Urgent') {
      calculatedDate.setHours(now.getHours() + 4);
      setTimeError(null);
    } else if (urgency === 'Standard') {
      calculatedDate.setHours(now.getHours() + 24);
      setTimeError(null);
    } else {
      calculatedDate.setHours(now.getHours() + 48);
    }

    setRequestedDateTime(formatDateTimeLocal(calculatedDate));
  }, [urgency]);

  const handleOcr = () => {
    setScanned(true);
    setFormData((prev) => ({
      ...prev,
      firstName: 'Michael',
      lastName: 'Henderson',
      middleName: 'Alexander',
      dob: '1985-05-22',
      primaryCarrier: 'BlueCross BlueShield',
      primaryPolicyId: 'SAGE882711',
      primaryGroup: 'GRP-9922',
      primarySubscriber: 'Michael Henderson',
    }));
  };

  const handleSecondaryOcr = () => {
    setSecondaryScanned(true);
    setFormData((prev) => ({
      ...prev,
      secondaryCarrier: 'Aetna Health',
      secondaryPolicyId: 'AET-112233',
      secondaryGroup: 'GRP-AET-01',
      secondarySubscriber: 'Michael Henderson',
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

  const handleUrgencyChange = (value: UrgencyType) => {
    setUrgency(value);
  };

  const handleDateTimeChange = (value: string) => {
    if (urgency !== 'Other') return;

    const selected = new Date(value);
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (selected < minimumTime) {
      setTimeError('Requests under 24 hours must use the Standard option.');
    } else {
      setTimeError(null);
    }

    setRequestedDateTime(value);
  };

  const toggleCPT = (code: string) => {
    setSelectedCPTs((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const handlePathChange = (selectedPath: 'eligibility' | 'benefit') => {
    setPath(selectedPath);

    if (selectedPath === 'eligibility') {
      setSelectedCPTs([]);
      setUrgency(null);
      setRequestedDateTime('');
      setTimeError(null);
    }
  };

  const secondaryValid =
    !showSecondary ||
    (!!secondaryScanned &&
      !!formData.secondaryCarrier &&
      !!formData.secondaryPolicyId &&
      !!formData.secondaryGroup &&
      !!formData.secondarySubscriber);

  const isFormValid =
    !!formData.firstName &&
    !!formData.lastName &&
    !!formData.dob &&
    !!formData.primaryCarrier &&
    !!formData.primaryPolicyId &&
    !!formData.primaryGroup &&
    !!formData.primarySubscriber &&
    !!path &&
    secondaryValid &&
    (path === 'eligibility' ||
      (!!urgency && !!requestedDateTime && !timeError && selectedCPTs.length > 0));

  const footerMessage = useMemo(() => {
    if (isFormValid) {
      return {
        type: 'success' as const,
        text: 'All required details are complete. You can submit the verification now.',
      };
    }

    if (!scanned) {
      return {
        type: 'error' as const,
        text: 'Process identification documents first to unlock demographic and insurance fields.',
      };
    }

    if (showSecondary && !secondaryValid) {
      return {
        type: 'error' as const,
        text: 'Complete the secondary insurance section before submitting.',
      };
    }

    if (path === 'benefit') {
      return {
        type: 'error' as const,
        text: 'Missing Benefit Check details: urgency, requested time, and CPT codes.',
      };
    }

    return {
      type: 'error' as const,
      text: 'Missing required fields: carrier, policy ID, group number, subscriber, and selection path.',
    };
  }, [isFormValid, path, scanned, secondaryValid, showSecondary]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    setSubmitted(true);
  };

  const handleDownloadSummary = () => {
    const summary = [
      'Sage MS2 - Eligibility Verification Summary',
      `Reference Number: ${refNumber}`,
      `Submitted On: ${new Date().toLocaleString('en-US')}`,
      '',
      `Patient Name: ${formData.firstName} ${formData.middleName} ${formData.lastName}`.replace(
        /\s+/g,
        ' '
      ),
      `DOB: ${formatDateForDisplay(formData.dob)}`,
      '',
      `Primary Carrier: ${formData.primaryCarrier}`,
      `Primary Policy ID: ${formData.primaryPolicyId}`,
      `Primary Group: ${formData.primaryGroup}`,
      `Primary Subscriber: ${formData.primarySubscriber}`,
      '',
      `Secondary Insurance Included: ${showSecondary ? 'Yes' : 'No'}`,
      ...(showSecondary
        ? [
            `Secondary Carrier: ${formData.secondaryCarrier}`,
            `Secondary Policy ID: ${formData.secondaryPolicyId}`,
            `Secondary Group: ${formData.secondaryGroup}`,
            `Secondary Subscriber: ${formData.secondarySubscriber}`,
            '',
          ]
        : []),
      `Selection Path: ${path === 'benefit' ? 'Benefit Check' : 'Eligibility Check'}`,
      ...(path === 'benefit'
        ? [
            `Urgency: ${urgency ?? ''}`,
            `Requested Completion: ${requestedDateTime}`,
            `Selected CPT Codes: ${selectedCPTs.join(', ')}`,
          ]
        : []),
    ].join('\n');

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${refNumber}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_50%,#cbd5e1_100%)] p-8 shadow-[0_12px_50px_rgba(15,23,42,0.08)] transition-colors duration-500 dark:border-white/10 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#1e293b_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(141,197,63,0.2),transparent_40%)] dark:bg-[radial-gradient(circle_at_90%_10%,rgba(141,197,63,0.15),transparent_40%)]" />

        <div className="relative z-10 mx-auto max-w-3xl py-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#8dc53f]/15 text-[#8dc53f] shadow-[0_0_28px_rgba(141,197,63,0.18)]">
            <CheckCircle2 size={46} />
          </div>

          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Intake Successful
          </h1>
          <p className="mb-1 text-sm font-bold uppercase tracking-[0.25em] text-[#8dc53f]">
            Reference Number: {refNumber}
          </p>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Submitted: {new Date().toLocaleDateString('en-US')}
          </p>

          <div className={`${glassCardClass} mx-auto max-w-2xl`}>
            <p className="mb-8 text-lg font-semibold text-slate-900 dark:text-white">
              Eligibility Verification processed for{' '}
              <span className="text-[#8dc53f]">
                {formData.firstName} {formData.lastName}
              </span>
              .
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDownloadSummary}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-6 py-4 font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                <Download size={20} />
                <span>Download Intake Summary</span>
              </button>

              <button
                onClick={() => navigate('/intake')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8dc53f] px-6 py-4 font-bold text-slate-900 transition hover:opacity-90"
              >
                <RotateCcw size={20} />
                <span>Process Another Intake</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_50%,#cbd5e1_100%)] p-6 shadow-[0_12px_50px_rgba(15,23,42,0.08)] transition-colors duration-500 dark:border-white/10 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#1e293b_100%)] md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(141,197,63,0.2),transparent_40%)] dark:bg-[radial-gradient(circle_at_90%_10%,rgba(141,197,63,0.15),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 bg-white/15 blur-3xl dark:bg-white/[0.03]" />

      <div className="relative z-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Eligibility Verification
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Review identification, insurance, and verification path details before submitting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8dc53f]/30 bg-[#8dc53f]/10 px-4 py-2 text-sm font-semibold text-[#8dc53f]">
              <Scan size={16} />
              <span>SAGE OCR ENGINE</span>
            </div>

            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 backdrop-blur-md transition hover:scale-105 hover:text-[#8dc53f] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <div className="space-y-6 pb-28">
          <section className={glassCardClass}>
            <h2 className="mb-6 text-lg font-extrabold text-slate-900 dark:text-white">
              1. Identification &amp; Insurance Cards
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={handleOcr}
                className="group rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/90 p-8 text-center transition-all duration-300 hover:border-[#8dc53f] hover:bg-white dark:border-slate-600 dark:bg-slate-800/35 dark:hover:bg-slate-800/60"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800">
                  <CreditCard className="text-slate-500 dark:text-slate-400" size={28} />
                </div>
                <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
                  Scan Patient Card
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Extract demographics instantly
                </p>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/90 p-8 text-center transition-all duration-300 hover:border-[#8dc53f] hover:bg-white dark:border-slate-600 dark:bg-slate-800/35 dark:hover:bg-slate-800/60"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800">
                  <Upload className="text-slate-500 dark:text-slate-400" size={28} />
                </div>
                <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">
                  Upload Documents
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload ID and Insurance Cards
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
              </button>
            </div>

            {!scanned && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/20">
                <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Demographic fields will remain hidden until identification documents are
                  successfully processed by the system.
                </p>
              </div>
            )}

            {scanned && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#8dc53f]/25 bg-[#8dc53f]/10 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#8dc53f]" size={18} />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Demographics extracted successfully. Please review the populated fields below.
                </p>
              </div>
            )}
          </section>

          {scanned && (
            <section className={glassCardClass}>
              <h2 className="mb-6 text-lg font-extrabold text-slate-900 dark:text-white">
                2. Demographic Details
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Middle Name</label>
                  <input
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className={labelClass}>Date of Birth * (MM/DD/YYYY)</label>
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={formData.dob ? formatDateForDisplay(formData.dob) : ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          <section className={glassCardClass}>
            <h2 className="mb-6 text-lg font-extrabold text-slate-900 dark:text-white">
              3. Insurance Information
            </h2>

            {scanned ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Insurance Carrier *</label>
                  <input
                    value={formData.primaryCarrier}
                    onChange={(e) => setFormData({ ...formData, primaryCarrier: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Policy ID *</label>
                  <input
                    value={formData.primaryPolicyId}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryPolicyId: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Group Number *</label>
                  <input
                    value={formData.primaryGroup}
                    onChange={(e) => setFormData({ ...formData, primaryGroup: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Subscriber Name *</label>
                  <input
                    value={formData.primarySubscriber}
                    onChange={(e) =>
                      setFormData({ ...formData, primarySubscriber: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
                <p className="text-sm font-semibold italic tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  INSURANCE FIELDS HIDDEN UNTIL DEMOGRAPHICS ARE PROCESSED
                </p>
              </div>
            )}

            <label className="mt-6 inline-flex cursor-pointer items-center gap-3">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showSecondary}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowSecondary(checked);

                    if (!checked) {
                      setSecondaryScanned(false);
                      setFormData((prev) => ({
                        ...prev,
                        secondaryCarrier: '',
                        secondaryPolicyId: '',
                        secondaryGroup: '',
                        secondarySubscriber: '',
                      }));
                    }
                  }}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded border-2 border-slate-300 bg-white transition-colors peer-checked:border-[#8dc53f] peer-checked:bg-[#8dc53f] dark:border-slate-600 dark:bg-transparent" />
                <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
              </div>
              <span className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#8dc53f] dark:text-white">
                Secondary Insurance
              </span>
            </label>

            {showSecondary && (
              <div className="mt-6 space-y-6 rounded-2xl border border-[#8dc53f]/20 bg-[#8dc53f]/[0.03] p-6 dark:border-[#8dc53f]/15 dark:bg-[#8dc53f]/[0.04]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#8dc53f]">
                  <ShieldCheck size={14} />
                  <span>Secondary Insurance Verification</span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleSecondaryOcr}
                    className="group rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/90 p-6 text-center transition-all duration-300 hover:border-[#8dc53f] hover:bg-white dark:border-slate-600 dark:bg-slate-800/35 dark:hover:bg-slate-800/60"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800">
                      <Scan className="text-slate-500 dark:text-slate-400" size={22} />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">Scan Secondary Card</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => secondaryFileInputRef.current?.click()}
                    className="group rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/90 p-6 text-center transition-all duration-300 hover:border-[#8dc53f] hover:bg-white dark:border-slate-600 dark:bg-slate-800/35 dark:hover:bg-slate-800/60"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800">
                      <Upload className="text-slate-500 dark:text-slate-400" size={22} />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">Upload Secondary Doc</p>

                    <input
                      type="file"
                      ref={secondaryFileInputRef}
                      className="hidden"
                      onChange={handleSecondaryFileUpload}
                    />
                  </button>
                </div>

                {!secondaryScanned && (
                  <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/20">
                    <AlertCircle className="mt-0.5 shrink-0 text-blue-500" size={18} />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Secondary insurance fields will remain hidden until the secondary document is
                      processed successfully.
                    </p>
                  </div>
                )}

                {secondaryScanned && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Secondary Carrier *</label>
                      <input
                        value={formData.secondaryCarrier}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryCarrier: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Secondary Policy ID *</label>
                      <input
                        value={formData.secondaryPolicyId}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryPolicyId: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Secondary Group Number *</label>
                      <input
                        value={formData.secondaryGroup}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryGroup: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Secondary Subscriber Name *</label>
                      <input
                        value={formData.secondarySubscriber}
                        onChange={(e) =>
                          setFormData({ ...formData, secondarySubscriber: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className={glassCardClass}>
            <h2 className="mb-6 text-lg font-extrabold text-slate-900 dark:text-white">
              4. Selection Path
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePathChange('eligibility')}
                className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                  path === 'eligibility'
                    ? 'border-[#8dc53f] bg-[#8dc53f]/10 shadow-[0_0_20px_rgba(141,197,63,0.18)]'
                    : 'border-slate-200 bg-slate-50/80 hover:border-[#8dc53f] hover:shadow-[0_0_18px_rgba(141,197,63,0.12)] dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                <h3 className="mb-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  Eligibility Check
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Verify active coverage status with the carrier instantly.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePathChange('benefit')}
                className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                  path === 'benefit'
                    ? 'border-[#8dc53f] bg-[#8dc53f]/10 shadow-[0_0_20px_rgba(141,197,63,0.18)]'
                    : 'border-slate-200 bg-slate-50/80 hover:border-[#8dc53f] hover:shadow-[0_0_18px_rgba(141,197,63,0.12)] dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                <h3 className="mb-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  Benefit Check
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Detailed co-pay and deductible breakdown analysis.
                </p>
              </button>
            </div>

            {path === 'benefit' && (
              <div className="mt-8 space-y-8 border-t border-slate-200/70 pt-8 dark:border-white/10">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Clock className="text-[#8dc53f]" size={18} />
                    <h3 className="text-lg font-bold">Requested Backdate &amp; Time</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {(['Urgent', 'Standard', 'Other'] as UrgencyType[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleUrgencyChange(option)}
                        className={`rounded-2xl border px-6 py-4 text-sm font-bold transition-all duration-300 ${
                          urgency === option
                            ? 'border-[#8dc53f] bg-[#8dc53f] text-slate-900 shadow-[0_0_18px_rgba(141,197,63,0.18)]'
                            : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:border-[#8dc53f] dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {urgency && (
                    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.03] md:grid-cols-2">
                      <div>
                        <label className={labelClass}>Requested Completion Date/Time</label>
                        <div className="relative">
                          <CalendarIcon
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8dc53f]"
                            size={18}
                          />
                          <input
                            type="datetime-local"
                            value={requestedDateTime}
                            readOnly={urgency !== 'Other'}
                            onChange={(e) => handleDateTimeChange(e.target.value)}
                            className={`${inputClass} pl-12 ${
                              urgency !== 'Other' ? 'cursor-not-allowed opacity-80' : ''
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                        <Info className="shrink-0 text-[#8dc53f]" size={18} />
                        <span>
                          {urgency === 'Urgent' && 'Priority processing: fixed 4-hour window.'}
                          {urgency === 'Standard' && 'Standard processing: fixed 24-hour window.'}
                          {urgency === 'Other' &&
                            'Custom timeline: minimum 24-hour window required.'}
                        </span>
                      </div>

                      {timeError && (
                        <div className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-red-500">
                          <AlertCircle size={16} />
                          <span>{timeError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-5 border-t border-slate-200/70 pt-8 dark:border-white/10">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <ClipboardCheck className="text-[#8dc53f]" size={18} />
                    <h3 className="text-lg font-bold">Benefit Categories &amp; CPT Codes</h3>
                  </div>

                  <div className="space-y-4">
                    {CPT_CODES.map((group) => (
                      <div
                        key={group.category}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition-all duration-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800/70"
                      >
                        <div className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                          {group.category}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.codes.map((code) => {
                            const isSelected = selectedCPTs.includes(code);

                            return (
                              <button
                                key={code}
                                type="button"
                                onClick={() => toggleCPT(code)}
                                className={`rounded-xl border px-4 py-2 text-xs font-black transition-all duration-300 ${
                                  isSelected
                                    ? 'border-[#8dc53f] bg-[#8dc53f] text-slate-900 shadow-[0_0_14px_rgba(141,197,63,0.18)]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#8dc53f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                }`}
                              >
                                {code}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/90 md:left-64">
        <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <div
            className={`flex items-start gap-2 text-sm font-semibold ${
              footerMessage.type === 'success'
                ? 'text-[#8dc53f]'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            {footerMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{footerMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold transition-all duration-300 ${
              isFormValid
                ? 'bg-[#8dc53f] text-slate-900 shadow-[0_0_20px_rgba(141,197,63,0.25)] hover:opacity-90'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            <span>Submit Verification</span>
            <ChevronRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityVerificationView;