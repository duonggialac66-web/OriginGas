import { Router } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { containerType: 'asc' }
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải danh sách kho' });
  }
});

router.post('/import', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền nhập kho' });
  }

  const { containerType, fullQuantity } = req.body;
  try {
    const updated = await prisma.inventory.upsert({
      where: { containerType },
      update: { 
        fullQuantity: { increment: Number(fullQuantity) || 0 }
      },
      create: { 
        containerType, 
        fullQuantity: Number(fullQuantity) || 0
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi nhập kho' });
  }
});

router.put('/:id', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền sửa kho' });
  }

  const { fullQuantity } = req.body;
  try {
    const updated = await prisma.inventory.update({
      where: { id: req.params.id },
      data: { 
        fullQuantity: Number(fullQuantity)
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi sửa số lượng kho' });
  }
});

export default router;
