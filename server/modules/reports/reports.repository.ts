import prisma from '../../db.js';

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
    if (reportData.containerType === 'Gas lon') {
      return prisma.$transaction([
        prisma.deliveryReport.create({
          data: reportData,
          include: { employee: true }
        })
      ]);
    }

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

  async findById(id: string) {
    return prisma.deliveryReport.findUnique({
      where: { id },
      include: { employee: true }
    });
  }

  async updateReportTransaction(id: string, updateData: any, inventoryUpdates: { containerType: string, change: number }[]) {
    const transactionOperations = [
      prisma.deliveryReport.update({
        where: { id },
        data: updateData,
        include: { employee: true }
      })
    ];

    for (const update of inventoryUpdates) {
      transactionOperations.push(
        prisma.inventory.update({
          where: { containerType: update.containerType },
          data: {
            fullQuantity: { increment: update.change }
          }
        }) as any
      );
    }

    return prisma.$transaction(transactionOperations);
  }

  async deleteReportTransaction(id: string, containerType: string, quantityToRestore: number) {
    if (containerType === 'Gas lon') {
      return prisma.$transaction([
        prisma.deliveryReport.delete({
          where: { id }
        })
      ]);
    }

    return prisma.$transaction([
      prisma.deliveryReport.delete({
        where: { id }
      }),
      prisma.inventory.update({
        where: { containerType },
        data: {
          fullQuantity: { increment: quantityToRestore }
        }
      })
    ]);
  }
}

export const reportsRepository = new ReportsRepository();
