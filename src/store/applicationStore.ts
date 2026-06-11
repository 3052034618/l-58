import { create } from 'zustand';
import type {
  Application,
  ApplicationStatus,
  ApprovalRecord,
  ApprovalAction,
  User,
} from '@/types';

interface ApplicationState {
  applications: Application[];
  approvalRecords: Record<string, ApprovalRecord[]>;
  todoTasks: Application[];
  doneTasks: Application[];
  setApplications: (applications: Application[]) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: string, data: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  getApplicationById: (id: string) => Application | undefined;
  setApprovalRecords: (
    applicationId: string,
    records: ApprovalRecord[]
  ) => void;
  addApprovalRecord: (applicationId: string, record: ApprovalRecord) => void;
  approve: (
    applicationId: string,
    approver: User,
    comment: string,
    nextStatus: ApplicationStatus,
    nextNode: string
  ) => void;
  reject: (
    applicationId: string,
    approver: User,
    comment: string
  ) => void;
  returnBack: (
    applicationId: string,
    approver: User,
    comment: string
  ) => void;
  transfer: (
    applicationId: string,
    approver: User,
    comment: string,
    targetApproverId: string
  ) => void;
  setTodoTasks: (tasks: Application[]) => void;
  setDoneTasks: (tasks: Application[]) => void;
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getMyApplications: (applicantId: string) => Application[];
}

const nodeNameMap: Record<string, string> = {
  pending_dept: '部门负责人审批',
  pending_admin: '行政人员核查',
  pending_finance: '财务人员审批',
  pending_handover: '实物交接确认',
  pending_executive: '高管终审',
};

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  approvalRecords: {},
  todoTasks: [],
  doneTasks: [],
  setApplications: (applications) => set({ applications }),
  addApplication: (application) =>
    set((state) => ({ applications: [...state.applications, application] })),
  updateApplication: (id, data) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      ),
    })),
  deleteApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),
  getApplicationById: (id) => get().applications.find((a) => a.id === id),
  setApprovalRecords: (applicationId, records) =>
    set((state) => ({
      approvalRecords: { ...state.approvalRecords, [applicationId]: records },
    })),
  addApprovalRecord: (applicationId, record) =>
    set((state) => ({
      approvalRecords: {
        ...state.approvalRecords,
        [applicationId]: [
          ...(state.approvalRecords[applicationId] || []),
          record,
        ],
      },
    })),
  approve: (applicationId, approver, comment, nextStatus, nextNode) => {
    const application = get().getApplicationById(applicationId);
    if (!application) return;

    const record: ApprovalRecord = {
      id: `apr_${Date.now()}`,
      applicationId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      node: application.currentNode,
      nodeName: nodeNameMap[application.currentNode] || application.currentNode,
      action: 'approve',
      comment,
      createdAt: new Date().toISOString(),
    };

    get().addApprovalRecord(applicationId, record);
    get().updateApplication(applicationId, {
      status: nextStatus,
      currentNode: nextNode,
    });

    set((state) => ({
      todoTasks: state.todoTasks.filter((t) => t.id !== applicationId),
      doneTasks: [
        { ...application, status: nextStatus, currentNode: nextNode },
        ...state.doneTasks,
      ],
    }));
  },
  reject: (applicationId, approver, comment) => {
    const application = get().getApplicationById(applicationId);
    if (!application) return;

    const record: ApprovalRecord = {
      id: `apr_${Date.now()}`,
      applicationId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      node: application.currentNode,
      nodeName: nodeNameMap[application.currentNode] || application.currentNode,
      action: 'reject',
      comment,
      createdAt: new Date().toISOString(),
    };

    get().addApprovalRecord(applicationId, record);
    get().updateApplication(applicationId, {
      status: 'rejected',
      currentNode: 'rejected',
    });

    set((state) => ({
      todoTasks: state.todoTasks.filter((t) => t.id !== applicationId),
      doneTasks: [
        { ...application, status: 'rejected', currentNode: 'rejected' },
        ...state.doneTasks,
      ],
    }));
  },
  returnBack: (applicationId, approver, comment) => {
    const application = get().getApplicationById(applicationId);
    if (!application) return;

    const record: ApprovalRecord = {
      id: `apr_${Date.now()}`,
      applicationId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      node: application.currentNode,
      nodeName: nodeNameMap[application.currentNode] || application.currentNode,
      action: 'return',
      comment,
      createdAt: new Date().toISOString(),
    };

    get().addApprovalRecord(applicationId, record);
    get().updateApplication(applicationId, {
      status: 'returned',
      currentNode: 'returned',
    });

    set((state) => ({
      todoTasks: state.todoTasks.filter((t) => t.id !== applicationId),
      doneTasks: [
        { ...application, status: 'returned', currentNode: 'returned' },
        ...state.doneTasks,
      ],
    }));
  },
  transfer: (applicationId, approver, comment, _targetApproverId) => {
    const application = get().getApplicationById(applicationId);
    if (!application) return;

    const record: ApprovalRecord = {
      id: `apr_${Date.now()}`,
      applicationId,
      approverId: approver.id,
      approverName: approver.name,
      approverRole: approver.role,
      node: application.currentNode,
      nodeName: nodeNameMap[application.currentNode] || application.currentNode,
      action: 'transfer',
      comment,
      createdAt: new Date().toISOString(),
    };

    get().addApprovalRecord(applicationId, record);
  },
  setTodoTasks: (tasks) => set({ todoTasks: tasks }),
  setDoneTasks: (tasks) => set({ doneTasks: tasks }),
  getApplicationsByStatus: (status) =>
    get().applications.filter((a) => a.status === status),
  getMyApplications: (applicantId) =>
    get().applications.filter((a) => a.applicantId === applicantId),
}));
