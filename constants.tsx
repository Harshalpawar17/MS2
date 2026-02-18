
import React from 'react';
import { UserRole, Submission, Claim, EVRecord } from './types';

export const MOCK_CREDENTIALS = [
  { email: 'clinicstaff@gmail.com', password: 'pass@123', role: UserRole.CLINIC_STAFF, name: 'Sarah Miller' },
  { email: 'client@gmail.com', password: 'pass@123', role: UserRole.CLINIC, name: 'Sage Clinic Admin' },
  { email: 'agent@gmail.com', password: 'pass@123', role: UserRole.AGENT, name: 'Agent Smith' },
  { email: 'management@gmail.com', password: 'pass@123', role: UserRole.MANAGEMENT, name: 'Director Jones' },
  { email: 'admin@gmail.com', password: 'pass@123', role: UserRole.ADMIN, name: 'System Admin' },
  { email: 'patient@gmail.com', password: 'pass@123', role: UserRole.PATIENT, name: 'John Doe' },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  { id: '1', refNumber: 'SAGE-82731', patientName: 'John Doe', carrier: 'BlueCross BlueShield', dateSubmitted: '05/12/2025', status: 'Pending', workflow: 'Eligibility Verification', clinicName: 'Sage Health RCM Main' },
  { id: '2', refNumber: 'SAGE-82732', patientName: 'Jane Smith', carrier: 'Aetna', dateSubmitted: '05/11/2025', status: 'Completed', workflow: 'Prior Authorization', clinicName: 'Elite Chiro One' },
  { id: '3', refNumber: 'SAGE-82733', patientName: 'Robert Wilson', carrier: 'UnitedHealthcare', dateSubmitted: '05/10/2025', status: 'Action Required', workflow: 'Personal Injury', clinicName: 'Sage Health RCM Main' },
  { id: '4', refNumber: 'SAGE-82734', patientName: 'Alice Brown', carrier: 'Medicare', dateSubmitted: '05/14/2025', status: 'Pending', workflow: 'Eligibility Verification', clinicName: 'Myodetox Rehab Center' },
  { id: '5', refNumber: 'SAGE-82735', patientName: 'John Doe', carrier: 'UnitedHealthcare', dateSubmitted: '05/15/2025', status: 'Action Required', workflow: 'Personal Injury', clinicName: 'Sage Health RCM Main' },
];

export const CPT_CODES = [
  { category: 'Physical Therapy', codes: ['97110', '97140', '97112'] },
  { category: 'Diagnostic Imaging', codes: ['72141', '72148', '70551'] },
  { category: 'Office Visit', codes: ['99203', '99204', '99213', '99214'] },
];

export const CLINIC_PODS = ['Pod A', 'Pod B', 'Pod C', 'Pod D'];

export const PORTFOLIOS = [
  'Select All',
  'ChiroHD',
  'ChiroOne',
  'ChiroSpring',
  'Core – CoreTouch',
  'House – CoreTouch',
  'House – Others',
  'Myodetox',
  'Sage'
];

export const MOCK_CLAIMS: Claim[] = [
  {
    claim_id: 'PL-1001',
    claim_type: 'WorkerComp',
    patient_name: 'John Doe',
    clinic_name: 'Sage Health RCM Main',
    provider_name: 'Dr. Reagan Hyde',
    insurer_or_third_party: 'Liberty Mutual',
    policy_or_claim_number: 'WC-992831',
    date_of_injury: '03/12/2025',
    date_received: '03/15/2025',
    status: 'Open',
    assigned_to: 'Sarah Miller',
    primary_contact: 'Mark Davis (Adjuster)',
    case_total: 4500.00,
    balance_remaining: 1200.00,
    created_at: '2025-03-15T10:00:00Z',
    last_updated_at: '2025-04-10T14:30:00Z',
    created_by: 'Admin',
    last_updated_by: 'Agent Smith'
  },
  {
    claim_id: 'PL-1002',
    claim_type: 'PersonalInjury',
    patient_name: 'Jane Smith',
    clinic_name: 'Elite Chiro One',
    provider_name: 'Dr. Alan Grant',
    insurer_or_third_party: 'Allstate',
    policy_or_claim_number: 'PI-112233',
    date_of_injury: '02/20/2025',
    date_received: '02/25/2025',
    status: 'Authorized',
    assigned_to: 'Agent Smith',
    primary_contact: 'Lisa Wong (Attorney)',
    case_total: 8200.50,
    balance_remaining: 8200.50,
    created_at: '2025-02-25T09:00:00Z',
    last_updated_at: '2025-05-01T11:20:00Z',
    created_by: 'Admin',
    last_updated_by: 'Sarah Miller'
  }
];

export const MOCK_EV_RECORDS: EVRecord[] = [
  {
    unique_id: 'EV-82731-A',
    submitted_date: '05/12/2025',
    clinic_name: 'Sage Health RCM Main',
    requested_back_date: '05/10/2025',
    insurance_name: 'BlueCross BlueShield',
    insurance_order: 1,
    ev_status: 'Pending',
    metadata: {
      created_by: 'Sarah Miller',
      created_at: '2025-05-12T08:30:00Z',
      last_updated_at: '2025-05-12T09:15:00Z',
      last_updated_by: 'Agent Smith',
      notes: 'Initial verification requested for physical therapy.',
      related_policy_ids: ['POL-X9281', 'POL-X9282']
    }
  },
  {
    unique_id: 'EV-82732-B',
    submitted_date: '05/11/2025',
    clinic_name: 'Elite Chiro One',
    requested_back_date: '05/05/2025',
    insurance_name: 'Aetna',
    insurance_order: 1,
    ev_status: 'Completed',
    metadata: {
      created_by: 'Jane Smith',
      created_at: '2025-05-11T10:00:00Z',
      last_updated_at: '2025-05-11T14:20:00Z',
      last_updated_by: 'Admin',
      notes: 'Coverage verified. 10 visits authorized.',
      related_policy_ids: ['AET-44321']
    }
  },
  {
    unique_id: 'EV-82733-C',
    submitted_date: '05/10/2025',
    clinic_name: 'Sage Health RCM Main',
    requested_back_date: '05/01/2025',
    insurance_name: 'UnitedHealthcare',
    insurance_order: 2,
    ev_status: 'Action Required',
    metadata: {
      created_by: 'Robert Wilson',
      created_at: '2025-05-10T11:45:00Z',
      last_updated_at: '2025-05-10T16:00:00Z',
      last_updated_by: 'Sarah Miller',
      notes: 'Additional documentation required for secondary coverage.',
      related_policy_ids: ['UHC-55443']
    }
  },
  {
    unique_id: 'EV-82734-D',
    submitted_date: '05/09/2025',
    clinic_name: 'Myodetox Rehab Center',
    requested_back_date: '05/08/2025',
    insurance_name: 'Medicare',
    insurance_order: 1,
    ev_status: 'Authorized',
    metadata: {
      created_by: 'Alice Brown',
      created_at: '2025-05-09T09:00:00Z',
      last_updated_at: '2025-05-09T11:30:00Z',
      last_updated_by: 'Agent Smith',
      notes: 'Medicare Part B active.',
      related_policy_ids: ['MC-77889']
    }
  }
];
