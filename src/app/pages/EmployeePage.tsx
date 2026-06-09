import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router';
import { Flame, LogOut, Plus, FileText, TrendingUp, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeePage() {
  const { user, logout } = useAuth();
  const { addDeliveryReport, updateDeliveryReport, deliveryReports, inventory } = useData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    quantity: '',
    containerType: inventory.length > 0 ? inventory[0].containerType : '',
    unitPrice: '',
    actualReceived: '',
    notes: '',
  });

  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const handleStartEdit = (report: any) => {
    setEditingReportId(report.id);
    setFormData({
      customerName: report.customerName,
      quantity: String(report.quantity),
      containerType: report.containerType,
      unitPrice: String(report.unitPrice),
      actualReceived: String(report.actualReceived),
      notes: report.notes || '',
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setFormData({
      customerName: '',
      quantity: '',
      containerType: inventory.length > 0 ? inventory[0].containerType : '',
      unitPrice: '',
      actualReceived: '',
      notes: '',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = formData.quantity === '' ? 0 : parseFloat(formData.quantity);
    const unitPrice = formData.unitPrice === '' ? 0 : parseFloat(formData.unitPrice);
    const total = quantity * unitPrice;
    const actualReceived = formData.actualReceived === '' ? 0 : parseFloat(formData.actualReceived);

    if (editingReportId) {
      const result = await updateDeliveryReport(editingReportId, {
        customerName: formData.customerName,
        quantity,
        containerType: formData.containerType,
        unitPrice,
        total,
        actualReceived,
        notes: formData.notes,
      });

      if (result && !result.success) {
        toast.error(result.message || 'Lỗi khi cập nhật báo cáo');
        return;
      }

      toast.success('Cập nhật báo cáo giao gas thành công!');
      setEditingReportId(null);
    } else {
      const result = await addDeliveryReport({
        employeeId: user!.id,
        employeeName: user!.name,
        date: new Date().toISOString().split('T')[0],
        customerName: formData.customerName,
        quantity,
        containerType: formData.containerType,
        unitPrice,
        total,
        actualReceived,
        notes: formData.notes,
      });
      
      if (result && !result.success) {
        toast.error(result.message || 'Lỗi khi tạo báo cáo');
        return;
      }

      toast.success('Đã gửi báo cáo giao gas thành công!');
    }

    setFormData({
      customerName: '',
      quantity: '',
      containerType: inventory.length > 0 ? inventory[0].containerType : '',
      unitPrice: '',
      actualReceived: '',
      notes: '',
    });
  };

  const myReportsToday = deliveryReports.filter(
    report => report.employeeId === user!.id && report.date === new Date().toISOString().split('T')[0]
  );

  const totalDeliveredToday = myReportsToday.reduce((sum, report) => sum + report.quantity, 0);
  const totalRevenueToday = myReportsToday.reduce((sum, report) => sum + report.total, 0);
  const totalActualReceivedToday = myReportsToday.reduce((sum, report) => sum + report.actualReceived, 0);

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
                  <div className="font-bold text-xl text-white">Nhân viên giao gas</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-blue-400/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <div className="text-sm font-semibold opacity-95">Số đơn hôm nay</div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">{myReportsToday.length}</div>
            <div className="text-xs opacity-80 mt-2">Đơn hàng đã giao</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-emerald-400/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <Flame className="w-7 h-7" />
              </div>
              <div className="text-sm font-semibold opacity-95">Tổng số bình</div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">{totalDeliveredToday}</div>
            <div className="text-xs opacity-80 mt-2">Bình gas đã giao</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-red-700 rounded-2xl p-7 text-white shadow-2xl hover-lift border border-orange-400/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="text-sm font-semibold opacity-95">Doanh thu hôm nay</div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">
              {(totalRevenueToday / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs opacity-80 mt-2">Triệu đồng</div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100 hover-lift">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-16 h-16 bg-gradient-to-br ${editingReportId ? 'from-blue-500 to-indigo-600' : 'from-orange-500 via-red-500 to-red-600'} rounded-2xl flex items-center justify-center shadow-lg`}>
              {editingReportId ? <Pencil className="w-8 h-8 text-white" /> : <Plus className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {editingReportId ? 'Chỉnh sửa báo cáo' : 'Báo cáo giao gas'}
              </h2>
              <p className="text-sm text-gray-600 font-medium mt-1">📅 Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Tên khách hàng
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                  placeholder="Nhập tên khách hàng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Số lượng giao (Đầy)
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                  placeholder="Số lượng bình (mặc định 0)"
                  min="0"
                  step="1"
                />
              </div>



              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Loại bình
                </label>
                <select
                  value={formData.containerType}
                  onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                  required
                >
                  {inventory.length > 0 ? (
                    inventory.map(inv => (
                      <option key={inv.id} value={inv.containerType}>{inv.containerType}</option>
                    ))
                  ) : (
                    <option value="">Chưa có dữ liệu kho</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Đơn giá (ĐG)
                </label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                  placeholder="Đơn giá (VND, mặc định 0)"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Thành tiền (TT)
                </label>
                <input
                  type="text"
                  value={formData.quantity && formData.unitPrice
                    ? (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toLocaleString('vi-VN')
                    : '0'}
                  className="w-full px-5 py-3.5 border-2 border-green-200 rounded-xl bg-green-50/50 font-bold text-green-700 shadow-sm"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5">
                  Thực nhận
                </label>
                <input
                  type="number"
                  value={formData.actualReceived}
                  onChange={(e) => setFormData({ ...formData, actualReceived: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                  placeholder="Số tiền thực nhận (VND, mặc định 0)"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2.5">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm hover:border-gray-300"
                placeholder="Ghi chú thêm (nếu có)"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              {editingReportId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-1/3 bg-gray-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-600 transition-all shadow-lg hover:scale-[1.02] transform flex items-center justify-center gap-3"
                >
                  <X className="w-6 h-6" />
                  Hủy chỉnh sửa
                </button>
              )}
              <button
                type="submit"
                className={`${editingReportId ? 'w-2/3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' : 'w-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600 hover:from-orange-600 hover:via-red-600 hover:to-red-700'} text-white py-4 rounded-xl font-bold text-lg transition-all shadow-2xl hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-3`}
              >
                {editingReportId ? (
                  <>
                    <Pencil className="w-6 h-6" />
                    Cập nhật báo cáo
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    Gửi báo cáo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {myReportsToday.length > 0 && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-6">📋 Lịch sử giao hôm nay</h3>
            <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 shadow-lg">
              <table className="w-full">
                <thead>
                  <tr className="table-header-gas">
                    <th className="text-left py-4 px-5 text-sm font-bold">Khách hàng</th>
                    <th className="text-center py-4 px-5 text-sm font-bold">SL</th>
                    <th className="text-left py-4 px-5 text-sm font-bold">Loại bình</th>
                    <th className="text-right py-4 px-5 text-sm font-bold">Đơn giá</th>
                    <th className="text-right py-4 px-5 text-sm font-bold">Thành tiền</th>
                    <th className="text-right py-4 px-5 text-sm font-bold">Thực nhận</th>
                    <th className="text-left py-4 px-5 text-sm font-bold">Ghi chú</th>
                    <th className="text-center py-4 px-5 text-sm font-bold w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {myReportsToday.map((report, index) => (
                    <tr key={report.id} className={`border-b border-gray-200 transition-colors ${
                      index % 2 === 0 ? 'bg-blue-50/30' : 'bg-white'
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
                      <td className="py-4 px-5 text-sm text-center">
                        <button
                          onClick={() => handleStartEdit(report)}
                          className="p-2 text-blue-600 hover:text-blue-805 hover:bg-blue-50 rounded-lg transition-all"
                          title="Chỉnh sửa báo cáo"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-200">
                    <td className="py-4 px-5 text-sm font-extrabold text-blue-800 text-center">Tổng</td>
                    <td className="py-4 px-5 text-sm text-center font-extrabold text-blue-800">{totalDeliveredToday}</td>
                    <td className="py-4 px-5"></td>
                    <td className="py-4 px-5"></td>
                    <td className="py-4 px-5 text-sm text-right font-extrabold text-green-700">{totalRevenueToday.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-4 px-5 text-sm text-right font-extrabold text-orange-700">{totalActualReceivedToday.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-4 px-5"></td>
                    <td className="py-4 px-5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
