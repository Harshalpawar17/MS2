
export enum UserRole {
  CLINIC_STAFF = 'Clinic Staff',
  CLINIC = 'Clinic',
  PATIENT = 'Patient',
  AGENT = 'Agent',
  MANAGEMENT = 'Management',
  ADMIN = 'Admin'
}

export type WorkflowType = 'Eligibility Verification' | 'Prior Authorization' | 'Personal Injury' | 'Upload Document';

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

export interface Submission {
  id: string;
  refNumber: string;
  patientName: string;
  carrier: string;
  dateSubmitted: string;
  status: 'Pending' | 'Completed' | 'Action Required';
  workflow: WorkflowType;
  clinicName?: string;
}

export interface Provider {
  id: string;
  fullName: string;
  taxonomy: string;
  npi: string;
}

export interface InsuranceCredential {
  company: string;
  providerNumber: string;
  groupNumber: string;
  portalUrl: string;
  username: string;
  password: string;
  networkStatus: 'In-Network' | 'Out-of-Network' | '';
}

export interface SystemAccess {
  name: string;
  username: string;
  password: string;
}

export interface Clinic {
  id: string;
  name: string;
  portfolio: string;
  pod: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  fax: string;
  npi: string;
  taxId: string;
  logo?: string;
  providers: Provider[];
  insuranceCredentials: InsuranceCredential[];
  systemAccess: SystemAccess[];
}

export interface Claim {
  claim_id: string;
  claim_type: 'WorkerComp' | 'PersonalInjury';
  patient_name: string;
  clinic_name: string;
  provider_name: string;
  insurer_or_third_party: string;
  policy_or_claim_number: string;
  date_of_injury: string;
  date_received: string;
  status: 'Open' | 'Pending Info' | 'Authorized' | 'Denied' | 'Closed';
  assigned_to: string;
  primary_contact: string;
  case_total: number;
  balance_remaining: number;
  created_at: string;
  last_updated_at: string;
  created_by: string;
  last_updated_by: string;
}

export type EVStatus = 'Pending' | 'Action Required' | 'Authorized' | 'Completed' | 'Denied' | 'Closed';

export interface EVRecord {
  unique_id: string;
  submitted_date: string;
  clinic_name: string;
  requested_back_date: string;
  insurance_name: string;
  insurance_order: number;
  ev_status: EVStatus;
  metadata: {
    created_by: string;
    created_at: string;
    last_updated_at: string;
    last_updated_by: string;
    notes: string;
    related_policy_ids: string[];
  };
}
