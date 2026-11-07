import { inventoryRepository } from './inventory.repository.js';

export class InventoryService {
  async getAllInventory() {
    return inventoryRepository.findAll();
  }

  async importInventory(containerType: string, _fullQuantity?: number | string) {
    if (!containerType || !containerType.trim()) {
      throw new Error('Tên sản phẩm không hợp lệ');
    }
    return inventoryRepository.upsertInventory(containerType.trim());
  }

  async updateInventory(id: string, fullQuantity: number | string) {
    const newQuantity = Number(fullQuantity) || 0;
    return inventoryRepository.updateInventoryById(id, newQuantity);
  }
}

export const inventoryService = new InventoryService();
