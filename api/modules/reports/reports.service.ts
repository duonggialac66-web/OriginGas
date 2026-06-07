import { reportsRepository } from './reports.repository.js';

export class ReportsService {
  async getReports(queryDate?: string, userRole?: string, userId?: string) {
    let whereClause: any = {};
    
    if (queryDate) {
      whereClause.date = String(queryDate);
    }
    
    // Nếu là nhân viên, chỉ lấy báo cáo của chính họ
    if (userRole === 'employee' && userId) {
      whereClause.employeeId = userId;
    }

    const reports = await reportsRepository.findReports(whereClause);

    return reports.map((r: any) => ({
      ...r,
      employeeName: r.employee.name,
    }));
  }

  async createReport(userId: string, data: any) {
    const quantity = Number(data.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('Số lượng không hợp lệ');
    }

    const inventory = await reportsRepository.getInventoryByType(data.containerType);

    if (!inventory || inventory.fullQuantity < quantity) {
      throw new Error(`Kho không đủ bình đầy cho loại ${data.containerType}. Hiện còn: ${inventory ? inventory.fullQuantity : 0}`);
    }

    const reportData = {
      employeeId: userId,
      date: data.date,
      customerName: data.customerName,
      quantity,
      containerType: data.containerType,
      unitPrice: Number(data.unitPrice),
      total: Number(data.total),
      actualReceived: Number(data.actualReceived),
      notes: data.notes || '',
    };

    const [newReport] = await reportsRepository.createReportTransaction(reportData);
    
    return {
      ...newReport,
      employeeName: newReport.employee.name
    };
  }
}

export const reportsService = new ReportsService();
