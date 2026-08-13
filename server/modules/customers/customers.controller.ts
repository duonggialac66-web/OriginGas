import { customersService } from './customers.service.js';

export class CustomersController {
  async getCustomers(req: any, res: any) {
    try {
      const customers = await customersService.getCustomers(req.query.search);
      res.json(customers);
    } catch (error: any) {
      console.error('Lỗi lấy danh sách khách hàng:', error);
      res.status(500).json({ message: 'Lỗi khi tải danh sách khách hàng' });
    }
  }

  async createCustomer(req: any, res: any) {
    try {
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ message: 'Tên khách hàng không được để trống' });
      }
      const customer = await customersService.createCustomer({
        ...req.body,
        name: req.body.name.trim(),
      });
      res.json(customer);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ message: 'Khách hàng với tên này đã tồn tại' });
      } else {
        console.error('Lỗi tạo khách hàng:', error);
        res.status(500).json({ message: 'Lỗi khi tạo khách hàng' });
      }
    }
  }

  async updateCustomer(req: any, res: any) {
    try {
      const updated = await customersService.updateCustomer(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Lỗi cập nhật khách hàng:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật khách hàng' });
    }
  }

  async updateLocation(req: any, res: any) {
    try {
      const { latitude, longitude } = req.body;
      if (latitude == null || longitude == null) {
        return res.status(400).json({ message: 'Thiếu tọa độ latitude/longitude' });
      }
      const updated = await customersService.updateCustomerLocation(
        req.params.id,
        Number(latitude),
        Number(longitude)
      );
      res.json(updated);
    } catch (error: any) {
      console.error('Lỗi cập nhật vị trí:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật vị trí khách hàng' });
    }
  }

  async deleteCustomer(req: any, res: any) {
    try {
      await customersService.deleteCustomer(req.params.id);
      res.json({ success: true, message: 'Đã xóa khách hàng' });
    } catch (error: any) {
      console.error('Lỗi xóa khách hàng:', error);
      res.status(500).json({ message: 'Lỗi khi xóa khách hàng' });
    }
  }
}

export const customersController = new CustomersController();
