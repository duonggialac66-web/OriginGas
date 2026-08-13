import prisma from '../../db.js';
import { hashCustomerName } from '../../utils/hashName.js';

export class CustomersService {
  async getCustomers(search?: string) {
    const whereClause: any = {};

    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    return prisma.customer.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async createCustomer(data: {
    name: string;
    phone?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string;
  }) {
    const hash = hashCustomerName(data.name);
    
    // Kiểm tra tên đã tồn tại chưa (dùng hash hoặc name cho data cũ)
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { nameHash: hash },
          { name: data.name }
        ]
      },
    });

    if (existing) {
      // Nếu đã tồn tại, cập nhật GPS nếu có gửi kèm (và cập nhật hash nếu chưa có)
      const updateData: any = {};
      let shouldUpdate = false;
      
      if (data.latitude != null && data.longitude != null) {
        updateData.latitude = data.latitude;
        updateData.longitude = data.longitude;
        shouldUpdate = true;
      }
      
      if (!existing.nameHash) {
        updateData.nameHash = hash;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        return prisma.customer.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      return existing;
    }

    return prisma.customer.create({
      data: {
        name: data.name,
        nameHash: hash,
        phone: data.phone || null,
        address: data.address || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        notes: data.notes || null,
      },
    });
  }

  async updateCustomer(id: string, data: any) {
    const updateData: any = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    };
    
    if (data.name) {
      updateData.nameHash = hashCustomerName(data.name);
    }
    
    return prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async updateCustomerLocation(id: string, latitude: number, longitude: number) {
    return prisma.customer.update({
      where: { id },
      data: { latitude, longitude },
    });
  }

  async deleteCustomer(id: string) {
    // Trước khi xóa, gỡ liên kết customerId trong các DeliveryReport
    await prisma.deliveryReport.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    return prisma.customer.delete({
      where: { id },
    });
  }

  async findOrCreateByName(name: string, latitude?: number | null, longitude?: number | null) {
    const hash = hashCustomerName(name);
    
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { nameHash: hash },
          { name }
        ]
      },
    });

    if (existing) {
      const updateData: any = {};
      let shouldUpdate = false;
      
      // Cập nhật GPS nếu có gửi kèm và khách chưa có GPS
      if (latitude != null && longitude != null && (!existing.latitude || !existing.longitude)) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
        shouldUpdate = true;
      }
      
      if (!existing.nameHash) {
        updateData.nameHash = hash;
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        return prisma.customer.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      return existing;
    }

    return prisma.customer.create({
      data: {
        name,
        nameHash: hash,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });
  }
}

export const customersService = new CustomersService();
