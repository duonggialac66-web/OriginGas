import { Request, Response } from 'express';
import { reportsService } from './reports.service.js';

export class ReportsController {
  async getReports(req: any, res: any) {
    try {
      const reports = await reportsService.getReports(
        req.query.date, 
        req.user?.role, 
        req.user?.id
      );
      res.json(reports);
    } catch (error: any) {
      console.error('Lỗi lấy danh sách báo cáo:', error);
      res.status(500).json({ message: 'Lỗi khi tải danh sách báo cáo' });
    }
  }

  async createReport(req: any, res: any) {
    try {
      const report = await reportsService.createReport(req.user?.id, req.body);
      res.json(report);
    } catch (error: any) {
      if (error.message.includes('Kho không đủ') || error.message === 'Số lượng không hợp lệ') {
        res.status(400).json({ message: error.message });
      } else {
        console.error('Lỗi tạo báo cáo:', error);
        res.status(500).json({ message: 'Lỗi khi tạo báo cáo mới' });
      }
    }
  }

  async updateReport(req: any, res: any) {
    try {
      const updated = await reportsService.updateReport(
        req.params.id,
        req.user?.id,
        req.user?.role,
        req.body
      );
      res.json(updated);
    } catch (error: any) {
      if (error.message.includes('Kho không đủ') || error.message === 'Số lượng không hợp lệ' || error.message === 'Không tìm thấy báo cáo' || error.message === 'Bạn không có quyền chỉnh sửa báo cáo này') {
        res.status(400).json({ message: error.message });
      } else {
        console.error('Lỗi cập nhật báo cáo:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật báo cáo' });
      }
    }
  }

  async deleteReport(req: any, res: any) {
    try {
      await reportsService.deleteReport(req.params.id, req.user?.id, req.user?.role);
      res.json({ success: true, message: 'Đã xóa báo cáo' });
    } catch (error: any) {
      if (error.message === 'Không tìm thấy báo cáo' || error.message === 'Bạn không có quyền xóa báo cáo này') {
        res.status(400).json({ message: error.message });
      } else {
        console.error('Lỗi xóa báo cáo:', error);
        res.status(500).json({ message: 'Lỗi khi xóa báo cáo' });
      }
    }
  }
}

export const reportsController = new ReportsController();
