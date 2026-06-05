import prisma from '../../db';

export class ReportsRepository {
  async findReports(whereClause: any) {
    return prisma.deliveryReport.findMany({
      where: whereClause,
      include: { employee: true },
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
        include: { employee: true }
      }),
      prisma.inventory.update({
        where: { containerType: reportData.containerType },
        data: { 
          fullQuantity: { decrement: reportData.quantity }
        }
      })
    ]);
  }
}

export const reportsRepository = new ReportsRepository();
