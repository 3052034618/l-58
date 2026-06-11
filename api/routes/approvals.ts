import { Router, type Request, type Response } from 'express';
import { applications, approvalRecords, users } from '../data/mockData.js';
import type { ApprovalAction, User, ApplicationStatus, UserRole } from '../../src/types/index.js';

const router = Router();

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

const success = <T>(data: T, message = 'success'): ApiResponse<T> => ({
  code: 0,
  message,
  data,
});

const error = (message: string, code = 1): ApiResponse<null> => ({
  code,
  message,
  data: null,
});

const getCurrentUser = (req: Request): User => {
  const userId = req.header('x-user-id');
  if (userId) {
    const user = users.find((u) => u.id === userId);
    if (user) return user;
  }
  return users.find((u) => u.role === 'admin') || users[0];
};

const nodeToRole: Record<string, UserRole> = {
  pending_dept: 'dept_head',
  pending_admin: 'admin',
  pending_finance: 'finance',
  pending_handover: 'admin',
  pending_executive: 'executive',
};

const nodeNameMap: Record<string, string> = {
  pending_dept: '部门负责人审批',
  pending_admin: '行政人员核查',
  pending_finance: '财务人员审批',
  pending_handover: '实物交接确认',
  pending_executive: '高管终审',
};

const nextNodeMap: Record<string, ApplicationStatus> = {
  pending_dept: 'pending_admin',
  pending_admin: 'pending_finance',
  pending_finance: 'pending_handover',
  pending_handover: 'pending_executive',
  pending_executive: 'completed',
};

const canUserApproveNode = (user: User, node: string, appDepartment: string): boolean => {
  const requiredRole = nodeToRole[node];
  if (!requiredRole) return false;

  if (user.role === 'executive' && node === 'pending_executive') return true;
  if (user.role === 'finance' && node === 'pending_finance') return true;
  if (user.role === 'admin' && (node === 'pending_admin' || node === 'pending_handover')) return true;
  if (user.role === 'dept_head' && node === 'pending_dept') {
    return user.department === appDepartment;
  }
  return false;
};

router.get('/todo', (req: Request, res: Response): void => {
  const user = getCurrentUser(req);

  const pendingNodes = Object.keys(nodeToRole).filter((node) =>
    canUserApproveNode(user, node, '')
  );

  const todo = applications.filter((app) => {
    if (!pendingNodes.includes(app.currentNode)) return false;
    if (app.currentNode === 'pending_dept') {
      return user.department === app.department;
    }
    return true;
  });

  todo.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(success(todo));
});

router.get('/done', (req: Request, res: Response): void => {
  const user = getCurrentUser(req);

  const doneRecords = approvalRecords
    .filter((r) => r.approverId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const doneApps = doneRecords
    .map((r) => applications.find((a) => a.id === r.applicationId))
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  const uniqueApps = Array.from(new Map(doneApps.map((a) => [a.id, a])).values());

  res.json(success(uniqueApps));
});

router.post('/:id/approve', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = getCurrentUser(req);
  const { comment } = req.body as { comment?: string };

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const app = applications[appIndex];
  if (!canUserApproveNode(user, app.currentNode, app.department)) {
    res.status(403).json(error('您没有权限审批此节点'));
    return;
  }

  const recordId = `ar${Date.now()}`;
  approvalRecords.push({
    id: recordId,
    applicationId: app.id,
    approverId: user.id,
    approverName: user.name,
    approverRole: user.role,
    node: app.currentNode,
    nodeName: nodeNameMap[app.currentNode] || app.currentNode,
    action: 'approve',
    comment: comment || '同意',
    createdAt: new Date().toISOString(),
  });

  const nextNode = nextNodeMap[app.currentNode];
  if (nextNode) {
    app.currentNode = nextNode;
    app.status = nextNode;
  } else {
    app.currentNode = 'completed';
    app.status = 'completed';
  }
  app.updatedAt = new Date().toISOString();

  res.json(success(app, '审批通过'));
});

router.post('/:id/reject', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = getCurrentUser(req);
  const { comment } = req.body as { comment?: string };

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const app = applications[appIndex];
  if (!canUserApproveNode(user, app.currentNode, app.department)) {
    res.status(403).json(error('您没有权限审批此节点'));
    return;
  }

  approvalRecords.push({
    id: `ar${Date.now()}`,
    applicationId: app.id,
    approverId: user.id,
    approverName: user.name,
    approverRole: user.role,
    node: app.currentNode,
    nodeName: nodeNameMap[app.currentNode] || app.currentNode,
    action: 'reject',
    comment: comment || '驳回',
    createdAt: new Date().toISOString(),
  });

  app.currentNode = 'rejected';
  app.status = 'rejected';
  app.updatedAt = new Date().toISOString();

  res.json(success(app, '已驳回'));
});

router.post('/:id/return', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = getCurrentUser(req);
  const { comment } = req.body as { comment?: string };

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const app = applications[appIndex];
  if (!canUserApproveNode(user, app.currentNode, app.department)) {
    res.status(403).json(error('您没有权限审批此节点'));
    return;
  }

  approvalRecords.push({
    id: `ar${Date.now()}`,
    applicationId: app.id,
    approverId: user.id,
    approverName: user.name,
    approverRole: user.role,
    node: app.currentNode,
    nodeName: nodeNameMap[app.currentNode] || app.currentNode,
    action: 'return',
    comment: comment || '请补充材料',
    createdAt: new Date().toISOString(),
  });

  app.currentNode = 'returned';
  app.status = 'returned';
  app.updatedAt = new Date().toISOString();

  res.json(success(app, '已退回补充材料'));
});

router.post('/:id/transfer', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = getCurrentUser(req);
  const { targetUserId, comment } = req.body as { targetUserId?: string; comment?: string };

  if (!targetUserId) {
    res.status(400).json(error('请指定转交人'));
    return;
  }

  const targetUser = users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    res.status(404).json(error('目标用户不存在'));
    return;
  }

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const app = applications[appIndex];
  if (!canUserApproveNode(user, app.currentNode, app.department)) {
    res.status(403).json(error('您没有权限审批此节点'));
    return;
  }

  approvalRecords.push({
    id: `ar${Date.now()}`,
    applicationId: app.id,
    approverId: user.id,
    approverName: `${user.name}(转交给 ${targetUser.name})`,
    approverRole: user.role,
    node: app.currentNode,
    nodeName: nodeNameMap[app.currentNode] || app.currentNode,
    action: 'transfer' as ApprovalAction,
    comment: comment || `转交给 ${targetUser.name} 处理`,
    createdAt: new Date().toISOString(),
  });

  app.updatedAt = new Date().toISOString();

  res.json(success(app, `已转交给 ${targetUser.name}`));
});

export default router;
