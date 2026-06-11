import { create } from 'zustand';
import type { User, UserRole, Permission } from '@/types';

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: null,
  login: (user) => {
    set({
      user,
      permissions: rolePermissions[user.role],
    });
  },
  logout: () => {
    set({
      user: null,
      permissions: null,
    });
  },
  hasPermission: (permission) => {
    const { permissions } = get();
    if (!permissions) return false;
    return permissions[permission];
  },
}));
