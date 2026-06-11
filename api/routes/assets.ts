import { Router, type Request, type Response } from 'express';
import { assets } from '../data/mockData.js';
import type { Asset, AssetStatus } from '../../src/types/index.js';

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

interface AssetFlowRecord {
  id: string;
  assetId: string;
  type: 'purchase' | 'transfer' | 'repair' | 'disposal' | 'valuation';
  typeName: string;
  fromDepartment?: string;
  toDepartment?: string;
  operator: string;
  description: string;
  date: string;
}

router.get('/', (req: Request, res: Response): void => {
  const { category, status, department, keyword } = req.query as {
    category?: string;
    status?: string;
    department?: string;
    keyword?: string;
  };

  let filtered = [...assets];

  if (category) {
    filtered = filtered.filter((a) => a.category === category);
  }
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  if (department) {
    filtered = filtered.filter((a) => a.department === department);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.assetNo.toLowerCase().includes(kw) ||
        a.custodian.toLowerCase().includes(kw)
    );
  }

  res.json(success(filtered));
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const asset = assets.find((a) => a.id === id);

  if (!asset) {
    res.status(404).json(error('资产不存在'));
    return;
  }

  res.json(success(asset));
});

router.post('/', (req: Request, res: Response): void => {
  const body = req.body as Partial<Asset>;
  const newAsset: Asset = {
    id: `a${Date.now()}`,
    name: body.name || '',
    category: body.category || '',
    assetNo: body.assetNo || `NEW-${Date.now()}`,
    originalValue: body.originalValue || 0,
    netValue: body.netValue || 0,
    status: (body.status as AssetStatus) || 'in_use',
    department: body.department || '',
    purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
    location: body.location || '',
    photos: body.photos || [],
    description: body.description || '',
    custodian: body.custodian || '',
  };

  assets.push(newAsset);
  res.json(success(newAsset, '创建成功'));
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = assets.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json(error('资产不存在'));
    return;
  }

  const body = req.body as Partial<Asset>;
  assets[index] = { ...assets[index], ...body, id: assets[index].id };

  res.json(success(assets[index], '更新成功'));
});

router.patch('/batch-status', (req: Request, res: Response): void => {
  const { ids, status } = req.body as { ids: string[]; status: AssetStatus };

  if (!ids || ids.length === 0 || !status) {
    res.status(400).json(error('参数不完整'));
    return;
  }

  const updated: Asset[] = [];
  ids.forEach((id) => {
    const asset = assets.find((a) => a.id === id);
    if (asset) {
      asset.status = status;
      updated.push(asset);
    }
  });

  res.json(success(updated, `批量更新了 ${updated.length} 条记录`));
});

router.get('/:id/history', (req: Request, res: Response): void => {
  const { id } = req.params;
  const asset = assets.find((a) => a.id === id);

  if (!asset) {
    res.status(404).json(error('资产不存在'));
    return;
  }

  const history: AssetFlowRecord[] = [
    {
      id: 'h1',
      assetId: id,
      type: 'purchase',
      typeName: '采购入库',
      operator: '系统',
      description: `${asset.name} 采购入库，资产编号 ${asset.assetNo}`,
      date: asset.purchaseDate,
    },
    {
      id: 'h2',
      assetId: id,
      type: 'transfer',
      typeName: '部门调拨',
      fromDepartment: '采购部',
      toDepartment: asset.department,
      operator: '王强',
      description: `资产调拨至 ${asset.department}，保管人：${asset.custodian}`,
      date: asset.purchaseDate,
    },
  ];

  if (asset.status === 'repairing') {
    history.push({
      id: 'h3',
      assetId: id,
      type: 'repair',
      typeName: '送修',
      operator: '张伟',
      description: '设备故障送修',
      date: new Date().toISOString().split('T')[0],
    });
  }

  if (asset.status === 'pending_disposal' || asset.status === 'disposed') {
    history.push({
      id: 'h4',
      assetId: id,
      type: 'valuation',
      typeName: '资产评估',
      operator: '王强',
      description: '进入处置流程，完成资产评估',
      date: new Date().toISOString().split('T')[0],
    });
  }

  res.json(success(history));
});

export default router;
