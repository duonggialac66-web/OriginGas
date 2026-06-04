import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Lấy danh sách nhân viên
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'employee' },
      select: { id: true, name: true, username: true, phone: true, startDate: true, status: true }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách nhân viên' });
  }
});

// Thêm nhân viên
router.post('/', authenticateToken, async (req: any, res: any) => {
  const { name, username, password, phone, startDate } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
  
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'employee',
        phone,
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'active',
      }
    });

    const { password: _, ...employeeData } = newUser;
    res.json(employeeData);
  } catch (error) {
    console.error('Lỗi tạo nhân viên:', error);
    res.status(500).json({ message: 'Lỗi khi tạo nhân viên mới' });
  }
});

// Cập nhật nhân viên
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
  const { name, phone, status } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, status }
    });
    const { password: _, ...employeeData } = updated;
    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật nhân viên' });
  }
});

// Xóa nhân viên
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa nhân viên' });
  }
});

export default router;
