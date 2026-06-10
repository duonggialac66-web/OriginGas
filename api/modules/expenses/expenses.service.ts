import { expensesRepository } from './expenses.repository.js';

export class ExpensesService {
  async getExpenses(queryDate?: string, userRole?: string, userId?: string) {
    const where: any = {};
    if (queryDate) where.date = String(queryDate);
    // Nhân viên chỉ xem chi phí của chính mình
    if (userRole === 'employee' && userId) where.employeeId = userId;

    const expenses = await expensesRepository.findExpenses(where);
    return expenses.map((e: any) => ({ ...e, employeeName: e.employee.name }));
  }

  async createExpense(userId: string, data: any) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount < 0) throw new Error('Số tiền chi không hợp lệ');

    const newExpense = await expensesRepository.create({
      employeeId: userId,
      date: data.date,
      description: data.description,
      amount,
      notes: data.notes || '',
    });

    return { ...newExpense, employeeName: (newExpense as any).employee.name };
  }

  async updateExpense(id: string, userId: string, userRole: string, data: any) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new Error('Không tìm thấy khoản chi');
    if (userRole === 'employee' && existing.employeeId !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa khoản chi này');
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount < 0) throw new Error('Số tiền chi không hợp lệ');

    const updated = await expensesRepository.update(id, {
      description: data.description,
      amount,
      notes: data.notes || '',
    });

    return { ...updated, employeeName: (updated as any).employee.name };
  }

  async deleteExpense(id: string, userId: string, userRole: string) {
    const existing = await expensesRepository.findById(id);
    if (!existing) throw new Error('Không tìm thấy khoản chi');
    if (userRole === 'employee' && existing.employeeId !== userId) {
      throw new Error('Bạn không có quyền xóa khoản chi này');
    }
    await expensesRepository.delete(id);
    return { success: true };
  }
}

export const expensesService = new ExpensesService();
