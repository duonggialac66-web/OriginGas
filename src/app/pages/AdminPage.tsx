import { useState } from 'react';
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
  PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'overview' | 'employees' | 'reports' | 'inventory';

export function AdminPage() {
  const { user, logout } = useAuth();
  const { deliveryReports, employees, inventory, addEmployee, updateEmployee, deleteEmployee, importInventory, updateInventoryQuantity } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as const,
  });

  const [importData, setImportData] = useState({ type: '', fullQuantity: 0 });
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [editInventoryQuantity, setEditInventoryQuantity] = useState({ full: 0 });

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
    addEmployee(newEmployee);
    toast.success('Đã thêm nhân viên thành công!');
    setShowAddEmployee(false);
    setNewEmployee({
      name: '',
      username: '',
      password: '',
      phone: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
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
  const totalDeliveries = todayReports.length;
  const totalQuantity = todayReports.reduce((sum, report) => sum + report.quantity, 0);
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;

  const employeeStats = employees.map(employee => {
    const employeeReports = todayReports.filter(r => r.employeeId === employee.id);
    const revenue = employeeReports.reduce((sum, r) => sum + r.total, 0);
    const quantity = employeeReports.reduce((sum, r) => sum + r.quantity, 0);
    return {
      ...employee,
      todayDeliveries: employeeReports.length,
      todayRevenue: revenue,
      todayQuantity: quantity,
    };
  }).sort((a, b) => b.todayRevenue - a.todayRevenue);

  const groupedReports = employees.map(emp => {
    const empReports = todayReports.filter(r => r.employeeId === emp.id);
    return {
      employee: emp,
      reports: empReports,
      totalQuantity: empReports.reduce((sum, r) => sum + r.quantity, 0),
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
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white">Admin Dashboard</div>
                  <div className="text-sm text-slate-400 font-medium">{user?.name}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-semibold border-2 border-transparent hover:border-red-500/30"
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
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" />
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <Users className="w-6 h-6" />
            Quản lý nhân viên
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <FileText className="w-6 h-6" />
            Báo cáo giao hàng
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shadow-lg hover-lift ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            <Database className="w-6 h-6" />
            Quản lý kho
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-red-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-orange-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-95">Doanh thu hôm nay</div>
                    <div className="text-4xl font-extrabold tracking-tight">{(totalRevenue / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Triệu đồng</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-blue-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-95">Đơn hàng hôm nay</div>
                    <div className="text-4xl font-extrabold tracking-tight">{totalDeliveries}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Đơn hàng đã giao</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-emerald-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-95">Tổng số bình</div>
                    <div className="text-4xl font-extrabold tracking-tight">{totalQuantity}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Bình gas đã giao</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-purple-400/20">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold opacity-95">NV đang làm</div>
                    <div className="text-4xl font-extrabold tracking-tight">{activeEmployees}</div>
                  </div>
                </div>
                <div className="text-xs opacity-80 mt-2">Nhân viên hoạt động</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Hiệu suất nhân viên hôm nay
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="table-header-gas">
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
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
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
                        <td className="py-5 px-5 text-center text-sm font-semibold text-gray-700">{employee.todayQuantity}</td>
                        <td className="py-5 px-5 text-right text-sm font-bold text-green-600">
                          {employee.todayRevenue.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
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
                  <Users className="w-8 h-8 text-white" />
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
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white rounded-2xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-red-700 shadow-2xl hover-lift transition-all"
              >
                <UserPlus className="w-6 h-6" />
                Thêm nhân viên
              </button>
            </div>

            {showAddEmployee && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-6">✨ Thêm nhân viên mới</h3>
                <form onSubmit={handleAddEmployee} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Họ và tên</label>
                      <input
                        type="text"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Tên đăng nhập</label>
                      <input
                        type="text"
                        value={newEmployee.username}
                        onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Mật khẩu</label>
                      <input
                        type="password"
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Số điện thoại</label>
                      <input
                        type="tel"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={newEmployee.startDate}
                        onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-red-700 transition-all shadow-xl hover:scale-[1.02]"
                    >
                      Thêm nhân viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEmployee(false)}
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
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                      {employee.name.charAt(0)}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                      employee.status === 'active'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                      {employee.status === 'active' ? 'Hoạt động' : 'Nghỉ việc'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-gray-900 mb-2">{employee.name}</h3>
                  <p className="text-sm text-gray-600 mb-1.5 font-medium">👤 {employee.username}</p>
                  <p className="text-sm text-gray-600 mb-4 font-medium">📱 {employee.phone}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-5 font-semibold bg-gray-50 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Từ {new Date(employee.startDate).toLocaleDateString('vi-VN')}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleStatus(employee.id, employee.status)}
                      className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-bold shadow-lg hover:scale-[1.02]"
                    >
                      {employee.status === 'active' ? 'Tạm nghỉ' : 'Kích hoạt'}
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                      className="px-5 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border-2 border-red-200 shadow-md hover:scale-[1.02]"
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
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Báo cáo giao hàng
                  </h2>
                  <p className="text-gray-600 font-medium mt-1">📅 Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="text-right bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-4 rounded-2xl border-2 border-green-200">
                <div className="text-sm font-semibold text-gray-600">Tổng doanh thu</div>
                <div className="text-3xl font-extrabold text-green-600 mt-1">
                  {totalRevenue.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>

            {groupedReports.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-16 h-16 text-gray-300" />
                  <p className="text-gray-500 font-medium">Chưa có báo cáo nào trong ngày hôm nay</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedReports.map((group) => (
                  <div key={group.employee.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden animate-fade-in hover-lift">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                      <div className="font-bold text-xl flex items-center gap-3">
                        <UserCircle className="w-7 h-7" />
                        {group.employee.name}
                      </div>
                      <div className="text-sm bg-white/20 px-4 py-1.5 rounded-full font-bold backdrop-blur-md shadow-inner">
                        {group.reports.length} đơn hàng
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-50/50 border-b border-gray-200">
                            <th className="text-left py-4 px-5 text-sm font-bold text-gray-700">Khách hàng</th>
                            <th className="text-center py-4 px-5 text-sm font-bold text-gray-700">SL</th>
                            <th className="text-left py-4 px-5 text-sm font-bold text-gray-700">Loại bình</th>
                            <th className="text-right py-4 px-5 text-sm font-bold text-gray-700">Đơn giá</th>
                            <th className="text-right py-4 px-5 text-sm font-bold text-gray-700">Thành tiền</th>
                            <th className="text-right py-4 px-5 text-sm font-bold text-gray-700">Thực nhận</th>
                            <th className="text-left py-4 px-5 text-sm font-bold text-gray-700">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.reports.map((report, index) => (
                            <tr key={report.id} className={`border-b border-gray-100 transition-colors ${
                              index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'
                            } hover:bg-orange-50`}>
                              <td className="py-4 px-5 text-sm font-semibold text-gray-900">{report.customerName}</td>
                              <td className="py-4 px-5 text-sm text-center font-bold text-blue-600">{report.quantity}</td>
                              <td className="py-4 px-5 text-sm text-gray-700">{report.containerType}</td>
                              <td className="py-4 px-5 text-sm text-right text-gray-700">{report.unitPrice.toLocaleString('vi-VN')} ₫</td>
                              <td className="py-4 px-5 text-sm text-right font-bold text-green-600">
                                {report.total.toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="py-4 px-5 text-sm text-right font-semibold text-orange-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</td>
                              <td className="py-4 px-5 text-sm text-gray-600">{report.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-200">
                            <td className="py-4 px-5 text-sm font-extrabold text-blue-800 text-center">Tổng</td>
                            <td className="py-4 px-5 text-sm text-center font-extrabold text-blue-800">{group.totalQuantity}</td>
                            <td className="py-4 px-5"></td>
                            <td className="py-4 px-5"></td>
                            <td className="py-4 px-5 text-sm text-right font-extrabold text-green-700">{group.totalRevenue.toLocaleString('vi-VN')} ₫</td>
                            <td className="py-4 px-5 text-sm text-right font-extrabold text-orange-700">{group.totalReceived.toLocaleString('vi-VN')} ₫</td>
                            <td className="py-4 px-5"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </div>
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Database className="w-8 h-8 text-white" />
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
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tồn kho hiện tại</h3>
                <div className="space-y-4">
                  {inventory.length > 0 ? (
                    inventory.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
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
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
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
                      className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
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
                        className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-xl"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Thêm vào kho
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
  );
}
