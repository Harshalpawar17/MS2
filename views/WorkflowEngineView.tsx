import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  MarkerType,
  ConnectionLineType,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

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
  FileText,
  Settings2,
  Workflow as WorkflowIcon,
  Zap,
  UploadCloud,
  BadgeCheck,
  GripVertical,
  Trash2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Layers,
  Info,
  Pencil,
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

type ActionType =
  | "SET_STATUS"
  | "AUTOFILL_FIELDS"
  | "ASSIGN_USER"
  | "SEND_EMAIL"
  | "SEND_FAX"
  | "EXPIRE"
  | "REQUEUE"
  | "API_CALL"
  | "GENERATE_PDF"
  | "REQUEUE_LIMIT_CHECK"
  | "AUTO_CREATE_EV_ACCOUNT"
  | "AUTO_CREATE_PA_ACCOUNT";

type ActionIf = { ifGroup?: ConditionGroup | null };

type WorkflowAction =
  | ({ id: string; type: "SET_STATUS"; payload: { dispositionId: string } } & ActionIf)
  | ({ id: string; type: "AUTOFILL_FIELDS"; payload: { fields: { key: string; op: "IS" | "IS_NOT" | "EXISTS"; value: string }[] } } & ActionIf)
  | ({ id: string; type: "ASSIGN_USER"; payload: { mode: "ROLE" | "DEPARTMENT" | "PERSON"; value: string } } & ActionIf)
  | ({ id: string; type: "SEND_EMAIL"; payload: { templateId: string; to: "clinic" | "agent" | "qa" } } & ActionIf)
  | ({ id: string; type: "SEND_FAX"; payload: { templateId: string; to: string } } & ActionIf)
  | ({
      id: string;
      type: "EXPIRE";
      payload: {
        days: number;
        queueName: string;
        dispositionId: string;
      };
    } & ActionIf)
  | ({
    id: string;
    type: "REQUEUE";
    payload: {
      delayHours: number;
      delayMinutes: number;
      hiddenFromQueue: boolean;
      queueName: string;
      dispositionId: string;
    };
  } & ActionIf)
  | ({ id: string; type: "API_CALL"; payload: { method: "GET" | "POST" | "PUT" | "DELETE"; url: string; headers: string; body: string } } & ActionIf)
  | ({ id: string; type: "GENERATE_PDF"; payload: { templateName: string; saveToDocuments: boolean } } & ActionIf)
  | ({
      id: string;
      type: "REQUEUE_LIMIT_CHECK";
      payload: {
        maxCount: number;
        queueName: string;
        dispositionId: string;
      };
    } & ActionIf)
  | ({ id: string; type: "AUTO_CREATE_EV_ACCOUNT"; payload: {} } & ActionIf)
  | ({ id: string; type: "AUTO_CREATE_PA_ACCOUNT"; payload: {} } & ActionIf);

type NodeKind = "TRIGGER" | "ACTION" | "DECISION" | "RESULTS" | "END";

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
 *  localStorage persistence helpers
 *  ----------------------------- */
function lsRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function lsWrite<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}
function useLs<T>(key: string, fallback: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, _setState] = useState<T>(() => {
    const stored = lsRead<T | null>(key, null);
    if (stored !== null) return stored;
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  });
  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback((action) => {
    _setState((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      lsWrite(key, next);
      return next;
    });
  }, [key]);
  return [state, setState];
}

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
  if (a.type === "SET_STATUS") return `Set Disposition → ${a.payload.dispositionId}`;
  if (a.type === "AUTOFILL_FIELDS") return `Autofill ${a.payload.fields.length} field(s)`;
  if (a.type === "ASSIGN_USER") return `Assign → ${a.payload.mode}:${a.payload.value}`;
  if (a.type === "SEND_EMAIL") return `Email → ${a.payload.to} (template: ${a.payload.templateId})`;
  if (a.type === "SEND_FAX") return `Fax → ${a.payload.to} (template: ${a.payload.templateId})`;
  if (a.type === "EXPIRE") {
    const queuePart = a.payload.queueName ? ` → ${a.payload.queueName}` : "";
    const dispositionPart = a.payload.dispositionId ? ` → ${a.payload.dispositionId}` : "";
    return `Expire in ${a.payload.days} day(s)${queuePart}${dispositionPart}`;
  }
  if (a.type === "REQUEUE") {
    const queuePart = a.payload.queueName ? ` → ${a.payload.queueName}` : "";
    const dispositionPart = a.payload.dispositionId ? ` → ${a.payload.dispositionId}` : "";
    return `Requeue ${a.payload.delayHours}h ${a.payload.delayMinutes}m${queuePart}${dispositionPart}`;
  }
  if (a.type === "API_CALL") return `API ${a.payload.method} → ${a.payload.url}`;
  if (a.type === "GENERATE_PDF") return `Generate PDF: ${a.payload.templateName}`;
  if (a.type === "REQUEUE_LIMIT_CHECK") {
    const queuePart = a.payload.queueName ? ` → ${a.payload.queueName}` : "";
    const dispositionPart = a.payload.dispositionId ? ` → ${a.payload.dispositionId}` : "";
    return `Requeue limit ≥ ${a.payload.maxCount}${queuePart}${dispositionPart}`;
  }
  if (a.type === "AUTO_CREATE_EV_ACCOUNT") return "Auto-create EV account";
  if (a.type === "AUTO_CREATE_PA_ACCOUNT") return "Auto-create PA account";
  const exhaustive: never = a;
  return String(exhaustive).replace(/_/g, " ");
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
  results: string[]; // e.g. ["Approved", "Denied", "Pending"]
};

type HubEdge = {
  id: string;
  source: string;
  target: string;
  priority: number; // lowest first
  label: string;
  conditionGroup: ConditionGroup | null; // IF has group with items; ELSE is null
  resultLabel?: string; // which result from source node this edge represents
};

/** Template & Document types */
type EmailTemplate = { id: string; name: string; subject: string; body: string };
type FaxTemplate = { id: string; name: string; coverSheet: string };
type DocRecord = { id: string; name: string; docType: string; createdAt: string };

const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: "et-1", name: "Missing Insurance Card", subject: "Action Required: Insurance Card Needed", body: "Dear clinic, please provide..." },
  { id: "et-2", name: "EV Completed Notification", subject: "Eligibility Verification Complete", body: "Your EV has been completed..." },
  { id: "et-3", name: "PA Approval Notice", subject: "Prior Authorization Approved", body: "The PA for your patient..." },
  { id: "et-4", name: "Benefits Summary", subject: "Benefits Verification Summary", body: "Please find attached..." },
];

const MOCK_FAX_TEMPLATES: FaxTemplate[] = [
  { id: "ft-1", name: "PA Request Form", coverSheet: "Standard PA Cover" },
  { id: "ft-2", name: "Insurance Verification Request", coverSheet: "IV Cover Sheet" },
  { id: "ft-3", name: "Medical Records Request", coverSheet: "Records Cover" },
];

const MOCK_DOCUMENTS: DocRecord[] = [
  { id: "doc-1", name: "Patient Insurance Card.pdf", docType: "Insurance", createdAt: "2025-12-01T10:00:00Z" },
  { id: "doc-2", name: "EV Report #1042.pdf", docType: "EV Report", createdAt: "2025-12-05T14:30:00Z" },
  { id: "doc-3", name: "PA Approval Letter.pdf", docType: "Authorization", createdAt: "2026-01-10T09:00:00Z" },
];

const SYSTEM_FIELDS = [
  { key: "insurance_name", label: "Insurance Name" },
  { key: "plan_type", label: "Plan Type" },
  { key: "network_status", label: "Network Status" },
  { key: "policy_id", label: "Policy ID" },
  { key: "group_id", label: "Group ID" },
  { key: "copay", label: "Copay" },
  { key: "deductible", label: "Deductible" },
  { key: "coinsurance", label: "Coinsurance" },
  { key: "oop_max", label: "Out of Pocket Max" },
  { key: "auth_number", label: "Auth Number" },
  { key: "effective_date", label: "Effective Date" },
  { key: "term_date", label: "Term Date" },
  { key: "subscriber_id", label: "Subscriber ID" },
  { key: "clinic_flag", label: "Clinic Flag" },
  { key: "status", label: "Status" },
];

const DEPARTMENT_OPTIONS = ["Eligibility", "Authorization", "Billing", "QA", "Management", "Data Entry"];
const ROLE_OPTIONS = ["Agent", "QA Reviewer", "Manager", "Admin", "Supervisor"];
const PERSON_OPTIONS = ["John Smith", "Jane Doe", "Mike Chen", "Sarah Wilson"];

function makeDefaultDefinition(): WorkflowDefinition {
  const trig = uid();
  const act1 = uid();
  const end = uid();

  const nodes: HubNode[] = [
    { id: trig, kind: "TRIGGER", name: "Trigger: Enrollment", actions: [], results: [] },
    {
      id: act1,
      kind: "ACTION",
      name: "Action: Set Status",
      actions: [{ id: uid(), type: "SET_STATUS", payload: { dispositionId: "" } }],
      results: ["Completed", "Needs Review"],
    },
    { id: end, kind: "END", name: "End", actions: [], results: [] },
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

function makeDispositionDefinition(
  results: ResultMapping[],
  dispositionName: string,
  queueName: string
): WorkflowDefinition {
  const trigId = uid();

  // Visio-style default: Trigger on LEFT, Results stacked on RIGHT
  const TRIGGER_X = 140;
  const TRIGGER_Y = 240;
  const RESULTS_X = 560;
  const ROW_GAP_Y = 190;

  const triggerNode: any = {
    id: trigId,
    kind: "TRIGGER" as NodeKind,
    name: "Trigger: Disposition",
    actions: [],
    results: [],
    _pos: { x: TRIGGER_X, y: TRIGGER_Y },
    _subtitle: `${dispositionName} • Queue: ${queueName}`,
  };

  if (results.length === 0) {
    return { nodes: [triggerNode], edges: [] };
  }

  const totalHeight = (results.length - 1) * ROW_GAP_Y;
  const startY = TRIGGER_Y - totalHeight / 2;

  const resultNodes: any[] = results.map((r, idx) => ({
    id: uid(),
    kind: "RESULTS" as NodeKind,
    name: `Result: ${r.label}`,
    actions: [],
    results: [r.label],
    _resultMapping: r,
    _pos: { x: RESULTS_X, y: startY + idx * ROW_GAP_Y },
  }));

  const edges: HubEdge[] = resultNodes.map((rn, idx) => ({
    id: uid(),
    source: trigId,
    target: rn.id,
    priority: idx + 1,
    label: rn.results[0] || "Next",
    conditionGroup: null,
  }));

  return { nodes: [triggerNode, ...resultNodes], edges };
}

function syncDispositionResultsIntoDraft(
  prevDraft: WorkflowDefinition,
  results: ResultMapping[],
  dispositionName: string,
  queueName: string
): WorkflowDefinition {
  const TRIGGER_X = 140;
  const TRIGGER_Y = 240;
  const RESULTS_X = 560;
  const ROW_GAP_Y = 190;

  const nodes: any[] = (prevDraft.nodes || []).map((n) => ({ ...(n as any) }));
  const edges: any[] = (prevDraft.edges || []).map((e) => ({ ...(e as any) }));

  // Find (or create) trigger node
  let trigger = nodes.find((n) => n.kind === "TRIGGER");
  if (!trigger) {
    trigger = {
      id: uid(),
      kind: "TRIGGER" as NodeKind,
      name: "Trigger: Disposition",
      actions: [],
      results: [],
      _pos: { x: TRIGGER_X, y: TRIGGER_Y },
      _subtitle: `${dispositionName} • Queue: ${queueName}`,
    };
  }

  trigger.name = "Trigger: Disposition";
  trigger._subtitle = `${dispositionName} • Queue: ${queueName}`;
  trigger._pos = { x: TRIGGER_X, y: TRIGGER_Y };

  const trigId = String(trigger.id);

  // Existing RESULT nodes keyed by resultMapping.id (stable)
  const existingResults = nodes.filter((n) => n.kind === "RESULTS" && n._resultMapping?.id);
  const byMappingId = new Map<string, any>(
    existingResults.map((n) => [String(n._resultMapping.id), n])
  );

  const keepMappingIds = new Set(results.map((r) => String(r.id)));

  // Removed RESULT nodes (must delete + remove their edges)
  const removedNodeIds = new Set<string>(
    existingResults
      .filter((n) => !keepMappingIds.has(String(n._resultMapping.id)))
      .map((n) => String(n.id))
  );

  // Build ordered RESULT nodes (reuse where possible)
  const orderedResultNodes: any[] = results.map((r) => {
    const existing = byMappingId.get(String(r.id));
    if (existing) {
      return {
        ...existing,
        name: `Result: ${r.label}`,
        results: [r.label],
        _resultMapping: { ...r },
      };
    }
    return {
      id: uid(),
      kind: "RESULTS" as NodeKind,
      name: `Result: ${r.label}`,
      actions: [],
      results: [r.label],
      _resultMapping: { ...r },
      _pos: { x: 0, y: 0 },
    };
  });

  // Position result nodes in Visio-style stack
  const totalHeight = (orderedResultNodes.length - 1) * ROW_GAP_Y;
  const startY = TRIGGER_Y - totalHeight / 2;
  orderedResultNodes.forEach((rn, idx) => {
    rn._pos = { x: RESULTS_X, y: startY + idx * ROW_GAP_Y };
  });

  // Remove all old RESULTS nodes, re-add ordered ones
  const nonResultNodes = nodes.filter((n) => n.kind !== "RESULTS" && String(n.id) !== trigId);
  const finalNodes = [trigger, ...nonResultNodes, ...orderedResultNodes];

  // Remove edges connected to removed RESULT nodes
  let finalEdges = edges.filter(
    (e) =>
      !removedNodeIds.has(String(e.source)) &&
      !removedNodeIds.has(String(e.target))
  );

  // Ensure trigger->result edges exist and priority reflects order
  const resultNodeIds = new Set(orderedResultNodes.map((n) => String(n.id)));

  // Drop stale trigger->result edges that point to non-existing result nodes
  finalEdges = finalEdges.filter((e) => {
    if (String(e.source) !== trigId) return true;
    // if it's not pointing to a current RESULT node, remove it
    return resultNodeIds.has(String(e.target)) || nodes.some((n) => String(n.id) === String(e.target));
  });

  orderedResultNodes.forEach((rn, idx) => {
    const existingEdge = finalEdges.find(
      (e) => String(e.source) === trigId && String(e.target) === String(rn.id)
    );

    if (existingEdge) {
      existingEdge.priority = idx + 1;
      existingEdge.label = rn.results?.[0] || "Next";
      existingEdge.conditionGroup = existingEdge.conditionGroup ?? null;
    } else {
      finalEdges.push({
        id: uid(),
        source: trigId,
        target: rn.id,
        priority: idx + 1,
        label: rn.results?.[0] || "Next",
        conditionGroup: null,
      } as HubEdge);
    }
  });

  return { ...prevDraft, nodes: finalNodes, edges: finalEdges };
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

  const runNodeActions = (node: HubNode) => {
    for (const a of node.actions || []) {
      // Action-level IF/THEN (ifGroup). If not present -> run.
      const g = a.ifGroup ?? null;
      if (g && !groupMatches(g, inputs)) continue;

      executed.push(a);

      if (a.type === "SET_STATUS") finalStatus = a.payload.dispositionId;
      if (a.type === "ASSIGN_USER") assignedTo = `${a.payload.mode}:${a.payload.value}`;
    }
  };

  let current = start;
  let lastPath: { from: string; to: string; edgeLabel?: string } | null = null;

  // Run trigger node actions (if any)
  runNodeActions(current);

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

    let chosen: HubEdge | null = null;

    if (current.kind === "DECISION") {
      const matchingIf = outgoing.find((e) => {
        const g = e.conditionGroup;
        if (!g || !g.items || g.items.length === 0) return false;
        return groupMatches(g, inputs);
      });

      const elseEdge =
        outgoing.find((e) => !e.conditionGroup || (e.conditionGroup.items?.length ?? 0) === 0) || null;

      chosen = matchingIf || elseEdge;

      if (!chosen) {
        return {
          ok: true as const,
          reason: `Stopped: no matching IF branch from decision "${current.name}" and no ELSE branch.`,
          executed,
          finalStatus,
          assignedTo,
          chosenPath: lastPath,
        };
      }
    } else {
      // Non-decision nodes should continue through the first ordered path only.
      chosen = outgoing[0];
    }

    const next = def.nodes.find((n) => n.id === chosen.target);
    if (!next) return { ok: false as const, reason: "Edge points to missing node.", executed, finalStatus, assignedTo };

    // Run next node actions (respect action-level ifGroup)
    runNodeActions(next);

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

function validateDecisionNodes(def: WorkflowDefinition): string[] {
  const errors: string[] = [];

  for (const node of def.nodes) {
    if (node.kind !== "DECISION") continue;

    const outgoing = def.edges
      .filter((e) => e.source === node.id)
      .slice()
      .sort((a, b) => a.priority - b.priority);

    if (outgoing.length < 2) {
      errors.push(`Decision node "${node.name}" must have at least 2 outgoing branches.`);
      continue;
    }

    const ifEdges = outgoing.filter((e) => e.conditionGroup && (e.conditionGroup.items?.length ?? 0) > 0);
    const elseEdges = outgoing.filter((e) => !e.conditionGroup || (e.conditionGroup.items?.length ?? 0) === 0);

    if (ifEdges.length === 0) {
      errors.push(`Decision node "${node.name}" must have at least one IF branch.`);
    }

    if (elseEdges.length !== 1) {
      errors.push(`Decision node "${node.name}" must have exactly one ELSE branch.`);
    }
  }

  return errors;
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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="min-h-full flex items-start justify-center px-4 py-8">
        <div className="relative z-10 w-full max-w-3xl bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="flex items-start justify-between gap-4 p-8 pb-6 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-primaryText">{title}</h3>
              <p className="text-sm text-secondary font-medium">
                Complete details and click Save.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X size={20} className="text-secondary" />
            </button>
          </div>

          <div className="p-8 pt-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            {children}
          </div>
        </div>
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

              <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1.4fr] gap-3">
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
  if (kind === "RESULTS") return "RESULTS";
  return "END";
}
function nodeIcon(kind: NodeKind) {
  if (kind === "TRIGGER") return <Zap size={16} className="text-primary" />;
  if (kind === "DECISION") return <GitBranch size={16} className="text-primary" />;
  if (kind === "ACTION") return <WorkflowIcon size={16} className="text-primary" />;
  if (kind === "RESULTS") return <BadgeCheck size={16} className="text-primary" />;
  return <CheckCircle2 size={16} className="text-primary" />;
}

const HubNodeCard: React.FC<NodeProps<any>> = ({ data, selected }) => {
  const kind: NodeKind = data.kind;
  const title: string = data.name;
  const results: string[] = data.results || [];
  const actions: WorkflowAction[] = data.actions || [];

  const baseHandleStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: 6, // more “Visio-like” than circles
    border: "2px solid #3B82F6",
    background: "#EFF6FF",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.15)",
    cursor: "crosshair",
  };

  const badgeForAction = (a: WorkflowAction) => {
    if (a.type === "GENERATE_PDF") return `PDF: ${a.payload.templateName || ""}`;
    if (a.type === "SEND_EMAIL") return "Email";
    if (a.type === "SEND_FAX") return "Fax";
    if (a.type === "AUTO_CREATE_EV_ACCOUNT") return "Auto EV";
    if (a.type === "AUTO_CREATE_PA_ACCOUNT") return "Auto PA";
    return a.type.replace(/_/g, " ");
  };

  const actionBadges = kind === "ACTION" ? actions.slice(0, 3).map(badgeForAction) : [];

  return (
    <div
      className={`relative rounded-2xl border bg-white px-3 py-3 w-[240px] ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
      }`}
    >
      {/* MAIN TARGET HANDLE */}
      <Handle type="target" position={Position.Left} style={baseHandleStyle} />

      {/* MAIN SOURCE HANDLE (for non-results nodes) */}
      {kind !== "RESULTS" && (
        <Handle type="source" position={Position.Right} style={baseHandleStyle} />
      )}

      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-bold text-primaryText">{title}</div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-secondary">
          {nodeBadge(kind)}
        </span>
      </div>

      {/* Action badges visible on canvas (manager request) */}
      {actionBadges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {actionBadges.map((b, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-secondary"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* RESULTS node: one connector per outcome */}
      {kind === "RESULTS" && results.length > 0 && (
        <div className="space-y-2 mt-2">
          {results.map((r, idx) => (
            <div
              key={idx}
              className="relative w-full px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-primaryText"
            >
              {r}
              <Handle
                type="source"
                id={`result:${idx}`}
                position={Position.Right}
                style={baseHandleStyle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const nodeTypes = { hubNode: HubNodeCard };

/** -----------------------------
 *  ReactFlow: Custom Edge
 *  ----------------------------- */
const HubEdgeView: React.FC<EdgeProps<any>> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerEnd,
    data,
    selected,
  } = props;

  const label = data?.label || "Next";
  const priority = data?.priority ?? 1;
  const isElse = data?.isElse ?? false;
  const resultLabel = data?.resultLabel || "";

  // Visio-style: orthogonal (right-angle) routing, with straight segments
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // 0 = sharp corners (Visio-like)
    offset: 28,
  });

  const stroke = selected ? "#2563EB" : "#94A3B8"; // blue on select, slate otherwise
  const displayLabel = resultLabel ? `${label} • ${resultLabel}` : `${label} • P${priority}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: isElse ? "6 4" : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
        >
          <div
            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-sm ${
              isElse
                ? "bg-gray-50 border-gray-200 text-secondary"
                : "bg-white border-gray-200 text-primaryText"
            }`}
          >
            {displayLabel}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes = { hubEdge: HubEdgeView };

/** -----------------------------
 *  Visio-like auto layout (Dagre)
 *  - Gives straight columns/rows and reduces criss-cross connectors.
 *  - Triggered by "Auto Layout" button in the toolbar.
 *  ----------------------------- */
const VISIO_NODE_WIDTH = 240;  // matches HubNodeCard width
const VISIO_NODE_HEIGHT = 160; // safe average for layout purposes

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 140,
    nodesep: 90,
    edgesep: 25,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: VISIO_NODE_WIDTH, height: VISIO_NODE_HEIGHT });
  });

  edges.forEach((e) => {
    if (e.source && e.target) g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const layouted = nodes.map((n) => {
    const p = g.node(n.id);
    if (!p) return n;
    return {
      ...n,
      position: {
        x: p.x - VISIO_NODE_WIDTH / 2,
        y: p.y - VISIO_NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layouted, edges };
}


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

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "hubEdge",
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#94A3B8" },
      data: {
        label: e.label,
        priority: e.priority,
        isElse,
        resultLabel: e.resultLabel || "",
      },
    };
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

    const label = String(data.label ?? prev?.label ?? "Next");
    const priority = Number(data.priority ?? prev?.priority ?? 1);

    const rlRaw = data.resultLabel ?? prev?.resultLabel ?? "";
    const resultLabel = String(rlRaw || "").trim() || undefined;

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label,
      priority,
      conditionGroup: prev?.conditionGroup ?? null,
      resultLabel,
    };
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

type ResultMapping = {
  id: string;
  label: string;
  status: "active" | "disabled";
  nextType: "none" | "disposition" | "end";
  nextDispositionId: string;
  conditions?: ConditionGroup;
};

type Disposition = {
  id: string;
  code: number;
  name: string;
  queue: string;
  enabled: boolean;
  outcomeTag: string;
  results: ResultMapping[];
};

const DEFAULT_DISPOSITIONS: Disposition[] = [
  { id: "disp-1", code: 91, name: "Added to PI Worksheet", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-2", code: 7, name: "Additional Information Required to Complete EV", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-3", code: 66, name: "Auto Create a PA", queue: "Automations", enabled: true, outcomeTag: "Data Entry", results: [] },
  { id: "disp-4", code: 73, name: "Cannot Find Patient in EHR", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-5", code: 13, name: "Duplicate", queue: "Manager Action Required", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-6", code: 10, name: "Email sent to Clinic - Missing Information", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-7", code: 11, name: "Enter Patient Demographic from EHR", queue: "Data Entry", enabled: true, outcomeTag: "Data Entry", results: [] },
  { id: "disp-8", code: 90, name: "Enter PI Patient in EMR", queue: "Data Entry", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-9", code: 6, name: "EV Failed QC - Please Review Comments", queue: "Insurance Verification - Portal", enabled: true, outcomeTag: "Pending", results: [] },
  { id: "disp-10", code: 19, name: "EV Missing Information - Manager Review", queue: "Manager Action Required", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-11", code: 2, name: "EV Needs to be Uploaded to Client Portal", queue: "Data Entry", enabled: true, outcomeTag: "Data Entry", results: [] },
  { id: "disp-12", code: 5, name: "EV Requires a Manager Review", queue: "Manager Action Required", enabled: true, outcomeTag: "Pending", results: [] },
  { id: "disp-13", code: 3, name: "EV Requires an Audit", queue: "Audit Required", enabled: true, outcomeTag: "Auditing", results: [] },
  { id: "disp-14", code: 71, name: "EV Uploaded - Additional Insurance on File", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "EV Uploaded To EHR", results: [] },
  { id: "disp-15", code: 1, name: "EV Uploaded - No Action Required", queue: "Completed Insurance Verifications", enabled: true, outcomeTag: "EV Uploaded To EHR", results: [] },
  { id: "disp-16", code: 9, name: "Manager/Biller Requires an EV", queue: "Insurance Verification - Call", enabled: true, outcomeTag: "Pending", results: [] },
  { id: "disp-17", code: 18, name: "Maxed Attempts to Reach Clinic", queue: "Clinic Action Required", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-18", code: 110, name: "Medulla - Auto Create PA", queue: "Automations", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-19", code: 96, name: "Missing Date of Accident", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-20", code: 16, name: "Missing Insurance Card - Automated Email", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-21", code: 15, name: "Missing Insurance Card - Follow Up Email 1", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-22", code: 17, name: "Missing Insurance Card - Follow Up Email 2", queue: "Automations", enabled: true, outcomeTag: "Missing/Invalid Info", results: [] },
  { id: "disp-23", code: 95, name: "Missing Payer Info", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-24", code: 125, name: "New Disposition for Accumulation Benefits", queue: "Accumulations Benifits", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-25", code: 8, name: "New EV Received - Please Verify by Call", queue: "Insurance Verification - Call", enabled: true, outcomeTag: "Submitted", results: [] },
  { id: "disp-26", code: 4, name: "New EV Received - Please Verify by Portal", queue: "Insurance Verification - Portal", enabled: true, outcomeTag: "Submitted", results: [] },
  { id: "disp-27", code: 108, name: "PA Missed - Caught During Audit", queue: "Data Entry", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-28", code: 94, name: "Patient Name Invalid", queue: "PI - Waiting Queue", enabled: true, outcomeTag: "—", results: [] },
  { id: "disp-29", code: 105, name: "Patient Requires New PA - Call", queue: "Authorizations", enabled: true, outcomeTag: "—", results: [] },
];

type TopTabKey =
  | "Queues"
  | "Dispositions"
  | "workflows"
  | "triggers"
  | "builder"
  | "test"
  | "audit"
  | "emailTemplates"
  | "faxTemplates"
  | "pdfTemplates"
  | "documents";
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
  const [showEditDisposition, setShowEditDisposition] = useState(false);
  const [editDispositionId, setEditDispositionId] = useState<string | null>(null);
  const [showAddQueue, setShowAddQueue] = useState(false);

  // Queues (localStorage-persisted)
  const [queues, setQueues] = useLs<QueueRow[]>("wfe_queues", () => {
    const uniq = Array.from(
      new Set(
        DEFAULT_DISPOSITIONS
          .map((d) => d.queue)
          .filter((queue): queue is string => typeof queue === "string" && queue.trim().length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return uniq.map((name, i) => ({ id: `q-${i}`, name, enabled: true }));
  });

  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const selectedQueue = useMemo(() => queues.find((q) => q.id === selectedQueueId) || null, [queues, selectedQueueId]);

  // Dispositions (localStorage-persisted)
  const [dispositions, setDispositions] = useLs<Disposition[]>("wfe_dispositions", DEFAULT_DISPOSITIONS);
  const editingDisposition = useMemo(() => {
  if (!editDispositionId) return null;
    return dispositions.find((d) => d.id === editDispositionId) || null;
  }, [editDispositionId, dispositions]);

  const closeEditDisposition = () => {
    setShowEditDisposition(false);
    setEditDispositionId(null);
  };

  const [dispositionSearch, setDispositionSearch] = useState("");

  // Normal workflow mgmt (localStorage-persisted)
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>("EV");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [workflows, setWorkflows] = useLs<WorkflowMeta[]>("wfe_workflows", []);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  // Audit logs (localStorage-persisted)
  const [auditLogs, setAuditLogs] = useLs<WorkflowAuditLog[]>("wfe_auditLogs", []);

  // Template & Document state
  const [emailTemplates, setEmailTemplates] = useLs<EmailTemplate[]>("wfe_emailTemplates", MOCK_EMAIL_TEMPLATES);
  const [faxTemplates, setFaxTemplates] = useLs<FaxTemplate[]>("wfe_faxTemplates", MOCK_FAX_TEMPLATES);
  const [pdfTemplates, setPdfTemplates] = useLs<{ id: string; name: string; body: string }[]>("wfe_pdfTemplates", []);
  const [showAddPdfTemplate, setShowAddPdfTemplate] = useState(false);
  const [documents] = useState<DocRecord[]>(MOCK_DOCUMENTS);
  const [showAddEmailTemplate, setShowAddEmailTemplate] = useState(false);
  const [showAddFaxTemplate, setShowAddFaxTemplate] = useState(false);

  // Disposition workflow mode (per disposition)
  const [dispMode, setDispMode] = useState<DispositionWorkflowState>({ open: false, dispositionId: null, tab: "builder" });
  const [dispWorkflowByDispositionId, setDispWorkflowByDispositionId] = useLs<Record<string, WorkflowMeta>>("wfe_dispWorkflows", {});

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

  // Disposition test runner state
  const [clickResult, setClickResult] = useState<{ label: string; nextType: string; nextName: string; nextId: string; conditions?: ConditionGroup } | null>(null);

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

      const decisionErrors = validateDecisionNodes(def);
      if (decisionErrors.length > 0) {
        alert(`Publish blocked: ${decisionErrors[0]}`);
        return;
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
      if (existing) {
        const d = dispositions.find((x) => x.id === dispositionId);
        if (!d) return existing;

        const draftResultSig = (existing.draft.nodes || [])
          .filter((n: any) => n.kind === "RESULTS")
          .map((n: any) => `${String(n._resultMapping?.id || "")}:${String(n.results?.[0] || "")}`)
          .join("|");

        const dispResultSig = (d.results || [])
          .map((r) => `${String(r.id)}:${String(r.label)}`)
          .join("|");

        // If results changed (add/edit/reorder), sync draft to match and re-layout
        if (draftResultSig !== dispResultSig) {
          const t = nowIso();
          const nextDraft = syncDispositionResultsIntoDraft(
            existing.draft,
            d.results || [],
            d.name || "Disposition",
            d.queue || ""
          );

          const updated = {
            ...existing,
            name: `Disposition: ${d.name}`,
            description: `Queue: ${d.queue} • Code: ${d.code}`,
            updatedAt: t,
            draft: nextDraft,
          };

          setDispWorkflowByDispositionId((prev) => ({ ...prev, [dispositionId]: updated }));
          return updated;
        }

        return existing;
      }

      const d = dispositions.find((x) => x.id === dispositionId);
      const wfName = d ? `Disposition: ${d.name}` : "Disposition Workflow";
      const wfDesc = d ? `Queue: ${d.queue} • Code: ${d.code}` : "Disposition workflow";
      const dispResults = d?.results || [];

      const created = nowIso();
      const base = makeDispositionDefinition(dispResults, d?.name || "Disposition", d?.queue || "");
      const v1: WorkflowVersion = { version: 1, createdAt: created, updatedAt: created, definition: base };
      const wf: WorkflowMeta = {
        id: uid(),
        accountType: selectedAccountType,
        name: wfName,
        description: wfDesc,
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

      const decisionErrors = validateDecisionNodes(def);
      if (decisionErrors.length > 0) {
        alert(`Publish blocked: ${decisionErrors[0]}`);
        return;
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
      { key: "emailTemplates" as const, label: "Email Templates", icon: <FileDown size={18} />, desc: "Manage email templates used in workflow actions" },
      { key: "faxTemplates" as const, label: "Fax Templates", icon: <FileDown size={18} />, desc: "Manage fax templates used in workflow actions" },
      { key: "pdfTemplates" as const, label: "PDF Templates", icon: <FileText size={18} />, desc: "Manage PDF templates used in workflow actions" },
      { key: "documents" as const, label: "Documents", icon: <ClipboardList size={18} />, desc: "Generated documents and file storage" },
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
                  Queue: <span className="font-bold text-primaryText">{selectedDisposition.queue}</span> • Status:{" "}
                  <span className="font-bold text-primaryText">{selectedDisposition.enabled ? "Active" : "Inactive"}</span>
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
                    className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all ${selected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-secondary hover:bg-gray-100 font-medium"
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
            <BuilderCanvasSection
              workflow={selectedDispWorkflow}
              published={selectedDispPublished}
              onDraftChange={updateDispDraft}
              onPublish={publishDispNewVersion}
              dispositions={dispositions}
              emailTemplates={emailTemplates}
              faxTemplates={faxTemplates}
              pdfTemplates={pdfTemplates}
            />
          )}

          {dispMode.tab === "test" && (() => {
            // ── Disposition Test Runner: click a result → see what happens ──
            const dispDef = selectedDispWorkflow.draft;
            const resultNodes = dispDef.nodes.filter((n) => n.kind === "RESULTS");

            return (
              <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-primaryText">Test: Disposition Flow</h2>
                  <p className="text-secondary text-sm font-medium">
                    Click a result to simulate triggering it. The flow will show the next step based on mappings.
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Disposition: <span className="font-bold text-primaryText">{selectedDisposition.name}</span> •
                    Queue: <span className="font-bold text-primaryText">{selectedDisposition.queue}</span>
                  </p>
                </div>

                {resultNodes.length === 0 ? (
                  <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-6 bg-gray-50 text-center">
                    No results defined for this disposition yet. Add results from the Disposition settings.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-secondary uppercase tracking-wide">Click a result to trigger it:</p>
                    <div className="flex flex-wrap gap-3">
                      {resultNodes.map((rn: any) => {
                        const label = rn.results?.[0] || rn.name;
                        const mapping = rn._resultMapping as ResultMapping | undefined;
                        return (
                          <button
                            key={rn.id}
                            onClick={() => {
                              const nextType = mapping?.nextType || "none";
                              let nextName = "";
                              let nextId = "";
                              if (nextType === "end") {
                                nextName = "End (Flow Stops)";
                              } else if (nextType === "disposition" && mapping?.nextDispositionId) {
                                const target = dispositions.find((d) => d.id === mapping.nextDispositionId);
                                nextName = target ? target.name : "Unknown Disposition";
                                nextId = mapping.nextDispositionId;
                              } else {
                                nextName = "Not Mapped";
                              }
                              setClickResult({ label, nextType, nextName, nextId, conditions: mapping?.conditions });
                              // Audit log
                              const condCount = mapping?.conditions?.items?.length || 0;
                              setAuditLogs((prev) => [{
                                id: uid(), createdAt: nowIso(), accountType: selectedAccountType,
                                workflowId: selectedDispWorkflow.id, workflowName: selectedDispWorkflow.name, workflowVersion: selectedDispPublished?.version || 1,
                                entityId: selectedDisposition.id, triggerType: "RULE_ENGINE",
                                chosenPath: { from: selectedDisposition.name, to: nextName },
                                executedActions: [{ type: "SET_STATUS" as ActionType, summary: `Result "${label}" triggered → ${nextName}${condCount ? ` (${condCount} condition${condCount > 1 ? "s" : ""})` : ""}` }],
                                finalStatus: nextType === "end" ? "Completed" : nextType === "disposition" ? "Routed" : "Unmapped",
                                assignedTo: "", notes: `Test runner: "${label}" triggered in disposition "${selectedDisposition.name}".`,
                              }, ...prev]);
                            }}
                            className="px-5 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition inline-flex items-center gap-2"
                          >
                            <BadgeCheck size={18} /> {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {clickResult && (
                  <div className={`border rounded-2xl p-6 space-y-3 ${clickResult.nextType === "end" ? "border-green-200 bg-green-50"
                    : clickResult.nextType === "disposition" ? "border-blue-200 bg-blue-50"
                      : "border-orange-200 bg-orange-50"
                    }`}>
                    <div className="flex items-center gap-2">
                      {clickResult.nextType === "end" ? <CheckCircle2 className="text-green-600" size={20} />
                        : clickResult.nextType === "disposition" ? <ArrowRight className="text-blue-600" size={20} />
                          : <AlertTriangle className="text-orange-500" size={20} />}
                      <p className="text-sm font-bold text-primaryText">
                        Result "{clickResult.label}" triggered
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${clickResult.nextType === "end" ? "text-green-700"
                      : clickResult.nextType === "disposition" ? "text-blue-700"
                        : "text-orange-600"
                      }`}>
                      {clickResult.nextType === "end" ? "✅ Flow ended — no further dispositions."
                        : clickResult.nextType === "disposition" ? `→ Next: ${clickResult.nextName}`
                          : "⚠ This result is not mapped yet. Go to the Builder tab to map it."}
                    </p>
                    {clickResult.nextType === "disposition" && clickResult.nextId && (
                      <button
                        onClick={() => {
                          openDispositionWorkflow(clickResult.nextId);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition inline-flex items-center gap-2"
                      >
                        <ArrowRight size={16} /> Open Next Disposition Builder
                      </button>
                    )}
                    {/* Show IF conditions if present */}
                    {clickResult.conditions && clickResult.conditions.items && clickResult.conditions.items.length > 0 && (
                      <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2 mt-1">
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">IF Conditions Required ({clickResult.conditions.groupOp})</p>
                        <p className="text-[11px] text-secondary">These conditions must all be met before proceeding:</p>
                        <div className="space-y-1">
                          {clickResult.conditions.items.map((c, i) => (
                            <div key={c.id || i} className="flex items-center gap-2 text-sm pl-2 border-l-2 border-primary/30">
                              <span className="font-bold text-primaryText">{c.field}</span>
                              <span className="text-secondary">{c.op}</span>
                              <span className="font-bold text-primary">"{c.value}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {dispMode.tab === "audit" && <AuditSection logs={auditLogs.filter((l) => l.workflowId === selectedDispWorkflow.id || l.entityId === selectedDisposition.id)} onExport={exportAuditCsv} />}
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
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl transition-all ${selected
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
            onQueueChange={() => { }}
            searchValue={dispositionSearch}
            onSearchChange={setDispositionSearch}
            onAdd={() => setShowAddDisposition(true)}
            onEdit={(id) => {
              setEditDispositionId(id);
              setShowEditDisposition(true);
            }}
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
          <BuilderCanvasSection
            workflow={selectedWorkflow}
            published={selectedPublished}
            onDraftChange={updateDraft}
            onPublish={publishNewVersion}
            dispositions={dispositions}
            emailTemplates={emailTemplates}
            faxTemplates={faxTemplates}
            pdfTemplates={pdfTemplates}
          />
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

        {activeTab === "emailTemplates" && (
          <EmailTemplatesSection templates={emailTemplates} onAdd={() => setShowAddEmailTemplate(true)} onDelete={(id) => setEmailTemplates((prev) => prev.filter((t) => t.id !== id))} />
        )}

        {activeTab === "faxTemplates" && (
          <FaxTemplatesSection templates={faxTemplates} onAdd={() => setShowAddFaxTemplate(true)} onDelete={(id) => setFaxTemplates((prev) => prev.filter((t) => t.id !== id))} />
        )}

        {activeTab === "pdfTemplates" && (
          <PdfTemplatesSection
            templates={pdfTemplates}
            onAdd={() => setShowAddPdfTemplate(true)}
            onDelete={(id) => setPdfTemplates((prev) => prev.filter((t) => t.id !== id))}
          />
        )}

        {activeTab === "documents" && <DocumentsSection documents={documents} />}

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
          <DispositionForm
            mode="add"
            selectedQueueName={selectedQueue?.name || ""}
            onCancel={() => setShowAddDisposition(false)}
            onSave={(payload) => {
              const maxCode = dispositions.reduce((max, d) => Math.max(max, d.code), 0);
              const newRow: Disposition = { id: uid(), code: maxCode + 1, ...payload };
              setDispositions((prev) => [newRow, ...prev]);

              setAuditLogs((prev) => [{
                id: uid(), createdAt: nowIso(), accountType: selectedAccountType,
                workflowId: "SYSTEM", workflowName: "Disposition CRUD", workflowVersion: 0,
                entityId: newRow.id, triggerType: "RULE_ENGINE",
                chosenPath: null, executedActions: [],
                finalStatus: "Created", assignedTo: "",
                notes: `Disposition "${newRow.name}" created in queue "${newRow.queue}" with ${newRow.results.length} result(s).`,
              }, ...prev]);

              setShowAddDisposition(false);
            }}
          />
        </Modal>

        <Modal title="Edit Disposition" open={showEditDisposition} onClose={closeEditDisposition}>
          {editingDisposition ? (
            <DispositionForm
              mode="edit"
              selectedQueueName={editingDisposition.queue}
              initialDisposition={editingDisposition}
              onCancel={closeEditDisposition}
              onSave={(payload) => {
                const disp = editingDisposition;
                if (!disp) return;

                const results = payload.results ?? [];

                // 1) Update Disposition list
                setDispositions((prev) =>
                  prev.map((d) => (d.id === disp.id ? { ...d, ...payload, results } : d))
                );

                // 2) ✅ Sync builder draft so results appear Trigger(left) -> Results(right) stacked (Visio-style)
                //    (Requires: syncDispositionResultsIntoDraft helper already added in the same file)
                setDispWorkflowByDispositionId((prev) => {
                  const wf = prev[disp.id];
                  if (!wf) return prev;

                  const t = nowIso();
                  const nextDraft = syncDispositionResultsIntoDraft(
                    wf.draft,
                    results,
                    payload.name || disp.name,
                    payload.queue || disp.queue
                  );

                  return {
                    ...prev,
                    [disp.id]: {
                      ...wf,
                      name: `Disposition: ${payload.name || disp.name}`,
                      description: `Queue: ${payload.queue || disp.queue} • Code: ${disp.code}`,
                      updatedAt: t,
                      draft: nextDraft,
                    },
                  };
                });

                // 3) Audit log
                setAuditLogs((prev) => [
                  {
                    id: uid(),
                    createdAt: nowIso(),
                    accountType: selectedAccountType,
                    workflowId: "SYSTEM",
                    workflowName: "Disposition CRUD",
                    workflowVersion: 0,
                    entityId: disp.id,
                    triggerType: "RULE_ENGINE",
                    chosenPath: null,
                    executedActions: [],
                    finalStatus: "Updated",
                    assignedTo: "",
                    notes: `Disposition "${payload.name}" updated. Results count: ${results.length}.`,
                  },
                  ...prev,
                ]);

                closeEditDisposition();
              }}
            />
          ) : (
            <div className="text-sm text-secondary">No disposition selected.</div>
          )}
        </Modal>

        <Modal title="Add Email Template" open={showAddEmailTemplate} onClose={() => setShowAddEmailTemplate(false)}>
          <AddEmailTemplateForm
            onCancel={() => setShowAddEmailTemplate(false)}
            onSave={(t) => { setEmailTemplates((prev) => [t, ...prev]); setShowAddEmailTemplate(false); }}
          />
        </Modal>

        <Modal title="Add PDF Template" open={showAddPdfTemplate} onClose={() => setShowAddPdfTemplate(false)}>
          <AddPdfTemplateForm
            onCancel={() => setShowAddPdfTemplate(false)}
            onSave={(t) => {
              setPdfTemplates((prev) => [t, ...prev]);
              setShowAddPdfTemplate(false);
            }}
          />
        </Modal>

        <Modal title="Add Fax Template" open={showAddFaxTemplate} onClose={() => setShowAddFaxTemplate(false)}>
          <AddFaxTemplateForm
            onCancel={() => setShowAddFaxTemplate(false)}
            onSave={(t) => { setFaxTemplates((prev) => [t, ...prev]); setShowAddFaxTemplate(false); }}
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
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
            className={`px-5 py-3 rounded-2xl font-bold inline-flex items-center gap-2 transition ${cfg.enabled ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-50 border border-gray-100 text-secondary hover:bg-gray-100"
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
 *  Email Templates Section
 *  ----------------------------- */
const EmailTemplatesSection: React.FC<{ templates: EmailTemplate[]; onAdd: () => void; onDelete: (id: string) => void }> = ({ templates, onAdd, onDelete }) => (
  <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileDown size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-primaryText">Email Templates</h2>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">{templates.length}</span>
      </div>
      <button onClick={onAdd} className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold hover:opacity-95 shadow-lg shadow-primary/20 transition text-sm inline-flex items-center gap-2">
        <Plus size={16} /> Add Template
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-left text-[10px] font-bold text-secondary uppercase tracking-wide">
          <th className="py-3 px-4">Name</th><th className="py-3 px-4">Subject</th><th className="py-3 px-4">Body (preview)</th><th className="py-3 px-4 w-20">Actions</th>
        </tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3 px-4 font-bold text-primaryText">{t.name}</td>
              <td className="py-3 px-4 text-secondary">{t.subject}</td>
              <td className="py-3 px-4 text-secondary truncate max-w-[200px]">{t.body}</td>
              <td className="py-3 px-4"><button onClick={() => onDelete(t.id)} className="p-2 rounded-xl hover:bg-red-50 text-secondary hover:text-red-500 transition"><Trash2 size={14} /></button></td>
            </tr>
          ))}
          {templates.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-secondary">No email templates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

/** -----------------------------
 *  Fax Templates Section
 *  ----------------------------- */
const FaxTemplatesSection: React.FC<{ templates: FaxTemplate[]; onAdd: () => void; onDelete: (id: string) => void }> = ({ templates, onAdd, onDelete }) => (
  <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileDown size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-primaryText">Fax Templates</h2>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">{templates.length}</span>
      </div>
      <button onClick={onAdd} className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold hover:opacity-95 shadow-lg shadow-primary/20 transition text-sm inline-flex items-center gap-2">
        <Plus size={16} /> Add Template
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-left text-[10px] font-bold text-secondary uppercase tracking-wide">
          <th className="py-3 px-4">Name</th><th className="py-3 px-4">Cover Sheet</th><th className="py-3 px-4 w-20">Actions</th>
        </tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3 px-4 font-bold text-primaryText">{t.name}</td>
              <td className="py-3 px-4 text-secondary">{t.coverSheet}</td>
              <td className="py-3 px-4"><button onClick={() => onDelete(t.id)} className="p-2 rounded-xl hover:bg-red-50 text-secondary hover:text-red-500 transition"><Trash2 size={14} /></button></td>
            </tr>
          ))}
          {templates.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-secondary">No fax templates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

/** -----------------------------
 *  Documents Section
 *  ----------------------------- */
const PdfTemplatesSection: React.FC<{ templates: { id: string; name: string; body: string }[]; onAdd: () => void; onDelete: (id: string) => void }> = ({ templates, onAdd, onDelete }) => (
  <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-primaryText">PDF Templates</h2>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">{templates.length}</span>
      </div>
      <button onClick={onAdd} className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold hover:opacity-95 shadow-lg shadow-primary/20 transition text-sm inline-flex items-center gap-2">
        <Plus size={16} /> Add Template
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-left text-[10px] font-bold text-secondary uppercase tracking-wide">
          <th className="py-3 px-4">Name</th><th className="py-3 px-4">Body (preview)</th><th className="py-3 px-4 w-20">Actions</th>
        </tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3 px-4 font-bold text-primaryText">{t.name}</td>
              <td className="py-3 px-4 text-secondary truncate max-w-[200px]">{t.body}</td>
              <td className="py-3 px-4"><button onClick={() => onDelete(t.id)} className="p-2 rounded-xl hover:bg-red-50 text-secondary hover:text-red-500 transition"><Trash2 size={14} /></button></td>
            </tr>
          ))}
          {templates.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-secondary">No PDF templates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const DocumentsSection: React.FC<{ documents: DocRecord[] }> = ({ documents }) => (
  <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4">
    <div className="flex items-center gap-2">
      <ClipboardList size={20} className="text-primary" />
      <h2 className="text-lg font-bold text-primaryText">Documents</h2>
      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">{documents.length}</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-left text-[10px] font-bold text-secondary uppercase tracking-wide">
          <th className="py-3 px-4">Name</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Created</th>
        </tr></thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3 px-4 font-bold text-primaryText">{d.name}</td>
              <td className="py-3 px-4 text-secondary"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold">{d.docType}</span></td>
              <td className="py-3 px-4 text-secondary">{d.createdAt}</td>
            </tr>
          ))}
          {documents.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-secondary">No documents yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

/** -----------------------------
 *  Add Email Template Form
 *  ----------------------------- */
const AddEmailTemplateForm: React.FC<{ onCancel: () => void; onSave: (t: EmailTemplate) => void }> = ({ onCancel, onSave }) => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Template Name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full" placeholder="Welcome Email" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Subject</p>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full" placeholder="Your eligibility has been verified" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Body</p>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full h-32" placeholder="Dear {{patient_name}},..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold transition">Cancel</button>
        <button onClick={() => { if (!name.trim()) return; onSave({ id: uid(), name, subject, body }); }} className="flex-1 px-4 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 transition">Save</button>
      </div>
    </div>
  );
};

/** -----------------------------
 *  Add Fax Template Form
 *  ----------------------------- */
const AddFaxTemplateForm: React.FC<{ onCancel: () => void; onSave: (t: FaxTemplate) => void }> = ({ onCancel, onSave }) => {
  const [name, setName] = useState("");
  const [coverSheet, setCoverSheet] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Template Name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full" placeholder="PA Fax Cover" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Cover Sheet Text</p>
        <textarea value={coverSheet} onChange={(e) => setCoverSheet(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full h-32" placeholder="CONFIDENTIAL: Prior Authorization request for..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold transition">Cancel</button>
        <button onClick={() => { if (!name.trim()) return; onSave({ id: uid(), name, coverSheet }); }} className="flex-1 px-4 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 transition">Save</button>
      </div>
    </div>
  );
};

const AddPdfTemplateForm: React.FC<{ onCancel: () => void; onSave: (t: { id: string; name: string; body: string }) => void }> = ({ onCancel, onSave }) => {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Template Name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full" placeholder="Insurance Verification Report" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">PDF Body / Content</p>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full h-32" placeholder="PDF template content or markup..." />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold transition">Cancel</button>
        <button onClick={() => { if (!name.trim()) return; onSave({ id: uid(), name, body }); }} className="flex-1 px-4 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 transition">Save</button>
      </div>
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
  dispositions: Disposition[];
  emailTemplates: EmailTemplate[];
  faxTemplates: FaxTemplate[];
  pdfTemplates: { id: string; name: string; body: string }[];
}> = ({ workflow, published, onDraftChange, onPublish, dispositions, emailTemplates, faxTemplates, pdfTemplates }) => {
  const rf = useRef<ReactFlowInstance | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const downloadPdf = async () => {
    const el = canvasRef.current;
    if (!el) return;
    setPdfExporting(true);
    try {
      // Capture the canvas as PNG
      const dataUrl = await toPng(el, {
        backgroundColor: "#ffffff",
        quality: 1,
        pixelRatio: 2,
      });

      // Create A4 landscape PDF
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(workflow?.name || "Workflow", 14, 16);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Exported: ${new Date().toLocaleString()}  •  Version: v${publishedVersion}`, 14, 23);

      // Draw separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, 26, pageW - 14, 26);

      // Embed canvas image below header
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const imgAspect = img.width / img.height;
      const availW = pageW - 28;
      const availH = pageH - 36;
      let drawW = availW;
      let drawH = drawW / imgAspect;
      if (drawH > availH) { drawH = availH; drawW = drawH * imgAspect; }

      pdf.addImage(dataUrl, "PNG", 14, 30, drawW, drawH);
      pdf.save(`${(workflow?.name || "workflow").replace(/[^a-zA-Z0-9]/g, "_")}_canvas.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfExporting(false);
    }
  };
  const [propertiesOpen, setPropertiesOpen] = useState(false);

const def = workflow?.draft ?? { nodes: [], edges: [] };
const publishedVersion = published?.version ?? 1;

const initialFlowNodes = useMemo(() => toFlowNodes(def), [def]);
const initialFlowEdges = useMemo(() => toFlowEdges(def), [def]);

const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

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

  const [saveFlash, setSaveFlash] = useState<string | null>(null);

  // IMPORTANT: when switching between workflows, reset the canvas state
  useEffect(() => {
    if (!workflow) return;
    const nextNodes = toFlowNodes(workflow.draft);
    const nextEdges = toFlowEdges(workflow.draft);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    // frame the diagram nicely (Visio-like "fit to page")
    window.requestAnimationFrame(() => {
      rf.current?.fitView({ padding: 0.22, duration: 250 });
    });
  }, [workflow.id, setEdges, setNodes]);

  const syncDraft = useCallback(
    (n: Node[], e: Edge[]) => {
      const nextDef = fromFlow(n, e, def);
      onDraftChange(nextDef);
    },
    [def, onDraftChange]
  );

  const saveNow = useCallback(() => {
    // ensures positions/edges are synced into draft model
    syncDraft(nodes, edges);
    setSaveFlash("Saved");
    window.setTimeout(() => setSaveFlash(null), 1200);
  }, [nodes, edges, syncDraft]);

  const autoLayout = useCallback(
    (direction: "LR" | "TB" = "LR") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      syncDraft(layoutedNodes, layoutedEdges);

      window.requestAnimationFrame(() => {
        rf.current?.fitView({ padding: 0.22, duration: 350 });
      });
    },
    [edges, nodes, setEdges, setNodes, syncDraft]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newId = uid();

      const srcNode = def.nodes.find((n) => n.id === params.source);
      let resultLabel: string | undefined = undefined;

      // If connection started from a result-specific handle
      if (params.sourceHandle?.startsWith("result:") && srcNode?.results?.length) {
        const idx = Number(params.sourceHandle.split(":")[1]);
        resultLabel = srcNode.results[idx];
      }

      const hubEdge: HubEdge = {
        id: newId,
        source: params.source || "",
        target: params.target || "",
        label: "Next",
        priority: 999,
        conditionGroup: null,
        resultLabel,
      };

      const newEdge: Edge = {
        id: newId,
        source: hubEdge.source,
        target: hubEdge.target,
        type: "hubEdge",
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#94A3B8" },
        data: {
          label: hubEdge.label,
          priority: hubEdge.priority,
          isElse: true,
          resultLabel: hubEdge.resultLabel,
        },
      };

      setEdges((prev) => addEdge(newEdge, prev));
      onDraftChange({ ...def, edges: [...def.edges, hubEdge] });
    },
    [def, onDraftChange, setEdges]
  );

  const selectedNode = useMemo(() => def.nodes.find((n) => n.id === selectedNodeId) || null, [def.nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => def.edges.find((e) => e.id === selectedEdgeId) || null, [def.edges, selectedEdgeId]);

  const enabledQueueNames = useMemo(() => {
    return Array.from(
      new Set(
        dispositions
          .filter((d) => d.enabled)
          .map((d) => d.queue)
          .filter((queue): queue is string => typeof queue === "string" && queue.trim().length > 0)
      )
    ).sort((a: string, b: string) => a.localeCompare(b));
  }, [dispositions]);

  const getEnabledDispositionsByQueue = useCallback(
    (queueName: string) => {
      return dispositions.filter(
        (d) => d.enabled && !!queueName && d.queue === queueName
      );
    },
    [dispositions]
  );
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

    const decisionErrors = validateDecisionNodes(d);
    if (decisionErrors.length > 0) return decisionErrors[0];

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
            : kind === "RESULTS"
              ? "Results: Outcomes"
              : "End";

    const newHubNode: HubNode = { id, kind, name, actions: [], results: [] };
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
    const defaults: Record<ActionType, () => WorkflowAction> = {
      SET_STATUS: () => ({
        id: uid(),
        type: "SET_STATUS",
        payload: { dispositionId: "" },
        ifGroup: null,
      }),
      AUTOFILL_FIELDS: () => ({
        id: uid(),
        type: "AUTOFILL_FIELDS",
        payload: { fields: [{ key: "copay", op: "IS" as const, value: "" }] },
        ifGroup: null,
      }),
      ASSIGN_USER: () => ({
        id: uid(),
        type: "ASSIGN_USER",
        payload: { mode: "ROLE", value: "" },
        ifGroup: null,
      }),
      SEND_EMAIL: () => ({
        id: uid(),
        type: "SEND_EMAIL",
        payload: { templateId: "", to: "qa" },
        ifGroup: null,
      }),
      SEND_FAX: () => ({
        id: uid(),
        type: "SEND_FAX",
        payload: { templateId: "", to: "" },
        ifGroup: null,
      }),
      EXPIRE: () => ({
        id: uid(),
        type: "EXPIRE",
        payload: {
          days: 30,
          queueName: "",
          dispositionId: "",
        },
        ifGroup: null,
      }),
      REQUEUE: () => ({
        id: uid(),
        type: "REQUEUE",
        payload: {
          delayHours: 1,
          delayMinutes: 0,
          hiddenFromQueue: false,
          queueName: "",
          dispositionId: "",
        },
        ifGroup: null,
      }),
      API_CALL: () => ({
        id: uid(),
        type: "API_CALL",
        payload: { method: "GET", url: "", headers: "", body: "" },
        ifGroup: null,
      }),
      GENERATE_PDF: () => ({
        id: uid(),
        type: "GENERATE_PDF",
        payload: { templateName: "", saveToDocuments: true },
        ifGroup: null,
      }),
      REQUEUE_LIMIT_CHECK: () => ({
        id: uid(),
        type: "REQUEUE_LIMIT_CHECK",
        payload: {
          maxCount: 3,
          queueName: "",
          dispositionId: "",
        },
        ifGroup: null,
      }),
      AUTO_CREATE_EV_ACCOUNT: () => ({
        id: uid(),
        type: "AUTO_CREATE_EV_ACCOUNT",
        payload: {},
        ifGroup: null,
      }),
      AUTO_CREATE_PA_ACCOUNT: () => ({
        id: uid(),
        type: "AUTO_CREATE_PA_ACCOUNT",
        payload: {},
        ifGroup: null,
      }),
    };

    const action = defaults[type]();

    onDraftChange({
      ...def,
      nodes: def.nodes.map((n) =>
        n.id === nodeId ? { ...n, actions: [action, ...n.actions] } : n
      ),
    });

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...(n.data as any),
                actions: [action, ...(((n.data as any)?.actions || []) as any[])],
              },
            }
          : n
      )
    );
  };

  const removeActionFromNode = (nodeId: string, actionId: string) => {
    const node = def.nodes.find((n) => n.id === nodeId);
    const nextActions = (node?.actions || []).filter((a) => a.id !== actionId);

    const nextNodes = def.nodes.map((n) => (n.id === nodeId ? { ...n, actions: nextActions } : n));
    onDraftChange({ ...def, nodes: nextNodes });

    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as any), actions: nextActions } } : n))
    );
  };

  const updateAction = (nodeId: string, action: WorkflowAction) => {
    const node = def.nodes.find((n) => n.id === nodeId);
    const nextActions = (node?.actions || []).map((a) => (a.id === action.id ? action : a));

    const nextNodes = def.nodes.map((n) => (n.id === nodeId ? { ...n, actions: nextActions } : n));
    onDraftChange({ ...def, nodes: nextNodes });

    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data as any), actions: nextActions } } : n))
    );
  };

  const updateEdgeMeta = (edgeId: string, patch: Partial<HubEdge>) => {
    onDraftChange({ ...def, edges: def.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)) });

    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== edgeId) return e;

        const prevData: any = e.data || {};
        const nextData: any = { ...prevData };

        if (patch.label !== undefined) nextData.label = patch.label;
        if (patch.priority !== undefined) nextData.priority = patch.priority;
        if (patch.resultLabel !== undefined) nextData.resultLabel = patch.resultLabel ?? "";

        // Only recompute isElse when conditionGroup is explicitly updated (including null)
        if (patch.conditionGroup !== undefined) {
          nextData.isElse = !patch.conditionGroup || (patch.conditionGroup.items?.length ?? 0) === 0;
        }

        return { ...e, data: nextData };
      })
    );
  };

  const getOutgoingEdgesForNode = useCallback(
    (nodeId: string) => {
      return def.edges
        .filter((e) => e.source === nodeId)
        .slice()
        .sort((a, b) => a.priority - b.priority);
    },
    [def.edges]
  );

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
    <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4">
      {/* Info Banner */}
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
        <Info size={18} className="text-primary shrink-0" />
        <p className="text-sm font-bold text-primary">Note: All results must be mapped.</p>
      </div>

      {/* Empty state when no result nodes */}
      {def.nodes.length <= 1 && def.nodes.every((n) => n.kind === "TRIGGER") && (
        <div className="flex flex-col items-center justify-center border border-gray-100 rounded-[24px] bg-gray-50 py-20 space-y-3">
          <BadgeCheck size={40} className="text-gray-300" />
          <p className="text-sm font-bold text-secondary">No results added yet.</p>
          <p className="text-xs text-secondary">Add results from the Disposition settings.</p>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primaryText">Builder (Visual Canvas)</h2>
          <p className="text-secondary text-sm font-medium">
            Editing Draft: <span className="font-bold text-primaryText">{workflow.name}</span>{" "}
            <span className="text-xs text-secondary">(Published v{publishedVersion})</span>
          </p>
          <p className="text-xs text-secondary mt-1">Branch rules are on arrows: IF uses conditions; ELSE is default. IF evaluation uses priority (low first).</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={downloadPdf}
            disabled={pdfExporting}
            className="px-4 py-3 rounded-2xl font-bold inline-flex items-center gap-2 transition bg-white border border-gray-100 text-secondary hover:bg-gray-100 disabled:opacity-50"
            title="Download canvas as PDF"
          >
            <FileDown size={18} /> {pdfExporting ? "Exporting…" : "Download PDF"}
          </button>
          <button
            onClick={() => { if (validationError) return; onPublish(); }}
            disabled={!!validationError}
            className={`px-5 py-3 rounded-2xl font-bold inline-flex items-center gap-2 transition shrink-0 ${validationError ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-100 text-secondary hover:bg-gray-100"}`}
            title={validationError || "Publish draft as a new version"}
          >
            <UploadCloud size={18} /> Publish New Version
          </button>
        </div>
      </div>

      {validationError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
          <span className="font-bold">Fix before publish:</span> {validationError}
        </div>
      )}

      {/* Horizontal Toolbar */}
      <div className="border border-gray-100 rounded-2xl bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-secondary uppercase tracking-wide mr-1">Blocks:</span>
        <button onClick={() => addNodeBlock("TRIGGER")} className="px-3 py-2 rounded-xl bg-primary text-white font-bold shadow-sm shadow-primary/20 hover:opacity-95 transition inline-flex items-center gap-1.5 text-xs">
          <Zap size={14} /> Trigger
        </button>
        <button onClick={() => addNodeBlock("ACTION")} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs">
          <WorkflowIcon size={14} className="text-primary" /> Action
        </button>
        <button onClick={() => addNodeBlock("DECISION")} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs">
          <GitBranch size={14} className="text-primary" /> Decision
        </button>
        <button onClick={() => addNodeBlock("RESULTS")} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs">
          <BadgeCheck size={14} className="text-primary" /> Results
        </button>
        <button onClick={() => addNodeBlock("END")} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs">
          <CheckCircle2 size={14} className="text-primary" /> End
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button onClick={duplicateSelectedNode} disabled={!selectedNode} title="Duplicate Node"
          className={`px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 transition text-xs ${selectedNode ? "bg-white border border-gray-200 text-secondary hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          <Copy size={14} /> Duplicate
        </button>
        <button onClick={removeSelected} disabled={!selectedNodeId && !selectedEdgeId} title="Delete Selected"
          className={`px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 transition text-xs ${selectedNodeId || selectedEdgeId ? "bg-white border border-gray-200 text-secondary hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          <Trash2 size={14} /> Delete
        </button>

        <div className="flex-1" />

        <button
          onClick={() => autoLayout("LR")}
          title="Auto arrange blocks (Visio-style)"
          className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs"
        >
          <Layers size={14} /> Auto Layout
        </button>

        <button
          onClick={() => rf.current?.fitView({ padding: 0.22, duration: 350 })}
          title="Fit diagram to screen"
          className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition inline-flex items-center gap-1.5 text-xs"
        >
          <RefreshCcw size={14} /> Fit
        </button>

        <button onClick={() => setPropertiesOpen((p) => !p)}
          className={`px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 transition text-xs ${propertiesOpen ? "bg-primary text-white shadow-sm shadow-primary/20" : "bg-white border border-gray-200 text-secondary hover:bg-gray-100"}`}>
          <Settings2 size={14} /> Properties
        </button>
      </div>

      {/* Full-width Canvas */}
      <div className="border border-gray-100 rounded-[24px] overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 text-xs font-bold text-secondary uppercase tracking-wide flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <GitBranch size={16} /> Canvas
          </div>
          <div className="text-[11px] text-secondary font-medium inline-flex items-center gap-2">
            <ArrowRight size={14} /> Connect nodes to create branches
          </div>
        </div>
        <div ref={canvasRef} style={{ height: "calc(100vh - 340px)", minHeight: "420px" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => (rf.current = instance)}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={() => setIsConnecting(true)}
            onConnectEnd={() => setIsConnecting(false)}
            nodesDraggable={!isConnecting}
            nodeDragThreshold={8}
            snapToGrid
            snapGrid={[24, 24]}
            connectionLineType={ConnectionLineType.SmoothStep}
            panOnScroll
            selectionOnDrag
            fitViewOptions={{ padding: 0.22 }}
            connectOnClick
            onSelectionChange={onSelectionChange}
            onNodeDoubleClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
              setPropertiesOpen(true);
            }}
            onNodeDragStop={onNodeDragStop}
            fitView
          >
            <Background gap={24} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* Properties Drawer (slide-in from right) */}
      {propertiesOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setPropertiesOpen(false)} />
          <div className="fixed top-0 right-0 h-full z-50 w-full max-w-[620px] bg-white border-l border-gray-200 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wide">
                <Settings2 size={16} /> Properties
                {saveFlash && (
                  <span className="ml-2 text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                    {saveFlash}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveNow}
                  className="px-3 py-2 rounded-xl bg-primary text-white font-bold hover:opacity-95 transition text-xs inline-flex items-center gap-2 shadow-sm shadow-primary/20"
                  title="Save draft"
                >
                  <Save size={14} /> Save
                </button>
                <button
                  onClick={() => setPropertiesOpen(false)}
                  className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                >
                  ✕ Close
                </button>
              </div>
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

                    {(selectedNode.kind === "ACTION" || selectedNode.kind === "RESULTS") && (
                      <div className="pt-2 border-t border-gray-100 space-y-4">
                        {/* ─── Results CRUD ─── */}
                        <div>
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-2">Results (Outcomes)</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(selectedNode.results || []).map((r: string, ri: number) => (
                              <span key={ri} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {r}
                                <button onClick={() => {
                                  const nr = (selectedNode.results || []).filter((_: string, i: number) => i !== ri);
                                  onDraftChange({ ...def, nodes: def.nodes.map((n) => n.id === selectedNode.id ? { ...n, results: nr } : n) });
                                  setNodes((prev) => prev.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as any), results: nr } } : n));
                                }} className="hover:text-red-500 ml-0.5">✕</button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input id="__newResult" className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-primaryText outline-none" placeholder="e.g. Approved, Denied..." />
                            <button onClick={() => {
                              const inp = document.getElementById("__newResult") as HTMLInputElement;
                              const v = inp?.value?.trim();
                              if (!v) return;
                              const nr = [...(selectedNode.results || []), v];
                              onDraftChange({ ...def, nodes: def.nodes.map((n) => n.id === selectedNode.id ? { ...n, results: nr } : n) });
                              setNodes((prev) => prev.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as any), results: nr } } : n));
                              inp.value = "";
                            }} className="px-3 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-xs">+ Add</button>
                          </div>
                        </div>

                        {/* ─── Result Mapping (RESULTS nodes only) ─── */}
                        {selectedNode.kind === "RESULTS" && (
                          <div className="border-t border-gray-100 pt-3 space-y-3">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-2">Map Result → Next Step</p>
                            <p className="text-[11px] text-secondary mb-2">Where should this result lead?</p>
                            <select
                              value={
                                (selectedNode as any)._resultMapping?.nextType === "end" ? "__END__"
                                  : (selectedNode as any)._resultMapping?.nextType === "disposition" ? ((selectedNode as any)._resultMapping?.nextDispositionId || "")
                                    : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const nextType = val === "__END__" ? "end" as const : val ? "disposition" as const : "none" as const;
                                const nextDispositionId = nextType === "disposition" ? val : "";
                                const updatedMapping: ResultMapping = {
                                  ...((selectedNode as any)._resultMapping || { id: uid(), label: selectedNode.results?.[0] || "", status: "active" }),
                                  nextType,
                                  nextDispositionId,
                                };
                                onDraftChange({
                                  ...def,
                                  nodes: def.nodes.map((n) =>
                                    n.id === selectedNode.id ? { ...n, _resultMapping: updatedMapping } as any : n
                                  ),
                                });
                                setNodes((prev) =>
                                  prev.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as any), _resultMapping: updatedMapping } } : n)
                                );
                              }}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
                            >
                              <option value="">⚠ Not Mapped</option>
                              <option value="__END__">✅ End (Flow Stops)</option>
                              {dispositions.map((d) => (
                                <option key={d.id} value={d.id}>→ {d.name} ({d.queue})</option>
                              ))}
                            </select>
                            {(selectedNode as any)._resultMapping?.nextType === "disposition" && (selectedNode as any)._resultMapping?.nextDispositionId && (
                              <div className="text-[11px] text-blue-600 font-bold bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                → Mapped to: {dispositions.find((d) => d.id === (selectedNode as any)._resultMapping?.nextDispositionId)?.name || "Unknown"}
                              </div>
                            )}

                            {/* ─── IF/ELSE Conditions for this result ─── */}
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">IF / ELSE Conditions</p>
                              <p className="text-[11px] text-secondary mb-2">Add conditions that must be met before proceeding to the next step. Empty = always proceed.</p>
                              <ConditionGroupEditor
                                title="Result Conditions"
                                group={(selectedNode as any)._resultMapping?.conditions || makeEmptyGroup()}
                                onChange={(g) => {
                                  const updatedMapping: ResultMapping = {
                                    ...((selectedNode as any)._resultMapping || { id: uid(), label: selectedNode.results?.[0] || "", status: "active", nextType: "none", nextDispositionId: "" }),
                                    conditions: g,
                                  };
                                  onDraftChange({
                                    ...def,
                                    nodes: def.nodes.map((n) =>
                                      n.id === selectedNode.id ? { ...n, _resultMapping: updatedMapping } as any : n
                                    ),
                                  });
                                  setNodes((prev) =>
                                    prev.map((n) => n.id === selectedNode.id ? { ...n, data: { ...(n.data as any), _resultMapping: updatedMapping } } : n)
                                  );
                                }}
                              />
                            </div>
                          </div>
                        )}


                        {selectedNode.kind === "ACTION" && (
                          /* ─── Actions list ─── */
                          <div>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-2">Actions</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {([
                                  ["SET_STATUS", "Disposition"],
                                  ["AUTOFILL_FIELDS", "Autofill"],
                                  ["ASSIGN_USER", "Assign"],
                                  ["SEND_EMAIL", "Email"],
                                  ["SEND_FAX", "Fax"],
                                  ["EXPIRE", "Expire"],
                                  ["REQUEUE", "Requeue"],
                                  ["API_CALL", "API Call"],
                                  ["GENERATE_PDF", "Gen PDF"],
                                  ["REQUEUE_LIMIT_CHECK", "Requeue Limit"],
                                  ["AUTO_CREATE_EV_ACCOUNT", "Auto EV"],
                                  ["AUTO_CREATE_PA_ACCOUNT", "Auto PA"],
                                ] as [ActionType, string][]).map(([type, label]) => (
                                <button key={type} onClick={() => addActionToNode(selectedNode.id, type)} className="px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]">
                                  + {label}
                                </button>
                              ))}
                            </div>

                            {selectedNode.actions.length === 0 ? (
                              <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">No actions yet.</div>
                            ) : (
                              <div className="space-y-3">
                                {selectedNode.actions.map((a) => (
                                  <div key={a.id} className="border border-gray-100 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs font-bold text-primaryText">{a.type.replace(/_/g, " ")}</div>
                                      <button onClick={() => removeActionFromNode(selectedNode.id, a.id)} className="px-2 py-1 rounded-xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>

                                    {/* ── SET_STATUS (Disposition selector) ── */}
                                    {a.type === "SET_STATUS" && (
                                      <div>
                                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Disposition</p>
                                        <select
                                          value={a.payload.dispositionId}
                                          onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { dispositionId: e.target.value } })}
                                          className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                        >
                                          <option value="">— Select Disposition —</option>
                                          {dispositions.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.queue})</option>
                                          ))}
                                        </select>
                                        {/* ── ACTION-LEVEL IF/THEN CONDITIONS ── */}
                                          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}

                                    {/* ── AUTOFILL_FIELDS ── */}
                                    {a.type === "AUTOFILL_FIELDS" && (
                                      <div className="space-y-3">
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                          <p className="text-xs font-bold text-blue-700">Autofill Fields</p>
                                          <p className="text-[11px] text-blue-700 mt-1">
                                            Configure which system fields should be auto-populated. Each row is one field rule.
                                          </p>
                                        </div>

                                        {a.payload.fields.length === 0 ? (
                                          <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                                            No autofill fields added yet.
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            {a.payload.fields.map((f, idx) => {
                                              const selectedField = SYSTEM_FIELDS.find((sf) => sf.key === f.key);

                                              return (
                                                <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <div>
                                                      <p className="text-xs font-bold text-primaryText">
                                                        {selectedField?.label || `Field Rule ${idx + 1}`}
                                                      </p>
                                                      <p className="text-[11px] text-secondary">
                                                        Choose field, operator, and value.
                                                      </p>
                                                    </div>

                                                    <button
                                                      onClick={() => {
                                                        const nextFields = a.payload.fields.filter((_, fieldIndex) => fieldIndex !== idx);
                                                        updateAction(selectedNode.id, {
                                                          ...a,
                                                          payload: { fields: nextFields },
                                                        });
                                                      }}
                                                      className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                    >
                                                      Remove
                                                    </button>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1.4fr] gap-3">
                                                    <div>
                                                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Field</p>
                                                      <select
                                                        value={f.key}
                                                        onChange={(e) => {
                                                          const nextFields = a.payload.fields.slice();
                                                          nextFields[idx] = { ...nextFields[idx], key: e.target.value };
                                                          updateAction(selectedNode.id, {
                                                            ...a,
                                                            payload: { fields: nextFields },
                                                          });
                                                        }}
                                                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                                      >
                                                        <option value="">— Select Field —</option>
                                                        {SYSTEM_FIELDS.map((sf) => (
                                                          <option key={sf.key} value={sf.key}>
                                                            {sf.label}
                                                          </option>
                                                        ))}
                                                      </select>
                                                    </div>

                                                    <div>
                                                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Operator</p>
                                                      <select
                                                        value={f.op}
                                                        onChange={(e) => {
                                                          const nextFields = a.payload.fields.slice();
                                                          nextFields[idx] = { ...nextFields[idx], op: e.target.value as "IS" | "IS_NOT" | "EXISTS" };
                                                          updateAction(selectedNode.id, {
                                                            ...a,
                                                            payload: { fields: nextFields },
                                                          });
                                                        }}
                                                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                                      >
                                                        <option value="IS">IS</option>
                                                        <option value="IS_NOT">IS NOT</option>
                                                        <option value="EXISTS">EXISTS</option>
                                                      </select>
                                                    </div>

                                                    <div>
                                                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Value</p>
                                                      <input
                                                        value={f.value}
                                                        onChange={(e) => {
                                                          const nextFields = a.payload.fields.slice();
                                                          nextFields[idx] = { ...nextFields[idx], value: e.target.value };
                                                          updateAction(selectedNode.id, {
                                                            ...a,
                                                            payload: { fields: nextFields },
                                                          });
                                                        }}
                                                        disabled={f.op === "EXISTS"}
                                                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full disabled:bg-gray-100 disabled:text-gray-400"
                                                        placeholder={f.op === "EXISTS" ? "No value needed" : "Enter value"}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        <div className="flex gap-2">
                                          <button
                                            onClick={() =>
                                              updateAction(selectedNode.id, {
                                                ...a,
                                                payload: {
                                                  fields: [...a.payload.fields, { key: "", op: "IS" as const, value: "" }],
                                                },
                                              })
                                            }
                                            className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-xs"
                                          >
                                            + Add Field
                                          </button>
                                        </div>

                                        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                              IF / THEN (Action Conditions)
                                            </p>

                                            {a.ifGroup ? (
                                              <button
                                                onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                title="Remove conditions (always run)"
                                              >
                                                Remove
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                title="Add conditions (run only if matched)"
                                              >
                                                + Add IF
                                              </button>
                                            )}
                                          </div>

                                          {!a.ifGroup ? (
                                            <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                              No conditions — this action will always run.
                                            </div>
                                          ) : (
                                            <ConditionGroupEditor
                                              title="Run this action only if…"
                                              group={a.ifGroup}
                                              onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* ── ASSIGN_USER ── */}
                                    {a.type === "ASSIGN_USER" && (
                                      <div className="grid grid-cols-1 gap-2">
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Target Type</p>
                                          <select value={a.payload.mode} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, mode: e.target.value as any, value: "" } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                            <option value="ROLE">Role</option>
                                            <option value="DEPARTMENT">Department</option>
                                            <option value="PERSON">Person</option>
                                          </select>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">{a.payload.mode === "ROLE" ? "Role" : a.payload.mode === "DEPARTMENT" ? "Department" : "Person"}</p>
                                          <select value={a.payload.value} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, value: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                            <option value="">— Select —</option>
                                            {(a.payload.mode === "ROLE" ? ROLE_OPTIONS : a.payload.mode === "DEPARTMENT" ? DEPARTMENT_OPTIONS : PERSON_OPTIONS).map((o) => <option key={o} value={o}>{o}</option>)}
                                          </select>
                                        </div>
                                                                                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}

                                    {/* ── SEND_EMAIL ── */}
                                    {a.type === "SEND_EMAIL" && (
                                      <div className="grid grid-cols-1 gap-2">
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">To</p>
                                          <select value={a.payload.to} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, to: e.target.value as any } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                            <option value="clinic">Clinic</option>
                                            <option value="agent">Agent</option>
                                            <option value="qa">QA</option>
                                          </select>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Email Template</p>
                                          <select value={a.payload.templateId} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, templateId: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                            <option value="">— Select Template —</option>
                                            {emailTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                          </select>
                                        </div>
                                                                                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}

                                    {/* ── SEND_FAX ── */}
                                    {a.type === "SEND_FAX" && (
                                      <div className="grid grid-cols-1 gap-2">
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Fax Template</p>
                                          <select value={a.payload.templateId} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, templateId: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                            <option value="">— Select Template —</option>
                                            {faxTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">To (Fax Number)</p>
                                          <input value={a.payload.to} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, to: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full" placeholder="555-123-4567" />
                                        </div>
                                                                                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}

                                    {/* ── EXPIRE ── */}
                                    {a.type === "EXPIRE" && (() => {
                                      const filteredDispositionOptions = getEnabledDispositionsByQueue(a.payload.queueName ?? "");

                                      return (
                                        <div className="space-y-3">
                                          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                                            <p className="text-xs font-bold text-orange-700">Expire Flow</p>
                                            <p className="text-[11px] text-orange-700 mt-1">
                                              Set expiry days, then choose the queue and disposition where the expired item should go.
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Expire After (Days)</p>
                                            <input
                                              type="number"
                                              min={1}
                                              value={a.payload.days}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    days: Number(e.target.value) || 1,
                                                  },
                                                })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                            />
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Queue</p>
                                            <select
                                              value={a.payload.queueName ?? ""}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    queueName: e.target.value,
                                                    dispositionId: "",
                                                  },
                                                })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                            >
                                              <option value="">— Select Queue —</option>
                                              {enabledQueueNames.map((queueName) => (
                                                <option key={queueName} value={queueName}>
                                                  {queueName}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Disposition</p>
                                            <select
                                              value={a.payload.dispositionId ?? ""}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    dispositionId: e.target.value,
                                                  },
                                                })
                                              }
                                              disabled={!(a.payload.queueName ?? "")}
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full disabled:bg-gray-100 disabled:text-gray-400"
                                            >
                                              <option value="">
                                                {a.payload.queueName ? "— Select Disposition —" : "Select Queue First"}
                                              </option>
                                              {filteredDispositionOptions.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                  {d.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* ── REQUEUE ── */}
                                    {a.type === "REQUEUE" && (() => {
                                      const enabledQueues = Array.from(
                                        new Set(
                                          dispositions
                                            .filter((d) => d.enabled)
                                            .map((d) => d.queue)
                                            .filter((queue): queue is string => typeof queue === "string" && queue.trim().length > 0)
                                        )
                                      ).sort((x: string, y: string) => x.localeCompare(y));

                                      const filteredDispositionOptions = dispositions.filter(
                                        (d) => d.enabled && (!!(a.payload.queueName ?? "") ? d.queue === a.payload.queueName : false)
                                      );

                                      return (
                                        <div className="space-y-3">
                                          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                            <p className="text-xs font-bold text-blue-700">Requeue Flow</p>
                                            <p className="text-[11px] text-blue-700 mt-1">
                                              First select a queue, then select a disposition from that queue.
                                            </p>
                                          </div>

                                          <div className="grid grid-cols-1 gap-3">
                                            <div>
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Queue</p>
                                              <select
                                                value={a.payload.queueName ?? ""}
                                                onChange={(e) =>
                                                  updateAction(selectedNode.id, {
                                                    ...a,
                                                    payload: {
                                                      ...a.payload,
                                                      queueName: e.target.value,
                                                      dispositionId: "",
                                                    },
                                                  })
                                                }
                                                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                              >
                                                <option value="">— Select Queue —</option>
                                                {enabledQueues.map((queueName) => (
                                                  <option key={queueName} value={queueName}>
                                                    {queueName}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>

                                            <div>
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Disposition</p>
                                              <select
                                                value={a.payload.dispositionId ?? ""}
                                                onChange={(e) =>
                                                  updateAction(selectedNode.id, {
                                                    ...a,
                                                    payload: {
                                                      ...a.payload,
                                                      dispositionId: e.target.value,
                                                    },
                                                  })
                                                }
                                                disabled={!(a.payload.queueName ?? "")}
                                                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full disabled:bg-gray-100 disabled:text-gray-400"
                                              >
                                                <option value="">
                                                  {a.payload.queueName ? "— Select Disposition —" : "Select Queue First"}
                                                </option>
                                                {filteredDispositionOptions.map((d) => (
                                                  <option key={d.id} value={d.id}>
                                                    {d.name}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Hours</p>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={a.payload.delayHours}
                                                  onChange={(e) =>
                                                    updateAction(selectedNode.id, {
                                                      ...a,
                                                      payload: { ...a.payload, delayHours: Number(e.target.value) || 0 },
                                                    })
                                                  }
                                                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                                />
                                              </div>

                                              <div>
                                                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Minutes</p>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={59}
                                                  value={a.payload.delayMinutes}
                                                  onChange={(e) =>
                                                    updateAction(selectedNode.id, {
                                                      ...a,
                                                      payload: { ...a.payload, delayMinutes: Number(e.target.value) || 0 },
                                                    })
                                                  }
                                                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                                />
                                              </div>
                                            </div>

                                            <label className="flex items-center gap-2 text-xs text-primaryText cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={a.payload.hiddenFromQueue}
                                                onChange={(e) =>
                                                  updateAction(selectedNode.id, {
                                                    ...a,
                                                    payload: { ...a.payload, hiddenFromQueue: e.target.checked },
                                                  })
                                                }
                                                className="rounded"
                                              />
                                              Hidden from queue (visible to managers only)
                                            </label>
                                          </div>

                                          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* ── API_CALL ── */}
                                    {a.type === "API_CALL" && (
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Method</p>
                                            <select value={a.payload.method} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, method: e.target.value as any } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full">
                                              <option value="GET">GET</option>
                                              <option value="POST">POST</option>
                                              <option value="PUT">PUT</option>
                                              <option value="DELETE">DELETE</option>
                                            </select>
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">URL</p>
                                            <input value={a.payload.url} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, url: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full" placeholder="https://api.example.com" />
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Headers (JSON)</p>
                                          <textarea value={a.payload.headers} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, headers: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none w-full h-16 font-mono" placeholder='{"Authorization": "Bearer ..."}' />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Body (JSON)</p>
                                          <textarea value={a.payload.body} onChange={(e) => updateAction(selectedNode.id, { ...a, payload: { ...a.payload, body: e.target.value } })} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none w-full h-16 font-mono" placeholder='{"key": "value"}' />
                                        </div>
                                                                                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}

                                    {/* ── GENERATE_PDF ── */}
                                    {a.type === "GENERATE_PDF" && (
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">PDF Template</p>

                                          {pdfTemplates.length > 0 ? (
                                            <select
                                              value={a.payload.templateName}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, { ...a, payload: { ...a.payload, templateName: e.target.value } })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                            >
                                              <option value="">— Select Template —</option>
                                              {pdfTemplates.map((t) => (
                                                <option key={t.id} value={t.name}>
                                                  {t.name}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                              No PDF templates yet. Add one in the <span className="font-bold text-primaryText">PDF Templates</span> tab.
                                            </div>
                                          )}
                                        </div>

                                        {/* Allow custom name if needed */}
                                        {(!pdfTemplates.length || !pdfTemplates.some((t) => t.name === a.payload.templateName)) && (
                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Template Name (custom)</p>
                                            <input
                                              value={a.payload.templateName}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, { ...a, payload: { ...a.payload, templateName: e.target.value } })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                              placeholder="EV Summary Report"
                                            />
                                          </div>
                                        )}

                                        <label className="flex items-center gap-2 text-xs text-primaryText cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={a.payload.saveToDocuments}
                                            onChange={(e) =>
                                              updateAction(selectedNode.id, { ...a, payload: { ...a.payload, saveToDocuments: e.target.checked } })
                                            }
                                            className="rounded"
                                          />
                                          Save to Documents
                                        </label>
                                      </div>
                                    )}

                                    {/* ── REQUEUE_LIMIT_CHECK ── */}
                                    {a.type === "REQUEUE_LIMIT_CHECK" && (() => {
                                      const filteredDispositionOptions = getEnabledDispositionsByQueue(a.payload.queueName ?? "");

                                      return (
                                        <div className="space-y-3">
                                          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                            <p className="text-xs font-bold text-blue-700">Requeue Limit Flow</p>
                                            <p className="text-[11px] text-blue-700 mt-1">
                                              When requeue count reaches the limit, select the queue and disposition where the item should move.
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">If requeueCount ≥</p>
                                            <input
                                              type="number"
                                              min={1}
                                              value={a.payload.maxCount}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    maxCount: Number(e.target.value) || 1,
                                                  },
                                                })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                            />
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Queue</p>
                                            <select
                                              value={a.payload.queueName ?? ""}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    queueName: e.target.value,
                                                    dispositionId: "",
                                                  },
                                                })
                                              }
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full"
                                            >
                                              <option value="">— Select Queue —</option>
                                              {enabledQueueNames.map((queueName) => (
                                                <option key={queueName} value={queueName}>
                                                  {queueName}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Disposition</p>
                                            <select
                                              value={a.payload.dispositionId ?? ""}
                                              onChange={(e) =>
                                                updateAction(selectedNode.id, {
                                                  ...a,
                                                  payload: {
                                                    ...a.payload,
                                                    dispositionId: e.target.value,
                                                  },
                                                })
                                              }
                                              disabled={!(a.payload.queueName ?? "")}
                                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm outline-none w-full disabled:bg-gray-100 disabled:text-gray-400"
                                            >
                                              <option value="">
                                                {a.payload.queueName ? "— Select Disposition —" : "Select Queue First"}
                                              </option>
                                              {filteredDispositionOptions.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                  {d.name}
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {(a.type === "AUTO_CREATE_EV_ACCOUNT" || a.type === "AUTO_CREATE_PA_ACCOUNT") && (
                                      <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                        No configuration required. This action will trigger the backend automation for {a.type === "AUTO_CREATE_EV_ACCOUNT" ? "EV" : "PA"}.
                                                                                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                                                IF / THEN (Action Conditions)
                                              </p>

                                              {a.ifGroup ? (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: null })}
                                                  className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-[10px]"
                                                  title="Remove conditions (always run)"
                                                >
                                                  Remove
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => updateAction(selectedNode.id, { ...a, ifGroup: makeEmptyGroup() })}
                                                  className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition text-[10px]"
                                                  title="Add conditions (run only if matched)"
                                                >
                                                  + Add IF
                                                </button>
                                              )}
                                            </div>

                                            {!a.ifGroup ? (
                                              <div className="text-[11px] text-secondary border border-gray-100 rounded-xl p-3 bg-gray-50">
                                                No conditions — this action will always run.
                                              </div>
                                            ) : (
                                              <ConditionGroupEditor
                                                title="Run this action only if…"
                                                group={a.ifGroup}
                                                onChange={(g) => updateAction(selectedNode.id, { ...a, ifGroup: g })}
                                              />
                                            )}
                                          </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedNode.kind === "DECISION" && (() => {
                      const outgoingEdges = getOutgoingEdgesForNode(selectedNode.id);

                      return (
                        <div className="space-y-4">
                          <div className="text-[11px] text-secondary border border-blue-100 rounded-2xl p-4 bg-blue-50 space-y-2">
                            <p className="font-bold text-blue-700">Decision Block Setup</p>
                            <p className="text-blue-700">
                              Configure the decision branches directly here. This makes IF / ELSE usable without selecting arrows one by one.
                            </p>
                          </div>

                          {outgoingEdges.length === 0 ? (
                            <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                              No outgoing branches yet. Connect this decision node to other nodes first.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {outgoingEdges.map((edge) => (
                                <div key={edge.id} className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold text-primaryText">Branch</div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-secondary">
                                      Priority {edge.priority}
                                    </span>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Label</p>
                                    <input
                                      value={edge.label || ""}
                                      onChange={(e) => updateEdgeMeta(edge.id, { label: e.target.value })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                      placeholder="IF Eligible / ELSE"
                                    />
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Priority</p>
                                    <input
                                      type="number"
                                      min={1}
                                      value={edge.priority}
                                      onChange={(e) => updateEdgeMeta(edge.id, { priority: Number(e.target.value) || 1 })}
                                      className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedEdgeId(edge.id);
                                        setSelectedNodeId(null);
                                        const next = def.edges.map((e) =>
                                          e.id === edge.id
                                            ? {
                                                ...e,
                                                label: e.label?.startsWith("ELSE") ? "IF" : e.label || "IF",
                                                priority: Math.max(1, e.priority || 1),
                                                conditionGroup: e.conditionGroup && e.conditionGroup.items.length ? e.conditionGroup : makeEmptyGroup(),
                                              }
                                            : e
                                        );
                                        onDraftChange({ ...def, edges: next });
                                        setEdges((prev) =>
                                          prev.map((e) =>
                                            e.id === edge.id
                                              ? { ...e, data: { ...(e.data as any), isElse: false, label: "IF", priority: (e.data as any)?.priority ?? 1 } }
                                              : e
                                          )
                                        );
                                      }}
                                      className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                                    >
                                      Set as IF
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedEdgeId(edge.id);
                                        setSelectedNodeId(null);
                                        const next = def.edges.map((e) =>
                                          e.id === edge.id
                                            ? { ...e, label: "ELSE", priority: 999, conditionGroup: null }
                                            : e
                                        );
                                        onDraftChange({ ...def, edges: next });
                                        setEdges((prev) =>
                                          prev.map((e) =>
                                            e.id === edge.id
                                              ? { ...e, data: { ...(e.data as any), isElse: true, label: "ELSE", priority: 999 } }
                                              : e
                                          )
                                        );
                                      }}
                                      className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                                    >
                                      Set as ELSE
                                    </button>
                                  </div>

                                  {!edge.conditionGroup ? (
                                    <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50">
                                      This branch is <span className="font-bold text-primaryText">ELSE</span>. No conditions required.
                                    </div>
                                  ) : (
                                    <ConditionGroupEditor
                                      title="IF Conditions"
                                      group={edge.conditionGroup}
                                      onChange={(g) => updateEdgeMeta(edge.id, { conditionGroup: g })}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

                      {/* Result selector for this edge */}
                      <div>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Result (from source node)</p>
                        {(() => {
                          const srcNode = def.nodes.find((n) => n.id === selectedEdge.source);
                          const srcResults = srcNode?.results || [];
                          return (
                            <select
                              value={selectedEdge.resultLabel || ""}
                              onChange={(e) => updateEdgeMeta(selectedEdge.id, { resultLabel: e.target.value || undefined } as any)}
                              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none w-full"
                            >
                              <option value="">Default / Else</option>
                              {srcResults.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          );
                        })()}
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
                      <span className="font-bold text-primaryText">Flow:</span> Actions chain automatically — each node fires in sequence until the process reaches an END node.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
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
                  className={`grid grid-cols-12 gap-2 px-6 py-4 items-center transition cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  onClick={() => onSelectQueue(q.id)}
                  title="Click to open dispositions"
                >
                  <div className="col-span-7">
                    <div className="text-sm font-bold text-primaryText">{q.name}</div>
                    <div className="text-[11px] text-secondary mt-1">Click row → open dispositions</div>
                  </div>

                  <div className="col-span-3 text-sm text-secondary font-medium">
                    {q.enabled ? "Active" : "Inactive"}
                    {selected ? " • Selected" : ""}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleEnabled(q.id);
                      }}
                      className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                      title="Toggle status"
                    >
                      {q.enabled ? (
                        <span className="inline-flex items-center gap-2">
                          <ToggleLeft size={16} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <ToggleRight size={16} className="text-primary" /> Inactive
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
        <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Status</p>
        <select value={enabled ? "active" : "inactive"} onChange={(e) => setEnabled(e.target.value === "active")} className="bg-transparent outline-none w-full text-sm text-primaryText">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition">
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ name: name.trim(), enabled })}
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${canSave ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
  onEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRowClick: (id: string) => void;
}> = ({ dispositions, queueOptions, queueValue, onQueueChange, searchValue, onSearchChange, onAdd, onEdit, onToggleEnabled, onRowClick }) => {
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
          <div className="col-span-5">Disposition</div>
          <div className="col-span-3">Queue</div>
          <div className="col-span-2">Outcome Tag</div>
          <div className="col-span-2 text-right">Status</div>
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
                <div className="col-span-5">
                  <div className="text-sm font-bold text-primaryText">{d.name}</div>
                  <div className="text-[11px] text-secondary mt-1">Click row → open builder</div>
                </div>
                <div className="col-span-3 text-sm text-secondary font-medium">{d.queue}</div>
                <div className="col-span-2 text-sm text-secondary font-medium">{d.outcomeTag || "—"}</div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(d.id);
                    }}
                    className="px-3 py-2 rounded-2xl bg-white border border-gray-100 text-primaryText font-bold hover:bg-gray-50 transition text-xs inline-flex items-center gap-2"
                    title="Edit disposition"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(d.id);
                    }}
                    className="px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition text-xs"
                    title="Toggle status"
                  >
                    {d.enabled ? (
                      <span className="inline-flex items-center gap-2">
                        <ToggleLeft size={16} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <ToggleRight size={16} className="text-primary" /> Inactive
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
const DispositionForm: React.FC<{
  mode: "add" | "edit";
  selectedQueueName: string;
  initialDisposition?: Disposition | null;
  onCancel: () => void;
  onSave: (payload: Omit<Disposition, "id" | "code">) => void;
}> = ({ mode, selectedQueueName, initialDisposition = null, onCancel, onSave }) => {
  const [name, setName] = useState(initialDisposition?.name ?? "");
  const [enabled, setEnabled] = useState(initialDisposition?.enabled ?? true);
  const [outcomeTag, setOutcomeTag] = useState(initialDisposition?.outcomeTag ?? "—");
  const [results, setResults] = useState<ResultMapping[]>(
    () => (initialDisposition?.results?.length ? initialDisposition.results.map((r) => ({ ...r })) : [])
  );
  const [newResultName, setNewResultName] = useState("");

  // If user opens edit for another disposition without full remount
  useEffect(() => {
    if (mode === "edit" && initialDisposition) {
      setName(initialDisposition.name ?? "");
      setEnabled(!!initialDisposition.enabled);
      setOutcomeTag(initialDisposition.outcomeTag ?? "—");
      setResults(initialDisposition.results?.map((r) => ({ ...r })) ?? []);
      setNewResultName("");
    }
  }, [mode, initialDisposition?.id]);

  const outcomeTagOptions = ["—", "Missing/Invalid Info", "Data Entry", "Pending", "Auditing", "EV Uploaded To EHR", "Submitted"];
  const canSave = name.trim().length >= 3;

  const addResult = () => {
    const trimmed = newResultName.trim();
    if (!trimmed) return;

    const exists = results.some((r) => r.label.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    setResults((prev) => [
      ...prev,
      {
        id: uid(),
        label: trimmed,
        status: "active",
        nextType: "none",
        nextDispositionId: "",
      },
    ]);
    setNewResultName("");
  };

  const removeResult = (idx: number) => {
    setResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateResultLabel = (idx: number, label: string) => {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, label } : r)));
  };

  const updateResultStatus = (idx: number, status: "active" | "disabled") => {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, status } : r)));
  };

  // Drag ordering (handle-based)
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveResult = (from: number, to: number) => {
    setResults((prev) => {
      if (from === to) return prev;
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onHandleDragStart =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDragFromIndex(index);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", String(index));
      } catch {}
    };

  const onRowDragOver =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverIndex(index);
      e.dataTransfer.dropEffect = "move";
    };

  const onRowDrop =
    (toIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const from = dragFromIndex ?? Number(e.dataTransfer.getData("text/plain"));
      if (Number.isFinite(from) && from !== toIndex) {
        moveResult(from, toIndex);
      }
      setDragFromIndex(null);
      setDragOverIndex(null);
    };

  const onRowDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Read-only Queue */}
        <div className="lg:col-span-2 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Selected Queue</p>
          <p className="text-sm font-bold text-primary">{selectedQueueName || "—"}</p>
        </div>

        <div className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Status</p>
          <select
            value={enabled ? "active" : "inactive"}
            onChange={(e) => setEnabled(e.target.value === "active")}
            className="bg-transparent outline-none w-full text-sm text-primaryText"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Disposition Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent outline-none w-full text-sm text-primaryText placeholder:text-secondary"
            placeholder="e.g., Added to PI Worksheet"
          />
        </div>

        <div className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">Outcome Tag</p>
          <select
            value={outcomeTag}
            onChange={(e) => setOutcomeTag(e.target.value)}
            className="bg-transparent outline-none w-full text-sm text-primaryText"
          >
            {outcomeTagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results (Outcomes) Section */}
      <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-white">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-wide">Results (Outcomes)</p>
          <p className="text-[11px] text-secondary mt-0.5">
            Add, edit, and reorder the possible results/outcomes for this disposition.
          </p>
        </div>

        {/* Add result input */}
        <div className="flex items-center gap-2">
          <input
            value={newResultName}
            onChange={(e) => setNewResultName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addResult();
              }
            }}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none placeholder:text-secondary"
            placeholder="e.g., Approved, Denied, Pending Review"
          />
          <button
            type="button"
            onClick={addResult}
            disabled={!newResultName.trim()}
            className={`px-3 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition ${
              newResultName.trim()
                ? "bg-primary text-white shadow-sm shadow-primary/20 hover:opacity-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus size={14} /> Add Result
          </button>
        </div>

        {/* Result rows (editable + reorderable) */}
        {results.length === 0 ? (
          <div className="text-sm text-secondary border border-gray-100 rounded-2xl p-4 bg-gray-50 text-center">
            No results added yet. Click "+ Add Result" above.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {results.map((r, idx) => (
              <div
                key={r.id}
                onDragOver={onRowDragOver(idx)}
                onDrop={onRowDrop(idx)}
                onDragLeave={() => setDragOverIndex((prev) => (prev === idx ? null : prev))}
                className={`flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-3 bg-gray-50 ${
                  dragOverIndex === idx ? "ring-2 ring-primary/30" : ""
                }`}
                title="Drag handle to reorder"
              >
                {/* Drag handle */}
                <div
                  draggable
                  onDragStart={onHandleDragStart(idx)}
                  onDragEnd={onRowDragEnd}
                  className="p-2 rounded-lg hover:bg-gray-200 transition cursor-grab active:cursor-grabbing text-secondary"
                  title="Drag to reorder"
                >
                  <GripVertical size={16} />
                </div>

                {/* Editable label */}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Result</p>
                  <input
                    value={r.label}
                    onChange={(e) => updateResultLabel(idx, e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
                    placeholder="Result label"
                  />
                </div>

                {/* Status */}
                <div className="w-[140px]">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mb-1">Status</p>
                  <select
                    value={r.status}
                    onChange={(e) => updateResultStatus(idx, e.target.value as "active" | "disabled")}
                    className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm text-primaryText outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeResult(idx)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition text-secondary"
                  title="Remove result"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-secondary font-bold hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!canSave}
          onClick={() =>
            onSave({
              name: name.trim(),
              queue: selectedQueueName,
              enabled,
              outcomeTag: outcomeTag.trim() || "—",
              results: results.map((r) => ({
                ...r,
                label: r.label.trim(),
              })),
            })
          }
          className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${
            canSave
              ? "bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Save size={18} />
          {mode === "edit" ? "Update Disposition" : "Save Disposition"}
        </button>
      </div>
    </div>
  );
};
