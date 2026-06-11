import { Router, type Request, type Response } from 'express';
import { valuations, users, assets } from '../data/mockData.js';
import type { Valuation, ValuationMethod, ValuationStatus, User } from '../../src/types/index.js';

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

router.get('/', (req: Request, res: Response): void => {
  const { status, method } = req.query as {
    status?: string;
    method?: string;
  };

  let filtered = [...valuations];

  if (status) {
    filtered = filtered.filter((v) => v.status === status);
  }
  if (method) {
    filtered = filtered.filter((v) => v.method === method);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(success(filtered));
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const valuation = valuations.find((v) => v.id === id);

  if (!valuation) {
    res.status(404).json(error('估值记录不存在'));
    return;
  }

  res.json(success(valuation));
});

router.post('/', (req: Request, res: Response): void => {
  const user = getCurrentUser(req);
  const body = req.body as Partial<Valuation>;

  if (!body.assetId) {
    res.status(400).json(error('请指定资产'));
    return;
  }

  const asset = assets.find((a) => a.id === body.assetId);
  if (!asset) {
    res.status(404).json(error('资产不存在'));
    return;
  }

  const newValuation: Valuation = {
    id: `v${Date.now()}`,
    valuationNo: `VAL-${Date.now()}`,
    assetId: asset.id,
    assetName: asset.name,
    assetNo: asset.assetNo,
    applicationId: body.applicationId,
    method: (body.method as ValuationMethod) || 'cost',
    value: body.value || 0,
    originalValue: asset.originalValue,
    netValue: asset.netValue,
    valuatorId: user.id,
    valuatorName: user.name,
    status: 'draft',
    basis: body.basis || '',
    reportUrl: body.reportUrl,
    createdAt: new Date().toISOString(),
  };

  valuations.push(newValuation);
  res.json(success(newValuation, '创建成功'));
});

router.post('/:id/review', (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = getCurrentUser(req);
  const { status, comment } = req.body as { status?: 'reviewed' | 'rejected'; comment?: string };

  if (user.role !== 'finance' && user.role !== 'executive') {
    res.status(403).json(error('您没有审核权限'));
    return;
  }

  const index = valuations.findIndex((v) => v.id === id);
  if (index === -1) {
    res.status(404).json(error('估值记录不存在'));
    return;
  }

  if (valuations[index].status !== 'pending_review') {
    res.status(400).json(error('仅待审核状态可以审核'));
    return;
  }

  valuations[index].status = (status as ValuationStatus) || 'reviewed';
  if (comment) {
    valuations[index].basis = `${valuations[index].basis}\n审核意见：${comment}`;
  }

  res.json(success(valuations[index], '审核完成'));
});

export default router;
