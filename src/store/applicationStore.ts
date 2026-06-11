import { create } from 'zustand';
import type {
  Application,
  ApplicationStatus,
  ApprovalRecord,
  ApprovalAction,
  User,
  HandoverRecord,
} from '@/types';
import { mockApplications, mockApprovalRecords } from '@/mock/data';
import { api } from '@/utils/apiClient';

interface ApplicationState {
  applications: Application[];
  approvalRecords: Record<string, ApprovalRecord[]>;
  handoverRecords: Record<string, HandoverRecord>;
  todoTasks: Application[];
  doneTasks: Application[];
  isInitialized: boolean;

  initializeData: () => void;
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

  setHandoverRecord: (applicationId: string, record: HandoverRecord) => void;
  confirmHandover: (
    applicationId: string,
    confirmer: User,
    remark: string
  ) => void;

  approve: (
    applicationId: string,
    approver: User,
    comment: string
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

  refreshTodoTasks: (user: User) => void;
  refreshDoneTasks: (user: User) => void;

  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getMyApplications: (applicantId: string) => Application[];

  resetAllData: () => void;
  syncFromApi: () => Promise<void>;
}

const STORAGE_KEY = 'asset_disposal_applications_v1';
const APPROVAL_STORAGE_KEY = 'asset_disposal_approvals_v1';
const HANDOVER_STORAGE_KEY = 'asset_disposal_handover_v1';

const nodeNameMap: Record<string, string> = {
  pending_dept: '部门负责人审批',
  pending_admin: '行政人员核查',
  pending_finance: '财务人员审批',
  pending_handover: '实物交接确认',
  pending_executive: '高管终审',
};

const nextNodeMap: Record<
  string,
  { status: ApplicationStatus; node: string } | null
> = {
  pending_dept: { status: 'pending_admin', node: 'pending_admin' },
  pending_admin: { status: 'pending_finance', node: 'pending_finance' },
  pending_finance: { status: 'pending_handover', node: 'pending_handover' },
  pending_handover: { status: 'pending_executive', node: 'pending_executive' },
  pending_executive: { status: 'completed', node: 'completed' },
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function generateApplicationNo() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `CZR-${dateStr}-${random}`;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  approvalRecords: {},
  handoverRecords: {},
  todoTasks: [],
  doneTasks: [],
  isInitialized: false,

  initializeData: () => {
    if (get().isInitialized) {
      get().syncFromApi();
      return;
    }

    const storedApps = loadFromStorage<Application[] | null>(STORAGE_KEY, null);
    const storedRecords = loadFromStorage<Record<string, ApprovalRecord[]> | null>(
      APPROVAL_STORAGE_KEY,
      null
    );
    const storedHandovers = loadFromStorage<Record<string, HandoverRecord> | null>(
      HANDOVER_STORAGE_KEY,
      null
    );

    const defaultRecords = mockApprovalRecords.reduce(
      (acc, record) => {
        if (!acc[record.applicationId]) {
          acc[record.applicationId] = [];
        }
        acc[record.applicationId].push(record);
        return acc;
      },
      {} as Record<string, ApprovalRecord[]>
    );

    let baseApps = storedApps || mockApplications;
    let baseRecords = storedRecords || defaultRecords;
    let baseHandovers = storedHandovers || {};

    let needsMigration = false;
    baseApps = baseApps.map((app) => {
      if (app.status === 'approved' || app.currentNode === 'approved') {
        needsMigration = true;
        return {
          ...app,
          status: 'completed' as ApplicationStatus,
          currentNode: 'completed',
        };
      }
      return app;
    });

    if (needsMigration) {
      saveToStorage(STORAGE_KEY, baseApps);
      saveToStorage(APPROVAL_STORAGE_KEY, baseRecords);
      saveToStorage(HANDOVER_STORAGE_KEY, baseHandovers);
    }

    set({
      applications: baseApps,
      approvalRecords: baseRecords,
      handoverRecords: baseHandovers,
      isInitialized: true,
    });

    get().syncFromApi();
  },

  syncFromApi: async () => {
    try {
      const [appsRes, recordsRes] = await Promise.all([
        api.get<Application[]>('/applications'),
        api.get<ApprovalRecord[]>('/approvals/records'),
      ]);

      if (appsRes.code === 0 && appsRes.data) {
        const apiApps = appsRes.data as Application[];
        set({ applications: apiApps });
        saveToStorage(STORAGE_KEY, apiApps);
      }

      if (recordsRes.code === 0 && recordsRes.data) {
        const apiRecords = recordsRes.data as ApprovalRecord[];
        const recordMap: Record<string, ApprovalRecord[]> = {};
        apiRecords.forEach((r) => {
          if (!recordMap[r.applicationId]) {
            recordMap[r.applicationId] = [];
          }
          recordMap[r.applicationId].push(r);
        });
        set({ approvalRecords: recordMap });
        saveToStorage(APPROVAL_STORAGE_KEY, recordMap);
      }
    } catch {
      // ignore, use local data
    }
  },

  resetAllData: () => {
    const defaultRecords = mockApprovalRecords.reduce(
      (acc, record) => {
        if (!acc[record.applicationId]) {
          acc[record.applicationId] = [];
        }
        acc[record.applicationId].push(record);
        return acc;
      },
      {} as Record<string, ApprovalRecord[]>
    );
    set({
      applications: mockApplications,
      approvalRecords: defaultRecords,
      handoverRecords: {},
    });
    saveToStorage(STORAGE_KEY, mockApplications);
    saveToStorage(APPROVAL_STORAGE_KEY, defaultRecords);
    saveToStorage(HANDOVER_STORAGE_KEY, {});
  },

  setApplications: (applications) => {
    set({ applications });
    saveToStorage(STORAGE_KEY, applications);
  },

  addApplication: (application) => {
    set((state) => {
      const newApp = {
        ...application,
        applicationNo:
          application.applicationNo || generateApplicationNo(),
        createdAt: application.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const newApps = [...state.applications, newApp];
      saveToStorage(STORAGE_KEY, newApps);

      api.post('/applications', newApp).catch(() => {});

      return { applications: newApps };
    });
  },

  updateApplication: (id, data) =>
    set((state) => {
      const newApps = state.applications.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      );
      saveToStorage(STORAGE_KEY, newApps);
      return { applications: newApps };
    }),

  deleteApplication: (id) =>
    set((state) => {
      const newApps = state.applications.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEY, newApps);
      return { applications: newApps };
    }),

  getApplicationById: (id) => get().applications.find((a) => a.id === id),

  setApprovalRecords: (applicationId, records) =>
    set((state) => {
      const newRecords = {
        ...state.approvalRecords,
        [applicationId]: records,
      };
      saveToStorage(APPROVAL_STORAGE_KEY, newRecords);
      return { approvalRecords: newRecords };
    }),

  addApprovalRecord: (applicationId, record) =>
    set((state) => {
      const newRecords = {
        ...state.approvalRecords,
        [applicationId]: [
          ...(state.approvalRecords[applicationId] || []),
          record,
        ],
      };
      saveToStorage(APPROVAL_STORAGE_KEY, newRecords);
      return { approvalRecords: newRecords };
    }),

  setHandoverRecord: (applicationId, record) =>
    set((state) => {
      const newRecords = {
        ...state.handoverRecords,
        [applicationId]: record,
      };
      saveToStorage(HANDOVER_STORAGE_KEY, newRecords);
      return { handoverRecords: newRecords };
    }),

  confirmHandover: (applicationId, confirmer, remark) => {
    const application = get().getApplicationById(applicationId);
    if (!application) return;
    if (confirmer.role !== 'admin') return;

    const handoverRecord: HandoverRecord = {
      id: `ho_${Date.now()}`,
      applicationId,
      handoverDate: new Date().toISOString(),
      receiverName: application.applicantName,
      receiverDepartment: application.department,
      confirmerId: confirmer.id,
      confirmerName: confirmer.name,
      confirmerRole: confirmer.role,
      assetCount: application.items.length,
      remark,
      status: 'confirmed',
    };

    get().setHandoverRecord(applicationId, handoverRecord);

    const record: ApprovalRecord = {
      id: `apr_${Date.now()}`,
      applicationId,
      approverId: confirmer.id,
      approverName: confirmer.name,
      approverRole: confirmer.role,
      node: 'pending_handover',
      nodeName: '实物交接确认',
      action: 'approve' as ApprovalAction,
      comment: remark || '实物交接确认完成',
      createdAt: new Date().toISOString(),
    };

    get().addApprovalRecord(applicationId, record);

    const next = nextNodeMap['pending_handover'];
    if (next) {
      get().updateApplication(applicationId, {
        status: next.status,
        currentNode: next.node,
      });
    }

    set((state) => {
      const updatedApp = state.applications.find((a) => a.id === applicationId);
      return {
        todoTasks: state.todoTasks.filter((t) => t.id !== applicationId),
        doneTasks: updatedApp ? [updatedApp, ...state.doneTasks] : state.doneTasks,
      };
    });

    api
      .post(`/approvals/${applicationId}/approve`, { comment: remark })
      .catch(() => {});
  },

  approve: (applicationId, approver, comment) => {
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

    const next = nextNodeMap[application.currentNode];
    if (next) {
      get().updateApplication(applicationId, {
        status: next.status,
        currentNode: next.node,
      });
    }

    set((state) => ({
      todoTasks: state.todoTasks.filter((t) => t.id !== applicationId),
      doneTasks: [
        {
          ...application,
          status: next?.status || application.status,
          currentNode: next?.node || application.currentNode,
          updatedAt: new Date().toISOString(),
        },
        ...state.doneTasks,
      ],
    }));

    api
      .post(`/approvals/${applicationId}/approve`, { comment })
      .catch(() => {});
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
        { ...application, status: 'rejected', currentNode: 'rejected', updatedAt: new Date().toISOString() },
        ...state.doneTasks,
      ],
    }));

    api
      .post(`/approvals/${applicationId}/reject`, { comment })
      .catch(() => {});
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
        { ...application, status: 'returned', currentNode: 'returned', updatedAt: new Date().toISOString() },
        ...state.doneTasks,
      ],
    }));

    api
      .post(`/approvals/${applicationId}/return`, { comment })
      .catch(() => {});
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

    api
      .post(`/approvals/${applicationId}/transfer`, {
        targetUserId: _targetApproverId,
        comment,
      })
      .catch(() => {});
  },

  refreshTodoTasks: (user) => {
    const allApplications = get().applications;
    let todos: Application[] = [];

    if (user.role === 'dept_head') {
      todos = allApplications.filter(
        (a) =>
          a.currentNode === 'pending_dept' && a.department === user.department
      );
    } else if (user.role === 'admin') {
      todos = allApplications.filter((a) => {
        if (a.currentNode === 'pending_admin') return true;
        if (a.currentNode === 'pending_handover') return true;
        return false;
      });
    } else if (user.role === 'finance') {
      todos = allApplications.filter(
        (a) => a.currentNode === 'pending_finance'
      );
    } else if (user.role === 'executive') {
      todos = allApplications.filter(
        (a) => a.currentNode === 'pending_executive'
      );
    }

    todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    set({ todoTasks: todos });
  },

  refreshDoneTasks: (user) => {
    const allRecords = get().approvalRecords;
    const allApplications = get().applications;

    const handledAppIds = new Set<string>();
    Object.values(allRecords).forEach((records) => {
      records.forEach((record) => {
        if (record.approverId === user.id) {
          handledAppIds.add(record.applicationId);
        }
      });
    });

    const handoverRecords = get().handoverRecords;
    Object.values(handoverRecords).forEach((record) => {
      if (record.confirmerId === user.id) {
        handledAppIds.add(record.applicationId);
      }
    });

    const doneTasks = allApplications
      .filter((a) => handledAppIds.has(a.id))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    set({ doneTasks });
  },

  getApplicationsByStatus: (status) =>
    get().applications.filter((a) => a.status === status),
  getMyApplications: (applicantId) =>
    get().applications.filter((a) => a.applicantId === applicantId),
}));

export { nextNodeMap, nodeNameMap };
