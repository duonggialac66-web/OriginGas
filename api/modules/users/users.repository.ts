import prisma from '../../db.js';

export class UsersRepository {
  async findManyEmployees() {
    return prisma.user.findMany({
      where: { role: 'employee' },
      select: { id: true, name: true, username: true, phone: true, startDate: true, status: true }
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }

  async createUser(data: any) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}

export const usersRepository = new UsersRepository();
