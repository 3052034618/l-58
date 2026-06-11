import { cn } from '@/lib/utils';
import type {
  AssetStatus, ApplicationStatus, ValuationStatus } from '@/types';

type StatusType = 'asset' | 'application' | 'approval' | 'valuation';

type StatusColor = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusTagProps {
  type: StatusType;
  status: AssetStatus | ApplicationStatus | ValuationStatus;
  className?: string;
}

const assetStatusMap: Record<AssetStatus, { label: string; color: StatusColor }> = {
  in_use: { label: '使用中', color: 'success' },
  idle: { label: '闲置', color: 'info' },
  repairing: { label: '维修中', color: 'warning' },
  pending_disposal: { label: '待处置', color: 'warning' },
  disposed: { label: '已处置', color: 'default' },
};

const applicationStatusMap: Record<ApplicationStatus, { label: string; color: StatusColor }> = {
  draft: { label: '草稿', color: 'default' },
  pending_dept: { label: '待部门审批', color: 'warning' },
  pending_admin: { label: '待行政审核', color: 'warning' },
  pending_finance: { label: '待财务审核', color: 'warning' },
  pending_handover: { label: '待交接确认', color: 'warning' },
  pending_executive: { label: '待高管审批', color: 'warning' },
  approved: { label: '已审批通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'danger' },
  returned: { label: '已退回', color: 'warning' },
  completed: { label: '已完成', color: 'success' },
  archived: { label: '已归档', color: 'default' },
};

const approvalStatusMap: Record<string, { label: string; color: StatusColor }> = {
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已拒绝', color: 'danger' },
  returned: { label: '已退回', color: 'warning' },
  pending: { label: '待审批', color: 'warning' },
};

const valuationStatusMap: Record<ValuationStatus, { label: string; color: StatusColor }> = {
  draft: { label: '草稿', color: 'default' },
  pending_review: { label: '待审核', color: 'warning' },
  reviewed: { label: '已审核', color: 'success' },
  rejected: { label: '已拒绝', color: 'danger' },
};

const colorClasses: Record<StatusColor, string> = {
  success: 'bg-secondary-50 text-secondary-700 bg-secondary-50/10',
  warning: 'bg-warning-50 text-warning-700 bg-warning-50/10',
  danger: 'bg-danger-50 text-danger-700 bg-danger-50/10',
  info: 'bg-primary-50 text-primary-700 bg-primary-50/10',
  default: 'bg-slate-100 text-slate-600 bg-slate-100',
};

const dotColorClasses: Record<StatusColor, string> = {
  success: 'bg-secondary-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-primary-500',
  default: 'bg-slate-400',
};

export function getStatusConfig(type: StatusType, status: string) {
  switch (type) {
    case 'asset':
      return assetStatusMap[status as AssetStatus];
    case 'application':
      return applicationStatusMap[status as ApplicationStatus];
    case 'approval':
      return approvalStatusMap[status] || { label: status, color: 'default' as StatusColor };
    case 'valuation':
      return valuationStatusMap[status as ValuationStatus];
    default:
      return { label: status, color: 'default' as StatusColor };
  }
}

export default function StatusTag({ type, status, className }: StatusTagProps) {
  const config = getStatusConfig(type, status);
  const colorClass = colorClasses[config.color];
  const dotClass = dotColorClasses[config.color];

  return (
    <span
      className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
      colorClass,
      className
    )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {config.label}
    </span>
  );
}
