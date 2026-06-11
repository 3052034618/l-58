import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Box,
  ClipboardCheck,
  TrendingUp,
  Archive,
  Building2,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/applications', label: '处置申请', icon: FileText },
  { path: '/assets', label: '资产清单', icon: Box },
  { path: '/approvals', label: '审批看板', icon: ClipboardCheck, badge: 5 },
  { path: '/valuations', label: '估值记录', icon: TrendingUp },
  { path: '/archive', label: '归档查询', icon: Archive },
];

const roleLabels: Record<string, string> = {
  dept_head: '部门主管',
  admin: '管理员',
  finance: '财务',
  executive: '高管',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 h-screen bg-primary-900 flex flex-col text-white">
      <div className="h-16 flex items-center px-6 border-b border-primary-800">
        <Building2 className="w-8 h-8 text-secondary-400" />
        <span className="ml-3 text-lg font-bold tracking-wide">资产处置系统</span>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-secondary-500/20 text-secondary-400 shadow-sm'
                      : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold bg-danger-500 text-white rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-primary-800 p-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || '未登录'}</p>
            <p className="text-xs text-primary-300 truncate">
              {user ? roleLabels[user.role] || user.role : '请登录'}
            </p>
          </div>
          <button className="p-1 rounded hover:bg-primary-800 transition-colors text-primary-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-300 hover:bg-primary-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          切换用户
        </button>
      </div>
    </aside>
  );
}
