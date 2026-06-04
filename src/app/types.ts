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
  quantity: number; // Bình đầy
  containerType: string;
  unitPrice: number;
  total: number;
  actualReceived: number;
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
}

export interface Inventory {
  id: string;
  containerType: string;
  fullQuantity: number;
}
