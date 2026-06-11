import { useEffect } from 'react';
import { RouterProvider, router } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { useApplicationStore } from '@/store/applicationStore';
import { useAssetStore } from '@/store/assetStore';

export default function App() {
  const initAuthFromStorage = useAuthStore((s) => s.initFromStorage);
  const user = useAuthStore((s) => s.user);
  const initializeApplicationData = useApplicationStore((s) => s.initializeData);
  const refreshTodoTasks = useApplicationStore((s) => s.refreshTodoTasks);
  const refreshDoneTasks = useApplicationStore((s) => s.refreshDoneTasks);
  const initializeAssetData = useAssetStore((s) => s.initializeData);

  useEffect(() => {
    initAuthFromStorage();
  }, [initAuthFromStorage]);

  useEffect(() => {
    if (user) {
      initializeApplicationData();
      initializeAssetData();
      refreshTodoTasks(user);
      refreshDoneTasks(user);
    }
  }, [user, initializeApplicationData, initializeAssetData, refreshTodoTasks, refreshDoneTasks]);

  return <RouterProvider router={router} />;
}
