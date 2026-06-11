import { Router, type Request, type Response } from 'express';
import { applications, assets, approvalRecords, valuations } from '../data/mockData.js';
import type { Application } from '../../src/types/index.js';

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

interface DisposalRecord {
  id: string;
  applicationNo: string;
  applicantName: string;
  department: string;
  type: string;
  typeName: string;
  reason: string;
  estimatedValue: number;
  items: {
    assetId: string;
    assetName: string;
    assetNo: string;
    netValue: number;
    valuationValue?: number;
  }[];
  approvals: {
    nodeName: string;
    approverName: string;
    action: string;
    comment: string;
    date: string;
  }[];
  completedAt: string;
}

interface AssetFlowNode {
  id: string;
  type: string;
  typeName: string;
  department: string;
  custodian: string;
  date: string;
  description: string;
}

const disposalTypeName: Record<string, string> = {
  scrap: '报废',
  transfer: '内部划转',
  auction: '公开拍卖',
};

router.get('/disposals', (req: Request, res: Response): void => {
  const archivedApps = applications.filter(
    (a) => a.status === 'completed' || a.status === 'archived'
  );

  const records: DisposalRecord[] = archivedApps.map((app) => {
    const appApprovals = approvalRecords
      .filter((r) => r.applicationId === app.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r) => ({
        nodeName: r.nodeName,
        approverName: r.approverName,
        action: r.action,
        comment: r.comment,
        date: r.createdAt,
      }));

    const items = app.items.map((item) => {
      const valuation = valuations.find(
        (v) => v.assetId === item.assetId && v.applicationId === app.id
      );
      return {
        assetId: item.assetId,
        assetName: item.assetName,
        assetNo: item.assetNo,
        netValue: item.netValue,
        valuationValue: valuation?.value,
      };
    });

    return {
      id: app.id,
      applicationNo: app.applicationNo,
      applicantName: app.applicantName,
      department: app.department,
      type: app.type,
      typeName: disposalTypeName[app.type] || app.type,
      reason: app.reason,
      estimatedValue: app.estimatedValue,
      items,
      approvals: appApprovals,
      completedAt: app.updatedAt,
    };
  });

  records.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  res.json(success(records));
});

router.get('/asset-flow/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const asset = assets.find((a) => a.id === id);

  if (!asset) {
    res.status(404).json(error('资产不存在'));
    return;
  }

  const flow: AssetFlowNode[] = [
    {
      id: 'flow1',
      type: 'purchase',
      typeName: '采购入库',
      department: '采购部',
      custodian: '采购员',
      date: asset.purchaseDate,
      description: `${asset.name} 采购入库，资产编号：${asset.assetNo}，原值：${asset.originalValue} 元`,
    },
    {
      id: 'flow2',
      type: 'assign',
      typeName: '领用分配',
      department: asset.department,
      custodian: asset.custodian,
      date: asset.purchaseDate,
      description: `分配至 ${asset.department}，保管人：${asset.custodian}，存放位置：${asset.location}`,
    },
  ];

  const relatedApplications = applications.filter((app) =>
    app.items.some((item) => item.assetId === id)
  );

  relatedApplications.forEach((app, idx) => {
    if (app.status === 'completed' || app.status === 'approved') {
      flow.push({
        id: `flow${idx + 3}`,
        type: app.type,
        typeName: `处置${disposalTypeName[app.type] || ''}`,
        department: app.department,
        custodian: app.applicantName,
        date: app.updatedAt,
        description: `处置申请：${app.applicationNo}，类型：${disposalTypeName[app.type] || app.type}，原因：${app.reason}`,
      });
    }
  });

  if (asset.status === 'disposed') {
    flow.push({
      id: `flow${flow.length + 1}`,
      type: 'disposed',
      typeName: '处置完成',
      department: '-',
      custodian: '-',
      date: new Date().toISOString().split('T')[0],
      description: '资产已完成处置，退出台账',
    });
  }

  res.json(success(flow));
});

router.get('/export', (req: Request, res: Response): void => {
  const headers = [
    '资产编号',
    '资产名称',
    '分类',
    '状态',
    '部门',
    '保管人',
    '存放位置',
    '原值',
    '净值',
    '购入日期',
    '备注',
  ];

  const statusName: Record<string, string> = {
    in_use: '使用中',
    idle: '闲置',
    repairing: '维修中',
    pending_disposal: '待处置',
    disposed: '已处置',
  };

  const rows = assets.map((a) => [
    a.assetNo,
    a.name,
    a.category,
    statusName[a.status] || a.status,
    a.department,
    a.custodian,
    a.location,
    a.originalValue.toString(),
    a.netValue.toString(),
    a.purchaseDate,
    a.description,
  ]);

  const csv =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=asset-ledger.csv');

  const result = {
    filename: 'asset-ledger.csv',
    contentType: 'text/csv',
    content: csv,
  };

  res.json(success(result, '导出成功'));
});

export default router;
