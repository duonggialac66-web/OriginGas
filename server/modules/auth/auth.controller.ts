import { Request, Response } from 'express';
import { authService } from './auth.service.js';

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Tài khoản hoặc mật khẩu không đúng' || error.message === 'Tài khoản đã bị vô hiệu hóa') {
        res.status(401).json({ message: error.message });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
      }
    }
  }
}

export const authController = new AuthController();
