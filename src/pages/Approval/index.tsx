import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  History,
  ChevronDown,
  Search,
  Eye,
  CheckCircle,
  User,
  Building2,
  Calendar,
  Package,
  Banknote,
  GitBranch,
  ArrowRightLeft,
  PackageCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApplicationStore, nodeNameMap } from '@/store/applicationStore';
import { useAuthStore } from '@/store/authStore';
import Modal from '@/components/common/Modal';
import StatusTag from '@/components/common/StatusTag';
import ApprovalTimeline, { recordsToTimeline } from '@/components/business/ApprovalTimeline';
import type { Application, DisposalType } from '@/types';

const disposalTypeLabels: Record<DisposalType, string> = {
  scrap: '报废处置',
  transfer: '内部划转',
  auction: '公开拍卖',
};

const disposalTypeColors: Record<DisposalType, string> = {
  scrap: 'bg-danger-50 text-danger-700 border-danger-200',
  transfer: 'bg-primary-50 text-primary-700 border-primary-200',
  auction: 'bg-warning-50 text-warning-700 border-warning-200',
};

const urgencyLabels = ['全部', '普通', '紧急', '特急'];

const allNodes = [
  { node: 'pending_dept', nodeName: '部门负责人审批' },
  { node: 'pending_admin', nodeName: '行政人员核查' },
  { node: 'pending_finance', nodeName: '财务人员审批' },
  { node: 'pending_handover', nodeName: '实物交接确认' },
  { node: 'pending_executive', nodeName: '高管终审' },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function Approval() {
  const {
    todoTasks,
    doneTasks,
    approvalRecords,
    approve,
    reject,
    returnBack,
    transfer,
    confirmHandover,
    initializeData,
    refreshTodoTasks,
    refreshDoneTasks,
    isInitialized,
  } = useApplicationStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverRemark, setHandoverRemark] = useState('');

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, initializeData]);

  useEffect(() => {
    if (user) {
      refreshTodoTasks(user);
      refreshDoneTasks(user);
    }
  }, [user, refreshTodoTasks, refreshDoneTasks]);

  const filteredTodoTasks = useMemo(() => {
    return todoTasks.filter((task) => {
      if (typeFilter !== 'all' && task.type !== typeFilter) return false;
      return true;
    });
  }, [todoTasks, typeFilter]);

  const timelineItems = useMemo(() => {
    if (!selectedApplication) return [];
    const records = approvalRecords[selectedApplication.id] || [];
    return recordsToTimeline(records, selectedApplication.currentNode, allNodes);
  }, [selectedApplication, approvalRecords]);

  function handleQuickPass(application: Application) {
    if (!user) return;
    if (application.currentNode === 'pending_handover') {
      confirmHandover(application.id, user, '快速交接确认');
    } else {
      approve(application.id, user, '快速通过');
    }
  }

  function handleApprove() {
    if (!selectedApplication || !user) return;
    approve(selectedApplication.id, user, '同意');
    setSelectedApplication(null);
  }

  function handleReject() {
    if (!selectedApplication || !user) return;
    reject(selectedApplication.id, user, '驳回申请');
    setSelectedApplication(null);
  }

  function handleReturn() {
    if (!selectedApplication || !user || !returnReason.trim()) return;
    returnBack(selectedApplication.id, user, returnReason);
    setSelectedApplication(null);
    setReturnReason('');
    setShowReturnForm(false);
  }

  function handleTransfer() {
    if (!selectedApplication || !user || !transferTarget) return;
    transfer(selectedApplication.id, user, `转交给 ${transferTarget}`, transferTarget);
    setShowTransferModal(false);
    setTransferTarget('');
  }

  function handleConfirmHandover() {
    if (!selectedApplication || !user) return;
    confirmHandover(selectedApplication.id, user, handoverRemark);
    setSelectedApplication(null);
    setShowHandoverModal(false);
    setHandoverRemark('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">审批看板</h1>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('todo')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'todo'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <ClipboardList className="w-4 h-4" />
          待办任务
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs',
              activeTab === 'todo' ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-600'
            )}
          >
            {todoTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'done'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <History className="w-4 h-4" />
          已办历史
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs',
              activeTab === 'done' ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-600'
            )}
          >
            {doneTasks.length}
          </span>
        </button>
      </div>

      {activeTab === 'todo' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowUrgencyDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
              >
                申请类型
                <span className="text-slate-900 font-medium">
                  {typeFilter === 'all' ? '全部' : disposalTypeLabels[typeFilter as DisposalType]}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      setTypeFilter('all');
                      setShowTypeDropdown(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                      typeFilter === 'all' && 'text-primary-600 bg-primary-50'
                    )}
                  >
                    全部
                  </button>
                  {(Object.keys(disposalTypeLabels) as DisposalType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setShowTypeDropdown(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        typeFilter === type && 'text-primary-600 bg-primary-50'
                      )}
                    >
                      {disposalTypeLabels[type]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowUrgencyDropdown(!showUrgencyDropdown);
                  setShowTypeDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
              >
                紧急程度
                <span className="text-slate-900 font-medium">{urgencyFilter === 'all' ? '全部' : urgencyFilter}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showUrgencyDropdown && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  {urgencyLabels.map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        setUrgencyFilter(label === '全部' ? 'all' : label);
                        setShowUrgencyDropdown(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        (label === '全部' ? 'all' : label) === urgencyFilter && 'text-primary-600 bg-primary-50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 max-w-xs relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索申请编号..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          {filteredTodoTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ClipboardList className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">暂无待办任务</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTodoTasks.map((task) => (
                <div
                  key={task.id}
                  className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedApplication(task)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-semibold text-slate-900">
                        {task.applicationNo}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
                          disposalTypeColors[task.type]
                        )}
                      >
                        {disposalTypeLabels[task.type]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{task.applicantName}</span>
                      <span className="text-slate-300">·</span>
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{task.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatDate(task.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-3 border-y border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">资产</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {task.items.length} 件
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">预计</span>
                      <span className="text-sm font-semibold text-secondary-600">
                        {formatCurrency(task.estimatedValue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <GitBranch className="w-4 h-4 text-slate-400" />
                    <StatusTag type="application" status={task.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplication(task);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                    {task.currentNode === 'pending_handover' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplication(task);
                          setShowHandoverModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4" />
                        确认交接
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickPass(task);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-secondary-500 text-white rounded-lg text-sm font-medium hover:bg-secondary-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        快速通过
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'done' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  申请编号
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  申请人
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  处理时间
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  处理结果
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doneTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无已办记录</p>
                  </td>
                </tr>
              ) : (
                doneTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">
                      {task.applicationNo}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
                          disposalTypeColors[task.type]
                        )}
                      >
                        {disposalTypeLabels[task.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{task.applicantName}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(task.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <StatusTag type="application" status={task.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedApplication(task)}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!selectedApplication && !showHandoverModal}
        onClose={() => {
          setSelectedApplication(null);
          setReturnReason('');
          setShowReturnForm(false);
        }}
        title="申请详情"
        width="max-w-4xl"
        footer={
          selectedApplication && activeTab === 'todo' && todoTasks.some((t) => t.id === selectedApplication.id) ? (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                转交他人
              </button>
              <div className="flex items-center gap-3">
                {selectedApplication.currentNode === 'pending_handover' ? (
                  <button
                    onClick={() => setShowHandoverModal(true)}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    确认交接
                  </button>
                ) : showReturnForm ? (
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="请填写退回原因..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                    <button
                      onClick={() => {
                        setShowReturnForm(false);
                        setReturnReason('');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReturn}
                      disabled={!returnReason.trim()}
                      className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm font-medium hover:bg-warning-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      确认退回
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowReturnForm(true)}
                      className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm font-medium hover:bg-warning-600 transition-colors"
                    >
                      退回
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 bg-danger-500 text-white rounded-lg text-sm font-medium hover:bg-danger-600 transition-colors"
                    >
                      驳回
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-6 py-2 bg-secondary-500 text-white rounded-lg text-sm font-medium hover:bg-secondary-600 transition-colors"
                    >
                      通过
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">申请编号</p>
                <p className="text-sm font-semibold text-slate-900 font-mono">
                  {selectedApplication.applicationNo}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">处置方式</p>
                <p className="text-sm font-semibold text-slate-900">
                  {disposalTypeLabels[selectedApplication.type]}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">申请人</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedApplication.applicantName}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">所属部门</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedApplication.department}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1.5">申请原因</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedApplication.reason}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                资产清单
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">资产编号</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">资产名称</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">原值</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">净值</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedApplication.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-600 font-mono">{item.assetNo}</td>
                        <td className="px-4 py-3 text-slate-900">{item.assetName}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.originalValue)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.netValue)}</td>
                        <td className="px-4 py-3 text-center text-slate-900 font-medium">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                审批流程
              </h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <ApprovalTimeline items={timelineItems} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferTarget('');
        }}
        title="转交审批"
        width="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowTransferModal(false);
                setTransferTarget('');
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleTransfer}
              disabled={!transferTarget}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认转交
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">转交审批人</label>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">请选择审批人</option>
              <option value="u1">张伟 - 技术部主管</option>
              <option value="u2">李娜 - 行政部主管</option>
              <option value="u3">王强 - 资产管理员</option>
              <option value="u4">赵敏 - 财务</option>
              <option value="u5">陈总 - 高管</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            转交后，该审批任务将由被转交人处理，您将不再收到该任务的提醒。
          </p>
        </div>
      </Modal>

      <Modal
        open={showHandoverModal}
        onClose={() => {
          setShowHandoverModal(false);
          setHandoverRemark('');
        }}
        title="实物交接确认"
        width="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowHandoverModal(false);
                setHandoverRemark('');
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmHandover}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              确认交接
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedApplication && (
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <PackageCheck className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-primary-700">交接信息</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-600">
                  申请编号：<span className="font-mono text-slate-900">{selectedApplication.applicationNo}</span>
                </p>
                <p className="text-slate-600">
                  资产数量：<span className="font-medium text-slate-900">{selectedApplication.items.length} 件</span>
                </p>
                <p className="text-slate-600">
                  接收部门：<span className="font-medium text-slate-900">{selectedApplication.department}</span>
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">交接备注</label>
            <textarea
              rows={4}
              value={handoverRemark}
              onChange={(e) => setHandoverRemark(e.target.value)}
              placeholder="请填写交接备注信息..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>
          <p className="text-xs text-slate-500">
            确认交接后，实物交接节点完成，申请将进入下一审批环节。
          </p>
        </div>
      </Modal>
    </div>
  );
}
