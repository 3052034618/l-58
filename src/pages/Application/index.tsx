import { useState, useMemo, useRef } from 'react';
import {
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  TrendingDown,
  FileText,
  Send,
  Building2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusTag from '@/components/common/StatusTag';
import ApprovalTimeline from '@/components/business/ApprovalTimeline';
import { useAssetStore } from '@/store/assetStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useAuthStore } from '@/store/authStore';
import type { Asset, DisposalType, ApplicationItem } from '@/types';
import { useEffect } from 'react';
import { mockAssets } from '@/mock/data';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  type: DisposalType;
  reason: string;
  department: string;
  estimatedValue: number;
  remark: string;
  photos: string[];
}

const steps = [
  { id: 1 as Step, title: '选择资产', icon: Search },
  { id: 2 as Step, title: '填写信息', icon: FileText },
  { id: 3 as Step, title: '上传照片', icon: ImageIcon },
  { id: 4 as Step, title: '确认提交', icon: Send },
];

const disposalTypeLabels: Record<DisposalType, string> = {
  scrap: '报废',
  transfer: '转让',
  auction: '拍卖',
};

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

const approvalNodes = [
  { node: 'pending_dept', nodeName: '部门负责人审批' },
  { node: 'pending_admin', nodeName: '行政人员核查' },
  { node: 'pending_finance', nodeName: '财务人员审批' },
  { node: 'pending_handover', nodeName: '实物交接确认' },
  { node: 'pending_executive', nodeName: '高管终审' },
];

export default function ApplicationPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formData, setFormData] = useState<FormData>({
    type: 'scrap',
    reason: '',
    department: '',
    estimatedValue: 0,
    remark: '',
    photos: [],
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { assets, setAssets } = useAssetStore();
  const { addApplication } = useApplicationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (assets.length === 0) {
      setAssets(mockAssets);
    }
  }, [assets.length, setAssets]);

  const filteredAssets = useMemo(() => {
    if (!searchKeyword.trim()) return assets;
    const kw = searchKeyword.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(kw) ||
        a.assetNo.toLowerCase().includes(kw) ||
        a.category.toLowerCase().includes(kw)
    );
  }, [assets, searchKeyword]);

  const selectedAssets = useMemo(() => {
    return assets.filter((a) => selectedAssetIds.includes(a.id));
  }, [assets, selectedAssetIds]);

  const totalNetValue = useMemo(() => {
    return selectedAssets.reduce((sum, a) => sum + a.netValue, 0);
  }, [selectedAssets]);

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId));
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedAssetIds.length === 0) return;
    if (currentStep < 4) setCurrentStep((s) => (s + 1) as Step);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as Step);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    handleAddPhotos(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    handleAddPhotos(files);
  };

  const handleAddPhotos = (files: File[]) => {
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!user) return;

    const items: ApplicationItem[] = selectedAssets.map((asset, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      assetId: asset.id,
      assetName: asset.name,
      assetNo: asset.assetNo,
      originalValue: asset.originalValue,
      netValue: asset.netValue,
      quantity: 1,
      remark: '',
    }));

    const application = {
      id: `app_${Date.now()}`,
      applicationNo: `DISP-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, '0')}`,
      applicantId: user.id,
      applicantName: user.name,
      type: formData.type,
      reason: formData.reason,
      department: formData.department || user.department,
      estimatedValue: formData.estimatedValue || totalNetValue,
      status: 'pending_dept' as const,
      photos: formData.photos,
      items,
      currentNode: 'pending_dept',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addApplication(application);
    alert('申请提交成功！');
    setCurrentStep(1);
    setSelectedAssetIds([]);
    setFormData({
      type: 'scrap',
      reason: '',
      department: '',
      estimatedValue: 0,
      remark: '',
      photos: [],
    });
  };

  const canGoNext = () => {
    if (currentStep === 1) return selectedAssetIds.length > 0;
    if (currentStep === 2) return formData.reason.trim().length > 0 && formData.department;
    return true;
  };

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-between mb-8 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                    isCompleted && 'bg-secondary-500 text-white',
                    isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100',
                    !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary-600' : isCompleted ? 'text-secondary-600' : 'text-slate-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400">步骤 {step.id}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 rounded-full',
                    isCompleted ? 'bg-secondary-400' : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-5 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索资产名称、编号或类别..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredAssets.length > 0 && selectedAssetIds.length === filteredAssets.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  资产编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  净值
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  使用部门
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset: Asset, idx: number) => (
                <tr
                  key={asset.id}
                  className={cn(
                    'transition-colors cursor-pointer',
                    idx % 2 === 1 && 'bg-slate-50/50',
                    selectedAssetIds.includes(asset.id) && 'bg-primary-50',
                    'hover:bg-primary-50/70'
                  )}
                  onClick={() => handleToggleAsset(asset.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => handleToggleAsset(asset.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{asset.assetNo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{asset.category}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-700">
                    ¥{asset.netValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag type="asset" status={asset.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{asset.department}</td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    暂无匹配的资产
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedAssets.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">已选资产</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                  {selectedAssets.length} 项
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingDown className="w-4 h-4 text-warning-500" />
                <span>净值合计：</span>
                <span className="font-semibold text-slate-900">¥{totalNetValue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm"
                >
                  <span className="font-medium text-slate-700">{asset.name}</span>
                  <span className="text-slate-400">({asset.assetNo})</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAsset(asset.id);
                    }}
                    className="ml-1 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              处置方式 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(disposalTypeLabels) as DisposalType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={cn(
                    'py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                    formData.type === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  )}
                >
                  {disposalTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              处置原因 <span className="text-danger-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="请详细说明资产处置的原因..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              使用部门 <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
            >
              <option value="">请选择部门</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              预计残值（元）
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
              <input
                type="number"
                min={0}
                value={formData.estimatedValue || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedValue: Number(e.target.value) || 0,
                  }))
                }
                placeholder={`参考净值合计：¥${totalNetValue.toLocaleString()}`}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">备注</label>
            <textarea
              rows={3}
              value={formData.remark}
              onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
              placeholder="其他需要说明的情况..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              'relative rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer',
              isDragOver
                ? 'border-primary-400 bg-primary-50'
                : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">拖拽照片到此处，或点击上传</p>
                <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式，可多选</p>
              </div>
            </div>
          </div>

          {formData.photos.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">
                  已上传 <span className="text-primary-600">{formData.photos.length}</span> 张照片
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    <img
                      src={photo}
                      alt={`photo-${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-danger-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStep4() {
    const timelineItems = approvalNodes.map((n, idx) => ({
      id: n.node,
      nodeName: n.nodeName,
      status: (idx === 0 ? 'current' : 'pending') as 'current' | 'pending',
    }));

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            申请信息汇总
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">处置方式</p>
                <p className="text-sm font-medium text-slate-900">
                  {disposalTypeLabels[formData.type]}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">使用部门</p>
                <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {formData.department || user?.department}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">预计残值</p>
                <p className="text-sm font-semibold text-warning-600">
                  ¥{(formData.estimatedValue || totalNetValue).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">申请人</p>
                <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {user?.name || '未登录'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">处置原因</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                  {formData.reason}
                </p>
              </div>
              {formData.remark && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">备注</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    {formData.remark}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-warning-500" />
            处置资产明细 ({selectedAssets.length} 项)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    资产编号
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    类别
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    原值
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    净值
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">{asset.assetNo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{asset.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{asset.category}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">
                      ¥{asset.originalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-warning-600">
                      ¥{asset.netValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-sm text-right text-slate-600">
                    净值合计
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-warning-600">
                    ¥{totalNetValue.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {formData.photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-500" />
              附件照片 ({formData.photos.length} 张)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {formData.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                >
                  <img src={photo} alt={`photo-${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Check className="w-5 h-5 text-secondary-500" />
            审批流程预览
          </h3>
          <ApprovalTimeline items={timelineItems} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">资产处置申请</h1>
        <p className="mt-1 text-sm text-slate-500">
          按步骤填写申请信息，提交后将进入审批流程
        </p>
      </div>

      {renderStepIndicator()}

      <div className="mb-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={cn(
            'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            currentStep === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className={cn(
              'inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              canGoNext()
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            提交申请
          </button>
        )}
      </div>
    </div>
  );
}
