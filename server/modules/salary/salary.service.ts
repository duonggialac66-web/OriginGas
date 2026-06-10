import { salaryRepository } from './salary.repository.js';
import prisma from '../../db.js';

export function evaluateFormula(
  formula: string,
  context: { baseSalary: number; overtime: number; workDays: number; bonus: number; deliveries: number }
): number {
  // Clean whitespace
  let sanitized = formula.replace(/\s+/g, '');
  
  // Only allow: digits, operators (+ - * / . ( )), and variable names
  const allowedPattern = /^[0-9+\-*/.()|baseSalary|overtime|workDays|bonus|deliveries]+$/;
  if (!allowedPattern.test(sanitized)) {
    throw new Error('Công thức chứa ký tự không hợp lệ');
  }
  
  // Replace variables with their actual values
  sanitized = sanitized
    .replace(/baseSalary/g, String(context.baseSalary))
    .replace(/overtime/g, String(context.overtime))
    .replace(/workDays/g, String(context.workDays))
    .replace(/bonus/g, String(context.bonus))
    .replace(/deliveries/g, String(context.deliveries));
    
  // Double check it's purely mathematical expression now: only digits, +, -, *, /, ., (, )
  const mathPattern = /^[0-9+\-*/.()]+$/;
  if (!mathPattern.test(sanitized)) {
    throw new Error('Công thức không hợp lệ sau khi thay thế biến');
  }
  
  try {
    const fn = new Function(`return (${sanitized});`);
    const result = fn();
    return isNaN(result) || !isFinite(result) ? 0 : Number(result);
  } catch (e) {
    return 0;
  }
}

export class SalaryService {
  async getSalaryConfigs() {
    return salaryRepository.findSalaryConfigs();
  }

  async updateSalaryConfig(containerType: string, commission: number) {
    const rate = Number(commission);
    if (isNaN(rate) || rate < 0) {
      throw new Error('Định mức hoa hồng không hợp lệ');
    }
    return salaryRepository.upsertSalaryConfig(containerType, rate);
  }

  async getFormula() {
    return salaryRepository.getFormula();
  }

  async updateFormula(formula: string) {
    if (!formula || formula.trim() === '') {
      throw new Error('Công thức không được để trống');
    }
    // Test evaluate the formula with dummy data to make sure it's valid
    try {
      evaluateFormula(formula, { baseSalary: 1000, overtime: 1, workDays: 26, bonus: 0, deliveries: 10 });
    } catch (error: any) {
      throw new Error(`Công thức không hợp lệ: ${error.message}`);
    }
    return salaryRepository.updateFormula(formula.trim());
  }

  async updateMonthlyInput(
    employeeId: string,
    month: string,
    overtime: number,
    workDays: number,
    bonus: number
  ) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Tháng không đúng định dạng YYYY-MM');
    }

    const employee = await prisma.user.findUnique({
      where: { id: employeeId }
    });
    if (!employee) {
      throw new Error('Không tìm thấy nhân viên');
    }

    const formulaObj = await salaryRepository.getFormula();

    // Lấy báo cáo để tính số lượng deliveries
    const reports = await prisma.deliveryReport.findMany({
      where: {
        employeeId,
        date: { startsWith: month }
      }
    });
    const deliveries = reports.reduce((sum, r) => sum + r.quantity, 0);

    const context = {
      baseSalary: employee.baseSalary,
      overtime: Number(overtime) || 0,
      workDays: Number(workDays) || 0,
      bonus: Number(bonus) || 0,
      deliveries
    };

    const calculatedSalary = evaluateFormula(formulaObj.formula, context);

    return salaryRepository.upsertMonthlySalaryInput(
      employeeId,
      month,
      context.overtime,
      context.workDays,
      context.bonus,
      calculatedSalary
    );
  }

  async calculateSalaries(month: string) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Tháng không đúng định dạng YYYY-MM');
    }

    // Lấy công thức
    const formulaObj = await salaryRepository.getFormula();
    const formula = formulaObj.formula;

    // Lấy nhân viên và báo cáo
    const { employees, reports } = await salaryRepository.findEmployeesWithReports(month);

    // Lấy danh sách inputs hàng tháng đã lưu
    const monthlyInputs = await salaryRepository.getMonthlySalaryInputs(month);
    const inputsMap: Record<string, { overtime: number; workDays: number; bonus: number }> = {};
    monthlyInputs.forEach(input => {
      inputsMap[input.employeeId] = {
        overtime: input.overtime,
        workDays: input.workDays,
        bonus: input.bonus
      };
    });

    return employees.map(employee => {
      // Tính deliveries
      const employeeReports = reports.filter(r => r.employeeId === employee.id);
      const totalQty = employeeReports.reduce((sum, r) => sum + r.quantity, 0);

      // Nhóm theo loại bình để hiển thị chi tiết (breakdown)
      const breakdownMap: Record<string, { containerType: string; quantity: number }> = {};
      employeeReports.forEach(report => {
        const type = report.containerType;
        const qty = report.quantity;
        if (breakdownMap[type]) {
          breakdownMap[type].quantity += qty;
        } else {
          breakdownMap[type] = { containerType: type, quantity: qty };
        }
      });

      // Lấy biến hàng tháng (hoặc mặc định)
      const input = inputsMap[employee.id] || { overtime: 1.0, workDays: 26.0, bonus: 0.0 };

      // Tính lương theo công thức
      const context = {
        baseSalary: employee.baseSalary,
        overtime: input.overtime,
        workDays: input.workDays,
        bonus: input.bonus,
        deliveries: totalQty
      };

      let totalSalary = 0;
      let errorMsg: string | null = null;
      try {
        totalSalary = evaluateFormula(formula, context);
      } catch (err: any) {
        errorMsg = err.message;
      }

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        phone: employee.phone,
        baseSalary: employee.baseSalary,
        totalDeliveries: totalQty,
        overtime: input.overtime,
        workDays: input.workDays,
        bonus: input.bonus,
        totalSalary,
        formula,
        error: errorMsg,
        breakdown: Object.values(breakdownMap)
      };
    });
  }
}

export const salaryService = new SalaryService();
