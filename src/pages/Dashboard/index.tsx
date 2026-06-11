import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  TrendingUp,
  FileSearch,
  Wallet,
  PlusCircle,
  ListChecks,
  Clock,
  Download,
  ChevronRight,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useAssetStore } from '@/store/assetStore';
import {
  mockApplications,
  mockAssets,
} from '@/mock/data';
import StatusTag from '@/components/common/StatusTag';
import type {
  UserRole,
  Application,
  DisposalType,
} from '@/types';
import { cn } from '@/lib/utils';

const roleLabelMap: Record<UserRole, string> = {
  dept_head: '部门负责人',
  admin: '行政人员',
  finance: '财务人员',
  executive: '高管',
};

const disposalTypeLabel: Record<DisposalType, string> = {
  scrap: '报废处置',
  transfer: '内部划转',
  auction: '公开拍卖',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

const getTodayDate = () => {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof ClipboardList;
  color: 'orange' | 'blue' | 'green' | 'purple';
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, color, suffix }: StatCardProps) {
  const colorMap = {
    orange: {
      bg: 'bg-warning-50',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      accent: 'group-hover:bg-warning-500',
    },
    blue: {
      bg: 'bg-primary-50',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      accent: 'group-hover:bg-primary-500',
    },
    green: {
      bg: 'bg-secondary-50',
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      accent: 'group-hover:bg-secondary-500',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      accent: 'group-hover:bg-purple-500',
    },
  } as const;

  const c = colorMap[color];

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl p-6 border border-slate-200 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 overflow-hidden'
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 w-full h-1 transition-all duration-300',
          c.accent,
          'bg-transparent'
        )}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800">{value}</span>
            {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
          </div>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
            c.iconBg,
            'group-hover:scale-110'
          )}
        >
          <Icon className={cn('w-6 h-6', c.iconColor)} />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  icon: typeof PlusCircle;
  onClick?: () => void;
}

function QuickAction({ label, icon: Icon, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 transition-all duration-300 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center transition-all duration-300 group-hover:bg-primary-100">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-800 group-hover:text-primary-700 transition-colors">
          {label}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 transition-all duration-300 group-hover:text-primary-500 group-hover:translate-x-1" />
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setApplications = useApplicationStore((s) => s.setApplications);
  const setTodoTasks = useApplicationStore((s) => s.setTodoTasks);
  const todoTasks = useApplicationStore((s) => s.todoTasks);
  const applications = useApplicationStore((s) => s.applications);
  const setAssets = useAssetStore((s) => s.setAssets);

  useEffect(() => {
    setApplications(mockApplications);
    setAssets(mockAssets);
    if (user) {
      const roleNodeMap: Record<UserRole, string> = {
        dept_head: 'pending_dept',
        admin: 'pending_admin',
        finance: 'pending_finance',
        executive: 'pending_executive',
      };
      const node = roleNodeMap[user.role];
      const todos = mockApplications.filter((a) => a.currentNode === node);
      setTodoTasks(todos);
    }
  }, [setApplications, setAssets, setTodoTasks, user]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyCompleted = mockApplications.filter((a) => {
      const created = new Date(a.createdAt);
      return (
        created >= thisMonthStart &&
        (a.status === 'completed' || a.status === 'archived')
      );
    });

    const disposedAssetsCount = monthlyCompleted.reduce(
      (sum, a) => sum + a.items.length,
      0
    );

    const pendingValuation = mockAssets.filter(
      (a) => a.status === 'pending_disposal'
    ).length;

    const totalValue = mockAssets.reduce(
      (sum, a) => sum + a.netValue,
      0
    );

    return {
      todoCount: todoTasks.length,
      monthlyDisposed: disposedAssetsCount,
      pendingValuation,
      totalValue,
    };
  }, [todoTasks]);

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [applications]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-secondary-400/20 rounded-full blur-2xl translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/20"
              />
              <div>
                <h1 className="text-2xl font-bold">
                  你好，{user.name}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur border border-white/20">
                    {roleLabelMap[user.role]}
                  </span>
                </h1>
                <p className="text-primary-100 mt-1">{user.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-100">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{getTodayDate()}</span>
            </div>
          </div>
          <p className="mt-5 text-primary-100 max-w-2xl">
            欢迎回到资产处置管理平台。您当前有
            <span className="text-white font-semibold mx-1">{stats.todoCount}</span>
            条待办审批需要处理，请及时查看。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <StatCard
          title="待办审批数"
          value={stats.todoCount}
          icon={ClipboardList}
          color="orange"
          suffix="条"
        />
        <StatCard
          title="本月处置资产数"
          value={stats.monthlyDisposed}
          icon={TrendingUp}
          color="blue"
          suffix="件"
        />
        <StatCard
          title="待估值资产数"
          value={stats.pendingValuation}
          icon={FileSearch}
          color="green"
          suffix="件"
        />
        <StatCard
          title="资产总值"
          value={(stats.totalValue / 10000).toFixed(2)}
          icon={Wallet}
          color="purple"
          suffix="万元"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">快捷操作</h2>
          </div>
          <div className="space-y-3">
            <QuickAction label="发起处置申请" icon={PlusCircle} onClick={() => navigate('/applications')} />
            <QuickAction label="查看资产清单" icon={ListChecks} onClick={() => navigate('/assets')} />
            <QuickAction label="处理待办审批" icon={Clock} onClick={() => navigate('/approvals')} />
            <QuickAction label="导出台账" icon={Download} onClick={() => navigate('/archive')} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">最近申请</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentApplications.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  暂无申请记录
                </div>
              ) : (
                recentApplications.map((app: Application) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 text-sm truncate group-hover:text-primary-600 transition-colors">
                          {app.applicationNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {disposalTypeLabel[app.type]} · {app.applicantName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <StatusTag type="application" status={app.status} />
                      <div className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
                        {formatDate(app.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">待办任务</h2>
                {todoTasks.length > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning-100 text-warning-700 text-xs font-medium">
                    {todoTasks.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {todoTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                    <ListChecks className="w-8 h-8 text-secondary-500" />
                  </div>
                  <p className="text-slate-500">暂无待办任务</p>
                  <p className="text-sm text-slate-400 mt-1">所有任务均已处理完成</p>
                </div>
              ) : (
                todoTasks.map((task: Application) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-warning-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 text-sm truncate group-hover:text-primary-600 transition-colors">
                          {task.applicationNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                          {task.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-500">提交时间</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(task.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-1.5 text-sm font-medium rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors whitespace-nowrap"
                      >
                        处理
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
