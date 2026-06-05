import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';

export class InventoryController {
  async getInventory(req: Request, res: Response) {
    try {
      const inventory = await inventoryService.getAllInventory();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: 'Lỗi tải danh sách kho' });
    }
  }

  async importInventory(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền nhập kho' });
    }

    const { containerType, fullQuantity } = req.body;
    try {
      const updated = await inventoryService.importInventory(containerType, fullQuantity);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi nhập kho' });
    }
  }

  async updateInventory(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền sửa kho' });
    }

    const { fullQuantity } = req.body;
    try {
      const updated = await inventoryService.updateInventory(req.params.id, fullQuantity);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi sửa số lượng kho' });
    }
  }
}

export const inventoryController = new InventoryController();
