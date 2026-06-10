import prisma from '../../db.js';

export const expensesRepository = {
  async findExpenses(where: any) {
    return prisma.expense.findMany({
      where,
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    employeeId: string;
    date: string;
    description: string;
    amount: number;
    notes?: string;
  }) {
    return prisma.expense.create({
      data,
      include: { employee: { select: { name: true } } },
    });
  },

  async findById(id: string) {
    return prisma.expense.findUnique({ where: { id } });
  },

  async update(id: string, data: Partial<{ description: string; amount: number; notes: string }>) {
    return prisma.expense.update({
      where: { id },
      data,
      include: { employee: { select: { name: true } } },
    });
  },

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  },
};

