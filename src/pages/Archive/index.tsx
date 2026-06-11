import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileDown,
  ArrowLeft,
  Package,
  UserCheck,
  Wrench,
  PauseCircle,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Archive as ArchiveIcon,
  Calendar,
  Building2,
  Hash,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusTag from '@/components/common/StatusTag';
import { useApplicationStore } from '@/store/applicationStore';
import { useAssetStore } from '@/store/assetStore';
import { useAuthStore } from '@/store/authStore';
import { generateDisposalDoc } from '@/utils/exportDisposal';
import { downloadTextFile } from '@/utils/downloadFile';
import type { Application, DisposalType, ApplicationStatus, Asset } from '@/types';

type TabType = 'ledger' | 'lifecycle';

interface ArchiveFilters {
  disposalTypes: DisposalType[];
  statuses: ApplicationStatus[];
  department: string;
  dateRange: [string, string] | null;
  category: string;
  keyword: string;
}

const disposalTypeMap: Record<DisposalType, { label: string; color: string }> = {
  scrap: { label: '报废', color: 'bg-danger-50 text-danger-700 border-danger-200' },
  transfer: { label: '划转', color: 'bg-primary-50 text-primary-700 border-primary-200' },
  auction: { label: '拍卖', color: 'bg-secondary-50 text-secondary-700 border-secondary-200' },
};

const departments = ['技术部', '行政部', '资产管理部', '财务部', '总经办', '市场部', '设计部'];
const categories = ['IT设备', '办公设备', '家具'];
const allDisposalTypes: DisposalType[] = ['scrap', 'transfer', 'auction'];
const allStatuses: ApplicationStatus[] = [
  'draft', 'pending_dept', 'pending_admin', 'pending_finance',
  'pending_handover', 'pending_executive', 'approved', 'rejected',
  'returned', 'completed', 'archived',
];

const lifecycleNodes = [
  { key: 'inbound', label: '入库', icon: Package, color: 'bg-slate-500' },
  { key: 'assign', label: '领用', icon: UserCheck, color: 'bg-primary-500' },
  { key: 'maintain', label: '维护', icon: Wrench, color: 'bg-warning-500' },
  { key: 'idle', label: '闲置', icon: PauseCircle, color: 'bg-slate-400' },
  { key: 'apply', label: '申请处置', icon: FileText, color: 'bg-primary-500' },
  { key: 'approve', label: '审批', icon: ClipboardCheck, color: 'bg-warning-500' },
  { key: 'dispose', label: '处置完成', icon: CheckCircle2, color: 'bg-secondary-500' },
  { key: 'archive', label: '归档', icon: ArchiveIcon, color: 'bg-slate-600' },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatMoney(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Archive() {
  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [assetSearchKeyword, setAssetSearchKeyword] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { user, hasPermission } = useAuthStore();
  const { applications, approvalRecords, handoverRecords, initializeData: initApplicationData } = useApplicationStore();
  const { assets, initializeData: initAssetData } = useAssetStore();

  useEffect(() => {
    initApplicationData();
    initAssetData();
  }, [initApplicationData, initAssetData]);

  const [filters, setFilters] = useState<ArchiveFilters>({
    disposalTypes: [],
    statuses: [],
    department: '',
    dateRange: null,
    category: '',
    keyword: '',
  });

  const pageSize = 5;

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filters.disposalTypes.length > 0 && !filters.disposalTypes.includes(app.type)) {
        return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
        return false;
      }
      if (filters.department && app.department !== filters.department) {
        return false;
      }
      if (filters.category) {
        const hasCategory = app.items.some((item) => {
          const asset = assets.find((a) => a.id === item.assetId);
          return asset?.category === filters.category;
        });
        if (!hasCategory) return false;
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !app.applicationNo.toLowerCase().includes(kw) &&
          !app.applicantName.toLowerCase().includes(kw) &&
          !app.items.some((item) =>
            item.assetName.toLowerCase().includes(kw) ||
            item.assetNo.toLowerCase().includes(kw)
          )
        ) {
          return false;
        }
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const appDate = new Date(app.updatedAt).getTime();
        if (start && appDate < new Date(start).getTime()) return false;
        if (end && appDate > new Date(end).getTime()) return false;
      }
      return true;
    });
  }, [applications, filters, assets]);

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  const filteredAssets = useMemo(() => {
    if (!assetSearchKeyword.trim()) return [];
    const kw = assetSearchKeyword.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.assetNo.toLowerCase().includes(kw)
    ).slice(0, 10);
  }, [assets, assetSearchKeyword]);

  const toggleFilter = (key: 'disposalTypes' | 'statuses', value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value as never)
        ? (prev[key].filter((v) => v !== value) as never)
        : ([...prev[key], value] as never),
    }));
  };

  const resetFilters = () => {
    setFilters({
      disposalTypes: [],
      statuses: [],
      department: '',
      dateRange: null,
      category: '',
      keyword: '',
    });
    setCurrentPage(1);
  };

  const handleExport = () => {
    const headers = ['处置单号', '处置方式', '资产数量', '总估值', '处置部门', '完成时间', '归档人', '状态'];
    const rows = filteredApplications.map((app) => [
      app.applicationNo,
      disposalTypeMap[app.type]?.label || app.type,
      app.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
      formatMoney(app.estimatedValue),
      app.department,
      formatDate(app.updatedAt),
      '系统',
      app.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `处置台账_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDisposalDoc = (app: Application) => {
    const records = approvalRecords[app.id] || [];
    const handoverRecord = handoverRecords[app.id];
    const content = generateDisposalDoc(app, records, handoverRecord);
    downloadTextFile(content, `处置单_${app.applicationNo}.txt`);
  };

  const generateLifecycleData = (asset: Asset) => {
    const baseDate = new Date(asset.purchaseDate).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    return lifecycleNodes.map((node, idx) => {
      let completed = false;
      let date = '';
      let operator = '';
      let detail = '';

      switch (node.key) {
        case 'inbound':
          completed = true;
          date = asset.purchaseDate;
          operator = '系统';
          detail = `入库登记，原值 ${formatMoney(asset.originalValue)}`;
          break;
        case 'assign':
          completed = true;
          date = new Date(baseDate + 3 * dayMs).toISOString().split('T')[0];
          operator = asset.custodian;
          detail = `领用至 ${asset.location}，保管人：${asset.custodian}`;
          break;
        case 'maintain':
          if (asset.status === 'repairing' || ['in_use', 'idle', 'pending_disposal', 'disposed'].includes(asset.status)) {
            completed = true;
            date = new Date(baseDate + 180 * dayMs).toISOString().split('T')[0];
            operator = '王强';
            detail = '例行维护保养';
          }
          break;
        case 'idle':
          if (['idle', 'pending_disposal', 'disposed'].includes(asset.status)) {
            completed = true;
            date = new Date(baseDate + 365 * dayMs).toISOString().split('T')[0];
            operator = '系统';
            detail = '标记为闲置状态';
          }
          break;
        case 'apply':
          if (['pending_disposal', 'disposed'].includes(asset.status)) {
            completed = true;
            const relatedApp = applications.find((app) =>
              app.items.some((item) => item.assetId === asset.id)
            );
            if (relatedApp) {
              date = relatedApp.createdAt.split('T')[0];
              operator = relatedApp.applicantName;
              detail = `${relatedApp.applicationNo}：${relatedApp.reason.slice(0, 30)}...`;
            }
          }
          break;
        case 'approve':
          if (asset.status === 'disposed') {
            completed = true;
            const relatedApp = applications.find((app) =>
              app.items.some((item) => item.assetId === asset.id)
            );
            if (relatedApp) {
              date = relatedApp.updatedAt.split('T')[0];
              operator = '陈总';
              detail = '审批通过';
            }
          }
          break;
        case 'dispose':
          if (asset.status === 'disposed') {
            completed = true;
            date = new Date(baseDate + 500 * dayMs).toISOString().split('T')[0];
            operator = '王强';
            detail = `处置完成，净值 ${formatMoney(asset.netValue)}`;
          }
          break;
        case 'archive':
          if (asset.status === 'disposed') {
            completed = true;
            date = new Date(baseDate + 510 * dayMs).toISOString().split('T')[0];
            operator = '赵敏';
            detail = '档案归档完成';
          }
          break;
      }

      const isCurrent = !completed && idx > 0 && lifecycleNodes[idx - 1] &&
        (lifecycleNodes[idx - 1].key === 'idle' && asset.status === 'idle' ||
         lifecycleNodes[idx - 1].key === 'apply' && asset.status === 'pending_disposal');

      return {
        ...node,
        completed,
        isCurrent,
        date,
        operator,
        detail,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">归档查询</h1>
          <p className="text-slate-500 mt-1">查询已归档的处置台账和资产生命周期</p>
        </div>
        {hasPermission('exportArchive') && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            导出台账
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setShowAdvancedSearch((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700">高级搜索</span>
            {(filters.disposalTypes.length > 0 || filters.statuses.length > 0 || filters.department || filters.category || filters.keyword || filters.dateRange) && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                {[
                  filters.disposalTypes.length,
                  filters.statuses.length,
                  filters.department ? 1 : 0,
                  filters.category ? 1 : 0,
                  filters.keyword ? 1 : 0,
                  filters.dateRange ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
          {showAdvancedSearch ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {showAdvancedSearch && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">处置方式</label>
                <div className="flex flex-wrap gap-2">
                  {allDisposalTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleFilter('disposalTypes', type)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg border transition-all',
                        filters.disposalTypes.includes(type)
                          ? disposalTypeMap[type].color + ' border-current font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {disposalTypeMap[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {allStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleFilter('statuses', status)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg border transition-all',
                        filters.statuses.includes(status)
                          ? 'bg-primary-50 text-primary-700 border-primary-300 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {(() => {
                        const config = {
                          draft: '草稿',
                          pending_dept: '待部门审批',
                          pending_admin: '待行政审核',
                          pending_finance: '待财务审核',
                          pending_handover: '待交接',
                          pending_executive: '待高管审批',
                          approved: '已审批',
                          rejected: '已拒绝',
                          returned: '已退回',
                          completed: '已完成',
                          archived: '已归档',
                        };
                        return config[status];
                      })()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">部门</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">全部部门</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">日期范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.[0] || ''}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dateRange: [e.target.value, p.dateRange?.[1] || ''] as [string, string],
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    value={filters.dateRange?.[1] || ''}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dateRange: [p.dateRange?.[0] || '', e.target.value] as [string, string],
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">资产类别</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">全部类别</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">关键词搜索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))}
                    placeholder="处置单号、资产名称、编号..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ledger')}
              className={cn(
                'px-6 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'ledger'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              处置台账
            </button>
            <button
              onClick={() => setActiveTab('lifecycle')}
              className={cn(
                'px-6 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'lifecycle'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              资产流向
            </button>
          </div>
        </div>

        {activeTab === 'ledger' ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">处置单号</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">处置方式</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">资产数量</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">总估值</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">处置部门</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">完成时间</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">归档人</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedApplications.map((app: Application) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-slate-400" />
                            <span className="font-mono text-sm font-medium text-slate-900">{app.applicationNo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
                            disposalTypeMap[app.type].color
                          )}>
                            {disposalTypeMap[app.type].label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {app.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {formatMoney(app.estimatedValue)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            {app.department}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(app.updatedAt)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                            {user?.name || '系统'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                              <Eye className="w-4 h-4" />
                              详情
                            </button>
                            <button
                              onClick={() => handleDownloadDisposalDoc(app)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <FileDown className="w-4 h-4" />
                              下载处置单
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredApplications.length > 0 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  共 <span className="font-medium text-slate-900">{filteredApplications.length}</span> 条记录，
                  第 <span className="font-medium text-slate-900">{currentPage}</span> / {totalPages} 页
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md transition-colors',
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={assetSearchKeyword}
                onChange={(e) => {
                  setAssetSearchKeyword(e.target.value);
                  setSelectedAsset(null);
                }}
                placeholder="输入资产名称或编号搜索..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {!selectedAsset && assetSearchKeyword && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {filteredAssets.length === 0 ? (
                  <div className="px-5 py-12 text-center text-slate-400">
                    未找到匹配的资产
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{asset.name}</p>
                          <p className="text-sm text-slate-500">{asset.assetNo} · {asset.category}</p>
                        </div>
                        <StatusTag type="asset" status={asset.status} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedAsset && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold text-slate-900">资产生命周期</h3>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-primary-50/30 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-primary-600" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">资产名称</p>
                        <p className="font-medium text-slate-900">{selectedAsset.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">资产编号</p>
                        <p className="font-mono font-medium text-slate-900">{selectedAsset.assetNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">资产类别</p>
                        <p className="font-medium text-slate-900">{selectedAsset.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">当前状态</p>
                        <StatusTag type="asset" status={selectedAsset.status} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">使用部门</p>
                        <p className="font-medium text-slate-900">{selectedAsset.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">保管人</p>
                        <p className="font-medium text-slate-900">{selectedAsset.custodian}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">原值 / 净值</p>
                        <p className="font-medium text-slate-900">
                          {formatMoney(selectedAsset.originalValue)} / {formatMoney(selectedAsset.netValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">购置日期</p>
                        <p className="font-medium text-slate-900">{formatDate(selectedAsset.purchaseDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-6">全生命周期时间线</h4>
                  <div className="relative">
                    <div className="overflow-x-auto pb-4">
                      <div className="flex items-start gap-2 min-w-max">
                        {generateLifecycleData(selectedAsset).map((node, idx) => (
                          <div key={node.key} className="flex items-start">
                            <div className="flex flex-col items-center" style={{ width: '130px' }}>
                              <div
                                className={cn(
                                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                                  node.completed
                                    ? `${node.color} text-white shadow-lg`
                                    : node.isCurrent
                                    ? 'bg-primary-500 text-white ring-4 ring-primary-100 animate-pulse'
                                    : 'bg-slate-100 border-2 border-slate-200 text-slate-400'
                                )}
                              >
                                <node.icon className="w-5 h-5" />
                              </div>
                              <div className="mt-3 text-center">
                                <p className={cn(
                                  'text-sm font-medium',
                                  node.completed ? 'text-slate-900' : node.isCurrent ? 'text-primary-600' : 'text-slate-400'
                                )}>
                                  {node.label}
                                </p>
                                {node.date && (
                                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {node.date}
                                  </div>
                                )}
                                {node.operator && (
                                  <p className="mt-1 text-xs text-slate-600">{node.operator}</p>
                                )}
                                {node.detail && (
                                  <p className="mt-1.5 text-xs text-slate-500 px-2 leading-relaxed">
                                    {node.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                            {idx < lifecycleNodes.length - 1 && (
                              <div className="flex items-center pt-5" style={{ width: '32px' }}>
                                <div
                                  className={cn(
                                    'w-full h-0.5 rounded',
                                    node.completed ? node.color : 'bg-slate-200'
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!assetSearchKeyword && !selectedAsset && (
              <div className="px-5 py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">输入资产名称或编号，查看资产生命周期</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
