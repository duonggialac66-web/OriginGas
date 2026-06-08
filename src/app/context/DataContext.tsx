import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DeliveryReport, Employee, Inventory, SalaryConfig, CalculatedSalary, SalaryFormula } from '../types';
import { API_BASE_URL } from '../lib/api';

interface DataContextType {
  deliveryReports: DeliveryReport[];
  employees: Employee[];
  inventory: Inventory[];
  salaryConfigs: SalaryConfig[];
  salaryFormula: string;
  addDeliveryReport: (report: Omit<DeliveryReport, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateDeliveryReport: (id: string, report: Omit<DeliveryReport, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => Promise<{ success: boolean; message?: string }>;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  importInventory: (containerType: string, fullQty: number) => Promise<void>;
  updateInventoryQuantity: (id: string, fullQty: number) => Promise<void>;
  updateSalaryConfig: (containerType: string, commission: number) => Promise<void>;
  getCalculatedSalaries: (month: string) => Promise<CalculatedSalary[]>;
  updateSalaryFormula: (formula: string) => Promise<void>;
  updateMonthlySalaryInput: (employeeId: string, month: string, overtime: number, workDays: number, bonus: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);



export function DataProvider({ children }: { children: ReactNode }) {
  const [deliveryReports, setDeliveryReports] = useState<DeliveryReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfig[]>([]);
  const [salaryFormula, setSalaryFormula] = useState<string>('baseSalary * overtime');

  const fetchAllData = (token: string) => {
    fetch(`${API_BASE_URL}/api/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setDeliveryReports(data); })
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setEmployees(data); })
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setInventory(data); })
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/salary/configs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => { if (Array.isArray(data)) setSalaryConfigs(data); })
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/salary/formula`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => { if (data && data.formula) setSalaryFormula(data.formula); })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    // Fetch ngay nếu đã có token (refresh trang)
    const token = localStorage.getItem('gasToken');
    if (token) fetchAllData(token);

    // Lắng nghe event khi login xong và token vừa được lưu
    const handleTokenSaved = () => {
      const newToken = localStorage.getItem('gasToken');
      if (newToken) fetchAllData(newToken);
    };

    window.addEventListener('gas:token-saved', handleTokenSaved);
    return () => window.removeEventListener('gas:token-saved', handleTokenSaved);
  }, []);

  const addDeliveryReport = async (report: Omit<DeliveryReport, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return { success: false, message: 'Chưa đăng nhập' };

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      if (res.ok) {
        setDeliveryReports([data, ...deliveryReports]);
        
        // Cập nhật lại kho ở frontend (Trừ bình đầy)
        setInventory(prev => prev.map(inv => 
          inv.containerType === report.containerType 
            ? { ...inv, fullQuantity: inv.fullQuantity - report.quantity } 
            : inv
        ));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi mạng khi gọi server' };
    }
  };

  const updateDeliveryReport = async (id: string, report: Omit<DeliveryReport, 'id' | 'createdAt' | 'employeeId' | 'employeeName'>) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return { success: false, message: 'Chưa đăng nhập' };

    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      if (res.ok) {
        setDeliveryReports(prev => prev.map(rep => rep.id === id ? data : rep));
        
        // Cập nhật lại kho ở frontend bằng cách fetch lại từ server
        const invRes = await fetch(`${API_BASE_URL}/api/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const invData = await invRes.json();
        if (Array.isArray(invData)) {
          setInventory(invData);
        }
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi mạng khi gọi server' };
    }
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(employee)
      });
      if (res.ok) {
        const newEmployee = await res.json();
        setEmployees([...employees, newEmployee]);
      }
    } catch (error) {
      console.error('Lỗi khi thêm nhân viên:', error);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...updated } : emp));
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật nhân viên:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployees(employees.filter(emp => emp.id !== id));
      }
    } catch (error) {
      console.error('Lỗi khi xóa nhân viên:', error);
    }
  };

  const importInventory = async (containerType: string, fullQuantity: number) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ containerType, fullQuantity })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setInventory(prev => {
          const exists = prev.find(i => i.containerType === containerType);
          if (exists) {
            return prev.map(i => i.containerType === containerType ? updatedItem : i);
          }
          return [...prev, updatedItem];
        });
      }
    } catch (error) {
      console.error('Lỗi khi nhập kho:', error);
    }
  };

  const updateInventoryQuantity = async (id: string, fullQuantity: number) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ fullQuantity })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setInventory(prev => prev.map(i => i.id === id ? updatedItem : i));
      }
    } catch (error) {
      console.error('Lỗi khi sửa kho:', error);
    }
  };

  const updateSalaryConfig = async (containerType: string, commission: number) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/salary/configs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ containerType, commission })
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setSalaryConfigs(prev => {
          const exists = prev.find(c => c.containerType === containerType);
          if (exists) {
            return prev.map(c => c.containerType === containerType ? updatedConfig : c);
          }
          return [...prev, updatedConfig];
        });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật cấu hình lương:', error);
    }
  };

  const getCalculatedSalaries = async (month: string): Promise<CalculatedSalary[]> => {
    const token = localStorage.getItem('gasToken');
    if (!token) return [];

    try {
      const res = await fetch(`${API_BASE_URL}/api/salary?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data as CalculatedSalary[];
      }
      return [];
    } catch (error) {
      console.error('Lỗi khi tính toán lương:', error);
      return [];
    }
  };

  const updateSalaryFormula = async (formula: string) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/salary/formula`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ formula })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.formula) {
          setSalaryFormula(data.formula);
        }
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Lỗi khi cập nhật công thức');
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật công thức tính lương:', error);
      throw error;
    }
  };

  const updateMonthlySalaryInput = async (
    employeeId: string,
    month: string,
    overtime: number,
    workDays: number,
    bonus: number
  ) => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/salary/inputs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ employeeId, month, overtime, workDays, bonus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Lỗi khi cập nhật tham số tháng');
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật biến số tháng:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      deliveryReports,
      employees,
      inventory,
      salaryConfigs,
      salaryFormula,
      addDeliveryReport,
      updateDeliveryReport,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      importInventory,
      updateInventoryQuantity,
      updateSalaryConfig,
      getCalculatedSalaries,
      updateSalaryFormula,
      updateMonthlySalaryInput
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
