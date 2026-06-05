import { inventoryRepository } from './inventory.repository';

export class InventoryService {
  async getAllInventory() {
    return inventoryRepository.findAll();
  }

  async importInventory(containerType: string, fullQuantity: number | string) {
    const quantityToAdd = Number(fullQuantity) || 0;
    if (quantityToAdd < 0) {
      throw new Error('Số lượng nhập không hợp lệ');
    }
    return inventoryRepository.upsertInventory(containerType, quantityToAdd);
  }

  async updateInventory(id: string, fullQuantity: number | string) {
    const newQuantity = Number(fullQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      throw new Error('Số lượng không hợp lệ');
    }
    return inventoryRepository.updateInventoryById(id, newQuantity);
  }
}

export const inventoryService = new InventoryService();
