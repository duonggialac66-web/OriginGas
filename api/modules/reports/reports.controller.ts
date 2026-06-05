import { Request, Response } from 'express';
import { reportsService } from './reports.service';

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
}

export const reportsController = new ReportsController();
