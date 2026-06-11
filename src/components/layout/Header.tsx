import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronRight,
  Home,
  Settings,
  User,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const routeTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/applications': '处置申请',
  '/assets': '资产清单',
  '/approvals': '审批看板',
  '/valuations': '估值记录',
  '/archive': '归档查询',
};

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTitle = routeTitles[location.pathname] || '资产处置系统';
  const breadcrumbs = [
    { label: '首页', icon: Home },
    { label: currentTitle },
  ];

  const roleLabels: Record<string, string> = {
    dept_head: '部门主管',
    admin: '管理员',
    finance: '财务',
    executive: '高管',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            <span
              className={cn(
                'flex items-center gap-1.5',
                idx === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : ''
              )}
            >
              {crumb.icon && <crumb.icon className="w-4 h-4" />}
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索资产、申请、审批..."
            className="w-64 h-9 pl-10 pr-4 rounded-lg bg-slate-100 border border-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white focus:border-secondary-200 transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {user?.name || '未登录'}
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                {user ? roleLabels[user.role] || user.role : ''}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.department}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <User className="w-4 h-4" />
                个人资料
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" />
                账户设置
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <HelpCircle className="w-4 h-4" />
                帮助中心
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
