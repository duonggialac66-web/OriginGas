import prisma from '../../db.js';

export class InventoryRepository {
  async findAll() {
    return prisma.inventory.findMany({
      orderBy: { containerType: 'asc' },
    });
  }

  async upsertInventory(containerType: string, quantityToAdd: number) {
    return prisma.inventory.upsert({
      where: { containerType },
      update: {
        fullQuantity: { increment: quantityToAdd },
      },
      create: {
        containerType,
        fullQuantity: quantityToAdd,
      },
    });
  }

  async updateInventoryById(id: string, newQuantity: number) {
    return prisma.inventory.update({
      where: { id },
      data: {
        fullQuantity: newQuantity,
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
