import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAssetStore } from '@/store/assetStore';
import { useApplicationStore } from '@/store/applicationStore';
import { mockAssets, mockApplications, mockApprovalRecords } from '@/mock/data';

useAssetStore.getState().setAssets(mockAssets);
useApplicationStore.getState().setApplications(mockApplications);

const approvalRecordsMap: Record<string, typeof mockApprovalRecords> = {};
mockApprovalRecords.forEach((record) => {
  if (!approvalRecordsMap[record.applicationId]) {
    approvalRecordsMap[record.applicationId] = [];
  }
  approvalRecordsMap[record.applicationId].push(record);
});
Object.entries(approvalRecordsMap).forEach(([appId, records]) => {
  useApplicationStore.getState().setApprovalRecords(appId, records);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
