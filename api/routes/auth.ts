import { Router, type Request, type Response } from 'express';
import { users } from '../data/mockData.js';
import type { User } from '../../src/types/index.js';

const router = Router();

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

const success = <T>(data: T, message = 'success'): ApiResponse<T> => ({
  code: 0,
  message,
  data,
});

const error = (message: string, code = 1): ApiResponse<null> => ({
  code,
  message,
  data: null,
});

const getCurrentUser = (req: Request): User => {
  const userId = req.header('x-user-id');
  if (userId) {
    const user = users.find((u) => u.id === userId);
    if (user) return user;
  }
  return users.find((u) => u.role === 'admin') || users[0];
};

router.get('/profile', (req: Request, res: Response): void => {
  const user = getCurrentUser(req);
  res.json(success(user));
});

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json(error('用户名和密码不能为空'));
    return;
  }

  const user = users.find((u) => u.name === username) || users[0];
  res.json(success(user, '登录成功'));
});

export default router;
