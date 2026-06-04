import { Router } from 'express';
import prisma from '../db';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Lấy danh sách báo cáo
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { date } = req.query;
    let whereClause: any = {};
    
    if (date) {
      whereClause.date = String(date);
    }
    
    // Nếu là nhân viên, chỉ lấy báo cáo của chính họ
    if (req.user.role === 'employee') {
      whereClause.employeeId = req.user.id;
    }

    const reports = await prisma.deliveryReport.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });

    // Format lại dữ liệu cho giống Frontend
    const formattedReports = reports.map((r: any) => ({
      ...r,
      employeeName: r.employee.name,
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Lỗi lấy danh sách báo cáo:', error);
    res.status(500).json({ message: 'Lỗi khi tải danh sách báo cáo' });
  }
});

// Tạo báo cáo mới
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const data = req.body;
    
    // Kiểm tra và trừ kho trước
    const inventory = await prisma.inventory.findUnique({
      where: { containerType: data.containerType }
    });

    if (!inventory || inventory.fullQuantity < Number(data.quantity)) {
      return res.status(400).json({ message: `Kho không đủ bình đầy cho loại ${data.containerType}. Hiện còn: ${inventory ? inventory.fullQuantity : 0}` });
    }

    // Transaction: Trừ kho và tạo báo cáo
    const [newReport] = await prisma.$transaction([
      prisma.deliveryReport.create({
        data: {
          employeeId: req.user.id,
          date: data.date,
          customerName: data.customerName,
          quantity: Number(data.quantity),
          containerType: data.containerType,
          unitPrice: Number(data.unitPrice),
          total: Number(data.total),
          actualReceived: Number(data.actualReceived),
          notes: data.notes || '',
        },
        include: { employee: true }
      }),
      prisma.inventory.update({
        where: { containerType: data.containerType },
        data: { 
          fullQuantity: { decrement: Number(data.quantity) }
        }
      })
    ]);
    
    res.json({
      ...newReport,
      employeeName: newReport.employee.name
    });
  } catch (error) {
    console.error('Lỗi tạo báo cáo:', error);
    res.status(500).json({ message: 'Lỗi khi tạo báo cáo mới' });
  }
});

export default router;
