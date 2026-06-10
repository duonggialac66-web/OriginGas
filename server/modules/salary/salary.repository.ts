import prisma from '../../db.js';

export class SalaryRepository {
  async getFormula() {
    let config = await prisma.salaryFormula.findFirst();
    if (!config) {
      config = await prisma.salaryFormula.create({
        data: { formula: 'baseSalary * overtime' }
      });
    }
    return config;
  }

  async updateFormula(formula: string) {
    const config = await prisma.salaryFormula.findFirst();
    if (config) {
      return prisma.salaryFormula.update({
        where: { id: config.id },
        data: { formula }
      });
    } else {
      return prisma.salaryFormula.create({
        data: { formula }
      });
    }
  }

  async getMonthlySalaryInputs(month: string) {
    return prisma.monthlySalaryInput.findMany({
      where: { month }
    });
  }

  async upsertMonthlySalaryInput(
    employeeId: string, 
    month: string, 
    overtime: number, 
    workDays: number, 
    bonus: number, 
    calculatedSalary: number
  ) {
    return prisma.monthlySalaryInput.upsert({
      where: {
        employeeId_month: { employeeId, month }
      },
      update: { overtime, workDays, bonus, calculatedSalary },
      create: { employeeId, month, overtime, workDays, bonus, calculatedSalary }
    });
  }

  async findSalaryConfigs() {
    return prisma.salaryConfig.findMany({
      orderBy: { containerType: 'asc' }
    });
  }

  async upsertSalaryConfig(containerType: string, commission: number) {
    return prisma.salaryConfig.upsert({
      where: { containerType },
      update: { commission },
      create: { containerType, commission }
    });
  }

  async findEmployeesWithReports(month: string) {
    // Lấy tất cả nhân viên (role = employee)
    const employees = await prisma.user.findMany({
      where: { role: 'employee' },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        startDate: true,
        status: true,
        baseSalary: true
      }
    });

    // Lấy tất cả báo cáo giao hàng trong tháng
    const reports = await prisma.deliveryReport.findMany({
      where: {
        date: {
          startsWith: month
        }
      }
    });

    return { employees, reports };
  }
}

export const salaryRepository = new SalaryRepository();
