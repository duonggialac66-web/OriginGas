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
    const quantity = Number(data.quantity) || 0;
    if (isNaN(quantity) || quantity < 0) {
      throw new Error('Số lượng không hợp lệ');
    }

    if (quantity > 0 && data.containerType !== 'Gas lon') {
      const inventory = await reportsRepository.getInventoryByType(data.containerType);
      if (!inventory || inventory.fullQuantity < quantity) {
        throw new Error(`Kho không đủ bình đầy cho loại ${data.containerType}. Hiện còn: ${inventory ? inventory.fullQuantity : 0}`);
      }
    }

    const reportData = {
      employeeId: userId,
      date: data.date,
      customerName: data.customerName,
      quantity,
      containerType: data.containerType,
      unitPrice: Number(data.unitPrice) || 0,
      total: Number(data.total) || 0,
      actualReceived: Number(data.actualReceived) || 0,
      notes: data.notes || '',
    };

    const [newReport] = await reportsRepository.createReportTransaction(reportData);
    
    return {
      ...newReport,
      employeeName: newReport.employee.name
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

    const oldType = existingReport.containerType;
    const oldQty = existingReport.quantity;
    const newType = data.containerType;
    const newQty = quantity;

    const inventoryUpdates: { containerType: string, change: number }[] = [];

    if (oldType === newType) {
      const diff = newQty - oldQty; // Nếu newQty > oldQty, diff > 0, cần bớt đi trong kho
      if (diff !== 0 && newType !== 'Gas lon') {
        if (diff > 0) {
          // Cần lấy thêm từ kho
          const inventory = await reportsRepository.getInventoryByType(newType);
          if (!inventory || inventory.fullQuantity < diff) {
            throw new Error(`Kho không đủ bình đầy cho loại ${newType}. Hiện còn: ${inventory ? inventory.fullQuantity : 0}`);
          }
        }
        // change = -diff. Ví dụ: cần lấy thêm 2 bình, change = -2. Cần trả lại 2 bình, change = +2.
        inventoryUpdates.push({ containerType: newType, change: -diff });
      }
    } else {
      // Khác loại: trả lại số lượng cũ cho loại cũ, trừ số lượng mới từ loại mới
      if (oldType !== 'Gas lon') {
        inventoryUpdates.push({ containerType: oldType, change: oldQty });
      }

      if (newType !== 'Gas lon') {
        const newInventory = await reportsRepository.getInventoryByType(newType);
        if (!newInventory || newInventory.fullQuantity < newQty) {
          throw new Error(`Kho không đủ bình đầy cho loại ${newType}. Hiện còn: ${newInventory ? newInventory.fullQuantity : 0}`);
        }
        inventoryUpdates.push({ containerType: newType, change: -newQty });
      }
    }

    const reportData = {
      date: data.date,
      customerName: data.customerName,
      quantity,
      containerType: newType,
      unitPrice: Number(data.unitPrice) || 0,
      total: Number(data.total) || 0,
      actualReceived: Number(data.actualReceived) || 0,
      notes: data.notes || '',
      receiptUrl: data.receiptUrl || existingReport.receiptUrl,
    };

    const [updatedReport] = await reportsRepository.updateReportTransaction(id, reportData, inventoryUpdates);

    return {
      ...updatedReport,
      employeeName: updatedReport.employee.name
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

    await reportsRepository.deleteReportTransaction(id, existingReport.containerType, existingReport.quantity);
    return { success: true };
  }
}

export const reportsService = new ReportsService();
