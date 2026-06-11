import { create } from 'zustand';
import type { User, UserRole, Permission } from '@/types';
import { setApiUser } from '@/utils/apiClient';
import { mockUsers } from '@/mock/data';

const rolePermissions: Record<UserRole, Permission> = {
  dept_head: {
    createApplication: true,
    viewAssets: true,
    editAssets: false,
    createValuation: false,
    reviewValuation: false,
    approveDept: true,
    approveAdmin: false,
    approveFinance: false,
    approveExecutive: false,
    confirmHandover: true,
    generateDisposal: false,
    exportArchive: false,
    viewArchive: true,
  },
  admin: {
    createApplication: true,
    viewAssets: true,
    editAssets: true,
    createValuation: true,
    reviewValuation: false,
    approveDept: false,
    approveAdmin: true,
    approveFinance: false,
    approveExecutive: false,
    confirmHandover: true,
    generateDisposal: true,
    exportArchive: true,
    viewArchive: true,
  },
  finance: {
    createApplication: false,
    viewAssets: true,
    editAssets: false,
    createValuation: false,
    reviewValuation: true,
    approveDept: false,
    approveAdmin: false,
    approveFinance: true,
    approveExecutive: false,
    confirmHandover: false,
    generateDisposal: false,
    exportArchive: true,
    viewArchive: true,
  },
  executive: {
    createApplication: false,
    viewAssets: true,
    editAssets: false,
    createValuation: false,
    reviewValuation: false,
    approveDept: false,
    approveAdmin: false,
    approveFinance: false,
    approveExecutive: true,
    confirmHandover: false,
    generateDisposal: false,
    exportArchive: true,
    viewArchive: true,
  },
};

interface AuthState {
  user: User | null;
  permissions: Permission | null;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: keyof Permission) => boolean;
  initFromStorage: () => void;
}

const USER_STORAGE_KEY = 'asset_disposal_user';

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as User;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveUserToStorage(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function getInitialUser(): { user: User | null; permissions: Permission | null } {
  const storedUser = loadUserFromStorage();
  if (storedUser) {
    const user = mockUsers.find((u) => u.id === storedUser.id);
    if (user) {
      setApiUser(user.id);
      return { user, permissions: rolePermissions[user.role] };
    }
  }
  setApiUser(null);
  return { user: null, permissions: null };
}

const initialState = getInitialUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialState.user,
  permissions: initialState.permissions,
  login: (user) => {
    set({
      user,
      permissions: rolePermissions[user.role],
    });
    saveUserToStorage(user);
    setApiUser(user.id);
  },
  logout: () => {
    set({
      user: null,
      permissions: null,
    });
    saveUserToStorage(null);
    setApiUser(null);
  },
  hasPermission: (permission) => {
    const { permissions } = get();
    if (!permissions) return false;
    return permissions[permission];
  },
  initFromStorage: () => {
    // 保留此方法用于向后兼容，实际初始化已在 store 创建时完成
    const storedUser = loadUserFromStorage();
    if (storedUser) {
      const user = mockUsers.find((u) => u.id === storedUser.id);
      if (user && get().user?.id !== user.id) {
        set({
          user,
          permissions: rolePermissions[user.role],
        });
        setApiUser(user.id);
      }
    }
  },
}));
