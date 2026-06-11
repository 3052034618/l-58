export type UserRole = 'dept_head' | 'admin' | 'finance' | 'executive';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar: string;
}

export type AssetStatus = 'in_use' | 'idle' | 'repairing' | 'pending_disposal' | 'disposed';

export interface Asset {
  id: string;
  name: string;
  category: string;
  assetNo: string;
  originalValue: number;
  netValue: number;
  status: AssetStatus;
  department: string;
  purchaseDate: string;
  location: string;
  photos: string[];
  description: string;
  custodian: string;
}

export type DisposalType = 'scrap' | 'transfer' | 'auction';

export type ApplicationStatus =
  | 'draft'
  | 'pending_dept'
  | 'pending_admin'
  | 'pending_finance'
  | 'pending_handover'
  | 'pending_executive'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'completed'
  | 'archived';

export interface ApplicationItem {
  id: string;
  assetId: string;
  assetName: string;
  assetNo: string;
  originalValue: number;
  netValue: number;
  quantity: number;
  remark: string;
}

export interface Application {
  id: string;
  applicationNo: string;
  applicantId: string;
  applicantName: string;
  type: DisposalType;
  reason: string;
  department: string;
  estimatedValue: number;
  status: ApplicationStatus;
  photos: string[];
  items: ApplicationItem[];
  currentNode: string;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalAction = 'approve' | 'reject' | 'return' | 'transfer';

export interface ApprovalRecord {
  id: string;
  applicationId: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  node: string;
  nodeName: string;
  action: ApprovalAction;
  comment: string;
  createdAt: string;
}

export type ValuationMethod = 'cost' | 'market' | 'income' | 'expert';
export type ValuationStatus = 'draft' | 'pending_review' | 'reviewed' | 'rejected';

export interface Valuation {
  id: string;
  valuationNo: string;
  assetId: string;
  assetName: string;
  assetNo: string;
  applicationId?: string;
  method: ValuationMethod;
  value: number;
  originalValue: number;
  netValue: number;
  valuatorId: string;
  valuatorName: string;
  status: ValuationStatus;
  basis: string;
  reportUrl?: string;
  createdAt: string;
}

export interface Permission {
  createApplication: boolean;
  viewAssets: boolean;
  editAssets: boolean;
  createValuation: boolean;
  reviewValuation: boolean;
  approveDept: boolean;
  approveAdmin: boolean;
  approveFinance: boolean;
  approveExecutive: boolean;
  confirmHandover: boolean;
  generateDisposal: boolean;
  exportArchive: boolean;
  viewArchive: boolean;
}

export interface AssetFilters {
  keyword: string;
  category: string;
  status: AssetStatus | '';
  department: string;
  dateRange: [string, string] | null;
}
