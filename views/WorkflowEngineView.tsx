import React, { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  EdgeProps,
  Node,
  NodeProps,
  Position,
  ReactFlowInstance,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  Plus,
  Search,
  Save,
  X,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  GitBranch,
  PlayCircle,
  FileDown,
  Settings2,
  Workflow as WorkflowIcon,
  Zap,
  UploadCloud,
  BadgeCheck,
  Trash2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Layers,
} from "lucide-react";

/** -----------------------------
 *  Types (kept compatible with your current logic)
 *  ----------------------------- */
type AccountType = "EV" | "PA" | "IV" | "WCPI";
type TriggerType = "RULE_ENGINE" | "STATUS_CHANGE" | "FIELD_UPDATE" | "MANUAL_OVERRIDE";
type ClinicFlag = "Onboarding" | "Active" | "At_Risk" | "VIP" | "Training";

const ACCOUNT_TYPE_OPTIONS: { code: AccountType; label: string; desc: string }[] = [
  { code: "EV", label: "Eligibility Verification (EV)", desc: "Eligibility verification workflows" },
  { code: "PA", label: "Prior Authorization (PA)", desc: "Prior auth workflows" },
  { code: "IV", label: "Insurance Verification", desc: "Insurance verification workflows" },
  { code: "WCPI", label: "WC/PI", desc: "Worker Comp / Personal Injury workflows" },
];

const CLINIC_FLAG_OPTIONS: ClinicFlag[] = ["Onboarding", "Active", "At_Risk", "VIP", "Training"];

const STATUS_OPTIONS = ["Benefits Verified", "Pending Benefits", "Need More Info", "Out of Network", "Escalated", "Completed"];

type Operator = "EQUALS" | "NOT_EQUALS" | "STARTS_WITH" | "CONTAINS" | "IS_FILLED" | "IS_EMPTY";

type ConditionField =
  | "clinic_flag"
  | "status"
  | "insurance_name"
  | "plan_type"
  | "network_status"
  | "policy_id"
  | "group_id"
  | "winning_rule_code";

type Condition = { id: string; field: ConditionField; op: Operator; value?: string };
type GroupOp = "AND" | "OR";
type ConditionGroup = { id: string; groupOp: GroupOp; items: Condition[] };

type ActionType = "SET_STATUS" | "AUTOFILL_FIELDS" | "ASSIGN_USER" | "SEND_EMAIL";

type WorkflowAction =
  | { id: string; type: "SET_STATUS"; payload: { statusToSet: string } }
  | { id: string; type: "AUTOFILL_FIELDS"; payload: { fields: { key: string; value: string }[] } }
  | { id: string; type: "ASSIGN_USER"; payload: { mode: "ROLE" | "USER"; value: string } }
  | { id: string; type: "SEND_EMAIL"; payload: { templateId: string; to: "clinic" | "agent" | "qa" } };

type NodeKind = "TRIGGER" | "ACTION" | "DECISION" | "END";

type EnrollmentConfig = {
  enabled: boolean;
  triggerType: TriggerType;
  reEnroll: boolean;
  enrollmentGroup: ConditionGroup;
};

type WorkflowDefinition = {
  nodes: HubNode[];
  edges: HubEdge[];
};

type WorkflowVersion = {
  version: number;
  createdAt: string;
  updatedAt: string;
  definition: WorkflowDefinition;
};

type WorkflowMeta = {
  id: string;
  accountType: AccountType;
  name: string;
  description?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  draft: WorkflowDefinition;
  versions: WorkflowVersion[];

  enrollment: EnrollmentConfig;
};

type WorkflowAuditLog = {
  id: string;
  createdAt: string;
  accountType: AccountType;

  workflowId: string;
  workflowName: string;
  workflowVersion: number;

  entityId: string;
  triggerType: TriggerType;
  winningRuleCode?: string;

  chosenPath?: { from: string; to: string; edgeLabel?: string };
  executedActions: { type: ActionType; summary: string }[];

  finalStatus?: string;
  assignedTo?: string;
  notes?: string;
};

type EvalInputs = {
  entityId: string;
  clinicFlag: ClinicFlag;
  status: string;
  insuranceName: string;
  planType: string;
  networkStatus: string;
  policyId: string;
  groupId: string;
  winningRuleCode: string;
};

/** -----------------------------
 *  Helpers
 *  ----------------------------- */
function nowIso() {
  return new Date().toISOString();
}
function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function uid() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
function normalize(v: string) {
  return (v ?? "").trim().toLowerCase();
}
function makeEmptyGroup(): ConditionGroup {
  return { id: uid(), groupOp: "AND", items: [] };
}
function makeDefaultEnrollmentGroup(): ConditionGroup {
  return { id: uid(), groupOp: "AND", items: [{ id: uid(), field: "status", op: "EQUALS", value: "Pending Benefits" }] };
}
function summarizeAction(a: WorkflowAction) {
  if (a.type === "SET_STATUS") return `Set Status → ${a.payload.statusToSet}`;
  if (a.type === "AUTOFILL_FIELDS") return `Autofill ${a.payload.fields.length} field(s)`;
  if (a.type === "ASSIGN_USER") return `Assign → ${a.payload.mode}:${a.payload.value}`;
  if (a.type === "SEND_EMAIL") return `Email → ${a.payload.to} (template: ${a.payload.templateId})`;
  return "Action";
}

/** -----------------------------
 *  Condition Evaluation (simple group: AND/OR of conditions)
 *  ----------------------------- */
function getFieldValue(field: ConditionField, inputs: EvalInputs) {
  switch (field) {
    case "clinic_flag":
      return inputs.clinicFlag;
    case "status":
      return inputs.status;
    case "insurance_name":
      return inputs.insuranceName;
    case "plan_type":
      return inputs.planType;
    case "network_status":
      return inputs.networkStatus;
    case "policy_id":
      return inputs.policyId;
    case "group_id":
      return inputs.groupId;
    case "winning_rule_code":
      return inputs.winningRuleCode;
    default:
      return "";
  }
}
function conditionMatches(cond: Condition, inputs: EvalInputs) {
  const fv = normalize(String(getFieldValue(cond.field, inputs)));
  const cv = normalize(String(cond.value ?? ""));

  if (cond.op === "IS_FILLED") return fv.length > 0;
  if (cond.op === "IS_EMPTY") return fv.length === 0;
  if (cond.op === "EQUALS") return fv === cv;
  if (cond.op === "NOT_EQUALS") return fv !== cv;
  if (cond.op === "STARTS_WITH") return fv.startsWith(cv);
  if (cond.op === "CONTAINS") return fv.includes(cv);
  return false;
}
function groupMatches(group: ConditionGroup | null | undefined, inputs: EvalInputs) {
  if (!group) return true;
  if (!group.items || group.items.length === 0) return true;
  const results = group.items.map((c) => conditionMatches(c, inputs));
  return group.groupOp === "AND" ? results.every(Boolean) : results.some(Boolean);
}

/** -----------------------------
 *  HubSpot-like Graph Model (ReactFlow)
 *  ----------------------------- */
type HubNode = {
  id: string;
  kind: NodeKind;
  name: string;
  actions: WorkflowAction[];
};

type HubEdge = {
  id: string;
  source: string;
  target: string;
  priority: number; // lowest first
  label: string;
  conditionGroup: ConditionGroup | null; // IF has group with items; ELSE is null
};

function makeDefaultDefinition(): WorkflowDefinition {
  const trig = uid();
  const act1 = uid();
  const end = uid();

  const nodes: HubNode[] = [
    { id: trig, kind: "TRIGGER", name: "Trigger: Enrollment", actions: [] },
    {
      id: act1,
      kind: "ACTION",
      name: "Action: Set Status",
      actions: [{ id: uid(), type: "SET_STATUS", payload: { statusToSet: "Pending Benefits" } }],
    },
    { id: end, kind: "END", name: "End", actions: [] },
  ];

  const edges: HubEdge[] = [
    { id: uid(), source: trig, target: act1, priority: 1, label: "Next", conditionGroup: null },
    { id: uid(), source: act1, target: end, priority: 1, label: "Complete", conditionGroup: null },
  ];

  return { nodes, edges };
}

function makeWorkflowMeta(accountType: AccountType, name: string, description: string): WorkflowMeta {
  const created = nowIso();
  const base = makeDefaultDefinition();
  const v1: WorkflowVersion = { version: 1, createdAt: created, updatedAt: created, definition: base };
  return {
    id: uid(),
    accountType,
    name,
    description,
    isActive: true,
    createdAt: created,
    updatedAt: created,
    draft: base,
    versions: [v1],
    enrollment: {
      enabled: true,
      triggerType: "RULE_ENGINE",
      reEnroll: false,
      enrollmentGroup: makeDefaultEnrollmentGroup(),
    },
  };
}

/** -----------------------------
 *  Simulation (graph walk like HubSpot branches)
 *  ----------------------------- */
function simulate(def: WorkflowDefinition, inputs: EvalInputs) {
  let finalStatus = inputs.status || "";
  let assignedTo = "";
  const executed: WorkflowAction[] = [];
  const visited = new Set<string>();

  const start = def.nodes.find((n) => n.kind === "TRIGGER") || def.nodes[0];
  if (!start) return { ok: false as const, reason: "Workflow has no nodes." };

  let current = start;
  let lastPath: { from: string; to: string; edgeLabel?: string } | null = null;

  for (const a of current.actions) {
    executed.push(a);
    if (a.type === "SET_STATUS") finalStatus = a.payload.statusToSet;
    if (a.type === "ASSIGN_USER") assignedTo = `${a.payload.mode}:${a.payload.value}`;
  }

  while (current && current.kind !== "END") {
    if (visited.has(current.id)) {
      return { ok: false as const, reason: "Loop detected in workflow graph.", executed, finalStatus, assignedTo };
    }
    visited.add(current.id);

    const outgoing = def.edges
      .filter((e) => e.source === current.id)
      .slice()
      .sort((a, b) => a.priority - b.priority);

    if (outgoing.length === 0) {
      return {
        ok: true as const,
        reason: `Stopped: no outgoing path from "${current.name}".`,
        executed,
        finalStatus,
        assignedTo,
        chosenPath: lastPath,
      };
    }

    const matchingIf = outgoing.find((e) => {
      const g = e.conditionGroup;
      if (!g || !g.items || g.items.length === 0) return false;
      return groupMatches(g, inputs);
    });

    const elseEdge = outgoing.find((e) => !e.conditionGroup || (e.conditionGroup.items?.length ?? 0) === 0) || null;
    const chosen = matchingIf || elseEdge;

    if (!chosen) {
      return {
        ok: true as const,
        reason: `Stopped: no matching IF branch from "${current.name}" and no ELSE branch.`,
        executed,
        finalStatus,
        assignedTo,
        chosenPath: lastPath,
      };
    }

    const next = def.nodes.find((n) => n.id === chosen.target);
    if (!next) return { ok: false as const, reason: "Edge points to missing node.", executed, finalStatus, assignedTo };

    for (const a of next.actions) {
      executed.push(a);
      if (a.type === "SET_STATUS") finalStatus = a.payload.statusToSet;
      if (a.type === "ASSIGN_USER") assignedTo = `${a.payload.mode}:${a.payload.value}`;
    }

    lastPath = { from: current.name, to: next.name, edgeLabel: chosen.label };

    if (next.kind === "END") {
      return {
        ok: true as const,
        reason: `Completed: reached "${next.name}".`,
        executed,
        finalStatus,
        assignedTo,
        chosenPath: lastPath,
      };
    }

    current = next;
  }

  return { ok: true as const, reason: "Completed.", executed, finalStatus, assignedTo, chosenPath: lastPath };
}

/** -----------------------------
 *  UI Building Blocks
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
      <div className="relative w-full max-w-3xl bg-white rounded-[32px] border border-gray-100 shadow-2xl p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-primaryText">{title}</h3>
            <p className="text-sm text-secondary font-medium">Complete details and click Save.</p>
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

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
    <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">{label}</p>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
      placeholder="Enter value"
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
    <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">{label}</p>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none w-full text-sm text-primaryText">
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const InfoCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="border border-gray-100 rounded-2xl p-4 bg-white">
    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">{title}</p>
    <p className="text-sm font-bold text-primaryText mt-1">{value}</p>
  </div>
);

/** -----------------------------
 *  Condition Group Editor
 *  ----------------------------- */
const ConditionGroupEditor: React.FC<{
  title?: string;
  group: ConditionGroup;
  onChange: (g: ConditionGroup) => void;
}> = ({ title, group, onChange }) => {
  const update = (patch: Partial<ConditionGroup>) => onChange({ ...group, ...patch });

  const addCond = () => {
    const c: Condition = { id: uid(), field: "status", op: "EQUALS", value: "Pending Benefits" };
    update({ items: [c, ...(group.items || [])] });
  };

  const removeCond = (id: string) => update({ items: group.items.filter((c) => c.id !== id) });

  const updateCond = (id: string, patch: Partial<Condition>) =>
    update({ items: group.items.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-wide">{title || "Conditions"}</p>
          <p className="text-[11px] text-secondary mt-1">
            Combine with <span className="font-bold text-primaryText">{group.groupOp}</span>. Empty = matches all.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={group.groupOp}
            onChange={(e) => update({ groupOp: e.target.value as GroupOp })}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
          <button
            onClick={addCond}
            className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
          >
            + Condition
          </button>
        </div>
      </div>

      {group.items.length === 0 ? (
        <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
          No conditions yet. This branch/enrollment will match everything.
        </div>
      ) : (
        <div className="space-y-3">
          {group.items.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-primaryText">Condition</div>
                <button
                  onClick={() => removeCond(c.id)}
                  className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs inline-flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Field</p>
                  <select
                    value={c.field}
                    onChange={(e) => updateCond(c.id, { field: e.target.value as ConditionField })}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                  >
                    <option value="clinic_flag">Clinic Flag</option>
                    <option value="status">Status</option>
                    <option value="insurance_name">Insurance Name</option>
                    <option value="plan_type">Plan Type</option>
                    <option value="network_status">Network Status</option>
                    <option value="policy_id">Policy ID</option>
                    <option value="group_id">Group ID</option>
                    <option value="winning_rule_code">Winning Rule Code</option>
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Operator</p>
                  <select
                    value={c.op}
                    onChange={(e) => updateCond(c.id, { op: e.target.value as Operator })}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                  >
                    <option value="EQUALS">Equals</option>
                    <option value="NOT_EQUALS">Not Equals</option>
                    <option value="STARTS_WITH">Starts With</option>
                    <option value="CONTAINS">Contains</option>
                    <option value="IS_FILLED">Is Filled</option>
                    <option value="IS_EMPTY">Is Empty</option>
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Value</p>
                  <input
                    value={c.value || ""}
                    onChange={(e) => updateCond(c.id, { value: e.target.value })}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                    placeholder="e.g., Onboarding / Aetna / RULE-000123"
                    disabled={c.op === "IS_FILLED" || c.op === "IS_EMPTY"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** -----------------------------
 *  ReactFlow: Custom Nodes
 *  ----------------------------- */
function nodeBadge(kind: NodeKind) {
  if (kind === "TRIGGER") return "TRIGGER";
  if (kind === "DECISION") return "BRANCH";
  if (kind === "ACTION") return "ACTION";
  return "END";
}
function nodeIcon(kind: NodeKind) {
  if (kind === "TRIGGER") return <Zap size={16} className="text-primary" />;
  if (kind === "DECISION") return <GitBranch size={16} className="text-primary" />;
  if (kind === "ACTION") return <WorkflowIcon size={16} className="text-primary" />;
  return <CheckCircle2 size={16} className="text-primary" />;
}

const HubNodeCard: React.FC<NodeProps<any>> = ({ data, selected }) => {
  const kind: NodeKind = data.kind;
  const title: string = data.name;
  const subtitle: string =
    kind === "ACTION" ? `${(data.actions?.length || 0).toString()} action(s)` : kind === "DECISION" ? "IF / ELSE branches" : " ";

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-2xl border shadow-sm bg-white ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-gray-100"
      }`}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {nodeIcon(kind)}
          <div className="text-sm font-bold text-primaryText">{title}</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-secondary">{nodeBadge(kind)}</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-xs text-secondary font-medium">{subtitle}</div>
      </div>

      {/* ReactFlow handles */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Handle type="target" position={Position.Left} />
        </div>
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { hubNode: HubNodeCard };

/** -----------------------------
 *  ReactFlow: Custom Edge
 *  ----------------------------- */
const HubEdgeView: React.FC<EdgeProps<any>> = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;
  const label = data?.label || "Next";
  const priority = data?.priority ?? 1;
  const isElse = data?.isElse ?? false;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} C ${sourceX + 80} ${sourceY} ${targetX - 80} ${targetY} ${targetX} ${targetY}`;

  return (
    <>
      <path id={id} d={path} fill="none" strokeWidth={2} stroke="#CBD5E1" markerEnd={markerEnd} />
      <foreignObject x={midX - 70} y={midY - 18} width={140} height={36} requiredExtensions="http://www.w3.org/1999/xhtml">
        <div
          className={`w-full h-full flex items-center justify-center rounded-full border text-[11px] font-bold ${
            isElse ? "bg-gray-50 border-gray-200 text-secondary" : "bg-white border-gray-200 text-primaryText"
          }`}
        >
          {label} • P{priority}
        </div>
      </foreignObject>
    </>
  );
};

const edgeTypes = { hubEdge: HubEdgeView };

/** -----------------------------
 *  Map between WorkflowDefinition <-> ReactFlow
 *  ----------------------------- */
function toFlowNodes(def: WorkflowDefinition): Node[] {
  const hasAnyPos = def.nodes.some((n: any) => n?._pos?.x !== undefined);
  const baseX = 120;
  const baseY = 120;

  return def.nodes.map((n, idx) => {
    const pos = (n as any)._pos || (hasAnyPos ? { x: baseX + idx * 260, y: baseY } : { x: baseX + idx * 260, y: baseY });
    return { id: n.id, type: "hubNode", position: pos, data: { ...n } };
  });
}

function toFlowEdges(def: WorkflowDefinition): Edge[] {
  return def.edges.map((e) => {
    const isElse = !e.conditionGroup || (e.conditionGroup.items?.length ?? 0) === 0;
    return { id: e.id, source: e.source, target: e.target, type: "hubEdge", data: { label: e.label, priority: e.priority, isElse } };
  });
}

function fromFlow(nodes: Node[], edges: Edge[], prevDef: WorkflowDefinition): WorkflowDefinition {
  const hubNodes: HubNode[] = prevDef.nodes.map((n) => {
    const flowNode = nodes.find((x) => x.id === n.id);
    const next: any = { ...n };
    if (flowNode) next._pos = flowNode.position;
    return next;
  });

  const hubEdges: HubEdge[] = edges.map((e) => {
    const prev = prevDef.edges.find((x) => x.id === e.id);
    const data: any = e.data || {};
    const label = String(data.label || prev?.label || "Next");
    const priority = Number(data.priority || prev?.priority || 1);

    return { id: e.id, source: e.source, target: e.target, label, priority, conditionGroup: prev?.conditionGroup ?? null };
  });

  return { nodes: hubNodes, edges: hubEdges };
}

/** -----------------------------
 *  Dispositions + Queues
 *  ----------------------------- */
type QueueRow = {
  id: string;
  name: string;          // queue name
  module?: string;       // optional, for future
  programs?: string[];   // optional, for future
  enabled: boolean;
};

type Disposition = {
  id: string;
  code: number;
  name: string;
  queue: string;
  enabled: boolean;
  outcomeTag: string; 
};

const DEFAULT_DISPOSITIONS: Disposition[] = [
  { id: uid(), code: 91, name: "Added to PI Worksheet", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 7, name: "Additional Information Required to Complete EV", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 66, name: "Auto Create a PA", queue: "Automations", enabled: true, outcomeTag: "Data Entry" },
  { id: uid(), code: 73, name: "Cannot Find Patient in EHR", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 13, name: "Duplicate", queue: "Manager Action Required", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 14, name: "Duplicate", queue: "Manager Action Required", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 10, name: "Email sent to Clinic - Missing Information", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 11, name: "Enter Patient Demographic from EHR", queue: "Data Entry", enabled: true, outcomeTag: "Data Entry" },
  { id: uid(), code: 90, name: "Enter PI Patient in EMR", queue: "Data Entry", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 6, name: "EV Failed QC - Please Review Comments", queue: "Insurance Verification - Portal", enabled: true, outcomeTag: "Pending" },
  { id: uid(), code: 19, name: "EV Missing Information - Manager Review", queue: "Manager Action Required", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 2, name: "EV Needs to be Uploaded to Client Portal", queue: "Data Entry", enabled: true, outcomeTag: "Data Entry" },
  { id: uid(), code: 5, name: "EV Requires a Manager Review", queue: "Manager Action Required", enabled: true, outcomeTag: "Pending" },
  { id: uid(), code: 3, name: "EV Requires an Audit", queue: "Audit Required", enabled: true, outcomeTag: "Auditing" },
  { id: uid(), code: 71, name: "EV Uploaded - Additional Insurance on File", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "EV Uploaded To EHR" },
  { id: uid(), code: 1, name: "EV Uploaded - No Action Required", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "EV Uploaded To EHR" },
  { id: uid(), code: 9, name: "Manager/Biller Requires an EV", queue: "Insurance Verification - Call", enabled: true, outcomeTag: "Pending" },
  { id: uid(), code: 18, name: "Maxed Attempts to Reach Clinic", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 110, name: "Medulla - Auto Create PA", queue: "Automations", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 96, name: "Missing Date of Accident", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 16, name: "Missing Insurance Card - Automated Email", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 15, name: "Missing Insurance Card - Follow Up Email 1", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 17, name: "Missing Insurance Card - Follow Up Email 2", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info" },
  { id: uid(), code: 95, name: "Missing Payer Info", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 125, name: "New Disposition for Accumulation Benefits", queue: "Accumulations Benifits", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 8, name: "New EV Received - Please Verify by Call", queue: "Insurance Verification - Call", enabled: true, outcomeTag: "Submitted" },
  { id: uid(), code: 4, name: "New EV Received - Please Verify by Portal", queue: "Insurance Verification - Portal", enabled: true, outcomeTag: "Submitted" },
  { id: uid(), code: 108, name: "PA Missed - Caught During Audit", queue: "Data Entry", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 94, name: "Patient Name Invalid", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—" },
  { id: uid(), code: 105, name: "Patient Requires New PA - Call", queue: "Authorizations", enabled: true, outcomeTag: "—" },
];

type TopTabKey = "Queues" | "Dispositions" | "workflows" | "triggers" | "builder" | "test" | "audit";
type DispositionTabKey = "triggers" | "builder" | "test" | "audit";

type DispositionWorkflowState = {
  open: boolean;
  dispositionId: string | null;
  tab: DispositionTabKey;
};

/** -----------------------------
 *  MAIN COMPONENT
 *  ----------------------------- */
const WorkflowEngineHubspotFlow: React.FC = () => {
  // Top tabs (existing)
  const [activeTab, setActiveTab] = useState<TopTabKey>("Queues");
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [showAddDisposition, setShowAddDisposition] = useState(false);
  const [showAddQueue, setShowAddQueue] = useState(false);

  // Queues (NEW)
  const [queues, setQueues] = useState<QueueRow[]>(() => {
    // bootstrap queues from dispositions (unique queue names)
    const uniq = Array.from(new Set(DEFAULT_DISPOSITIONS.map((d) => d.queue))).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return uniq.map((name) => ({ id: uid(), name, enabled: true }));
  });

  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const selectedQueue = useMemo(() => queues.find((q) => q.id === selectedQueueId) || null, [queues, selectedQueueId]);

  // Dispositions (NEW: queue filter comes from selected queue)
  const [dispositions, setDispositions] = useState<Disposition[]>(DEFAULT_DISPOSITIONS);
  const [queueFilter, setQueueFilter] = useState<string>("All Queues");
  const [dispositionSearch, setDispositionSearch] = useState("");

  // Normal workflow mgmt
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>("EV");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [workflows, setWorkflows] = useState<WorkflowMeta[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  // Audit logs (shared; includes workflowId so it's safe)
  const [auditLogs, setAuditLogs] = useState<WorkflowAuditLog[]>([]);

  // Disposition workflow mode (per disposition)
  const [dispMode, setDispMode] = useState<DispositionWorkflowState>({ open: false, dispositionId: null, tab: "builder" });
  const [dispWorkflowByDispositionId, setDispWorkflowByDispositionId] = useState<Record<string, WorkflowMeta>>({});

  const selectedWorkflow = useMemo(() => workflows.find((w) => w.id === selectedWorkflowId) || null, [workflows, selectedWorkflowId]);

  const selectedPublished = useMemo(() => {
    if (!selectedWorkflow) return null;
    return selectedWorkflow.versions.slice().sort((a, b) => b.version - a.version)[0] || null;
  }, [selectedWorkflow]);

  const filteredWorkflows = useMemo(() => {
    const q = normalize(workflowSearch);
    return workflows.filter((w) => w.accountType === selectedAccountType).filter((w) => !q || normalize(w.name).includes(q));
  }, [workflows, selectedAccountType, workflowSearch]);

  // Queue options derived from dispositions (stable, always includes "All Queues")
  // Queue options from Queues table (NEW)
  const queueOptions = useMemo(() => {
    const names = queues.filter((q) => q.enabled).map((q) => q.name).sort((a, b) => a.localeCompare(b));
    return names.length ? names : ["—"];
  }, [queues]);

  const filteredDispositions = useMemo(() => {
    const q = normalize(dispositionSearch);
    const selectedQueueName = selectedQueue?.name || null;

    return dispositions
      .filter((d) => (selectedQueueName ? d.queue === selectedQueueName : false)) // strict: must pick a queue first
      .filter((d) => (!q ? true : normalize(d.name).includes(q) || String(d.code).includes(q) || normalize(d.outcomeTag).includes(q)));
  }, [dispositions, dispositionSearch, selectedQueue]);

  // Test inputs (shared for both normal workflow + disposition workflow mode)
  const [evalInputs, setEvalInputs] = useState<EvalInputs>({
    entityId: "SUB-1001",
    clinicFlag: "Onboarding",
    status: "Pending Benefits",
    insuranceName: "Aetna",
    planType: "HMO",
    networkStatus: "InNetwork",
    policyId: "AETNA-12345",
    groupId: "GRP-9988",
    winningRuleCode: "RULE-000123",
  });

  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    finalStatus?: string;
    assignedTo?: string;
    executedActions?: { type: ActionType; summary: string }[];
    chosenPath?: { from: string; to: string; edgeLabel?: string } | null;
  } | null>(null);

  // --- Normal workflow actions ---
  const createWorkflow = (payload: { accountType: AccountType; name: string; description: string }) => {
    const wf = makeWorkflowMeta(payload.accountType, payload.name, payload.description);
    setWorkflows((prev) => [wf, ...prev]);
    setSelectedWorkflowId(wf.id);
    setSelectedAccountType(payload.accountType);
    setActiveTab("triggers");
  };

  const toggleWorkflowActive = (workflowId: string) => {
    const t = nowIso();
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, isActive: !w.isActive, updatedAt: t } : w)));
  };

  const setOnlyOneActive = (workflowId: string) => {
    const target = workflows.find((w) => w.id === workflowId);
    if (!target) return;
    const t = nowIso();
    setWorkflows((prev) => prev.map((w) => (w.accountType === target.accountType ? { ...w, isActive: w.id === workflowId, updatedAt: t } : w)));
  };

  const updateDraft = (def: WorkflowDefinition) => {
    if (!selectedWorkflow) return;
    const t = nowIso();
    setWorkflows((prev) => prev.map((w) => (w.id === selectedWorkflow.id ? { ...w, draft: def, updatedAt: t } : w)));
  };

  const updateEnrollment = (enrollment: EnrollmentConfig) => {
    if (!selectedWorkflow) return;
    const t = nowIso();
    setWorkflows((prev) => prev.map((w) => (w.id === selectedWorkflow.id ? { ...w, enrollment, updatedAt: t } : w)));
  };

  const publishNewVersion = () => {
    if (!selectedWorkflow) return;
    const def = selectedWorkflow.draft;

    const hasTrigger = def.nodes.some((n) => n.kind === "TRIGGER");
    const hasEnd = def.nodes.some((n) => n.kind === "END");
    if (!hasTrigger || !hasEnd) {
      alert("Publish blocked: Workflow must have a TRIGGER node and an END node.");
      return;
    }
    for (const e of def.edges) {
      const fromOk = def.nodes.some((n) => n.id === e.source);
      const toOk = def.nodes.some((n) => n.id === e.target);
      if (!fromOk || !toOk) {
        alert("Publish blocked: A branch references a missing node.");
        return;
      }
    }

    const t = nowIso();
    const nextVersion = Math.max(...selectedWorkflow.versions.map((v) => v.version), 0) + 1;
    const v: WorkflowVersion = { version: nextVersion, createdAt: t, updatedAt: t, definition: def };

    setWorkflows((prev) => prev.map((w) => (w.id !== selectedWorkflow.id ? w : { ...w, updatedAt: t, versions: [v, ...w.versions] })));
  };

  // --- Disposition workflow mode helpers ---
  const getOrCreateDispositionWorkflow = useCallback(
    (dispositionId: string) => {
      const existing = dispWorkflowByDispositionId[dispositionId];
      if (existing) return existing;

      const d = dispositions.find((x) => x.id === dispositionId);
      const wfName = d ? `Disposition: ${d.name}` : "Disposition Workflow";
      const wfDesc = d ? `Queue: ${d.queue} • Code: ${d.code}` : "Disposition workflow";

      const wf = makeWorkflowMeta(selectedAccountType, wfName, wfDesc);

      setDispWorkflowByDispositionId((prev) => ({ ...prev, [dispositionId]: wf }));
      return wf;
    },
    [dispWorkflowByDispositionId, dispositions, selectedAccountType]
  );

  const openDispositionWorkflow = (dispositionId: string) => {
    getOrCreateDispositionWorkflow(dispositionId);
    setDispMode({ open: true, dispositionId, tab: "builder" });
    setTestResult(null);
  };

  const closeDispositionWorkflow = () => {
    setDispMode({ open: false, dispositionId: null, tab: "builder" });
    setTestResult(null);
  };

  const selectedDisposition = useMemo(
    () => (dispMode.dispositionId ? dispositions.find((d) => d.id === dispMode.dispositionId) || null : null),
    [dispMode.dispositionId, dispositions]
  );

  const selectedDispWorkflow = useMemo(() => {
    if (!dispMode.dispositionId) return null;
    return dispWorkflowByDispositionId[dispMode.dispositionId] || null;
  }, [dispMode.dispositionId, dispWorkflowByDispositionId]);

  const selectedDispPublished = useMemo(() => {
    if (!selectedDispWorkflow) return null;
    return selectedDispWorkflow.versions.slice().sort((a, b) => b.version - a.version)[0] || null;
  }, [selectedDispWorkflow]);

  const updateDispDraft = (def: WorkflowDefinition) => {
    if (!dispMode.dispositionId) return;
    const t = nowIso();
    setDispWorkflowByDispositionId((prev) => {
      const wf = prev[dispMode.dispositionId!];
      if (!wf) return prev;
      return { ...prev, [dispMode.dispositionId!]: { ...wf, draft: def, updatedAt: t } };
    });
  };

  const updateDispEnrollment = (enrollment: EnrollmentConfig) => {
    if (!dispMode.dispositionId) return;
    const t = nowIso();
    setDispWorkflowByDispositionId((prev) => {
      const wf = prev[dispMode.dispositionId!];
      if (!wf) return prev;
      return { ...prev, [dispMode.dispositionId!]: { ...wf, enrollment, updatedAt: t } };
    });
  };

  const publishDispNewVersion = () => {
    if (!dispMode.dispositionId) return;
    const wf = dispWorkflowByDispositionId[dispMode.dispositionId];
    if (!wf) return;

    const def = wf.draft;

    const hasTrigger = def.nodes.some((n) => n.kind === "TRIGGER");
    const hasEnd = def.nodes.some((n) => n.kind === "END");
    if (!hasTrigger || !hasEnd) {
      alert("Publish blocked: Workflow must have a TRIGGER node and an END node.");
      return;
    }
    for (const e of def.edges) {
      const fromOk = def.nodes.some((n) => n.id === e.source);
      const toOk = def.nodes.some((n) => n.id === e.target);
      if (!fromOk || !toOk) {
        alert("Publish blocked: A branch references a missing node.");
        return;
      }
    }

    const t = nowIso();
    const nextVersion = Math.max(...wf.versions.map((v) => v.version), 0) + 1;
    const v: WorkflowVersion = { version: nextVersion, createdAt: t, updatedAt: t, definition: def };

    setDispWorkflowByDispositionId((prev) => ({ ...prev, [dispMode.dispositionId!]: { ...wf, updatedAt: t, versions: [v, ...wf.versions] } }));
  };

  // --- Shared Test runner (works for normal workflow + disposition workflow) ---
  const runTestFor = (workflow: WorkflowMeta | null, published: WorkflowVersion | null, triggerType: TriggerType = "RULE_ENGINE") => {
    if (!workflow || !published) {
      setTestResult({ ok: false, message: "Select a workflow first." });
      return;
    }
    if (!workflow.isActive) {
      setTestResult({ ok: false, message: "Selected workflow is inactive. Activate it or choose an active workflow." });
      return;
    }

    if (workflow.enrollment.enabled) {
      const enrolled = groupMatches(workflow.enrollment.enrollmentGroup, evalInputs);
      if (!enrolled) {
        setTestResult({ ok: true, message: "Not enrolled: enrollment trigger conditions did not match." });
        return;
      }
    }

    const sim = simulate(published.definition, evalInputs);
    if (!sim.ok) {
      setTestResult({ ok: false, message: sim.reason });
      return;
    }

    const executedActions = (sim.executed || []).map((a) => ({ type: a.type, summary: summarizeAction(a) }));
    const msg = `${sim.reason} Final Status: "${sim.finalStatus || evalInputs.status}".`;

    setTestResult({
      ok: true,
      message: msg,
      finalStatus: sim.finalStatus || evalInputs.status,
      assignedTo: sim.assignedTo,
      executedActions,
      chosenPath: sim.chosenPath || null,
    });

    const log: WorkflowAuditLog = {
      id: uid(),
      createdAt: nowIso(),
      accountType: workflow.accountType,
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: published.version,
      entityId: evalInputs.entityId || "—",
      triggerType,
      winningRuleCode: evalInputs.winningRuleCode || undefined,
      chosenPath: sim.chosenPath || null,
      executedActions,
      finalStatus: sim.finalStatus || evalInputs.status,
      assignedTo: sim.assignedTo || "",
      notes: "Simulated via Test tab (UI demo). Production should log from backend runtime.",
    };

    setAuditLogs((prev) => [log, ...prev]);
  };

  const exportAuditCsv = () => {
    const headers = [
      "time",
      "accountType",
      "workflowId",
      "workflowName",
      "workflowVersion",
      "entityId",
      "triggerType",
      "winningRuleCode",
      "finalStatus",
      "assignedTo",
      "pathFrom",
      "pathTo",
      "pathLabel",
      "actions",
      "notes",
    ];

    const rows = auditLogs.map((l) => [
      l.createdAt,
      l.accountType,
      l.workflowId,
      l.workflowName,
      String(l.workflowVersion),
      l.entityId,
      l.triggerType,
      l.winningRuleCode || "",
      l.finalStatus || "",
      l.assignedTo || "",
      l.chosenPath?.from || "",
      l.chosenPath?.to || "",
      l.chosenPath?.edgeLabel || "",
      (l.executedActions || []).map((a) => a.summary).join(" | "),
      l.notes || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topTabs = useMemo(
    () => [
      { key: "Queues" as const, label: "Queues", icon: <Layers size={18} />, desc: "Select a queue first (then Dispositions are filtered by that queue)" },
      { key: "Dispositions" as const, label: "Dispositions", icon: <Layers size={18} />, desc: "Queue → Dispositions (row click opens disposition workflow builder)" },
      // { key: "workflows" as const, label: "Workflows", icon: <WorkflowIcon size={18} />, desc: "Create and manage workflows per account type" },
      // { key: "triggers" as const, label: "Triggers", icon: <Zap size={18} />, desc: "HubSpot-style enrollment rules (when records enter workflow)" },
      // { key: "builder" as const, label: "Builder", icon: <GitBranch size={18} />, desc: "Visual canvas: drag nodes, connect arrows, IF/ELSE branches" },
      { key: "test" as const, label: "Test", icon: <PlayCircle size={18} />, desc: "Simulate execution: chosen path, actions, final status" },
      { key: "audit" as const, label: "Audit Logs", icon: <ClipboardList size={18} />, desc: "History per entity + export CSV" },
    ],
    []
  );

  // If Disposition Workflow Mode open → show that experience (Netflix click → open details)
  if (dispMode.open && selectedDisposition && selectedDispWorkflow) {
    return (
      <ReactFlowProvider>
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Disposition Workflow Header */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-secondary text-sm font-bold">
                  <button
                    onClick={closeDispositionWorkflow}
                    className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    Back to Dispositions
                  </button>
                  <span className="text-secondary">/</span>
                  <span className="text-primaryText">Disposition Workflow</span>
                </div>
                <h1 className="text-2xl font-bold text-primaryText">{selectedDisposition.name}</h1>
                <p className="text-sm text-secondary font-medium">
                  Queue: <span className="font-bold text-primaryText">{selectedDisposition.queue}</span> • Code:{" "}
                  <span className="font-bold text-primaryText">{selectedDisposition.code}</span> • Enabled:{" "}
                  <span className="font-bold text-primaryText">{selectedDisposition.enabled ? "TRUE" : "FALSE"}</span>
                </p>
                {/* <p className="text-xs text-secondary">
                  This is the “all-in-one” workspace your manager wants: triggers + builder + test + audit for this single disposition.
                </p> */}
              </div>

              <div className="text-xs text-secondary">
                <span className="font-bold text-primaryText">Workflow:</span>{" "}
                {selectedDispPublished ? `${selectedDispWorkflow.name} (Published v${selectedDispPublished.version})` : selectedDispWorkflow.name}
              </div>
            </div>

            {/* Disposition Sub Tabs */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(["triggers", "builder", "test", "audit"] as DispositionTabKey[]).map((k) => {
                const selected = dispMode.tab === k;
                const label = k === "triggers" ? "Triggers" : k === "builder" ? "Builder" : k === "test" ? "Test" : "Audit";
                const icon = k === "triggers" ? <Zap size={18} /> : k === "builder" ? <GitBranch size={18} /> : k === "test" ? <PlayCircle size={18} /> : <ClipboardList size={18} />;
                return (
                  <button
                    key={k}
                    onClick={() => setDispMode((p) => ({ ...p, tab: k }))}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all ${
                      selected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-secondary hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <span className={selected ? "text-white" : "text-primary"}>{icon}</span>
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disposition Sub Tab Content */}
          {dispMode.tab === "triggers" && (
            <TriggersSection workflow={selectedDispWorkflow} onGoWorkflows={closeDispositionWorkflow} onChange={updateDispEnrollment} />
          )}

          {dispMode.tab === "builder" && (
            <BuilderCanvasSection workflow={selectedDispWorkflow} published={selectedDispPublished} onDraftChange={updateDispDraft} onPublish={publishDispNewVersion} />
          )}

          {dispMode.tab === "test" && (
            <TestSection
              workflow={selectedDispWorkflow}
              published={selectedDispPublished}
              evalInputs={evalInputs}
              setEvalInputs={setEvalInputs}
              onRun={() => runTestFor(selectedDispWorkflow, selectedDispPublished, "RULE_ENGINE")}
              result={testResult}
            />
          )}

          {dispMode.tab === "audit" && <AuditSection logs={auditLogs.filter((l) => l.workflowId === selectedDispWorkflow.id)} onExport={exportAuditCsv} />}
        </div>
      </ReactFlowProvider>
    );
  }

  // Normal app (top tabs)
  return (
    <ReactFlowProvider>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-primaryText">Workflow Engine</h1>
          {/* <p className="text-secondary font-medium">
            HubSpot-style builder: <span className="font-bold text-primaryText">left actions</span> +{" "}
            <span className="font-bold text-primaryText">visual branches/arrows</span> + triggers + versions + audit.
          </p> */}
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-4">
          <div className="flex flex-wrap gap-2">
            {topTabs.map((t) => {
              const selected = activeTab === (t.key as TopTabKey); // ✅ add this
              const isDispositions = t.key === "Dispositions";
              const disabled = isDispositions && !selectedQueue;

              return (
                <button
                  key={t.key}
                  disabled={disabled}
                  title={disabled ? "Select a queue first" : undefined}
                  onClick={() => !disabled && setActiveTab(t.key as TopTabKey)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all ${
                    selected
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-gray-50 text-secondary hover:bg-gray-100 font-medium"
                  } ${disabled ? "opacity-50 cursor-not-allowed hover:bg-gray-50" : ""}`}
                >
                  <span className={selected ? "text-white" : "text-primary"}>{t.icon}</span>
                  <span className="text-sm font-bold">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 px-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <p className="text-sm text-secondary">{topTabs.find((t) => t.key === activeTab)?.desc}</p>
            <div className="text-xs text-secondary">
              <span className="font-bold text-primaryText">Selected Workflow:</span>{" "}
              {selectedWorkflow && selectedPublished ? `${selectedWorkflow.name} (Published v${selectedPublished.version})` : "None"}
            </div>
          </div>
        </div>

        {activeTab === "Queues" && (
          <QueuesSection
            queues={queues}
            selectedQueueId={selectedQueueId}
            onAdd={() => setShowAddQueue(true)}
            onToggleEnabled={(id) => setQueues((prev) => prev.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q)))}
            onSelectQueue={(id) => {
              setSelectedQueueId(id);
              setActiveTab("Dispositions"); // auto move to Dispositions after selecting
              setDispositionSearch("");
            }}
          />
        )}

        {activeTab === "Dispositions" && (
          <DispositionsSection
            dispositions={filteredDispositions}
            queueOptions={queueOptions}
            queueValue={selectedQueue?.name || "—"}
            onQueueChange={() => {}}
            searchValue={dispositionSearch}
            onSearchChange={setDispositionSearch}
            onAdd={() => setShowAddDisposition(true)}
            onToggleEnabled={(id) => setDispositions((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)))}
            onRowClick={(id) => openDispositionWorkflow(id)}
          />
        )}

        {activeTab === "workflows" && (
          <WorkflowsSection
            selectedAccountType={selectedAccountType}
            setSelectedAccountType={setSelectedAccountType}
            workflows={filteredWorkflows}
            search={workflowSearch}
            onSearchChange={setWorkflowSearch}
            selectedWorkflowId={selectedWorkflowId}
            onSelectWorkflow={(id) => setSelectedWorkflowId(id)}
            onAddWorkflow={() => setShowAddWorkflow(true)}
            onToggleActive={toggleWorkflowActive}
            onMakeOnlyActive={setOnlyOneActive}
          />
        )}

        {activeTab === "triggers" && <TriggersSection workflow={selectedWorkflow} onGoWorkflows={() => setActiveTab("workflows")} onChange={updateEnrollment} />}

        {activeTab === "builder" && (
          <BuilderCanvasSection workflow={selectedWorkflow} published={selectedPublished} onDraftChange={updateDraft} onPublish={publishNewVersion} />
        )}

        {activeTab === "test" && (
          <TestSection
            workflow={selectedWorkflow}
            published={selectedPublished}
            evalInputs={evalInputs}
            setEvalInputs={setEvalInputs}
            onRun={() => runTestFor(selectedWorkflow, selectedPublished, "RULE_ENGINE")}
            result={testResult}
          />
        )}

        {activeTab === "audit" && <AuditSection logs={auditLogs} onExport={exportAuditCsv} />}

        {/* Modals */}
        <Modal title="Add Workflow" open={showAddWorkflow} onClose={() => setShowAddWorkflow(false)}>
          <AddWorkflowForm
            onCancel={() => setShowAddWorkflow(false)}
            onSave={(payload) => {
              createWorkflow(payload);
              setShowAddWorkflow(false);
            }}
          />
        </Modal>

        <Modal title="Add Queue" open={showAddQueue} onClose={() => setShowAddQueue(false)}>
          <AddQueueForm
            onCancel={() => setShowAddQueue(false)}
            onSave={(payload) => {
              const newQueue: QueueRow = { id: uid(), ...payload };
              setQueues((prev) => [newQueue, ...prev]);
              setShowAddQueue(false);
            }}
          />
        </Modal>

        <Modal title="Add Disposition" open={showAddDisposition} onClose={() => setShowAddDisposition(false)}>
          <AddDispositionForm
            onCancel={() => setShowAddDisposition(false)}
            onSave={(payload) => {
              const newRow: Disposition = { id: uid(), ...payload };
              setDispositions((prev) => [newRow, ...prev]);
              // auto-refresh queue dropdown if user had "All Queues"
              setShowAddDisposition(false);
            }}
          />
        </Modal>
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowEngineHubspotFlow;

/** -----------------------------
 *  Add Workflow Modal
 *  ----------------------------- */
const AddWorkflowForm: React.FC<{
  onCancel: () => void;
  onSave: (payload: { accountType: AccountType; name: string; description: string }) => void;
}> = ({ onCancel, onSave }) => {
  const [accountType, setAccountType] = useState<AccountType>("EV");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canSave = name.trim().length >= 3;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Account Type</p>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)} className="bg-transparent outline-none w-full text-sm text-primaryText">
            {ACCOUNT_TYPE_OPTIONS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Workflow Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., EV Standard Workflow"
            className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
          />
          <p className="text-[11px] text-secondary mt-2">No delete required — use Active/Inactive toggles & versions.</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
        <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Description</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes for admins"
          className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary min-h-[90px]"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ accountType, name: name.trim(), description: description.trim() })}
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${
            canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Save size={18} />
          Save Workflow
        </button>
      </div>
    </div>
  );
};

/** -----------------------------
 *  Workflows Section (unchanged behavior)
 *  ----------------------------- */
const WorkflowsSection: React.FC<{
  selectedAccountType: AccountType;
  setSelectedAccountType: (v: AccountType) => void;
  workflows: WorkflowMeta[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string) => void;
  onAddWorkflow: () => void;
  onToggleActive: (id: string) => void;
  onMakeOnlyActive: (id: string) => void;
}> = ({
  selectedAccountType,
  setSelectedAccountType,
  workflows,
  search,
  onSearchChange,
  selectedWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onToggleActive,
  onMakeOnlyActive,
}) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Workflows</h2>
          <p className="text-secondary text-sm font-medium">HubSpot pattern: choose workflow → configure triggers → build on canvas → publish → test → audit.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Account Type</p>
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value as AccountType)}
              className="bg-transparent outline-none w-[260px] text-sm text-primaryText"
            >
              {ACCOUNT_TYPE_OPTIONS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 w-full sm:w-[360px]">
            <Search size={18} className="text-secondary mr-2" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search workflow name..."
              className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
            />
          </div>

          <button onClick={onAddWorkflow} className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition">
            <Plus size={18} />
            <span>Add Workflow</span>
          </button>
        </div>
      </div>

      <div className="border border-gray-100 rounded-[24px] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
          <div className="col-span-5">Workflow</div>
          <div className="col-span-2">Published</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-3 text-right">Controls</div>
        </div>

        {workflows.length === 0 ? (
          <div className="px-6 py-6 text-sm text-secondary">
            No workflows yet. Click <span className="font-bold text-primaryText">Add Workflow</span>.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {workflows.map((w) => {
              const selected = selectedWorkflowId === w.id;
              const latestVersion = w.versions.slice().sort((a, b) => b.version - a.version)[0]?.version ?? 1;

              return (
                <div
                  key={w.id}
                  className={`grid grid-cols-12 gap-2 px-6 py-4 items-center cursor-pointer transition ${selected ? "bg-primary/5" : "hover:bg-gray-50"}`}
                  onClick={() => onSelectWorkflow(w.id)}
                >
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primaryText">{w.name}</span>
                      {w.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-white">Active</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-200 text-secondary">Inactive</span>
                      )}
                      {selected && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">Selected</span>}
                    </div>
                    <div className="text-xs text-secondary mt-1">{w.description || "—"}</div>
                  </div>

                  <div className="col-span-2 text-sm font-bold text-primaryText">v{latestVersion}</div>
                  <div className="col-span-2 text-xs text-secondary">{shortDate(w.updatedAt)}</div>

                  <div className="col-span-3 flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActive(w.id);
                      }}
                      className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                    >
                      {w.isActive ? (
                        <span className="inline-flex items-center gap-2">
                          <ToggleLeft size={16} /> Set Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <ToggleRight size={16} className="text-primary" /> Set Active
                        </span>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMakeOnlyActive(w.id);
                      }}
                      className="px-3 py-2 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                      title="Keep only one active workflow per Account Type"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary" /> Only Active
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

/** -----------------------------
 *  Triggers / Enrollment Section
 *  ----------------------------- */
const TriggersSection: React.FC<{
  workflow: WorkflowMeta | null;
  onGoWorkflows: () => void;
  onChange: (cfg: EnrollmentConfig) => void;
}> = ({ workflow, onGoWorkflows, onChange }) => {
  if (!workflow) {
    return (
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primaryText">Triggers</h2>
            <p className="text-secondary text-sm font-medium">Select a workflow first.</p>
          </div>
          <button onClick={onGoWorkflows} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const cfg = workflow.enrollment;

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Triggers / Enrollment</h2>
          <p className="text-secondary text-sm font-medium">Records enter workflow only when enrollment rules match (HubSpot style).</p>
          <p className="text-xs text-secondary mt-2">
            Workflow: <span className="font-bold text-primaryText">{workflow.name}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onChange({ ...cfg, enabled: !cfg.enabled })}
            className={`px-5 py-3 rounded-2xl font-bold inline-flex items-center gap-2 transition ${
              cfg.enabled ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-50 border border-gray-100 text-secondary hover:bg-gray-100"
            }`}
          >
            {cfg.enabled ? <BadgeCheck size={18} /> : <ToggleLeft size={18} />}
            {cfg.enabled ? "Enrollment Enabled" : "Enrollment Disabled"}
          </button>

          <button
            onClick={() => onChange({ ...cfg, reEnroll: !cfg.reEnroll })}
            className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2"
            title="Re-enroll allows a record to re-enter when conditions match again (demo toggle)"
          >
            <RefreshCcw size={18} />
            {cfg.reEnroll ? "Re-enroll: ON" : "Re-enroll: OFF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Trigger Type</p>
          <select
            value={cfg.triggerType}
            onChange={(e) => onChange({ ...cfg, triggerType: e.target.value as TriggerType })}
            className="bg-transparent outline-none w-full text-sm text-primaryText"
          >
            <option value="RULE_ENGINE">Rule Engine Outcome</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="FIELD_UPDATE">Field Update</option>
            <option value="MANUAL_OVERRIDE">Manual Override</option>
          </select>
          <p className="text-[11px] text-secondary mt-2">
            This is the “HubSpot trigger” concept — workflows run only when the trigger & enrollment conditions match.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-secondary text-sm font-bold">
            <Zap size={18} className="text-primary" /> Enrollment Rule
          </div>
          <p className="text-[11px] text-secondary mt-2">Configure AND/OR conditions that enroll the record into the workflow.</p>
        </div>
      </div>

      <ConditionGroupEditor title="Enroll records when…" group={cfg.enrollmentGroup} onChange={(g) => onChange({ ...cfg, enrollmentGroup: g })} />
    </div>
  );
};

/** -----------------------------
 *  Builder Canvas Section
 *  ----------------------------- */
const BuilderCanvasSection: React.FC<{
  workflow: WorkflowMeta | null;
  published: WorkflowVersion | null;
  onDraftChange: (def: WorkflowDefinition) => void;
  onPublish: () => void;
}> = ({ workflow, published, onDraftChange, onPublish }) => {
  const rf = useRef<ReactFlowInstance | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  if (!workflow) {
    return (
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Builder</h2>
          <p className="text-secondary text-sm font-medium">Select a workflow first.</p>
        </div>
      </div>
    );
  }

  const def = workflow.draft;
  const publishedVersion = published?.version ?? 1;

  const initialFlowNodes = useMemo(() => toFlowNodes(def), [def]);
  const initialFlowEdges = useMemo(() => toFlowEdges(def), [def]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  const syncDraft = useCallback(
    (n: Node[], e: Edge[]) => {
      const nextDef = fromFlow(n, e, def);
      onDraftChange(nextDef);
    },
    [def, onDraftChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newId = uid();
      const newEdge: Edge = {
        id: newId,
        source: params.source || "",
        target: params.target || "",
        type: "hubEdge",
        data: { label: "Next", priority: 999, isElse: true },
      };

      const hubEdge: HubEdge = { id: newId, source: params.source || "", target: params.target || "", label: "Next", priority: 999, conditionGroup: null };

      const nextEdges = addEdge(newEdge, edges);
      setEdges(nextEdges);

      const nextDef: WorkflowDefinition = { nodes: def.nodes.map((x) => x), edges: [hubEdge, ...def.edges] };
      onDraftChange(nextDef);
    },
    [def, edges, onDraftChange, setEdges]
  );

  const selectedNode = useMemo(() => def.nodes.find((n) => n.id === selectedNodeId) || null, [def.nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => def.edges.find((e) => e.id === selectedEdgeId) || null, [def.edges, selectedEdgeId]);

  const validateForPublish = (d: WorkflowDefinition) => {
    const hasTrigger = d.nodes.some((n) => n.kind === "TRIGGER");
    const hasEnd = d.nodes.some((n) => n.kind === "END");
    if (!hasTrigger) return "Workflow must have a TRIGGER node.";
    if (!hasEnd) return "Workflow must have an END node.";
    for (const e of d.edges) {
      const fromOk = d.nodes.some((n) => n.id === e.source);
      const toOk = d.nodes.some((n) => n.id === e.target);
      if (!fromOk || !toOk) return "A branch references a missing node.";
    }
    return null;
  };
  const validationError = validateForPublish(def);

  const addNodeBlock = (kind: NodeKind) => {
    const id = uid();
    const name =
      kind === "TRIGGER"
        ? "Trigger: Enrollment"
        : kind === "DECISION"
        ? "Decision: IF / ELSE"
        : kind === "ACTION"
        ? "Action: New Step"
        : "End";

    const newHubNode: HubNode = { id, kind, name, actions: [] };
    const newFlowNode: Node = { id, type: "hubNode", position: rf.current ? rf.current.project({ x: 180, y: 120 }) : { x: 180, y: 120 }, data: { ...newHubNode } };

    setNodes((p) => [...p, newFlowNode]);
    onDraftChange({ ...def, nodes: [...def.nodes, newHubNode] });

    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const removeSelected = () => {
    if (selectedNodeId) {
      const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const nextEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);

      setNodes(nextNodes);
      setEdges(nextEdges);

      onDraftChange({
        nodes: def.nodes.filter((n) => n.id !== selectedNodeId),
        edges: def.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
      });

      setSelectedNodeId(null);
      return;
    }

    if (selectedEdgeId) {
      const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(nextEdges);
      onDraftChange({ ...def, edges: def.edges.filter((e) => e.id !== selectedEdgeId) });
      setSelectedEdgeId(null);
    }
  };

  const duplicateSelectedNode = () => {
    if (!selectedNode) return;
    const id = uid();

    const newHub: HubNode = { ...selectedNode, id, name: `${selectedNode.name} (Copy)`, actions: selectedNode.actions.map((a) => ({ ...a, id: uid() })) };

    const sourceFlow = nodes.find((n) => n.id === selectedNode.id);
    const newPos = sourceFlow ? { x: sourceFlow.position.x + 40, y: sourceFlow.position.y + 40 } : { x: 240, y: 140 };

    const newFlow: Node = { id, type: "hubNode", position: newPos, data: { ...newHub } };

    setNodes((p) => [...p, newFlow]);
    onDraftChange({ ...def, nodes: [...def.nodes, newHub] });

    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const setEdgeAsIf = () => {
    if (!selectedEdge) return;

    const next = def.edges.map((e) =>
      e.id === selectedEdge.id
        ? {
            ...e,
            label: e.label?.startsWith("ELSE") ? "IF" : e.label || "IF",
            priority: Math.max(1, e.priority || 1),
            conditionGroup: e.conditionGroup && e.conditionGroup.items.length ? e.conditionGroup : makeEmptyGroup(),
          }
        : e
    );
    onDraftChange({ ...def, edges: next });

    setEdges((prev) => prev.map((e) => (e.id === selectedEdge.id ? { ...e, data: { ...(e.data as any), isElse: false, label: "IF", priority: (e.data as any)?.priority ?? 1 } } : e)));
  };

  const setEdgeAsElse = () => {
    if (!selectedEdge) return;

    const next = def.edges.map((e) => (e.id === selectedEdge.id ? { ...e, label: "ELSE", priority: 999, conditionGroup: null } : e));
    onDraftChange({ ...def, edges: next });

    setEdges((prev) => prev.map((e) => (e.id === selectedEdge.id ? { ...e, data: { ...(e.data as any), isElse: true, label: "ELSE", priority: 999 } } : e)));
  };

  const updateNodeName = (id: string, name: string) => {
    onDraftChange({ ...def, nodes: def.nodes.map((n) => (n.id === id ? { ...n, name } : n)) });
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, data: { ...(n.data as any), name } } : n)));
  };

  const addActionToNode = (nodeId: string, type: ActionType) => {
    const action: WorkflowAction =
      type === "SET_STATUS"
        ? { id: uid(), type: "SET_STATUS", payload: { statusToSet: "Need More Info" } }
        : type === "AUTOFILL_FIELDS"
        ? { id: uid(), type: "AUTOFILL_FIELDS", payload: { fields: [{ key: "copay", value: "20" }] } }
        : type === "ASSIGN_USER"
        ? { id: uid(), type: "ASSIGN_USER", payload: { mode: "ROLE", value: "QA" } }
        : { id: uid(), type: "SEND_EMAIL", payload: { templateId: "TEMPLATE-001", to: "qa" } };

    onDraftChange({ ...def, nodes: def.nodes.map((n) => (n.id === nodeId ? { ...n, actions: [action, ...n.actions] } : n)) });
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as any), actions: [action, ...((n.data as any)?.actions || [])] } } : n)));
  };

  const removeActionFromNode = (nodeId: string, actionId: string) => {
    onDraftChange({ ...def, nodes: def.nodes.map((n) => (n.id === nodeId ? { ...n, actions: n.actions.filter((a) => a.id !== actionId) } : n)) });
  };

  const updateAction = (nodeId: string, action: WorkflowAction) => {
    onDraftChange({ ...def, nodes: def.nodes.map((n) => (n.id === nodeId ? { ...n, actions: n.actions.map((a) => (a.id === action.id ? action : a)) } : n)) });
  };

  const updateEdgeMeta = (edgeId: string, patch: Partial<HubEdge>) => {
    onDraftChange({ ...def, edges: def.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)) });

    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...(e.data as any),
                label: patch.label ?? (e.data as any)?.label,
                priority: patch.priority ?? (e.data as any)?.priority,
                isElse: patch.conditionGroup ? (patch.conditionGroup.items?.length ?? 0) === 0 : patch.conditionGroup === null,
              },
            }
          : e
      )
    );
  };

  const onNodeDragStop = useCallback(() => syncDraft(nodes, edges), [edges, nodes, syncDraft]);

  const onSelectionChange = useCallback((sel: { nodes?: Node[]; edges?: Edge[] }) => {
    const n = sel.nodes?.[0];
    const e = sel.edges?.[0];
    if (n) {
      setSelectedNodeId(n.id);
      setSelectedEdgeId(null);
    } else if (e) {
      setSelectedEdgeId(e.id);
      setSelectedNodeId(null);
    }
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Builder (Visual Canvas)</h2>
          <p className="text-secondary text-sm font-medium">
            Editing Draft: <span className="font-bold text-primaryText">{workflow.name}</span>{" "}
            <span className="text-xs text-secondary">(Published v{publishedVersion})</span>
          </p>
          <p className="text-xs text-secondary mt-2">Branch rules are on arrows: IF uses conditions; ELSE is default. IF evaluation uses priority (low first).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (validationError) return;
              onPublish();
            }}
            disabled={!!validationError}
            className={`px-5 py-3 rounded-2xl font-bold inline-flex items-center gap-2 transition ${
              validationError ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-100 text-secondary hover:bg-gray-100"
            }`}
            title={validationError || "Publish draft as a new version"}
          >
            <UploadCloud size={18} />
            Publish New Version
          </button>
        </div>
      </div>

      {validationError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
          <span className="font-bold">Fix before publish:</span> {validationError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Palette */}
        <div className="xl:col-span-3 border border-gray-100 rounded-[24px] overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
            <Settings2 size={16} /> Actions & Blocks
          </div>

          <div className="p-5 space-y-4">
            <div className="text-xs text-secondary">Click to add blocks. Then connect arrows on canvas.</div>

            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => addNodeBlock("TRIGGER")} className="px-4 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition inline-flex items-center gap-2">
                <Zap size={16} /> Add Trigger
              </button>
              <button onClick={() => addNodeBlock("ACTION")} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2">
                <WorkflowIcon size={16} className="text-primary" /> Add Action Step
              </button>
              <button onClick={() => addNodeBlock("DECISION")} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2">
                <GitBranch size={16} className="text-primary" /> Add Decision (IF/ELSE)
              </button>
              <button onClick={() => addNodeBlock("END")} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" /> Add End
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="text-xs font-bold text-secondary uppercase tracking-wide">Quick Controls</div>
              <button
                onClick={duplicateSelectedNode}
                disabled={!selectedNode}
                className={`w-full px-4 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2 transition ${
                  selectedNode ? "bg-white border border-gray-100 text-secondary hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Copy size={16} /> Duplicate Node
              </button>

              <button
                onClick={removeSelected}
                disabled={!selectedNodeId && !selectedEdgeId}
                className={`w-full px-4 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2 transition ${
                  selectedNodeId || selectedEdgeId ? "bg-white border border-gray-100 text-secondary hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Trash2 size={16} /> Delete Selected
              </button>
            </div>

            <div className="text-[11px] text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
              <span className="font-bold text-primaryText">HubSpot parity:</span> left action palette + visual flow with branches and conditions on arrows.
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="xl:col-span-6 border border-gray-100 rounded-[24px] overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <GitBranch size={16} /> Canvas
            </div>
            <div className="text-[11px] text-secondary font-medium inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <ArrowRight size={14} /> Connect nodes to create branches
              </span>
            </div>
          </div>

          <div className="h-[640px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={(instance) => (rf.current = instance)}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onNodeDragStop={onNodeDragStop}
              fitView
            >
              <Background gap={18} />
              <MiniMap pannable zoomable />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {/* Right Properties */}
        <div className="xl:col-span-3 border border-gray-100 rounded-[24px] overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
            <Settings2 size={16} /> Properties
          </div>

          <div className="p-5 space-y-5">
            {!selectedNode && !selectedEdge ? (
              <div className="text-sm text-secondary">
                Select a <span className="font-bold text-primaryText">Node</span> to edit actions, or select an{" "}
                <span className="font-bold text-primaryText">Arrow</span> to edit IF/ELSE branch conditions.
              </div>
            ) : null}

            {selectedNode && (
              <div className="space-y-4">
                <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-primaryText">Node</div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-secondary">{nodeBadge(selectedNode.kind)}</span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Name</p>
                    <input
                      value={selectedNode.name}
                      onChange={(e) => updateNodeName(selectedNode.id, e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                    />
                  </div>

                  {selectedNode.kind === "ACTION" && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-2">Actions</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <button onClick={() => addActionToNode(selectedNode.id, "SET_STATUS")} className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                          + Status
                        </button>
                        <button onClick={() => addActionToNode(selectedNode.id, "AUTOFILL_FIELDS")} className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                          + Autofill
                        </button>
                        <button onClick={() => addActionToNode(selectedNode.id, "ASSIGN_USER")} className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                          + Assign
                        </button>
                        <button onClick={() => addActionToNode(selectedNode.id, "SEND_EMAIL")} className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                          + Email
                        </button>
                      </div>

                      {selectedNode.actions.length === 0 ? (
                        <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">No actions yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {selectedNode.actions.map((a) => (
                            <div key={a.id} className="border border-gray-100 rounded-2xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-primaryText">{a.type}</div>
                                <button onClick={() => removeActionFromNode(selectedNode.id, a.id)} className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                                  Remove
                                </button>
                              </div>

                              {a.type === "SET_STATUS" && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Status</p>
                                  <select
                                    value={a.payload.statusToSet}
                                    onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { statusToSet: e.target.value } })}
                                    className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                  >
                                    {STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {a.type === "ASSIGN_USER" && (
                                <div className="mt-3 grid grid-cols-1 gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Mode</p>
                                    <select
                                      value={a.payload.mode}
                                      onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, mode: e.target.value as any } })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                    >
                                      <option value="ROLE">Role</option>
                                      <option value="USER">User</option>
                                    </select>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">{a.payload.mode === "ROLE" ? "Role Name" : "User ID/Email"}</p>
                                    <input
                                      value={a.payload.value}
                                      onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, value: e.target.value } })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                      placeholder={a.payload.mode === "ROLE" ? "QA / Agent / Admin" : "user@company.com"}
                                    />
                                  </div>
                                </div>
                              )}

                              {a.type === "SEND_EMAIL" && (
                                <div className="mt-3 grid grid-cols-1 gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">To</p>
                                    <select
                                      value={a.payload.to}
                                      onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, to: e.target.value as any } })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                    >
                                      <option value="clinic">Clinic</option>
                                      <option value="agent">Agent</option>
                                      <option value="qa">QA</option>
                                    </select>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Template ID</p>
                                    <input
                                      value={a.payload.templateId}
                                      onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, templateId: e.target.value } })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                      placeholder="TEMPLATE-001"
                                    />
                                  </div>
                                </div>
                              )}

                              {a.type === "AUTOFILL_FIELDS" && (
                                <div className="mt-3 space-y-3">
                                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">Fields</p>
                                  {a.payload.fields.map((f, idx) => (
                                    <div key={`${a.id}_${idx}`} className="grid grid-cols-1 gap-2">
                                      <input
                                        value={f.key}
                                        onChange={(e) => {
                                          const next = a.payload.fields.slice();
                                          next[idx] = { ...next[idx], key: e.target.value };
                                          updateAction(selectedNode.id, { ...a, payload: { fields: next } });
                                        }}
                                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
                                        placeholder="field_key"
                                      />
                                      <input
                                        value={f.value}
                                        onChange={(e) => {
                                          const next = a.payload.fields.slice();
                                          next[idx] = { ...next[idx], value: e.target.value };
                                          updateAction(selectedNode.id, { ...a, payload: { fields: next } });
                                        }}
                                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
                                        placeholder="value"
                                      />
                                    </div>
                                  ))}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const next = [...a.payload.fields, { key: "", value: "" }];
                                        updateAction(selectedNode.id, { ...a, payload: { fields: next } });
                                      }}
                                      className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                                    >
                                      + Add Field
                                    </button>
                                    <button
                                      onClick={() => {
                                        const next = a.payload.fields.slice(0, Math.max(0, a.payload.fields.length - 1));
                                        updateAction(selectedNode.id, { ...a, payload: { fields: next } });
                                      }}
                                      className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                                      disabled={a.payload.fields.length === 0}
                                    >
                                      Remove Last
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedNode.kind === "DECISION" && (
                    <div className="text-[11px] text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                      Create IF/ELSE branches by selecting an arrow and setting it to IF (with conditions) or ELSE (default).
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-4">
                <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-primaryText">Branch (Arrow)</div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-secondary">Priority {selectedEdge.priority}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Label</p>
                      <input
                        value={selectedEdge.label || ""}
                        onChange={(e) => updateEdgeMeta(selectedEdge.id, { label: e.target.value })}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                        placeholder="IF Onboarding / ELSE"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Priority (IF order)</p>
                      <input
                        type="number"
                        value={selectedEdge.priority}
                        onChange={(e) => updateEdgeMeta(selectedEdge.id, { priority: Number(e.target.value) || 1 })}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                        min={1}
                      />
                      <p className="text-[11px] text-secondary mt-1">Lower priority runs first (HubSpot style).</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={setEdgeAsIf} className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                        Set as IF
                      </button>
                      <button onClick={setEdgeAsElse} className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs">
                        Set as ELSE
                      </button>
                    </div>

                    {!selectedEdge.conditionGroup ? (
                      <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                        This is <span className="font-bold text-primaryText">ELSE</span> (default). No conditions.
                      </div>
                    ) : (
                      <ConditionGroupEditor title="IF conditions (AND/OR)" group={selectedEdge.conditionGroup} onChange={(g) => updateEdgeMeta(selectedEdge.id, { conditionGroup: g })} />
                    )}
                  </div>

                  <div className="text-[11px] text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                    <span className="font-bold text-primaryText">Manager requirement:</span> branches + triggers + visual arrows + left actions → same HubSpot workflow feel.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-secondary bg-white border border-gray-100 rounded-2xl p-4">
        Tip: drag nodes, connect arrows. Select arrow to set IF/ELSE & conditions. Publish versions for stable production behavior.
      </div>
    </div>
  );
};

/** -----------------------------
 *  Test Section
 *  ----------------------------- */
const TestSection: React.FC<{
  workflow: WorkflowMeta | null;
  published: WorkflowVersion | null;
  evalInputs: EvalInputs;
  setEvalInputs: React.Dispatch<React.SetStateAction<EvalInputs>>;
  onRun: () => void;
  result: {
    ok: boolean;
    message: string;
    finalStatus?: string;
    assignedTo?: string;
    executedActions?: { type: ActionType; summary: string }[];
    chosenPath?: { from: string; to: string; edgeLabel?: string } | null;
  } | null;
}> = ({ workflow, published, evalInputs, setEvalInputs, onRun, result }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Test / Evaluate</h2>
          <p className="text-secondary text-sm font-medium">Simulate: enrollment check → IF/ELSE branching → actions (status/assign/email/autofill).</p>
        </div>
        <div className="text-xs text-secondary">
          <span className="font-bold text-primaryText">Workflow:</span> {workflow && published ? `${workflow.name} (v${published.version})` : "None selected"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Field label="Entity / Account ID" value={evalInputs.entityId} onChange={(v) => setEvalInputs((p) => ({ ...p, entityId: v }))} />
        <SelectField label="Clinic Flag" value={evalInputs.clinicFlag} options={CLINIC_FLAG_OPTIONS} onChange={(v) => setEvalInputs((p) => ({ ...p, clinicFlag: v as ClinicFlag }))} />
        <SelectField label="Current Status" value={evalInputs.status} options={STATUS_OPTIONS} onChange={(v) => setEvalInputs((p) => ({ ...p, status: v }))} />

        <Field label="Insurance Name" value={evalInputs.insuranceName} onChange={(v) => setEvalInputs((p) => ({ ...p, insuranceName: v }))} />
        <Field label="Plan Type" value={evalInputs.planType} onChange={(v) => setEvalInputs((p) => ({ ...p, planType: v }))} />
        <Field label="Network Status" value={evalInputs.networkStatus} onChange={(v) => setEvalInputs((p) => ({ ...p, networkStatus: v }))} />

        <Field label="Policy ID" value={evalInputs.policyId} onChange={(v) => setEvalInputs((p) => ({ ...p, policyId: v }))} />
        <Field label="Group ID" value={evalInputs.groupId} onChange={(v) => setEvalInputs((p) => ({ ...p, groupId: v }))} />
        <Field label="Winning Rule Code" value={evalInputs.winningRuleCode} onChange={(v) => setEvalInputs((p) => ({ ...p, winningRuleCode: v }))} />
      </div>

      <button onClick={onRun} className="w-full lg:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition">
        <RefreshCcw size={18} />
        <span>Run Simulation</span>
      </button>

      <div className="border border-gray-100 rounded-[24px] p-6 space-y-3">
        {!result ? (
          <p className="text-sm text-secondary">Result will appear here: enrollment status, chosen branch, executed actions, final status, assignment.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {result.ok ? <CheckCircle2 className="text-primary" size={18} /> : <AlertTriangle className="text-red-500" size={18} />}
              <p className="text-sm font-bold text-primaryText">Simulation Result</p>
            </div>

            <p className="text-sm text-secondary">{result.message}</p>

            {result.ok && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
                <InfoCard title="Final Status" value={result.finalStatus || "—"} />
                <InfoCard title="Assigned To" value={result.assignedTo || "—"} />
                <InfoCard
                  title="Chosen Path"
                  value={
                    result.chosenPath
                      ? `${result.chosenPath.from} → ${result.chosenPath.to}${result.chosenPath.edgeLabel ? ` (${result.chosenPath.edgeLabel})` : ""}`
                      : "—"
                  }
                />
              </div>
            )}

            {result.executedActions && result.executedActions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Executed Actions</p>
                <div className="space-y-2">
                  {result.executedActions.map((a, idx) => (
                    <div key={idx} className="text-sm text-secondary border border-gray-100 rounded-2xl p-3">
                      <span className="font-bold text-primaryText">{a.type}</span>: {a.summary}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/** -----------------------------
 *  Audit Section
 *  ----------------------------- */
const AuditSection: React.FC<{ logs: WorkflowAuditLog[]; onExport: () => void }> = ({ logs, onExport }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Audit Logs</h2>
          <p className="text-secondary text-sm font-medium">Run history: entity IDs, version, winning rule, chosen path, executed actions.</p>
        </div>

        <button onClick={onExport} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-2">
          <FileDown size={18} />
          Export CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="border border-gray-100 rounded-[24px] p-6 text-sm text-secondary">No audit logs yet. Run simulation in Test tab to generate logs (UI demo).</div>
      ) : (
        <div className="border border-gray-100 rounded-[24px] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Workflow</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-2">Rule</div>
            <div className="col-span-4">Result</div>
          </div>

          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 px-6 py-4 items-start">
                <div className="col-span-2 text-xs text-secondary">{shortDate(l.createdAt)}</div>

                <div className="col-span-2">
                  <div className="text-sm font-bold text-primaryText">{l.workflowName}</div>
                  <div className="text-xs text-secondary mt-1">v{l.workflowVersion}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm font-bold text-primaryText">{l.entityId}</div>
                  <div className="text-xs text-secondary mt-1">{l.accountType}</div>
                </div>

                <div className="col-span-2 text-sm text-secondary">
                  <div className="font-bold text-primaryText">{l.winningRuleCode || "—"}</div>
                  <div className="text-[11px] text-secondary mt-1">{l.triggerType}</div>
                </div>

                <div className="col-span-4 text-sm text-secondary">
                  <div className="font-bold text-primaryText">{l.finalStatus || "—"}</div>
                  {l.chosenPath && (
                    <div className="text-[11px] text-secondary mt-1">
                      Path: {l.chosenPath.from} → {l.chosenPath.to}
                      {l.chosenPath.edgeLabel ? ` (${l.chosenPath.edgeLabel})` : ""}
                    </div>
                  )}
                  <div className="text-[11px] text-secondary mt-1">
                    Actions: {l.executedActions?.length || 0}
                    {l.assignedTo ? ` | Assigned: ${l.assignedTo}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** -----------------------------
 *  Dispositions Section (UPDATED: Queue dropdown + search + row click opens disposition workflow)
 *  ----------------------------- */
const QueuesSection: React.FC<{
  queues: QueueRow[];
  selectedQueueId: string | null;
  onAdd: () => void;
  onToggleEnabled: (id: string) => void;
  onSelectQueue: (id: string) => void;
}> = ({ queues, selectedQueueId, onAdd, onToggleEnabled, onSelectQueue }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Queues</h2>
          <p className="text-secondary text-sm font-medium">Select a queue first → then manage dispositions for that queue.</p>
        </div>

        <button onClick={onAdd} className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition">
          <Plus size={18} />
          <span>Add Queue</span>
        </button>
      </div>

      <div className="border border-gray-100 rounded-[24px] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
          <div className="col-span-7">Queue</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {queues.length === 0 ? (
          <div className="px-6 py-6 text-sm text-secondary">No queues yet. Click Add Queue.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {queues.map((q) => {
              const selected = selectedQueueId === q.id;
              return (
                <div
                  key={q.id}
                  className={`grid grid-cols-12 gap-2 px-6 py-4 items-center transition cursor-pointer ${
                    selected ? "bg-primary/5" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectQueue(q.id)}
                  title="Click to open dispositions"
                >
                  <div className="col-span-7">
                    <div className="text-sm font-bold text-primaryText">{q.name}</div>
                    <div className="text-[11px] text-secondary mt-1">Click row → open dispositions</div>
                  </div>

                  <div className="col-span-3 text-sm text-secondary font-medium">
                    {q.enabled ? "Enabled" : "Disabled"}
                    {selected ? " • Selected" : ""}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleEnabled(q.id);
                      }}
                      className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                      title="Toggle enabled"
                    >
                      {q.enabled ? (
                        <span className="inline-flex items-center gap-2">
                          <ToggleLeft size={16} /> TRUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <ToggleRight size={16} className="text-primary" /> FALSE
                        </span>
                      )}
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

const AddQueueForm: React.FC<{
  onCancel: () => void;
  onSave: (payload: Omit<QueueRow, "id">) => void;
}> = ({ onCancel, onSave }) => {
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  const canSave = name.trim().length >= 3;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
        <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Queue Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
          placeholder="e.g., Insurance Verification - Call"
        />
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
        <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Enabled</p>
        <select value={enabled ? "true" : "false"} onChange={(e) => setEnabled(e.target.value === "true")} className="bg-transparent outline-none w-full text-sm text-primaryText">
          <option value="true">TRUE</option>
          <option value="false">FALSE</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), enabled })}
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${
            canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Save size={18} />
          Save Queue
        </button>
      </div>
    </div>
  );
};

const DispositionsSection: React.FC<{
  dispositions: Disposition[];
  queueOptions: string[];
  queueValue: string;
  onQueueChange: (v: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onAdd: () => void;
  onToggleEnabled: (id: string) => void;
  onRowClick: (id: string) => void;
}> = ({ dispositions, queueOptions, queueValue, onQueueChange, searchValue, onSearchChange, onAdd, onToggleEnabled, onRowClick }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Dispositions</h2>
          {/* <p className="text-secondary text-sm font-medium">
            Netflix-like: pick a <span className="font-bold text-primaryText">Queue</span> → only matching dispositions show. Click a row to open its workflow builder.
          </p> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Selected Queue</p>
            <div className="text-sm font-bold text-primaryText w-[280px]">{queueValue}</div>
            <p className="text-[11px] text-secondary mt-1">Go to Queues tab to change</p>
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 w-full sm:w-[360px]">
            <Search size={18} className="text-secondary mr-2" />
            <input value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search dispositions..." className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary" />
          </div>

          <button onClick={onAdd} className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition">
            <Plus size={18} />
            <span>Add Disposition</span>
          </button>
        </div>
      </div>

      <div className="border border-gray-100 rounded-[24px] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide">
          <div className="col-span-1">Code</div>
          <div className="col-span-5">Disposition</div>
          <div className="col-span-3">Queue</div>
          <div className="col-span-2">Outcome Tag</div>
          <div className="col-span-1 text-right">Enabled</div>
        </div>

        {dispositions.length === 0 ? (
          <div className="px-6 py-6 text-sm text-secondary">No dispositions for this queue/search.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {dispositions.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-gray-50 transition cursor-pointer"
                onClick={() => onRowClick(d.id)}
                title="Click to open disposition workflow"
              >
                <div className="col-span-1 text-sm font-bold text-primaryText">{d.code}</div>
                <div className="col-span-5">
                  <div className="text-sm font-bold text-primaryText">{d.name}</div>
                  <div className="text-[11px] text-secondary mt-1">Click row → open builder</div>
                </div>
                <div className="col-span-3 text-sm text-secondary font-medium">{d.queue}</div>
                <div className="col-span-2 text-sm text-secondary font-medium">{d.outcomeTag || "—"}</div>

                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(d.id);
                    }}
                    className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                    title="Toggle enabled"
                  >
                    {d.enabled ? (
                      <span className="inline-flex items-center gap-2">
                        <ToggleLeft size={16} /> TRUE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <ToggleRight size={16} className="text-primary" /> FALSE
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** -----------------------------
 *  Add Disposition Modal Form
 *  ----------------------------- */
const AddDispositionForm: React.FC<{
  onCancel: () => void;
  onSave: (payload: Omit<Disposition, "id">) => void;
}> = ({ onCancel, onSave }) => {
  const [code, setCode] = useState<number>(0);
  const [name, setName] = useState("");
  const [queue, setQueue] = useState("PI - Waiting Queue");
  const [enabled, setEnabled] = useState(true);
  const [outcomeTag, setOutcomeTag] = useState("—");

  const queueOptions = [
    "PI - Waiting Queue",
    "Clinic Action Required",
    "Automations",
    "Completed Insurance Verifications",
    "Manager Action Required",
    "Data Entry",
    "Insurance Verification - Portal",
    "Insurance Verification - Call",
    "Audit Required",
    "Authorizations",
    "Accumulations Benifits",
  ];

  const outcomeTagOptions = ["—", "Missing/Invalid Info", "Data Entry", "Pending", "Auditing", "EV Uploaded To EHR", "Submitted"];
  const canSave = Number(code) > 0 && name.trim().length >= 3;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Code</p>
          <input
            type="number"
            value={code || ""}
            onChange={(e) => setCode(Number(e.target.value || 0))}
            className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
            placeholder="e.g., 91"
            min={1}
          />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Enabled</p>
          <select value={enabled ? "true" : "false"} onChange={(e) => setEnabled(e.target.value === "true")} className="bg-transparent outline-none w-full text-sm text-primaryText">
            <option value="true">TRUE</option>
            <option value="false">FALSE</option>
          </select>
        </div>

        <div className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Disposition Name</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary" placeholder="e.g., Added to PI Worksheet" />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Queue</p>
          <select value={queue} onChange={(e) => setQueue(e.target.value)} className="bg-transparent outline-none w-full text-sm text-primaryText">
            {queueOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Outcome Tag</p>
          <select value={outcomeTag} onChange={(e) => setOutcomeTag(e.target.value)} className="bg-transparent outline-none w-full text-sm text-primaryText">
            {outcomeTagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              code: Number(code),
              name: name.trim(),
              queue,
              enabled,
              outcomeTag: outcomeTag.trim() || "—",
            })
          }
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${
            canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Save size={18} />
          Save Disposition
        </button>
      </div>
    </div>
  );
};
