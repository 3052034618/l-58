import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  TrendingDown,
  RefreshCw,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusTag from '@/components/common/StatusTag';
import { useAssetStore } from '@/store/assetStore';
import { useAuthStore } from '@/store/authStore';
import type { AssetStatus, Asset } from '@/types';

const PAGE_SIZE = 8;

const categoryOptions = ['IT设备', '办公设备', '家具'];

const statusOptions: { value: AssetStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'in_use', label: '使用中' },
  { value: 'idle', label: '闲置' },
  { value: 'repairing', label: '维修中' },
  { value: 'pending_disposal', label: '待处置' },
  { value: 'disposed', label: '已处置' },
];

const departmentOptions = [
  '技术部',
  '行政部',
  '资产管理部',
  '财务部',
  '总经办',
  '市场部',
  '设计部',
  '销售部',
];

export default function AssetsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  const {
    assets,
    filters,
    setFilters,
    resetFilters,
    selectedAssetIds,
    toggleSelectedAsset,
    setSelectedAssetIds,
    clearSelectedAssets,
    batchUpdateStatus,
    filteredAssets,
    initializeData,
  } = useAssetStore();

  const { user, hasPermission } = useAuthStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const list = filteredAssets();

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const allSelectedOnPage =
    paginatedAssets.length > 0 &&
    paginatedAssets.every((a) => selectedAssetIds.includes(a.id));

  const handleToggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      const pageIds = new Set(paginatedAssets.map((a) => a.id));
      setSelectedAssetIds(selectedAssetIds.filter((id) => !pageIds.has(id)));
    } else {
      const merged = new Set([...selectedAssetIds, ...paginatedAssets.map((a) => a.id)]);
      setSelectedAssetIds(Array.from(merged));
    }
  };

  const handleBatchDisposal = () => {
    alert(`已选择 ${selectedAssetIds.length} 项资产申请处置`);
  };

  const handleBatchUpdateStatus = (status: AssetStatus) => {
    batchUpdateStatus(selectedAssetIds, status);
    setShowStatusMenu(null);
    clearSelectedAssets();
  };

  const handleViewDetail = (asset: Asset) => {
    alert(`查看资产详情：${asset.name} (${asset.assetNo})`);
  };

  const handleApplyDisposal = (asset: Asset) => {
    alert(`申请处置资产：${asset.name} (${asset.assetNo})`);
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">资产清单</h1>
          <p className="mt-1 text-sm text-slate-500">
            管理和查看企业全部固定资产信息
          </p>
        </div>
        {hasPermission('editAssets') && (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            新建资产
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索资产名称或编号..."
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
          >
            <option value="">全部类别</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as AssetStatus | '' })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ department: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
            >
              <option value="">全部部门</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      {selectedAssetIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-semibold">
              {selectedAssetIds.length}
            </span>
            <span className="text-sm font-medium text-primary-700">
              已选择 {selectedAssetIds.length} 项资产
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDisposal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-warning-500 text-white text-sm font-medium hover:bg-warning-600 transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              批量申请处置
            </button>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(showStatusMenu === 'batch' ? null : 'batch')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                批量更新状态
              </button>
              {showStatusMenu === 'batch' && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px] z-10">
                  {statusOptions
                    .filter((s) => s.value !== '')
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleBatchUpdateStatus(opt.value as AssetStatus)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button
              onClick={clearSelectedAssets}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/50 transition-all"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-12 px-4 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={handleToggleSelectAllOnPage}
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                  />
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  资产编号
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  原值
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  净值
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  使用部门
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  购入日期
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAssets.map((asset, idx) => (
                <tr
                  key={asset.id}
                  className={cn(
                    'transition-colors',
                    idx % 2 === 1 && 'bg-slate-50/50',
                    selectedAssetIds.includes(asset.id) && 'bg-primary-50',
                    'hover:bg-primary-50/60'
                  )}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => toggleSelectedAsset(asset.id)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-sm font-mono text-slate-600">
                    {asset.assetNo}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                    {asset.name}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{asset.category}</td>
                  <td className="px-4 py-3.5 text-sm text-right text-slate-600">
                    ¥{asset.originalValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-right font-medium text-slate-700">
                    ¥{asset.netValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusTag type="asset" status={asset.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {asset.department}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {formatDate(asset.purchaseDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        onClick={() => handleViewDetail(asset)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {asset.status !== 'disposed' && (
                        <button
                          onClick={() => handleApplyDisposal(asset)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-warning-600 hover:bg-warning-50 transition-all"
                          title="申请处置"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowStatusMenu(showStatusMenu === asset.id ? null : asset.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showStatusMenu === asset.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px] z-10">
                            <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">
                              更新状态为
                            </div>
                            {statusOptions
                              .filter((s) => s.value !== '')
                              .map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    batchUpdateStatus([asset.id], opt.value as AssetStatus);
                                    setShowStatusMenu(null);
                                  }}
                                  className={cn(
                                    'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                                    asset.status === opt.value
                                      ? 'text-primary-600 bg-primary-50'
                                      : 'text-slate-700 hover:bg-slate-50'
                                  )}
                                >
                                  <span>{opt.label}</span>
                                  {asset.status === opt.value && (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAssets.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-10 h-10 text-slate-300" />
                      <p className="text-sm text-slate-400">暂无匹配的资产数据</p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 text-sm text-primary-500 hover:text-primary-600"
                      >
                        重置筛选条件
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {list.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              共 <span className="font-medium text-slate-700">{list.length}</span> 条，第{' '}
              <span className="font-medium text-slate-700">{currentPage}</span> /{' '}
              <span className="font-medium text-slate-700">{totalPages}</span> 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  currentPage === 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all',
                    currentPage === page
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  currentPage === totalPages
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
