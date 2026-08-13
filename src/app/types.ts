export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  username: string;
}

export interface DeliveryReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  customerName: string;
  customerId?: string | null;
  customer?: Customer | null;
  quantity: number; // Bình đầy
  containerType: string;
  unitPrice: number;
  total: number;
  actualReceived: number;
  notes: string;
  paymentStatus: 'paid' | 'debt';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  nameHash?: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  description: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
  phone: string;
  startDate: string;
  status: 'active' | 'inactive';
  baseSalary: number;
}

export interface Inventory {
  id: string;
  containerType: string;
  fullQuantity: number;
}

export interface SalaryConfig {
  id: string;
  containerType: string;
  commission: number;
}

export interface SalaryFormula {
  id: string;
  formula: string;
}

export interface CalculatedSalary {
  employeeId: string;
  employeeName: string;
  phone: string;
  baseSalary: number;
  totalDeliveries: number;
  overtime: number;
  workDays: number;
  bonus: number;
  totalSalary: number;
  formula: string;
  error?: string | null;
  breakdown: {
    containerType: string;
    quantity: number;
  }[];
}
