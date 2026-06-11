import { Router, type Request, type Response } from 'express';
import { applications, approvalRecords, users, persist } from '../data/mockData.js';
import type { Application, ApplicationStatus, DisposalType } from '../../src/types/index.js';

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

const getCurrentUserId = (req: Request): string => {
  const userId = req.header('x-user-id');
  return userId || users.find((u) => u.role === 'admin')?.id || 'u3';
};

router.get('/', (req: Request, res: Response): void => {
  const { status, type, department, keyword } = req.query as {
    status?: string;
    type?: string;
    department?: string;
    keyword?: string;
  };

  let filtered = [...applications];

  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  if (type) {
    filtered = filtered.filter((a) => a.type === type);
  }
  if (department) {
    filtered = filtered.filter((a) => a.department === department);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.applicationNo.toLowerCase().includes(kw) ||
        a.applicantName.toLowerCase().includes(kw) ||
        a.reason.toLowerCase().includes(kw)
    );
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(success(filtered));
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const app = applications.find((a) => a.id === id);

  if (!app) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  res.json(success(app));
});

router.post('/', (req: Request, res: Response): void => {
  const userId = getCurrentUserId(req);
  const user = users.find((u) => u.id === userId) || users[0];
  const body = req.body as Partial<Application>;

  const newApp: Application = {
    id: body.id || `app${Date.now()}`,
    applicationNo: body.applicationNo || `DISP-${new Date().getFullYear()}-${String(applications.length + 1).padStart(3, '0')}`,
    applicantId: userId,
    applicantName: user.name,
    type: (body.type as DisposalType) || 'scrap',
    reason: body.reason || '',
    department: body.department || user.department,
    estimatedValue: body.estimatedValue || 0,
    status: (body.status as ApplicationStatus) || 'draft',
    photos: body.photos || [],
    items: body.items || [],
    currentNode: (body.currentNode as string) || 'draft',
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  applications.push(newApp);
  res.json(success(newApp, '创建成功'));
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = applications.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  if (applications[index].status !== 'draft') {
    res.status(400).json(error('仅草稿状态可以编辑'));
    return;
  }

  const body = req.body as Partial<Application>;
  applications[index] = {
    ...applications[index],
    ...body,
    id: applications[index].id,
    updatedAt: new Date().toISOString(),
  };
  persist();

  res.json(success(applications[index], '更新成功'));
});

router.post('/:id/submit', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = applications.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const validStatuses: ApplicationStatus[] = ['draft', 'returned'];
  if (!validStatuses.includes(applications[index].status)) {
    res.status(400).json(error('当前状态不可提交'));
    return;
  }

  applications[index].status = 'pending_dept';
  applications[index].currentNode = 'pending_dept';
  applications[index].updatedAt = new Date().toISOString();

  res.json(success(applications[index], '提交成功'));
});

router.get('/:id/approvals', (req: Request, res: Response): void => {
  const { id } = req.params;
  const app = applications.find((a) => a.id === id);

  if (!app) {
    res.status(404).json(error('申请不存在'));
    return;
  }

  const records = approvalRecords
    .filter((r) => r.applicationId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json(success(records));
});

export default router;
