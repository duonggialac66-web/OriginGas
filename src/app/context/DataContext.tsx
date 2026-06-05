import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DeliveryReport, Employee, Inventory } from '../types';

interface DataContextType {
  deliveryReports: DeliveryReport[];
  employees: Employee[];
  inventory: Inventory[];
  addDeliveryReport: (report: Omit<DeliveryReport, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  importInventory: (containerType: string, fullQty: number) => Promise<void>;
  updateInventoryQuantity: (id: string, fullQty: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.PROD ? '' : 'https://origin-gas.vercel.app';

export function DataProvider({ children }: { children: ReactNode }) {
  const [deliveryReports, setDeliveryReports] = useState<DeliveryReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('gasToken');
    if (!token) return;

    // Lấy dữ liệu Báo cáo
    fetch(`${API_BASE_URL}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDeliveryReports(data);
      })
      .catch(err => console.error(err));

    // Lấy dữ liệu Nhân viên
    fetch(`${API_BASE_URL}/api/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch(err => console.error(err));

    // Lấy dữ liệu Kho
    fetch(`${API_BASE_URL}/api/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInventory(data);
      })
      .catch(err => console.error(err));
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

  return (
    <DataContext.Provider value={{
      deliveryReports,
      employees,
      inventory,
      addDeliveryReport,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      importInventory,
      updateInventoryQuantity
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
