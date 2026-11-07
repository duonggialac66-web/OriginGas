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
      customer: r.customer || null,
    }));
  }

  async createReport(userId: string, data: any) {
    const quantity = Number(data.quantity) || 0;
    if (isNaN(quantity) || quantity < 0) {
      throw new Error('Số lượng không hợp lệ');
    }

    const reportData = {
      employeeId: userId,
      date: data.date,
      customerName: data.customerName,
      customerId: data.customerId || null,
      quantity,
      containerType: data.containerType,
      unitPrice: Number(data.unitPrice) || 0,
      total: Number(data.total) || 0,
      actualReceived: Number(data.actualReceived) || 0,
      notes: data.notes || '',
      paymentStatus: data.paymentStatus || 'paid',
    };

    const [newReport] = await reportsRepository.createReportTransaction(reportData);
    
    return {
      ...newReport,
      employeeName: newReport.employee.name,
      customer: (newReport as any).customer || null,
    };
  }

  async updateReport(id: string, userId: string, userRole: string, data: any) {
    const existingReport = await reportsRepository.findById(id);
    if (!existingReport) {
      throw new Error('Không tìm thấy báo cáo');
    }

    // Nhân viên chỉ được sửa báo cáo của chính mình
    if (userRole === 'employee' && existingReport.employeeId !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa báo cáo này');
    }

    const quantity = Number(data.quantity) || 0;
    if (isNaN(quantity) || quantity < 0) {
      throw new Error('Số lượng không hợp lệ');
    }

    const newType = data.containerType;

    const reportData = {
      date: data.date,
      customerName: data.customerName,
      customerId: data.customerId !== undefined ? (data.customerId || null) : existingReport.customerId,
      quantity,
      containerType: newType,
      unitPrice: Number(data.unitPrice) || 0,
      total: Number(data.total) || 0,
      actualReceived: Number(data.actualReceived) || 0,
      notes: data.notes || '',
      receiptUrl: data.receiptUrl || existingReport.receiptUrl,
      paymentStatus: data.paymentStatus || existingReport.paymentStatus,
    };

    const [updatedReport] = await reportsRepository.updateReportTransaction(id, reportData);

    return {
      ...updatedReport,
      employeeName: updatedReport.employee.name,
      customer: (updatedReport as any).customer || null,
    };
  }

  async deleteReport(id: string, userId: string, userRole: string) {
    const existingReport = await reportsRepository.findById(id);
    if (!existingReport) {
      throw new Error('Không tìm thấy báo cáo');
    }

    if (userRole === 'employee' && existingReport.employeeId !== userId) {
      throw new Error('Bạn không có quyền xóa báo cáo này');
    }

    await reportsRepository.deleteReportTransaction(id);
    return { success: true };
  }

  async updatePaymentStatus(id: string, userId: string, userRole: string, paymentStatus: 'paid' | 'debt') {
    const existingReport = await reportsRepository.findById(id);
    if (!existingReport) {
      throw new Error('Không tìm thấy báo cáo');
    }

    if (userRole === 'employee' && existingReport.employeeId !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa báo cáo này');
    }

    const updated = await reportsRepository.updatePaymentStatus(id, paymentStatus);
    return updated;
  }
}

export const reportsService = new ReportsService();
