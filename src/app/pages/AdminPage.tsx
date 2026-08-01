import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router';
import {
  Flame,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  UserPlus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  UserCircle,
  Database,
  PlusCircle,
  Save,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'overview' | 'employees' | 'reports' | 'inventory' | 'salary';

export function AdminPage() {
  const { user, logout } = useAuth();
  const { 
    deliveryReports, 
    employees, 
    inventory, 
    salaryConfigs,
    salaryFormula,
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    importInventory, 
    updateInventoryQuantity,
    updateSalaryConfig,
    getCalculatedSalaries,
    updateSalaryFormula,
    updateMonthlySalaryInput
  } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as const,
    baseSalary: '',
  });

  const [importData, setImportData] = useState({ type: '', fullQuantity: 0 });
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [editInventoryQuantity, setEditInventoryQuantity] = useState({ full: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [calculatedSalaries, setCalculatedSalaries] = useState<any[]>([]);
  const [commissionForm, setCommissionForm] = useState({ containerType: '', commission: '' });
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Bộ lọc báo cáo — mặc định là ngày hôm nay
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDateFrom, setFilterDateFrom] = useState(todayStr);
  const [filterDateTo, setFilterDateTo] = useState(todayStr);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterContainer, setFilterContainer] = useState('');

  const [formulaInput, setFormulaInput] = useState('');
  const [editingInputs, setEditingInputs] = useState<Record<string, { overtime: string; workDays: string; bonus: string }>>({});

  useEffect(() => {
    if (salaryFormula) {
      setFormulaInput(salaryFormula);
    }
  }, [salaryFormula]);

  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSalaryFormula(formulaInput);
      toast.success('Đã cập nhật công thức tính lương!');
      if (calculatedSalaries.length > 0) {
        // Run calculate salary again to refresh figures
        const salaries = await getCalculatedSalaries(selectedMonth);
        setCalculatedSalaries(salaries);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật công thức');
    }
  };

  const handleSaveMonthlyInput = async (employeeId: string) => {
    const inputs = editingInputs[employeeId];
    if (!inputs) return;

    try {
      await updateMonthlySalaryInput(
        employeeId,
        selectedMonth,
        parseFloat(inputs.overtime) || 0,
        parseFloat(inputs.workDays) || 0,
        parseFloat(inputs.bonus) || 0
      );
      toast.success('Đã lưu thông số thành công!');
      // Refresh calculated salaries
      const salaries = await getCalculatedSalaries(selectedMonth);
      setCalculatedSalaries(salaries);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi lưu thông số');
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    const comm = parseFloat(commissionForm.commission);
    if (!commissionForm.containerType) return toast.error('Vui lòng chọn loại bình');
    if (isNaN(comm) || comm < 0) return toast.error('Hoa hồng phải lớn hơn hoặc bằng 0');
    
    await updateSalaryConfig(commissionForm.containerType, comm);
    toast.success(`Đã cập nhật hoa hồng cho ${commissionForm.containerType}`);
    setCommissionForm({ containerType: '', commission: '' });
  };

  const handleCalculateSalary = async () => {
    setIsCalculating(true);
    try {
      const salaries = await getCalculatedSalaries(selectedMonth);
      setCalculatedSalaries(salaries);
      
      // Initialize editing inputs state for each calculated employee
      const initialInputs: Record<string, { overtime: string; workDays: string; bonus: string }> = {};
      salaries.forEach(sal => {
        initialInputs[sal.employeeId] = {
          overtime: String(sal.overtime),
          workDays: String(sal.workDays),
          bonus: String(sal.bonus)
        };
      });
      setEditingInputs(initialInputs);

      if (salaries.length === 0) {
        toast.info('Không tìm thấy dữ liệu báo cáo cho tháng này');
      } else {
        toast.success(`Đã tính lương cho tháng ${selectedMonth}`);
      }
    } catch (error) {
      toast.error('Lỗi khi tính lương');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleImportInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importData.fullQuantity <= 0) return toast.error('Số lượng nhập phải lớn hơn 0');
    await importInventory(importData.type, importData.fullQuantity);
    toast.success(`Đã nhập kho ${importData.type}`);
    setImportData({ type: '', fullQuantity: 0 });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployeeId) {
      updateEmployee(editingEmployeeId, {
        name: newEmployee.name,
        phone: newEmployee.phone,
        status: newEmployee.status,
        baseSalary: Number(newEmployee.baseSalary) || 0,
      });
      toast.success('Đã cập nhật nhân viên thành công!');
      setEditingEmployeeId(null);
    } else {
      addEmployee({
        ...newEmployee,
        baseSalary: Number(newEmployee.baseSalary) || 0,
      });
      toast.success('Đã thêm nhân viên thành công!');
    }
    setShowAddEmployee(false);
    setNewEmployee({
      name: '',
      username: '',
      password: '',
      phone: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      baseSalary: '',
    });
  };

  const handleStartEditEmployee = (emp: any) => {
    setEditingEmployeeId(emp.id);
    setNewEmployee({
      name: emp.name,
      username: emp.username,
      password: '',
      phone: emp.phone,
      startDate: new Date(emp.startDate).toISOString().split('T')[0],
      status: emp.status,
      baseSalary: String(emp.baseSalary || 0),
    });
    setShowAddEmployee(true);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    updateEmployee(id, { status: currentStatus === 'active' ? 'inactive' : 'active' });
    toast.success('Đã cập nhật trạng thái nhân viên!');
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhân viên ${name}?`)) {
      deleteEmployee(id);
      toast.success('Đã xóa nhân viên!');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayReports = deliveryReports.filter(report => report.date === today);

  const totalRevenue = todayReports.reduce((sum, report) => sum + report.total, 0);
  const gasReportsToday = todayReports.filter(r => r.containerType !== 'Gas lon');
  const cannedReportsToday = todayReports.filter(r => r.containerType === 'Gas lon');
  
  const totalDeliveries = gasReportsToday.length;
  const totalQuantity = gasReportsToday.reduce((sum, report) => sum + report.quantity, 0);
  const totalCannedQuantity = cannedReportsToday.reduce((sum, report) => sum + report.quantity, 0);
  
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;

  const employeeStats = employees.map(employee => {
    const employeeReports = todayReports.filter(r => r.employeeId === employee.id);
    const empGasReports = employeeReports.filter(r => r.containerType !== 'Gas lon');
    const empCannedReports = employeeReports.filter(r => r.containerType === 'Gas lon');
    
    const revenue = employeeReports.reduce((sum, r) => sum + r.total, 0);
    const quantity = empGasReports.reduce((sum, r) => sum + r.quantity, 0);
    const cannedQuantity = empCannedReports.reduce((sum, r) => sum + r.quantity, 0);
    
    return {
      ...employee,
      todayDeliveries: empGasReports.length,
      todayRevenue: revenue,
      todayQuantity: quantity,
      todayCannedQuantity: cannedQuantity,
    };
  }).sort((a, b) => b.todayRevenue - a.todayRevenue);

  // Lọc báo cáo theo bộ lọc
  const filteredReports = deliveryReports.filter(r => {
    if (filterDateFrom && r.date < filterDateFrom) return false;
    if (filterDateTo && r.date > filterDateTo) return false;
    if (filterEmployee && r.employeeId !== filterEmployee) return false;
    if (filterContainer && r.containerType !== filterContainer) return false;
    return true;
  });

  // Có bộ lọc "khác với hôm nay" thì mới hiện nút reset
  const hasActiveFilter = filterDateFrom !== todayStr || filterDateTo !== todayStr || filterEmployee || filterContainer;

  const filteredRevenue = filteredReports.reduce((s, r) => s + r.total, 0);
  const filteredQuantity = filteredReports.reduce((s, r) => s + r.quantity, 0);

  const containerTypes = [...new Set(deliveryReports.map(r => r.containerType))];

  const groupedReports = employees.map(emp => {
    const empReports = filteredReports.filter(r => r.employeeId === emp.id);
    const gasReports = empReports.filter(r => r.containerType !== 'Gas lon');
    const cannedReports = empReports.filter(r => r.containerType === 'Gas lon');
    return {
      employee: emp,
      reports: empReports,
      gasReports,
      cannedReports,
      totalQuantity: gasReports.reduce((sum, r) => sum + r.quantity, 0),
      totalCannedQuantity: cannedReports.reduce((sum, r) => sum + r.quantity, 0),
      totalRevenue: empReports.reduce((sum, r) => sum + r.total, 0),
      totalReceived: empReports.reduce((sum, r) => sum + r.actualReceived, 0),
    };
  }).filter(group => group.reports.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden text-slate-200">
      {/* Animated Glowing Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)] z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse duration-10000 z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse z-0 pointer-events-none" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>

      <div className="relative z-10">
        <nav className="bg-slate-900/50 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Flame className="w-8 h-8 text-gray-100" />
                </div>
                <div>
                  <div className="font-bold text-xl text-gray-100">Admin Dashboard</div>
                  <div className="text-sm text-slate-400 font-medium">{user?.name}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-extrabold border-2 border-transparent hover:border-red-500/30"
              >
                <LogOut className="w-5 h-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 animate-fade-in">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 bg-gray-50'
            }`}
          >
            <Users className="w-6 h-6" />
            Quản lý nhân viên
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 bg-gray-50'
            }`}
          >
            <FileText className="w-6 h-6" />
            Báo cáo giao hàng
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 bg-gray-50'
            }`}
          >
            <Database className="w-6 h-6" />
            Quản lý kho
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'salary'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 bg-gray-50'
            }`}
          >
            <DollarSign className="w-6 h-6" />
            Tính lương nhân viên
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-red-700 rounded-2xl p-7 text-gray-100 shadow-lg border border-gray-100 hover-lift border border-orange-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold opacity-95">Doanh thu hôm nay</div>
                    <div className="text-4xl font-extrabold tracking-tight">{(totalRevenue / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Triệu đồng</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-7 text-gray-100 shadow-lg border border-gray-100 hover-lift border border-blue-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold opacity-95">Đơn hàng hôm nay</div>
                    <div className="text-4xl font-extrabold tracking-tight">{totalDeliveries}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Đơn hàng Gas lớn</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-7 text-gray-100 shadow-lg border border-gray-100 hover-lift border border-emerald-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold opacity-95">Tổng số bình</div>
                    <div className="text-4xl font-extrabold tracking-tight">{totalQuantity}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Bình Gas lớn đã giao (+ {totalCannedQuantity} lon)</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-7 text-gray-100 shadow-lg border border-gray-100 hover-lift border border-purple-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold opacity-95">NV đang làm</div>
                    <div className="text-4xl font-extrabold tracking-tight">{activeEmployees}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Nhân viên hoạt động</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-gray-100" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Hiệu suất nhân viên hôm nay
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-500 border-b border-gray-200">
                      <th className="text-center py-5 px-5 text-sm font-bold">Xếp hạng</th>
                      <th className="text-left py-5 px-5 text-sm font-bold">Nhân viên</th>
                      <th className="text-center py-5 px-5 text-sm font-bold">Số đơn</th>
                      <th className="text-center py-5 px-5 text-sm font-bold">Số bình</th>
                      <th className="text-right py-5 px-5 text-sm font-bold">Doanh thu</th>
                      <th className="text-center py-5 px-5 text-sm font-bold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeStats.map((employee, index) => (
                      <tr key={employee.id} className={`border-b border-gray-200 transition-colors ${
                        index % 2 === 0 ? 'bg-blue-50/30' : 'bg-white'
                      } hover:bg-orange-50`}>
                        <td className="py-5 px-5 text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base mx-auto shadow-md ${
                            index === 0 ? 'bg-gray-100 text-gray-900 text-gray-100' :
                            index === 1 ? 'bg-gray-100 text-gray-900 text-gray-100' :
                            index === 2 ? 'bg-gray-100 text-gray-900 text-gray-100' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-5 px-5">
                          <div className="font-bold text-gray-900 text-base">{employee.name}</div>
                          <div className="text-sm text-gray-600 mt-0.5">{employee.phone}</div>
                        </td>
                        <td className="py-5 px-5 text-center text-sm font-bold text-blue-600">{employee.todayDeliveries}</td>
                        <td className="py-5 px-5 text-center text-sm font-extrabold text-gray-700">
                          {employee.todayQuantity} bình {employee.todayCannedQuantity > 0 && <span className="text-teal-600 block text-xs">(+ {employee.todayCannedQuantity} lon)</span>}
                        </td>
                        <td className="py-5 px-5 text-right text-sm font-bold text-green-600">
                          {employee.todayRevenue.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                            employee.status === 'active'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}>
                            {employee.status === 'active' ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Nghỉ việc
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-gray-100" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Quản lý nhân viên
                  </h2>
                  <p className="text-gray-600 font-medium mt-1">👥 Tổng số: {employees.length} nhân viên</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 rounded-2xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-red-700 shadow-lg border border-gray-100 hover-lift transition-all"
              >
                <UserPlus className="w-6 h-6" />
                Thêm nhân viên
              </button>
            </div>

            {showAddEmployee && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100 animate-fade-in">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-6">
                  {editingEmployeeId ? '✏️ Cập nhật thông tin nhân viên' : '✨ Thêm nhân viên mới'}
                </h3>
                <form onSubmit={handleAddEmployee} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Họ và tên</label>
                      <input
                        type="text"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Tên đăng nhập</label>
                      <input
                        type="text"
                        value={newEmployee.username}
                        onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                        required
                        disabled={!!editingEmployeeId}
                      />
                    </div>
                    {!editingEmployeeId && (
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2.5">Mật khẩu</label>
                        <input
                          type="password"
                          value={newEmployee.password}
                          onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                          className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Số điện thoại</label>
                      <input
                        type="tel"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Lương cơ bản (VND)</label>
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={newEmployee.baseSalary}
                        onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                        required
                        placeholder="VD: 5000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={newEmployee.startDate}
                        onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-lg hover:border-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:bg-black text-gray-100 py-4 rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-red-700 transition-all shadow-xl hover:scale-[1.02]"
                    >
                      {editingEmployeeId ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEmployee(false);
                        setEditingEmployeeId(null);
                        setNewEmployee({
                          name: '',
                          username: '',
                          password: '',
                          phone: '',
                          startDate: new Date().toISOString().split('T')[0],
                          status: 'active',
                          baseSalary: '',
                        });
                      }}
                      className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-7 hover-lift transition-all border border-gray-100">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-red-600 rounded-2xl flex items-center justify-center text-gray-100 font-extrabold text-2xl shadow-lg">
                      {employee.name.charAt(0)}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                      employee.status === 'active'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                      {employee.status === 'active' ? 'Hoạt động' : 'Nghỉ việc'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-gray-900 mb-2">{employee.name}</h3>
                  <p className="text-sm text-gray-600 mb-1.5 font-medium">👤 {employee.username}</p>
                  <p className="text-sm text-gray-600 mb-1.5 font-medium">📱 {employee.phone}</p>
                  <p className="text-sm text-green-600 mb-4 font-bold">
                    💵 Lương cơ bản: {(employee.baseSalary || 0).toLocaleString('vi-VN')} ₫
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-5 font-extrabold bg-gray-50 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Từ {new Date(employee.startDate).toLocaleDateString('vi-VN')}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleStatus(employee.id, employee.status)}
                      className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-gray-100 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-bold shadow-lg hover:scale-[1.02]"
                    >
                      {employee.status === 'active' ? 'Tạm nghỉ' : 'Kích hoạt'}
                    </button>
                    <button
                      onClick={() => handleStartEditEmployee(employee)}
                      className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border-2 border-blue-200 shadow-md hover:scale-[1.02]"
                      title="Sửa thông tin"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border-2 border-red-200 shadow-md hover:scale-[1.02]"
                      title="Xóa nhân viên"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Header + Bộ lọc */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Filter className="w-6 h-6 text-gray-100" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Bộ lọc báo cáo</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Lọc theo ngày, nhân viên hoặc loại bình</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Từ ngày</label>
                  <input type="date" value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Đến ngày</label>
                  <input type="date" value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Nhân viên</label>
                  <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all bg-white">
                    <option value="">Tất cả nhân viên</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Loại bình</label>
                  <select value={filterContainer} onChange={e => setFilterContainer(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-gray-900 text-sm outline-none focus:border-blue-500 transition-all bg-white">
                    <option value="">Tất cả loại bình</option>
                    {containerTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                  </select>
                </div>
              </div>
              {hasActiveFilter && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-blue-600 font-extrabold">🔍 Đang lọc — {filteredReports.length} báo cáo</p>
                  <button onClick={() => { setFilterDateFrom(todayStr); setFilterDateTo(todayStr); setFilterEmployee(''); setFilterContainer(''); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold transition-all">
                    <X className="w-3.5 h-3.5" /> Về hôm nay
                  </button>
                </div>
              )}
            </div>

            {/* Thống kê tổng */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 sm:p-5 text-gray-100 shadow-xl">
                <div className="text-xs font-extrabold opacity-80 mb-1">Tổng doanh thu</div>
                <div className="text-base sm:text-2xl font-extrabold">{(filteredRevenue / 1000000).toFixed(2)}M ₫</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-3 sm:p-5 text-gray-100 shadow-xl">
                <div className="text-xs font-extrabold opacity-80 mb-1">Số đơn hàng</div>
                <div className="text-base sm:text-2xl font-extrabold">{filteredReports.length}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-3 sm:p-5 text-gray-100 shadow-xl">
                <div className="text-xs font-extrabold opacity-80 mb-1">Tổng số bình</div>
                <div className="text-base sm:text-2xl font-extrabold">{filteredQuantity}</div>
              </div>
            </div>

            {/* Bảng kết quả */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-100" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Danh sách báo cáo</h3>
              </div>

              {groupedReports.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-300 rounded-2xl">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">{hasActiveFilter ? 'Không tìm thấy báo cáo phù hợp với bộ lọc' : 'Chưa có báo cáo nào'}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupedReports.map((group) => (
                    <div key={group.employee.id} className="bg-white rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-xl overflow-hidden animate-fade-in">
                      {/* Header nhân viên */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 flex justify-between items-center text-gray-100 flex-wrap gap-2">
                        <div className="font-bold text-lg sm:text-xl flex items-center gap-3">
                          <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                          {group.employee.name}
                        </div>
                        <div className="text-xs sm:text-sm bg-white/20 px-3 sm:px-4 py-1.5 rounded-full font-bold">
                          {group.reports.length} đơn · {group.totalRevenue.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      {/* MOBILE: Card layout */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {group.gasReports.length > 0 && (
                          <>
                            <div className="px-4 py-2 bg-blue-50 text-blue-800 font-bold text-xs uppercase tracking-wider">Gas lớn</div>
                            {group.gasReports.map((report, index) => (
                              <div key={report.id} className={`p-4 ${index % 2 === 0 ? 'bg-gradient-to-r from-blue-100 to-blue-50' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-bold text-gray-900 text-sm">{report.customerName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{new Date(report.date).toLocaleDateString('vi-VN')} · {report.containerType}</div>
                                  </div>
                                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">SL: {report.quantity}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                                  <div className="text-gray-500">Đơn giá</div>
                                  <div className="text-right text-gray-700 font-extrabold">{report.unitPrice.toLocaleString('vi-VN')} ₫</div>
                                  <div className="text-gray-500">Thành tiền</div>
                                  <div className="text-right font-bold text-green-600">{report.total.toLocaleString('vi-VN')} ₫</div>
                                  <div className="text-gray-500">Thực nhận</div>
                                  <div className="text-right font-extrabold text-orange-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</div>
                                  {report.notes && (
                                    <>
                                      <div className="text-gray-500">Ghi chú</div>
                                      <div className="text-right text-gray-600">{report.notes}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {group.cannedReports.length > 0 && (
                          <>
                            <div className="px-4 py-2 bg-teal-50 text-gray-800 font-bold text-xs uppercase tracking-wider">Gas lon</div>
                            {group.cannedReports.map((report, index) => (
                              <div key={report.id} className={`p-4 ${index % 2 === 0 ? 'bg-gradient-to-r from-blue-100 to-blue-50' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-bold text-gray-900 text-sm">{report.customerName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{new Date(report.date).toLocaleDateString('vi-VN')}</div>
                                  </div>
                                  <span className="text-xs font-bold bg-teal-100 text-gray-700 px-2 py-1 rounded-full">SL: {report.quantity}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                                  <div className="text-gray-500">Giá bán</div>
                                  <div className="text-right font-bold text-teal-600">{report.unitPrice.toLocaleString('vi-VN')} ₫</div>
                                  <div className="text-gray-500">Tổng thu</div>
                                  <div className="text-right font-bold text-green-600">{report.total.toLocaleString('vi-VN')} ₫</div>
                                  <div className="text-gray-500">Thực nhận</div>
                                  <div className="text-right font-extrabold text-orange-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</div>
                                  {report.notes && (
                                    <>
                                      <div className="text-gray-500">Ghi chú</div>
                                      <div className="text-right text-gray-600">{report.notes}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Footer tổng cộng mobile */}
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-200">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="font-extrabold text-blue-800">Tổng số bình lớn</div>
                            <div className="text-right font-extrabold text-blue-800">{group.totalQuantity}</div>
                            {group.totalCannedQuantity > 0 && (
                              <>
                                <div className="font-extrabold text-gray-800">Tổng số Gas lon</div>
                                <div className="text-right font-extrabold text-gray-800">{group.totalCannedQuantity}</div>
                              </>
                            )}
                            <div className="font-extrabold text-blue-800">Tổng doanh thu</div>
                            <div className="text-right font-extrabold text-green-700">{group.totalRevenue.toLocaleString('vi-VN')} ₫</div>
                            <div className="font-extrabold text-blue-800">Tổng thực nhận</div>
                            <div className="text-right font-extrabold text-orange-700">{group.totalReceived.toLocaleString('vi-VN')} ₫</div>
                          </div>
                        </div>
                      </div>

                      {/* DESKTOP: Table layout (ẩn trên màn hình nhỏ) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-50/50 border-b border-gray-200">
                              <th className="text-left py-3 px-5 text-xs font-bold text-gray-600">Ngày</th>
                              <th className="text-left py-3 px-5 text-xs font-bold text-gray-600">Khách hàng</th>
                              <th className="text-center py-3 px-5 text-xs font-bold text-gray-600">SL</th>
                              <th className="text-left py-3 px-5 text-xs font-bold text-gray-600">Loại bình</th>
                              <th className="text-right py-3 px-5 text-xs font-bold text-gray-600">Đơn giá</th>
                              <th className="text-right py-3 px-5 text-xs font-bold text-gray-600">Thành tiền</th>
                              <th className="text-right py-3 px-5 text-xs font-bold text-gray-600">Thực nhận</th>
                              <th className="text-left py-3 px-5 text-xs font-bold text-gray-600">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.gasReports.length > 0 && (
                              <>
                                <tr><td colSpan={8} className="bg-blue-50 py-2 px-5 text-xs font-bold text-blue-800 uppercase tracking-wider">Gas lớn</td></tr>
                                {group.gasReports.map((report, index) => (
                                  <tr key={report.id} className={`border-b border-gray-100 transition-colors ${
                                    index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                                  } hover:bg-orange-50`}>
                                    <td className="py-3 px-5 text-xs font-extrabold text-gray-500">{new Date(report.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="py-3 px-5 text-sm font-extrabold text-gray-900">{report.customerName}</td>
                                    <td className="py-3 px-5 text-sm text-center font-bold text-blue-600">{report.quantity}</td>
                                    <td className="py-3 px-5 text-sm text-gray-700">{report.containerType}</td>
                                    <td className="py-3 px-5 text-sm text-right text-gray-700">{report.unitPrice.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-right font-bold text-green-600">{report.total.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-right font-extrabold text-orange-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-gray-600">{report.notes || '-'}</td>
                                  </tr>
                                ))}
                              </>
                            )}
                            {group.cannedReports.length > 0 && (
                              <>
                                <tr><td colSpan={8} className="bg-blue-50 py-2 px-5 text-xs font-bold text-gray-800 uppercase tracking-wider">Gas lon</td></tr>
                                {group.cannedReports.map((report, index) => (
                                  <tr key={report.id} className={`border-b border-gray-100 transition-colors ${
                                    index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                                  } hover:bg-orange-50`}>
                                    <td className="py-3 px-5 text-xs font-extrabold text-gray-500">{new Date(report.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="py-3 px-5 text-sm font-extrabold text-gray-900">{report.customerName}</td>
                                    <td className="py-3 px-5 text-sm text-center font-bold text-teal-600">{report.quantity}</td>
                                    <td className="py-3 px-5 text-sm text-gray-700">Gas lon</td>
                                    <td className="py-3 px-5 text-sm text-right text-gray-700">{report.unitPrice.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-right font-bold text-green-600">{report.total.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-right font-extrabold text-orange-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-3 px-5 text-sm text-gray-600">{report.notes || '-'}</td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-200">
                              <td colSpan={2} className="py-3 px-5 text-sm font-extrabold text-blue-800">Tổng cộng</td>
                              <td className="py-3 px-5 text-sm text-center font-extrabold text-blue-800">
                                {group.totalQuantity} bình
                                {group.totalCannedQuantity > 0 && <span className="text-gray-700 block text-xs">(+ {group.totalCannedQuantity} lon)</span>}
                              </td>
                              <td /><td />
                              <td className="py-3 px-5 text-sm text-right font-extrabold text-green-700">{group.totalRevenue.toLocaleString('vi-VN')} ₫</td>
                              <td className="py-3 px-5 text-sm text-right font-extrabold text-orange-700">{group.totalReceived.toLocaleString('vi-VN')} ₫</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Database className="w-8 h-8 text-gray-100" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Quản lý kho
                </h2>
                <p className="text-gray-600 font-medium mt-1">📦 Cập nhật số lượng bình gas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Danh sách kho */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tồn kho hiện tại</h3>
                <div className="space-y-4">
                  {inventory.length > 0 ? (
                    inventory.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                        <div className="flex items-center gap-3">
                          <Package className="w-6 h-6 text-orange-500" />
                          <span className="font-bold text-gray-800">{item.containerType}</span>
                        </div>
                        {editingInventoryId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={editInventoryQuantity.full}
                              onChange={(e) => setEditInventoryQuantity({ ...editInventoryQuantity, full: parseInt(e.target.value) || 0 })}
                              className="w-16 px-2 py-1 text-right border-2 border-green-500 rounded-lg outline-none font-bold text-gray-900"
                              title="Số lượng"
                            />
                            <button
                              onClick={async () => {
                                await updateInventoryQuantity(item.id, editInventoryQuantity.full);
                                setEditingInventoryId(null);
                                toast.success('Đã cập nhật số lượng kho');
                              }}
                              className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingInventoryId(null)}
                              className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <div className="text-xl font-extrabold text-green-600">
                                {item.fullQuantity} <span className="text-xs font-medium text-green-600/70">bình</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingInventoryId(item.id);
                                setEditInventoryQuantity({ full: item.fullQuantity });
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 font-medium">Kho đang trống</div>
                  )}
                </div>
              </div>

              {/* Nhập kho */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Nhập hàng vào kho</h3>
                <form onSubmit={handleImportInventory} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Loại bình</label>
                    <input
                      type="text"
                      list="containerTypes"
                      value={importData.type}
                      onChange={e => setImportData({ ...importData, type: e.target.value })}
                      placeholder="VD: Bình 12kg..."
                      className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    />
                    <datalist id="containerTypes">
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.containerType} />
                      ))}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Số lượng</label>
                      <input
                        type="number"
                        min="0"
                        value={importData.fullQuantity === 0 ? '' : importData.fullQuantity}
                        onChange={e => setImportData({ ...importData, fullQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-3.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-gray-100 py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-xl"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Thêm vào kho
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'salary' && (
          <div className="space-y-8 animate-fade-in text-gray-900">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-8 h-8 text-gray-100" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  Cấu hình & Tính lương tự động
                </h2>
                <p className="text-gray-400 font-medium mt-1">📊 Thiết lập công thức và cập nhật thông số nhân viên hàng tháng</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cột 1: Cấu hình Công thức */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-6 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    🔧 Công thức lương
                  </h3>
                  <form onSubmit={handleSaveFormula} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Công thức toán học</label>
                      <textarea
                        value={formulaInput}
                        onChange={e => setFormulaInput(e.target.value)}
                        placeholder="VD: baseSalary * overtime"
                        rows={3}
                        className="w-full px-4 py-3 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-gray-100 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      Lưu công thức
                    </button>
                  </form>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Biến số khả dụng</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="p-2.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <code className="font-bold text-red-600">baseSalary</code>: Lương cơ bản của nhân viên
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <code className="font-bold text-blue-600">overtime</code>: Số công tăng ca (hệ số tăng ca)
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <code className="font-bold text-green-600">workDays</code>: Số ngày công làm việc thực tế
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <code className="font-bold text-orange-600">bonus</code>: Tiền thưởng thêm (VND)
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <code className="font-bold text-purple-600">deliveries</code>: Tổng số bình gas đã giao
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-blue-200 text-xs text-gray-500 leading-relaxed">
                    <p className="font-bold mb-1">Ví dụ công thức:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">baseSalary * overtime</code></li>
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">baseSalary * (workDays / 26) + bonus</code></li>
                      <li><code className="bg-gray-100 px-1 py-0.5 rounded">baseSalary + deliveries * 10000 + bonus</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cột 2 & 3: Bảng tính lương */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8 border border-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <h3 className="text-xl font-bold text-gray-900">Thông số lương & Tính toán</h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="px-4 py-2.5 text-gray-900 border-2 border-gray-200 bg-gray-50 rounded-xl outline-none font-bold focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={handleCalculateSalary}
                        disabled={isCalculating}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-gray-100 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-md disabled:opacity-50"
                      >
                        {isCalculating ? 'Đang tính...' : 'Tính lương'}
                      </button>
                    </div>
                  </div>

                  {calculatedSalaries.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                      <DollarSign className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Bấm nút "Tính lương" để tải danh sách nhân viên và bắt đầu tính lương</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {calculatedSalaries.map(sal => {
                        const isExpanded = expandedEmployeeId === sal.employeeId;
                        const empInputs = editingInputs[sal.employeeId] || { overtime: '1', workDays: '26', bonus: '0' };
                        
                        return (
                          <div key={sal.employeeId} className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg transition-all hover:shadow-md">
                            {/* Header dòng lương nhân viên */}
                            <div className="p-5 bg-gradient-to-r from-blue-100 to-blue-50 border-b border-gray-100">
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                  <h4 className="font-extrabold text-lg text-gray-900">{sal.employeeName}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">SĐT: {sal.phone || 'N/A'} | Lương cơ bản: {sal.baseSalary.toLocaleString('vi-VN')} ₫</p>
                                </div>
                                <div className="text-right">
                                  <span className="block text-xs text-gray-500 font-medium">Thực nhận</span>
                                  <span className="font-extrabold text-orange-600 text-xl">
                                    {sal.error ? '⚠️ Lỗi công thức' : `${sal.totalSalary.toLocaleString('vi-VN')} ₫`}
                                  </span>
                                </div>
                              </div>
                              {sal.error && (
                                <div className="mt-2 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">
                                  Lỗi: {sal.error}
                                </div>
                              )}
                            </div>

                            {/* Khu vực nhập biến số tháng */}
                            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 items-end bg-white">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Tăng ca (Hệ số)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={empInputs.overtime}
                                  onChange={e => setEditingInputs({
                                    ...editingInputs,
                                    [sal.employeeId]: { ...empInputs, overtime: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-900 outline-none focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Ngày công thực tế</label>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={empInputs.workDays}
                                  onChange={e => setEditingInputs({
                                    ...editingInputs,
                                    [sal.employeeId]: { ...empInputs, workDays: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-900 outline-none focus:border-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Thưởng thêm (VND)</label>
                                <input
                                  type="number"
                                  step="10000"
                                  min="0"
                                  value={empInputs.bonus}
                                  onChange={e => setEditingInputs({
                                    ...editingInputs,
                                    [sal.employeeId]: { ...empInputs, bonus: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-900 outline-none focus:border-orange-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveMonthlyInput(sal.employeeId)}
                                  className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-gray-100 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                                  title="Lưu thông số & Tính lại"
                                >
                                  <Save className="w-4 h-4" />
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setExpandedEmployeeId(isExpanded ? null : sal.employeeId)}
                                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                                >
                                  {isExpanded ? 'Đóng' : 'Đơn gas'}
                                </button>
                              </div>
                            </div>

                            {/* Chi tiết bình gas đã giao */}
                            {isExpanded && (
                              <div className="p-5 border-t border-gray-100 bg-gray-50/30 text-gray-900">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    Chi tiết gas đã giao trong tháng ({sal.totalDeliveries} bình)
                                  </h5>
                                  <span className="text-xs font-extrabold text-gray-500">
                                    Công thức sử dụng: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">{sal.formula}</code>
                                  </span>
                                </div>
                                {sal.breakdown.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">Không có báo cáo giao gas trong tháng này</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 font-bold">
                                          <th className="text-left py-2">Loại bình</th>
                                          <th className="text-center py-2">Số lượng đã giao</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sal.breakdown.map((item: any, idx: number) => (
                                          <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-2 font-extrabold text-gray-700">{item.containerType}</td>
                                            <td className="py-2 text-center font-bold text-blue-600">{item.quantity} bình</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}
