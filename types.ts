export enum InterestType {
  SIMPLE = 'SIMPLE',
  COMPOUND = 'COMPOUND',
  FLAT = 'FLAT' // Common in informal lending
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  DEFAULTED = 'DEFAULTED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  businessName?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
}

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  cardDetails?: string;
  address?: string;
  notes: string;
  riskLevel: RiskLevel;
  createdAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  method: 'CASH' | 'TRANSFER' | 'OTHER' | 'PENALTY';
  notes?: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  principal: number;
  interestRate: number; // Percentage
  interestType: InterestType;
  startDate: string;
  termValue: number; // e.g., 6
  termUnit: 'DAYS' | 'WEEKS' | 'MONTHS';
  dueDate: string;
  status: LoanStatus;
  totalRepayment: number;
  balance: number;
  payments: Payment[];
  logs: AuditLog[];
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  entityId?: string;
}

export interface CashflowPoint {
  date: string;
  inflow: number;
  outflow: number;
}