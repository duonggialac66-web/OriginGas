import prisma from '../../db.js';

export class ReportsRepository {
  async findReports(whereClause: any) {
    return prisma.deliveryReport.findMany({
      where: whereClause,
      include: { employee: true, customer: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInventoryByType(containerType: string) {
    return prisma.inventory.findUnique({
      where: { containerType }
    });
  }

  async createReportTransaction(reportData: any) {
    return prisma.$transaction([
      prisma.deliveryReport.create({
        data: reportData,
        include: { employee: true, customer: true }
      })
    ]);
  }

  async findById(id: string) {
    return prisma.deliveryReport.findUnique({
      where: { id },
      include: { employee: true, customer: true }
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: 'paid' | 'debt') {
    return prisma.deliveryReport.update({
      where: { id },
      data: { paymentStatus },
      include: { employee: true, customer: true }
    });
  }

  async updateReportTransaction(id: string, updateData: any, _inventoryUpdates?: any[]) {
    return prisma.$transaction([
      prisma.deliveryReport.update({
        where: { id },
        data: updateData,
        include: { employee: true, customer: true }
      })
    ]);
  }

  async deleteReportTransaction(id: string, _containerType?: string, _quantityToRestore?: number) {
    return prisma.$transaction([
      prisma.deliveryReport.delete({
        where: { id }
      })
    ]);
  }
}

export const reportsRepository = new ReportsRepository();
