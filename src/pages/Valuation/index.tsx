import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  BarChart3,
  List,
  FileText,
  Search,
  Upload,
  X,
  DollarSign,
  ClipboardCheck,
  Target,
  BarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useValuationStore } from '@/store/valuationStore';
import { useAssetStore } from '@/store/assetStore';
import Modal from '@/components/common/Modal';
import StatusTag from '@/components/common/StatusTag';
import { mockAssets } from '@/mock/data';
import type { Valuation, ValuationMethod } from '@/types';

const valuationMethodLabels: Record<ValuationMethod, string> = {
  cost: '成本法',
  market: '市场法',
  income: '收益法',
  expert: '专家评估',
};

const valuationMethodColors: Record<ValuationMethod, string> = {
  cost: 'bg-primary-50 text-primary-700 border-primary-200',
  market: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  income: 'bg-warning-50 text-warning-700 border-warning-200',
  expert: 'bg-danger-50 text-danger-700 border-danger-200',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function Valuation() {
  const { hasPermission } = useAuthStore();
  const { valuations, addValuation, initializeData: initValuationData } = useValuationStore();
  const { assets, initializeData: initAssetData } = useAssetStore();
  const canCreateValuation = hasPermission('createValuation');

  const [activeTab, setActiveTab] = useState<'list' | 'analysis'>('list');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    initValuationData();
    initAssetData();
  }, [initValuationData, initAssetData]);

  const [newValuation, setNewValuation] = useState({
    assetId: '',
    method: '' as ValuationMethod | '',
    value: '',
    basis: '',
  });
  const [fileName, setFileName] = useState('');

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = valuations.filter((v) => {
      const d = new Date(v.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const pending = valuations.filter((v) => v.status === 'pending_review');
    const reviewed = valuations.filter((v) => v.status === 'reviewed');
    let accuracy = 0;
    if (reviewed.length > 0) {
      const totalAccuracy = reviewed.reduce((sum, v) => {
        const diff = Math.abs(v.value - v.netValue) / v.netValue;
        return sum + Math.max(0, 1 - diff);
      }, 0);
      accuracy = Math.round((totalAccuracy / reviewed.length) * 100);
    }

    return {
      total: valuations.length,
      thisMonth: thisMonth.length,
      pending: pending.length,
      accuracy,
    };
  }, [valuations]);

  const filteredValuations = useMemo(() => {
    return valuations.filter((v) => {
      if (methodFilter !== 'all' && v.method !== methodFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      return true;
    });
  }, [valuations, methodFilter, statusFilter]);

  const comparisonData = useMemo(() => {
    const categoryMap = new Map<string, { original: number; net: number; value: number; count: number }>();

    valuations.forEach((v) => {
      const asset = assets.find((a) => a.id === v.assetId);
      const category = asset?.category || '其他';
      const existing = categoryMap.get(category) || { original: 0, net: 0, value: 0, count: 0 };
      categoryMap.set(category, {
        original: existing.original + v.originalValue,
        net: existing.net + v.netValue,
        value: existing.value + v.value,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [valuations, assets]);

  const maxValue = useMemo(() => {
    let max = 0;
    comparisonData.forEach((d) => {
      max = Math.max(max, d.original, d.net, d.value);
    });
    return max || 1;
  }, [comparisonData]);

  function handleFileUpload() {
    setFileName('评估报告_' + Date.now() + '.pdf');
  }

  function handleCreate() {
    if (!newValuation.assetId || !newValuation.method || !newValuation.value) return;

    const asset = assets.find((a) => a.id === newValuation.assetId);
    if (!asset) return;

    const valuation: Valuation = {
      id: `v${Date.now()}`,
      valuationNo: `VAL-NEW-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      assetNo: asset.assetNo,
      method: newValuation.method,
      value: Number(newValuation.value),
      originalValue: asset.originalValue,
      netValue: asset.netValue,
      valuatorId: 'u3',
      valuatorName: '王强',
      status: 'pending_review',
      basis: newValuation.basis,
      reportUrl: fileName || undefined,
      createdAt: new Date().toISOString(),
    };

    addValuation(valuation);
    setShowCreateModal(false);
    setNewValuation({ assetId: '', method: '', value: '', basis: '' });
    setFileName('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">估值记录</h1>
        {canCreateValuation && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新增估值
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">总估值记录</span>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">累计估值记录数</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">本月新增</span>
            <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.thisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">本月新增估值记录</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">待审核估值</span>
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-warning-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
          <p className="text-xs text-slate-400 mt-1">等待财务审核</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">平均估值准确率</span>
            <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-danger-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.accuracy}%</p>
          <p className="text-xs text-slate-400 mt-1">与账面净值偏离度</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'list'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <List className="w-4 h-4" />
          估值列表
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'analysis'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          对比分析
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">估值方式：</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">全部</option>
                <option value="cost">成本法</option>
                <option value="market">市场法</option>
                <option value="income">收益法</option>
                <option value="expert">专家评估</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">审核状态：</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">全部</option>
                <option value="draft">草稿</option>
                <option value="pending_review">待审核</option>
                <option value="reviewed">已审核</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>

            <div className="flex-1 max-w-xs relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索估值编号或资产..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      估值编号
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      资产名称
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      估值方式
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      估值金额
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      原值
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      净值
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      估值人
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      估值日期
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      状态
                    </th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredValuations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-20 text-center text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>暂无估值记录</p>
                      </td>
                    </tr>
                  ) : (
                    filteredValuations.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900 whitespace-nowrap">
                          {v.valuationNo}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {v.assetName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
                              valuationMethodColors[v.method]
                            )}
                          >
                            {valuationMethodLabels[v.method]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-secondary-600 whitespace-nowrap">
                          {formatCurrency(v.value)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-500 whitespace-nowrap">
                          {formatCurrency(v.originalValue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-slate-500 whitespace-nowrap">
                          {formatCurrency(v.netValue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {v.valuatorName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(v.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusTag type="valuation" status={v.status} />
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-slate-500">总原值</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(comparisonData.reduce((sum, d) => sum + d.original, 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-warning-500" />
                <span className="text-sm text-slate-500">总净值</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(comparisonData.reduce((sum, d) => sum + d.net, 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-secondary-500" />
                <span className="text-sm text-slate-500">总估值</span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(comparisonData.reduce((sum, d) => sum + d.value, 0))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">原值 - 净值 - 估值对比</h3>
            </div>

            <div className="space-y-8">
              {comparisonData.map((data) => (
                <div key={data.category}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{data.category}</h4>
                      <p className="text-xs text-slate-400">共 {data.count} 项资产</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-xs text-slate-500 shrink-0">原值</span>
                      <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                          style={{ width: `${(data.original / maxValue) * 100}%` }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {formatCurrency(data.original)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-xs text-slate-500 shrink-0">净值</span>
                      <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-warning-400 rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                          style={{ width: `${(data.net / maxValue) * 100}%` }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {formatCurrency(data.net)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-16 text-xs text-slate-500 shrink-0">估值</span>
                      <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-secondary-400 rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                          style={{ width: `${(data.value / maxValue) * 100}%` }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {formatCurrency(data.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-primary-400" />
                <span className="text-xs text-slate-600">原值</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-warning-400" />
                <span className="text-xs text-slate-600">净值</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-secondary-400" />
                <span className="text-xs text-slate-600">估值</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewValuation({ assetId: '', method: '', value: '', basis: '' });
          setFileName('');
        }}
        title="新增估值"
        width="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewValuation({ assetId: '', method: '', value: '', basis: '' });
                setFileName('');
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!newValuation.assetId || !newValuation.method || !newValuation.value}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交估值
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              选择资产 <span className="text-danger-500">*</span>
            </label>
            <select
              value={newValuation.assetId}
              onChange={(e) => setNewValuation({ ...newValuation, assetId: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">请选择需要估值的资产</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetNo} - {asset.name}（净值: {formatCurrency(asset.netValue)}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              估值方式 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(valuationMethodLabels) as ValuationMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setNewValuation({ ...newValuation, method })}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-medium border transition-all text-left',
                    newValuation.method === method
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {valuationMethodLabels[method]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              估值金额（元） <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
              <input
                type="number"
                value={newValuation.value}
                onChange={(e) => setNewValuation({ ...newValuation, value: e.target.value })}
                placeholder="请输入估值金额"
                className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">估值依据说明</label>
            <textarea
              value={newValuation.basis}
              onChange={(e) => setNewValuation({ ...newValuation, basis: e.target.value })}
              placeholder="请简要说明估值依据和参考标准..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">上传评估报告</label>
            {fileName ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-5 h-5 text-primary-500" />
                <span className="text-sm text-slate-700 flex-1">{fileName}</span>
                <button
                  onClick={() => setFileName('')}
                  className="p-1 rounded hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFileUpload}
                className="w-full flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary-400 hover:bg-primary-50/30 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">点击上传或拖拽文件到此处</span>
                <span className="text-xs text-slate-400 mt-1">支持 PDF、Word、Excel 格式</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
