import { usersRepository } from './users.repository.js';
import bcrypt from 'bcryptjs';

export class UsersService {
  async getAllEmployees() {
    return usersRepository.findManyEmployees();
  }

  async createEmployee(data: any) {
    const existing = await usersRepository.findByUsername(data.username);
    if (existing) {
      throw new Error('Tên đăng nhập đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await usersRepository.createUser({
      name: data.name,
      username: data.username,
      password: hashedPassword,
      role: 'employee',
      phone: data.phone,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      status: 'active',
    });

    const { password: _, ...employeeData } = newUser;
    return employeeData;
  }

  async updateEmployee(id: string, data: any) {
    const updated = await usersRepository.updateUser(id, {
      name: data.name,
      phone: data.phone,
      status: data.status
    });
    const { password: _, ...employeeData } = updated;
    return employeeData;
  }

  async deleteEmployee(id: string) {
    return usersRepository.deleteUser(id);
  }
}

export const usersService = new UsersService();
