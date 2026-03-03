import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Layers,
  FlaskConical,
  ClipboardList,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  Eye,
  Pencil,
  ChevronDown,
  Check,
} from "lucide-react";

const STATUS_OPTIONS = ["Autofill EV", "Autofill PA"];

const NETWORK_STATUS_OPTIONS = ["In-Network", "Out-of-Network", "Unknown"];
const PLAN_TYPE_OPTIONS = ["PPO", "HMO", "EPO", "POS", "Medicare", "Medicaid", "Other"];

const SAMPLE_INSURANCES = [
  "Aetna", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Humana",
  "Kaiser Permanente", "Anthem", "Molina Healthcare", "Centene", "WellCare",
  "Ambetter", "Oscar Health", "Bright Health", "Devoted Health", "Clover Health",
];

const SAMPLE_CLINICS = [
  "Sunshine Rehab", "Valley Medical Center", "Coastal Health Clinic",
  "Mountain View Hospital", "Lakeside Family Practice", "Downtown Urgent Care",
  "Northside Physical Therapy", "Southgate Wellness Center", "Evergreen Medical Group",
  "Harmony Health Partners",
];

const EV_FIELDS = [
  { key: "memberId", label: "Member ID" },
  { key: "groupNumber", label: "Group Number" },
  { key: "planType", label: "Plan Type" },
  { key: "effectiveDate", label: "Effective Date" },
  { key: "terminationDate", label: "Termination Date" },
  { key: "copay", label: "Copay" },
  { key: "coinsurance", label: "Coinsurance %" },
  { key: "deductible", label: "Deductible" },
  { key: "deductibleMet", label: "Deductible Met" },
  { key: "outOfPocketMax", label: "Out-of-Pocket Max" },
  { key: "networkStatus", label: "Network Status" },
  { key: "benefitsSummary", label: "Benefits Summary" },
  { key: "priorAuthRequired", label: "Prior Auth Required" },
  { key: "referralRequired", label: "Referral Required" },
];

const PA_FIELDS = [
  { key: "authNumber", label: "Auth Number" },
  { key: "authStatus", label: "Auth Status" },
  { key: "procedureCode", label: "Procedure Code (CPT)" },
  { key: "diagnosisCode", label: "Diagnosis Code (ICD-10)" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "approvedUnits", label: "Approved Units/Visits" },
  { key: "providerName", label: "Provider Name" },
  { key: "facilityName", label: "Facility Name" },
  { key: "reviewType", label: "Review Type" },
  { key: "clinicalNotes", label: "Clinical Notes Required" },
  { key: "submissionMethod", label: "Submission Method" },
];

type TabKey = "groups" | "rules" | "test" | "audit";

type RuleScope = {
  insuranceNames: string[];
  planType?: string;
  networkStatus?: string;
  clinicNames?: string[];
  groupId?: string;
  policyId?: string;
};

type RuleAction = {
  statusToSet: string;
  autofillFields?: string[];
};

type PolicyMatchType = "EQUALS" | "STARTS_WITH";

type RuleRecord = {
  id: string;
  ruleCode: string;
  insuranceGroupId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  scope: RuleScope;
  policyMatchType: PolicyMatchType;
  action: RuleAction;
  description?: string;
};

/* ── MultiSelect Search Dropdown ── */
const MultiSelectSearch: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}> = ({ label, options, selected, onChange, placeholder = "Search..." }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o)
  );

  return (
    <div ref={ref} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 relative">
      <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">{label}</p>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {s}
              <button onClick={() => onChange(selected.filter((x) => x !== s))} className="hover:text-red-500 transition">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <Search size={14} className="text-secondary" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
          onFocus={() => setOpen(true)}
        />
        <ChevronDown size={16} className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-secondary">No options found</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o}
                onClick={() => { onChange([...selected, o]); setSearch(""); }}
                className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-primary/5 transition flex items-center gap-2"
              >
                <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center">
                  {selected.includes(o) && <Check size={12} className="text-primary" />}
                </div>
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ── Field Selection Popup (for EV / PA) ── */
const FieldSelectionPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { key: string; label: string }[];
  selected: string[];
  onSave: (fields: string[]) => void;
}> = ({ open, onClose, title, fields, selected, onSave }) => {
  const [local, setLocal] = useState<string[]>(selected);

  useEffect(() => { setLocal(selected); }, [selected]);

  if (!open) return null;

  const toggle = (key: string) =>
    setLocal((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[32px] border border-gray-100 shadow-2xl p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-primaryText">{title}</h3>
            <p className="text-sm text-secondary font-medium">Select the fields to auto-fill when this rule matches.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition"><X size={20} className="text-secondary" /></button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-secondary">{local.length} field(s) selected</span>
          <div className="flex gap-2">
            <button onClick={() => setLocal(fields.map((f) => f.key))} className="text-xs font-bold text-primary hover:underline">Select All</button>
            <button onClick={() => setLocal([])} className="text-xs font-bold text-secondary hover:underline">Clear</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {fields.map((f) => {
            const checked = local.includes(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggle(f.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${checked ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 text-primaryText border border-gray-100 hover:bg-gray-100"
                  }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? "bg-primary" : "border border-gray-300"
                  }`}>
                  {checked && <Check size={11} className="text-white" />}
                </div>
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">Cancel</button>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition flex items-center gap-2"
          >
            <Save size={18} />
            Confirm Fields
          </button>
        </div>
      </div>
    </div>
  );
};

type InsuranceGroup = {
  id: string;
  name: string;
  updatedAt: string;
};

type AuditLog = {
  id: string;
  createdAt: string;
  type: "EVALUATE" | "BATCH_EVALUATE" | "MANUAL_OVERRIDE";
  insuranceGroupName?: string;
  inputs: {
    clinicName: string;
    insuranceName: string;
    policyId: string;
    groupId: string;
    networkStatus: string;
    planType: string;
  };
  winningRule?: {
    ruleId: string;
    scopeLevel: string;
    precedenceReason: string;
    statusToSet: string;
  };
  notes?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function makeRuleCode(n: number) {
  // RULE-000001 format
  return `RULE-${String(n).padStart(6, "0")}`;
}

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function scopeLevelLabel(rule: RuleRecord): string {
  // Precedence order per requirements:
  // policy_id > group_id > clinic_name > network_status > plan_type > insurance default
  if (rule.scope.policyId) return "Policy";
  if (rule.scope.groupId) return "Group";
  if (rule.scope.clinicNames && rule.scope.clinicNames.length > 0) return "Clinic";
  if (rule.scope.networkStatus) return "Network";
  if (rule.scope.planType) return "Plan";
  return "Insurance Default";
}

function ruleMatchesInputs(rule: RuleRecord, inputs: AuditLog["inputs"]) {
  // A rule matches if every scope field that is set equals the input value.
  const s = rule.scope;

  // Insurance names: rule matches if input insurance is in the rule's list
  const inputIns = inputs.insuranceName.trim().toLowerCase();
  if (!s.insuranceNames.some((n) => n.trim().toLowerCase() === inputIns)) return false;

  if (s.planType && s.planType.trim().toLowerCase() !== inputs.planType.trim().toLowerCase()) return false;
  if (s.networkStatus && s.networkStatus.trim().toLowerCase() !== inputs.networkStatus.trim().toLowerCase()) return false;
  if (s.clinicNames && s.clinicNames.length > 0) {
    const inputClinic = inputs.clinicName.trim().toLowerCase();
    if (!s.clinicNames.some((c) => c.trim().toLowerCase() === inputClinic)) return false;
  }
  if (s.groupId && s.groupId.trim().toLowerCase() !== inputs.groupId.trim().toLowerCase()) return false;
  if (s.policyId) {
    const rulePolicy = s.policyId.trim().toLowerCase();
    const inputPolicy = inputs.policyId.trim().toLowerCase();

    if (rule.policyMatchType === "STARTS_WITH") {
      if (!inputPolicy.startsWith(rulePolicy)) return false;
    } else {
      // EQUALS (default)
      if (rulePolicy !== inputPolicy) return false;
    }
  }

  return true;
}

function precedenceScore(rule: RuleRecord): number {
  // higher is stronger
  if (rule.scope.policyId) return 600;
  if (rule.scope.groupId) return 500;
  if (rule.scope.clinicNames && rule.scope.clinicNames.length > 0) return 400;
  if (rule.scope.networkStatus) return 300;
  if (rule.scope.planType) return 200;
  return 100; // default
}

function pickWinningRule(rules: RuleRecord[], inputs: AuditLog["inputs"]) {
  // Only enabled rules that match
  const candidates = rules.filter((r) => r.isActive && ruleMatchesInputs(r, inputs));

  if (candidates.length === 0) {
    return { winner: null as RuleRecord | null, reason: "No matching enabled rule found." };
    // In real system, you might fall back to default behavior.
  }

  // Pick highest precedence score; if tie, choose latest updatedAt (most recent)
  const sorted = [...candidates].sort((a, b) => {
    const sa = precedenceScore(a);
    const sb = precedenceScore(b);
    if (sb !== sa) return sb - sa;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const winner = sorted[0];
  return {
    winner,
    reason: `Matched ${candidates.length} rule(s). Winner chosen by precedence (${scopeLevelLabel(
      winner
    )}) and latest update if tie.`,
  };
}

/** -----------------------------
 *  Modal (Reusable)
 *  ----------------------------- */
const Modal: React.FC<{
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] border border-gray-100 shadow-2xl p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-primaryText">{title}</h3>
            <p className="text-sm text-secondary font-medium">Complete the details and click Save.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition" aria-label="Close">
            <X size={20} className="text-secondary" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

/** -----------------------------
 *  Forms
 *  ----------------------------- */
const AddInsuranceGroupForm: React.FC<{
  onCancel: () => void;
  onSave: (insuranceName: string) => void;
}> = ({ onCancel, onSave }) => {
  const [name, setName] = useState("");
  const canSave = name.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
        <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Insurance Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Aetna"
          className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave(name)}
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          <Save size={18} />
          Save
        </button>
      </div>
    </div>
  );
};

const AddRuleForm: React.FC<{
  insuranceGroups: InsuranceGroup[];
  selectedInsuranceGroupId: string | null;
  initialRule?: RuleRecord | null;
  mode?: "add" | "edit";
  onCancel: () => void;
  onSave: (payload: {
    insuranceGroupId: string;
    scope: RuleScope;
    action: RuleAction;
    policyMatchType: PolicyMatchType;
    description?: string;
  }) => void;
}> = ({
  insuranceGroups,
  selectedInsuranceGroupId,
  initialRule = null,
  mode = "add",
  onCancel,
  onSave,
}) => {
    const [insuranceGroupId, setInsuranceGroupId] = useState(
      initialRule?.insuranceGroupId || selectedInsuranceGroupId || ""
    );
    const [insuranceNames, setInsuranceNames] = useState<string[]>(initialRule?.scope.insuranceNames || []);
    const [planType, setPlanType] = useState(initialRule?.scope.planType || "");
    const [networkStatus, setNetworkStatus] = useState(initialRule?.scope.networkStatus || "");
    const [clinicNames, setClinicNames] = useState<string[]>(initialRule?.scope.clinicNames || []);
    const [groupId, setGroupId] = useState(initialRule?.scope.groupId || "");
    const [policyId, setPolicyId] = useState(initialRule?.scope.policyId || "");
    const [groupMatchType, setGroupMatchType] = useState<PolicyMatchType>("EQUALS");
    const [policyMatchType, setPolicyMatchType] = useState<PolicyMatchType>(initialRule?.policyMatchType || "EQUALS");
    const [statusToSet, setStatusToSet] = useState(initialRule?.action.statusToSet || "");
    const [autofillFields, setAutofillFields] = useState<string[]>(initialRule?.action.autofillFields || []);
    const [showFieldPopup, setShowFieldPopup] = useState(false);
    const [description, setDescription] = useState(initialRule?.description || "");

    const canSave = insuranceGroupId.trim().length > 0 && insuranceNames.length > 0 && statusToSet.trim().length > 0;

    // Build condition summary
    const conditionParts: string[] = [];
    if (insuranceNames.length > 0) conditionParts.push(`Insurance: ${insuranceNames.join(", ")}`);
    if (planType) conditionParts.push(`Plan: ${planType}`);
    if (networkStatus) conditionParts.push(`Network: ${networkStatus}`);
    if (clinicNames.length > 0) conditionParts.push(`Clinics: ${clinicNames.join(", ")}`);
    if (policyId) conditionParts.push(`Policy: ${policyId}`);
    if (groupId) conditionParts.push(`Group: ${groupId}`);

    const isEV = statusToSet === "Autofill EV";
    const isPA = statusToSet === "Autofill PA";
    const fieldList = isEV ? EV_FIELDS : isPA ? PA_FIELDS : [];

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Insurance Group selector */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Insurance Group (required)</p>
          <select
            value={insuranceGroupId}
            onChange={(e) => setInsuranceGroupId(e.target.value)}
            disabled={mode === "edit"}
            className={`bg-transparent outline-none w-full text-sm text-primaryText ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <option value="">Select insurance group</option>
            {insuranceGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* ── CONDITIONS SECTION ── */}
        <div className="border border-primary/20 rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-black text-xs">IF</span>
            </div>
            <h4 className="text-sm font-bold text-primaryText">Conditions</h4>
            <p className="text-[11px] text-secondary ml-2">Define when this rule should trigger</p>
          </div>

          {/* Insurance Names - Multiselect */}
          <MultiSelectSearch
            label="Insurance Name(s) — required"
            options={SAMPLE_INSURANCES}
            selected={insuranceNames}
            onChange={setInsuranceNames}
            placeholder="Search insurances..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Plan Type - Dropdown */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Plan Type</p>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="bg-transparent outline-none w-full text-sm text-primaryText"
              >
                <option value="">Any Plan Type</option>
                {PLAN_TYPE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Network Status - Dropdown */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Network Status</p>
              <select
                value={networkStatus}
                onChange={(e) => setNetworkStatus(e.target.value)}
                className="bg-transparent outline-none w-full text-sm text-primaryText"
              >
                <option value="">Any Network Status</option>
                {NETWORK_STATUS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Policy ID */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Policy ID</p>
              <div className="flex gap-2">
                <select
                  value={policyMatchType}
                  onChange={(e) => setPolicyMatchType(e.target.value as PolicyMatchType)}
                  className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-[130px]"
                >
                  <option value="EQUALS">Equals</option>
                  <option value="STARTS_WITH">Starts With</option>
                </select>
                <input
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  placeholder="e.g., BCBS-123"
                  className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
                />
              </div>
            </div>

            {/* Group ID */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Group ID</p>
              <div className="flex gap-2">
                <select
                  value={groupMatchType}
                  onChange={(e) => setGroupMatchType(e.target.value as PolicyMatchType)}
                  className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-[130px]"
                >
                  <option value="EQUALS">Equals</option>
                  <option value="STARTS_WITH">Starts With</option>
                </select>
                <input
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="e.g., GRP-9988"
                  className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIONS SECTION ── */}
        <div className="border border-accent/20 rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-black text-xs">DO</span>
            </div>
            <h4 className="text-sm font-bold text-primaryText">Actions</h4>
            <p className="text-[11px] text-secondary ml-2">What happens when conditions match</p>
          </div>

          {/* Clinic Names - Multiselect */}
          <MultiSelectSearch
            label="Clinic Name(s)"
            options={SAMPLE_CLINICS}
            selected={clinicNames}
            onChange={setClinicNames}
            placeholder="Search clinics..."
          />

          {/* Action Dropdown */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
            <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Action (required)</p>
            <select
              value={statusToSet}
              onChange={(e) => {
                setStatusToSet(e.target.value);
                // Auto-open field popup when EV/PA is selected
                if (e.target.value === "Autofill EV" || e.target.value === "Autofill PA") {
                  setShowFieldPopup(true);
                } else {
                  setAutofillFields([]);
                }
              }}
              className="bg-transparent outline-none w-full text-sm text-primaryText"
            >
              <option value="">Select action</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Show selected fields summary if EV/PA */}
          {(isEV || isPA) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-primaryText">
                  {isEV ? "EV Fields" : "PA Fields"} to Auto-fill
                </p>
                <button
                  onClick={() => setShowFieldPopup(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {autofillFields.length > 0 ? "Edit Fields" : "Select Fields"}
                </button>
              </div>
              {autofillFields.length === 0 ? (
                <p className="text-xs text-secondary">No fields selected. Click "Select Fields" to choose.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {autofillFields.map((fk) => {
                    const label = fieldList.find((fl) => fl.key === fk)?.label || fk;
                    return (
                      <span key={fk} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RULE DESCRIPTION / NOTES ── */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Rule Description / Notes</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this rule so anyone can understand it. e.g., 'For Aetna PPO In-Network patients, auto-fill EV with standard benefit fields.'"
            rows={3}
            className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary resize-none"
          />
        </div>

        {/* ── RULE SUMMARY ── */}
        {conditionParts.length > 0 && statusToSet && (
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-gray-100 rounded-[24px] p-5">
            <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Rule Summary</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">IF</span>
              <span className="text-primaryText font-medium">{conditionParts.join(" + ")}</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-bold text-xs">THEN</span>
              <span className="text-primaryText font-medium">
                {statusToSet}
                {autofillFields.length > 0 && ` (${autofillFields.length} fields)`}
              </span>
            </div>
          </div>
        )}

        {/* Save / Cancel */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                insuranceGroupId,
                scope: {
                  insuranceNames,
                  planType: planType || undefined,
                  networkStatus: networkStatus || undefined,
                  clinicNames: clinicNames.length > 0 ? clinicNames : undefined,
                  groupId: groupId.trim() || undefined,
                  policyId: policyId.trim() || undefined,
                },
                action: {
                  statusToSet: statusToSet.trim(),
                  autofillFields: autofillFields.length > 0 ? autofillFields : undefined,
                },
                policyMatchType,
                description: description.trim() || undefined,
              })
            }
            className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <Save size={18} />
            {mode === "edit" ? "Save Changes" : "Save Rule"}
          </button>
        </div>

        {/* Field Selection Popup for EV/PA */}
        <FieldSelectionPopup
          open={showFieldPopup}
          onClose={() => setShowFieldPopup(false)}
          title={isEV ? "Select EV Fields to Auto-fill" : "Select PA Fields to Auto-fill"}
          fields={fieldList}
          selected={autofillFields}
          onSave={setAutofillFields}
        />
      </div>
    );
  };

/** -----------------------------
 *  Main Component
 *  ----------------------------- */
const RuleEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("groups");

  // Modals
  const [showAddInsuranceModal, setShowAddInsuranceModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false); // ✅ NEW
  const [editingRule, setEditingRule] = useState<RuleRecord | null>(null); // ✅ NEW

  // Data (local demo state; later replace with API)
  const [insuranceGroups, setInsuranceGroups] = useState<InsuranceGroup[]>([]);
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // UI state
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedInsuranceGroupId, setSelectedInsuranceGroupId] = useState<string | null>(null);

  // Evaluate inputs (shared state so result can be shown + logged)
  const [evalInputs, setEvalInputs] = useState<AuditLog["inputs"]>({
    clinicName: "",
    insuranceName: "",
    policyId: "",
    groupId: "",
    networkStatus: "",
    planType: "",
  });

  const [evalResult, setEvalResult] = useState<{
    winner: RuleRecord | null;
    message: string;
  } | null>(null);

  const tabs = useMemo(
    () => [
      {
        key: "groups" as const,
        label: "Insurance Groups",
        icon: <Layers size={18} />,
        description: "Create and manage insurance groups (Aetna, BCBS, etc.)",
      },
      {
        key: "rules" as const,
        label: "Rules",
        icon: <ClipboardList size={18} />,
        description: "Define rule scopes (policy/group/clinic) and actions",
      },
      {
        key: "test" as const,
        label: "Test / Evaluate",
        icon: <FlaskConical size={18} />,
        description: "Enter 6 inputs and see which rule wins + output",
      },
      {
        key: "audit" as const,
        label: "Audit Logs",
        icon: <ClipboardList size={18} />,
        description: "Track applied rules, precedence decisions, overrides",
      },
    ],
    []
  );

  const selectedGroup = useMemo(
    () => insuranceGroups.find((g) => g.id === selectedInsuranceGroupId) || null,
    [insuranceGroups, selectedInsuranceGroupId]
  );

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return insuranceGroups;
    return insuranceGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [insuranceGroups, groupSearch]);

  const rulesForSelectedGroup = useMemo(() => {
    if (!selectedInsuranceGroupId) return [];
    return rules.filter((r) => r.insuranceGroupId === selectedInsuranceGroupId);
  }, [rules, selectedInsuranceGroupId]);

  function addInsuranceGroup(name: string) {
    const trimmed = name.trim();
    const exists = insuranceGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const g: InsuranceGroup = { id: crypto.randomUUID(), name: trimmed, updatedAt: nowIso() };
    setInsuranceGroups((prev) => [...prev, g]);

    // auto-select newly created group
    setSelectedInsuranceGroupId(g.id);
    setActiveTab("groups");
  }

  function addRule(payload: { insuranceGroupId: string; scope: RuleScope; action: RuleAction; policyMatchType: PolicyMatchType; description?: string }) {
    const created = nowIso();

    // Create next rule code based on max existing ruleCode (safe for backend loads)
    const nextNum =
      rules.reduce((max, r) => {
        const n = Number(String(r.ruleCode || "").replace("RULE-", ""));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0) + 1;

    const ruleCode = makeRuleCode(nextNum)

    const r: RuleRecord = {
      id: crypto.randomUUID(),
      ruleCode,
      insuranceGroupId: payload.insuranceGroupId,
      isActive: true,
      createdAt: created,
      updatedAt: created,
      scope: payload.scope,
      policyMatchType: payload.policyMatchType ?? "EQUALS",
      action: payload.action,
      description: payload.description,
    };

    setRules((prev) => [r, ...prev]);

    setInsuranceGroups((prev) =>
      prev.map((g) => (g.id === payload.insuranceGroupId ? { ...g, updatedAt: created } : g))
    );

    setSelectedInsuranceGroupId(payload.insuranceGroupId);
    setActiveTab("rules");
  }

  function updateRule(ruleId: string, payload: { scope: RuleScope; action: RuleAction; policyMatchType: PolicyMatchType; description?: string }) {
    const t = nowIso();

    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
            ...r,
            scope: payload.scope,
            action: payload.action,
            policyMatchType: payload.policyMatchType ?? r.policyMatchType,
            description: payload.description,
            updatedAt: t,
          }
          : r
      )
    );

    // update insurance group timestamp too (same behavior as addRule)
    setInsuranceGroups((prev) =>
      prev.map((g) => (g.id === editingRule?.insuranceGroupId ? { ...g, updatedAt: t } : g))
    );

    setActiveTab("rules");
  }

  function toggleRuleActive(ruleId: string) {
    const t = nowIso();
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive, updatedAt: t } : r))
    );
  }

  function bulkSetRulesActive(isActive: boolean) {
    if (!selectedInsuranceGroupId) return;
    const t = nowIso();
    setRules((prev) =>
      prev.map((r) =>
        r.insuranceGroupId === selectedInsuranceGroupId ? { ...r, isActive, updatedAt: t } : r
      )
    );
  }

  function runEvaluate() {
    // Evaluate only against rules in the selected insurance group if chosen,
    // otherwise evaluate all rules.
    const targetRules = selectedInsuranceGroupId ? rulesForSelectedGroup : rules;

    const { winner, reason } = pickWinningRule(targetRules, evalInputs);

    const message = winner
      ? `${reason} → Status set to "${winner.action.statusToSet}".`
      : reason;

    setEvalResult({ winner, message });

    // Write audit log entry
    const groupName =
      selectedInsuranceGroupId
        ? insuranceGroups.find((g) => g.id === selectedInsuranceGroupId)?.name
        : undefined;

    const log: AuditLog = {
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      type: "EVALUATE",
      insuranceGroupName: groupName,
      inputs: { ...evalInputs },
      winningRule: winner
        ? {
          ruleId: winner.ruleCode,
          scopeLevel: scopeLevelLabel(winner),
          precedenceReason: reason,
          statusToSet: winner.action.statusToSet,
        }
        : undefined,
      notes: winner ? "Evaluation completed." : "No matching rule found.",
    };

    setAuditLogs((prev) => [log, ...prev]);
  }

  function batchReEvaluate() {
    if (!selectedInsuranceGroupId || !selectedGroup) return;

    const log: AuditLog = {
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      type: "BATCH_EVALUATE",
      insuranceGroupName: selectedGroup.name,
      inputs: { ...evalInputs },
      notes: "Batch re-evaluate is a backend job in production. This button is a UI hook for now.",
    };

    setAuditLogs((prev) => [log, ...prev]);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-primaryText">Rule Engine</h1>
        <p className="text-secondary font-medium">
          Configure insurance-based rules to auto-update status and auto-fill benefit-check fields.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const selected = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all ${selected
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-gray-50 text-secondary hover:bg-gray-100 font-medium"
                  }`}
              >
                <span className={selected ? "text-white" : "text-primary"}>{t.icon}</span>
                <span className="text-sm font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 px-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <p className="text-sm text-secondary">{tabs.find((t) => t.key === activeTab)?.description}</p>

          {/* Selected group quick view */}
          <div className="text-xs text-secondary">
            <span className="font-bold text-primaryText">Selected Group:</span>{" "}
            {selectedGroup ? selectedGroup.name : "None"}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "groups" && (
        <InsuranceGroupsSection
          search={groupSearch}
          onSearchChange={setGroupSearch}
          groups={filteredGroups}
          selectedInsuranceGroupId={selectedInsuranceGroupId}
          rules={rules}
          onSelectGroup={(id) => {
            setSelectedInsuranceGroupId(id);
            // also sync evaluation insurance name if empty
            const g = insuranceGroups.find((x) => x.id === id);
            if (g && !evalInputs.insuranceName) {
              setEvalInputs((p) => ({ ...p, insuranceName: g.name }));
            }
          }}
          onAddClick={() => setShowAddInsuranceModal(true)}
        />
      )}

      {activeTab === "rules" && (
        <RulesSection
          selectedGroup={selectedGroup}
          rules={rulesForSelectedGroup}
          onAddRule={() => setShowAddRuleModal(true)}
          onEditRule={(rule) => {
            setEditingRule(rule);
            setShowEditRuleModal(true);
          }}
          onToggleRule={toggleRuleActive}
          onBulkActivate={() => bulkSetRulesActive(true)}
          onBulkInactivate={() => bulkSetRulesActive(false)}
          onBatchReEvaluate={batchReEvaluate}
          onGoGroups={() => setActiveTab("groups")}
        />
      )}

      {activeTab === "test" && (
        <TestEvaluateSection
          evalInputs={evalInputs}
          setEvalInputs={setEvalInputs}
          onEvaluate={runEvaluate}
          result={evalResult}
        />
      )}

      {activeTab === "audit" && <AuditLogsSection logs={auditLogs} />}

      {/* Modals */}
      <Modal title="Add Insurance Group" open={showAddInsuranceModal} onClose={() => setShowAddInsuranceModal(false)}>
        <AddInsuranceGroupForm
          onCancel={() => setShowAddInsuranceModal(false)}
          onSave={(name) => {
            addInsuranceGroup(name);
            setShowAddInsuranceModal(false);
          }}
        />
      </Modal>

      <Modal
        title={`Edit Rule${editingRule ? ` (${editingRule.ruleCode})` : ""}`}
        open={showEditRuleModal}
        onClose={() => {
          setShowEditRuleModal(false);
          setEditingRule(null);
        }}
      >
        <AddRuleForm
          insuranceGroups={insuranceGroups}
          selectedInsuranceGroupId={selectedInsuranceGroupId}
          initialRule={editingRule}
          mode="edit"
          onCancel={() => {
            setShowEditRuleModal(false);
            setEditingRule(null);
          }}
          onSave={(payload) => {
            if (!editingRule) return;
            updateRule(editingRule.id, {
              scope: payload.scope,
              action: payload.action,
              policyMatchType: payload.policyMatchType,
            });
            setShowEditRuleModal(false);
            setEditingRule(null);
          }}
        />
      </Modal>
      <Modal title="Add New Rule" open={showAddRuleModal} onClose={() => setShowAddRuleModal(false)}>
        <AddRuleForm
          insuranceGroups={insuranceGroups}
          selectedInsuranceGroupId={selectedInsuranceGroupId}
          mode="add"
          onCancel={() => setShowAddRuleModal(false)}
          onSave={(payload) => {
            addRule(payload);
            setShowAddRuleModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default RuleEngine;

/** -----------------------------
 *  Sections
 *  ----------------------------- */

const InsuranceGroupsSection: React.FC<{
  search: string;
  onSearchChange: (v: string) => void;
  groups: InsuranceGroup[];
  rules: RuleRecord[];
  selectedInsuranceGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onAddClick: () => void;
}> = ({ search, onSearchChange, groups, rules, selectedInsuranceGroupId, onSelectGroup, onAddClick }) => {
  const rulesCountByGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rules) {
      map.set(r.insuranceGroupId, (map.get(r.insuranceGroupId) || 0) + 1);
    }
    return map;
  }, [rules]);

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Insurance Groups</h2>
          <p className="text-secondary text-sm font-medium">Rules are organized by insurance for inheritance and overrides.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 w-full sm:w-[360px]">
            <Search size={18} className="text-secondary mr-2" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search insurance name..."
              className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
            />
          </div>

          <button
            onClick={onAddClick}
            className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition"
          >
            <Plus size={18} />
            <span>Add Insurance Group</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-100 rounded-[24px] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
          <div className="col-span-6">Insurance Name</div>
          <div className="col-span-2">Total Rules</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {groups.length === 0 ? (
          <div className="px-6 py-6 text-sm text-secondary">
            No insurance groups yet. Click <span className="font-bold text-primaryText">Add Insurance Group</span> to start.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groups.map((g) => {
              const selected = selectedInsuranceGroupId === g.id;
              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-12 gap-2 px-6 py-4 items-center cursor-pointer transition ${selected ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  onClick={() => onSelectGroup(g.id)}
                >
                  <div className="col-span-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primaryText">{g.name}</span>
                      {selected && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-secondary mt-1">Use this group to manage rules and evaluate matches.</div>
                  </div>

                  <div className="col-span-2 text-sm font-bold text-primaryText">
                    {rulesCountByGroup.get(g.id) || 0}
                  </div>

                  <div className="col-span-2 text-xs text-secondary">{shortDate(g.updatedAt)}</div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGroup(g.id);
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Eye size={16} /> Open
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const RulesSection: React.FC<{
  selectedGroup: InsuranceGroup | null;
  rules: RuleRecord[];
  onAddRule: () => void;
  onEditRule: (rule: RuleRecord) => void; // ✅ NEW
  onToggleRule: (ruleId: string) => void;
  onBulkActivate: () => void;
  onBulkInactivate: () => void;
  onBatchReEvaluate: () => void;
  onGoGroups: () => void;
}> = ({
  selectedGroup,
  rules,
  onAddRule,
  onEditRule, // ✅ NEW
  onToggleRule,
  onBulkActivate,
  onBulkInactivate,
  onBatchReEvaluate,
  onGoGroups,
}) => {
    const [filter, setFilter] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");

    const visibleRules = useMemo(() => {
      if (filter === "ALL") return rules;
      if (filter === "ACTIVE") return rules.filter((r) => r.isActive);
      return rules.filter((r) => !r.isActive);
    }, [rules, filter]);

    const enabledCount = rules.filter((r) => r.isActive).length;

    if (!selectedGroup) {
      return (
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primaryText">Rules</h2>
              <p className="text-secondary text-sm font-medium">
                Select an insurance group first (from “Insurance Groups”) to view and manage rules under it.
              </p>
            </div>
            <button
              onClick={onGoGroups}
              className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
            >
              Go to Insurance Groups
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primaryText">Rules</h2>
            <p className="text-secondary text-sm font-medium">
              Managing rules for: <span className="font-bold text-primaryText">{selectedGroup.name}</span>
            </p>
            <p className="text-xs text-secondary mt-2">
              Precedence: policy_id &gt; group_id &gt; clinic_name &gt; network_status &gt; plan_type &gt; insurance default.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wide">Show:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "ACTIVE" | "INACTIVE" | "ALL")}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ALL">All</option>
              </select>
            </div>

            <button
              onClick={onAddRule}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition"
            >
              <Plus size={18} />
              <span>Add New Rule</span>
            </button>

            <button
              onClick={onBatchReEvaluate}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
            >
              <RefreshCcw size={18} />
              <span>Batch Re-evaluate</span>
            </button>
          </div>
        </div>

        {/* Bulk ops */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gray-50 border border-gray-100 rounded-[24px] p-5">
          <div className="text-sm text-secondary">
            <span className="font-bold text-primaryText">{enabledCount}</span> active /{" "}
            <span className="font-bold text-primaryText">{rules.length}</span> total
            <span className="text-xs text-secondary block mt-1">
              Bulk operations are group-level (backend later). For now this updates local state.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBulkActivate}
              className="px-4 py-2 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ToggleRight size={18} className="text-primary" /> Mark All Active
              </span>
            </button>

            <button
              onClick={onBulkInactivate}
              className="px-4 py-2 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ToggleLeft size={18} className="text-secondary" /> Mark All Inactive
              </span>
            </button>
          </div>
        </div>

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="border border-gray-100 rounded-[24px] p-6 text-sm text-secondary">
            No rules yet for this insurance group. Click <span className="font-bold text-primaryText">Add New Rule</span> to start.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-[24px] overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
              <div className="col-span-4">Scope</div>
              <div className="col-span-3">Scope Level</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-2 text-right">Controls</div>
            </div>

            <div className="divide-y divide-gray-100">
              {visibleRules.map((r) => {
                const level = scopeLevelLabel(r);

                const scopePieces: string[] = [];
                if (r.scope.policyId) scopePieces.push(`policy_id=${r.scope.policyId}`);
                if (r.scope.groupId) scopePieces.push(`group_id=${r.scope.groupId}`);
                if (r.scope.clinicNames && r.scope.clinicNames.length > 0) scopePieces.push(`clinic=${r.scope.clinicNames.join(", ")}`);
                if (r.scope.networkStatus) scopePieces.push(`network=${r.scope.networkStatus}`);
                if (r.scope.planType) scopePieces.push(`plan=${r.scope.planType}`);

                if (scopePieces.length === 0) scopePieces.push("default (insurance only)");

                return (
                  <div key={r.id} className="grid grid-cols-12 gap-2 px-6 py-4 items-center">
                    <div className="col-span-4">
                      <div className="text-sm font-bold text-primaryText">{r.scope.insuranceNames.join(", ")}</div>
                      <div className="text-[11px] text-secondary mt-1">Rule ID: {r.ruleCode}</div>
                      <div className="text-xs text-secondary mt-1">{scopePieces.join(" • ")}</div>
                      {r.description && (
                        <div className="text-xs text-secondary mt-1.5 italic bg-gray-50 rounded-lg px-2 py-1">
                          📝 {r.description}
                        </div>
                      )}
                    </div>

                    <div className="col-span-3">
                      <span
                        className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-full ${level === "Policy"
                          ? "bg-primary/10 text-primary"
                          : level === "Group"
                            ? "bg-accent/10 text-accent"
                            : "bg-gray-100 text-secondary"
                          }`}
                      >
                        {r.isActive ? (
                          <CheckCircle2 size={14} className="text-primary" />
                        ) : (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                        {level}
                      </span>
                      <div className="text-[11px] text-secondary mt-2">Updated: {shortDate(r.updatedAt)}</div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-sm font-bold text-primaryText">{r.action.statusToSet}</div>
                      <div className="text-xs text-secondary mt-1">Status update (v1)</div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => onEditRule(r)} // ✅ NEW
                        className="px-3 py-2 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs inline-flex items-center gap-2"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() => onToggleRule(r.id)}
                        className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                      >
                        {r.isActive ? "Set Inactive" : "Set Active"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

const TestEvaluateSection: React.FC<{
  evalInputs: AuditLog["inputs"];
  setEvalInputs: React.Dispatch<React.SetStateAction<AuditLog["inputs"]>>;
  onEvaluate: () => void;
  result: { winner: RuleRecord | null; message: string } | null;
}> = ({ evalInputs, setEvalInputs, onEvaluate, result }) => {
  const fields: { key: keyof AuditLog["inputs"]; label: string; placeholder: string }[] = [
    { key: "clinicName", label: "Clinic Name", placeholder: "e.g., Sunshine Rehab" },
    { key: "insuranceName", label: "Insurance Name", placeholder: "e.g., Aetna" },
    { key: "policyId", label: "Policy ID", placeholder: "e.g., ACME-PRIO-123" },
    { key: "groupId", label: "Group ID", placeholder: "e.g., GRP-9988" },
    { key: "networkStatus", label: "Network Status", placeholder: "InNetwork / OutOfNetwork / Unknown" },
    { key: "planType", label: "Plan Type", placeholder: "PPO / HMO / Medicare / Other" },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primaryText">Test / Evaluate</h2>
        <p className="text-secondary text-sm font-medium">
          Enter the 6 allowed inputs. The system will show the winning rule + reason + outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
            <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">{f.label}</p>
            <input
              value={evalInputs[f.key]}
              onChange={(e) => setEvalInputs((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onEvaluate}
        className="w-full lg:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition"
      >
        <span>Evaluate</span>
      </button>

      <div className="border border-gray-100 rounded-[24px] p-6 space-y-2">
        {!result ? (
          <p className="text-sm text-secondary">Result will appear here: winning rule, precedence reason, status change.</p>
        ) : (
          <>
            <p className="text-sm font-bold text-primaryText">Evaluation Result</p>
            <p className="text-sm text-secondary">{result.message}</p>

            {result.winner ? (
              <div className="mt-3 text-xs bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-primaryText">
                      Winning Scope: {scopeLevelLabel(result.winner)}
                    </div>
                    <div className="text-secondary mt-1">Rule ID: {result.winner.ruleCode}</div>
                  </div>
                  <span className="px-3 py-2 rounded-full bg-primary/10 text-primary font-bold">
                    Status → {result.winner.action.statusToSet}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700">
                No rule matched these inputs.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AuditLogsSection: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  function exportLogsCsv() {
    const headers = ["time", "type", "insuranceGroup", "ruleId", "scopeLevel", "statusToSet", "notes"];
    const rows = logs.map((l) => [
      l.createdAt,
      l.type,
      l.insuranceGroupName || "",
      l.winningRule?.ruleId || "",
      l.winningRule?.scopeLevel || "",
      l.winningRule?.statusToSet || "",
      l.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rule-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primaryText">Audit Logs</h2>
        <p className="text-secondary text-sm font-medium">
          Track rule evaluations, applied rule scope, precedence decisions, and manual overrides (backend later).
        </p>
      </div>
      <button
        onClick={exportLogsCsv}
        className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
      >
        Export Logs (CSV)
      </button>

      {logs.length === 0 ? (
        <div className="border border-gray-100 rounded-[24px] p-6 text-sm text-secondary">
          No audit logs yet. Once evaluation is used, you’ll see records here.
        </div>
      ) : (
        <div className="border border-gray-100 rounded-[24px] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Insurance Group</div>
            <div className="col-span-5">Result</div>
          </div>

          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 px-6 py-4 items-start">
                <div className="col-span-2 text-xs text-secondary">{shortDate(l.createdAt)}</div>

                <div className="col-span-2">
                  <span className="text-xs font-bold px-3 py-2 rounded-full bg-gray-100 text-secondary">
                    {l.type}
                  </span>
                </div>

                <div className="col-span-3 text-sm font-bold text-primaryText">
                  {l.insuranceGroupName || "—"}
                </div>

                <div className="col-span-5 text-sm text-secondary">
                  {l.winningRule ? (
                    <>
                      <div className="font-bold text-primaryText">
                        Winner: {l.winningRule.scopeLevel} → {l.winningRule.statusToSet}
                      </div>
                      <div className="text-xs text-secondary mt-1">{l.winningRule.precedenceReason}</div>
                    </>
                  ) : (
                    <div className="text-sm text-secondary">{l.notes || "No winner."}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
