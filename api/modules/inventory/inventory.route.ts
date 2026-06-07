import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { inventoryController } from './inventory.controller.js';

const router = Router();

// Lấy danh sách kho
router.get('/', authenticateToken, inventoryController.getInventory);

// Nhập kho (chỉ Admin)
router.post('/import', authenticateToken, inventoryController.importInventory);

// Cập nhật số lượng kho (chỉ Admin)
router.put('/:id', authenticateToken, inventoryController.updateInventory);

export default router;
