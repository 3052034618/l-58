import { Check, X, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalRecord, ApprovalAction } from '@/types';

type TimelineStatus = 'completed' | 'current' | 'pending' | 'rejected' | 'returned';

interface TimelineItem {
  id: string;
  nodeName: string;
  approverName?: string;
  approverRole?: string;
  action?: ApprovalAction;
  comment?: string;
  createdAt?: string;
  status: TimelineStatus;
}

interface ApprovalTimelineProps {
  items: TimelineItem[];
  className?: string;
}

function getStatusIcon(status: TimelineStatus) {
  switch (status) {
    case 'completed':
      return <Check className="w-4 h-4" />;
    case 'current':
      return <Clock className="w-4 h-4" />;
    case 'rejected':
      return <X className="w-4 h-4" />;
    case 'returned':
      return <RotateCcw className="w-4 h-4" />;
    case 'pending':
    default:
      return null;
  }
}

function getStatusClasses(status: TimelineStatus) {
  switch (status) {
    case 'completed':
      return {
        dot: 'bg-secondary-500 text-white',
        line: 'bg-secondary-300',
        pulse: false,
      };
    case 'current':
      return {
        dot: 'bg-primary-500 text-white ring-4 ring-primary-100',
        line: 'bg-slate-200',
        pulse: true,
      };
    case 'rejected':
      return {
        dot: 'bg-danger-500 text-white',
        line: 'bg-slate-200',
        pulse: false,
      };
    case 'returned':
      return {
        dot: 'bg-warning-500 text-white',
        line: 'bg-slate-200',
        pulse: false,
      };
    case 'pending':
    default:
      return {
        dot: 'bg-white border-2 border-slate-300 text-slate-400',
        line: 'bg-slate-200',
        pulse: false,
      };
  }
}

export function recordsToTimeline(
  records: ApprovalRecord[],
  currentNode: string,
  allNodes: { node: string; nodeName: string }[]
): TimelineItem[] {
  const recordMap = new Map(records.map((r) => [r.node, r]));

  return allNodes.map(({ node, nodeName }) => {
    const record = recordMap.get(node);

    let status: TimelineStatus;
    if (record) {
      if (record.action === 'approve') {
        status = 'completed';
      } else if (record.action === 'reject') {
        status = 'rejected';
      } else if (record.action === 'return') {
        status = 'returned';
      } else {
        status = 'completed';
      }
    } else if (node === currentNode) {
      status = 'current';
    } else {
      status = 'pending';
    }

    return {
      id: node,
      nodeName,
      approverName: record?.approverName,
      approverRole: record?.approverRole,
      action: record?.action,
      comment: record?.comment,
      createdAt: record?.createdAt,
      status,
    };
  });
}

export default function ApprovalTimeline({ items, className }: ApprovalTimelineProps) {
  const roleLabels: Record<string, string> = {
    dept_head: '部门主管',
    admin: '管理员',
    finance: '财务',
    executive: '高管',
  };

  function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <ol className={cn('relative', className)}>
      {items.map((item, idx) => {
        const statusClasses = getStatusClasses(item.status);
        const isLast = idx === items.length - 1;

        return (
          <li key={item.id} className="relative pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[15px] top-8 w-0.5 -translate-x-1/2 h-[calc(100%-2rem)]',
                  statusClasses.line
                )}
              />
            )}

            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                  statusClasses.dot,
                  statusClasses.pulse && 'animate-pulse-slow'
                )}
              >
                {getStatusIcon(item.status)}
              </div>

              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-slate-900">{item.nodeName}</h4>
                  {item.approverName && (
                    <span className="text-xs text-slate-500">
                      {item.approverName}
                      {item.approverRole && ` · ${roleLabels[item.approverRole] || item.approverRole}`}
                    </span>
                  )}
                  {item.createdAt && (
                    <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                  )}
                </div>
                {item.comment && (
                  <p className="mt-1.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    {item.comment}
                  </p>
                )}
                {item.status === 'current' && !item.comment && (
                  <p className="mt-1.5 text-sm text-primary-600">审批进行中...</p>
                )}
                {item.status === 'pending' && (
                  <p className="mt-1.5 text-sm text-slate-400">等待处理</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
