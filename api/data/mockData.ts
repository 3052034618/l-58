import type {
  User,
  Asset,
  Application,
  ApprovalRecord,
  Valuation,
} from '../../src/types/index.js';

import {
  mockUsers,
  mockAssets,
  mockApplications,
  mockApprovalRecords,
  mockValuations,
} from '../../src/mock/data.js';

export const users: User[] = mockUsers;
export const assets: Asset[] = mockAssets;
export const applications: Application[] = mockApplications;
export const approvalRecords: ApprovalRecord[] = mockApprovalRecords;
export const valuations: Valuation[] = mockValuations;
