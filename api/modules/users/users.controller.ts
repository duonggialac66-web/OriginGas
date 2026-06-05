import { Request, Response } from 'express';
import { usersService } from './users.service';

export class UsersController {
  async getEmployees(req: any, res: any) {
    try {
      const employees = await usersService.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: 'Lỗi khi tải danh sách nhân viên' });
    }
  }

  async createEmployee(req: any, res: any) {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
    
    try {
      const employee = await usersService.createEmployee(req.body);
      res.json(employee);
    } catch (error: any) {
      if (error.message === 'Tên đăng nhập đã tồn tại') {
        res.status(400).json({ message: error.message });
      } else {
        console.error('Lỗi tạo nhân viên:', error);
        res.status(500).json({ message: 'Lỗi khi tạo nhân viên mới' });
      }
    }
  }

  async updateEmployee(req: any, res: any) {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
    
    try {
      const employee = await usersService.updateEmployee(req.params.id, req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: 'Lỗi cập nhật nhân viên' });
    }
  }

  async deleteEmployee(req: any, res: any) {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
    
    try {
      await usersService.deleteEmployee(req.params.id);
      res.json({ message: 'Xóa thành công' });
    } catch (error: any) {
      res.status(500).json({ message: 'Lỗi khi xóa nhân viên' });
    }
  }
}

export const usersController = new UsersController();
