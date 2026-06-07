import { authRepository } from './auth.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gas-delivery-secret-key-2026';

export class AuthService {
  async login(username: string, passwordText: string) {
    const user = await authRepository.findByUsername(username);
    
    if (!user || !user.password) {
      throw new Error('Tài khoản hoặc mật khẩu không đúng');
    }

    if (user.status !== 'active') {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    const isMatch = await bcrypt.compare(passwordText, user.password);
    if (!isMatch) {
      throw new Error('Tài khoản hoặc mật khẩu không đúng');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password, ...userData } = user;
    
    return { token, user: userData };
  }
}

export const authService = new AuthService();
