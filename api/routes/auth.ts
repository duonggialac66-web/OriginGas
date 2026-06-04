import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gas-delivery-secret-key-2026';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user;
    
    res.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
});

export default router;
