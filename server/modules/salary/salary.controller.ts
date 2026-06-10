import { Request, Response } from 'express';
import { salaryService } from './salary.service.js';

export class SalaryController {
  async getSalaryConfigs(req: any, res: any) {
    try {
      const configs = await salaryService.getSalaryConfigs();
      res.json(configs);
    } catch (error: any) {
      console.error('Lỗi lấy cấu hình lương:', error);
      res.status(500).json({ message: 'Lỗi tải cấu hình lương' });
    }
  }

  async updateSalaryConfig(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const { containerType, commission } = req.body;
    try {
      const updated = await salaryService.updateSalaryConfig(containerType, commission);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi cập nhật cấu hình lương' });
    }
  }

  async getFormula(req: any, res: any) {
    try {
      const formula = await salaryService.getFormula();
      res.json(formula);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Lỗi khi lấy công thức tính lương' });
    }
  }

  async updateFormula(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const { formula } = req.body;
    try {
      const updated = await salaryService.updateFormula(formula);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi cập nhật công thức tính lương' });
    }
  }

  async updateMonthlyInput(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const { employeeId, month, overtime, workDays, bonus } = req.body;
    try {
      const updated = await salaryService.updateMonthlyInput(employeeId, month, overtime, workDays, bonus);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi cập nhật biến số tính lương' });
    }
  }

  async getCalculatedSalaries(req: any, res: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const { month } = req.query;
    try {
      const salaries = await salaryService.calculateSalaries(month);
      res.json(salaries);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Lỗi khi tính toán lương' });
    }
  }
}

export const salaryController = new SalaryController();
