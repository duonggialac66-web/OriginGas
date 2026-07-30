import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router';
import { Flame, LogOut, Plus, FileText, TrendingUp, Pencil, X, Minus, ArrowUpCircle, ArrowDownCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

export function EmployeePage() {
  const { user, logout } = useAuth();
  const { addDeliveryReport, updateDeliveryReport, deleteDeliveryReport, deliveryReports, inventory, expenses, addExpense, updateExpense, deleteExpense } = useData();
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

  // --- State cho form chi phí ---
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', notes: '' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // --- State cho form Gas Lon ---
  const [cannedGasForm, setCannedGasForm] = useState({ customerName: '', quantity: '', importPrice: '', sellingPrice: '', notes: '' });

  const [isExporting, setIsExporting] = useState(false);

  const handlePriceBlur = (val: string, updater: (newVal: string) => void) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num < 10000) {
      updater((num * 1000).toString());
    }
  };

  const handleExportToZalo = async () => {
    const element = document.getElementById('export-summary-section');
    if (!element) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return node.getAttribute('data-html2canvas-ignore') !== 'true';
          }
          return true;
        }
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      if (!blob) {
        toast.error('Không thể tạo ảnh báo cáo');
        return;
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const file = new File([blob], `baocao-${new Date().toISOString().split('T')[0]}.png`, { type: 'image/png' });

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Báo cáo doanh thu',
          text: 'Gửi báo cáo thu chi hôm nay',
          files: [file],
        });
      } else {
        // Trên Máy tính (PC) -> Copy thẳng vào Clipboard và mở Zalo
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          
          toast.success('ĐÃ COPY ẢNH! Hãy nhấn Ctrl+V (hoặc Chuột phải -> Dán) vào khung chat Zalo để gửi.', {
            duration: 8000,
            icon: '📋'
          });

          // Cố gắng mở app Zalo PC
          setTimeout(() => {
            window.location.href = 'zalo://';
          }, 500);

        } catch (clipboardErr) {
          // Nếu trình duyệt chặn copy, fallback sang tải file
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `baocao-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('Đã tải ảnh xuống. Hãy kéo thả ảnh vào Zalo để gửi!');
        }
      }
    } catch (error) {
      console.error('Lỗi export:', error);
      toast.error('Lỗi khi xuất ảnh');
    } finally {
      setIsExporting(false);
    }
  };

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

  const handleCannedGasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(cannedGasForm.quantity) || 0;
    const importPrice = parseFloat(cannedGasForm.importPrice) || 0;
    const sellingPrice = parseFloat(cannedGasForm.sellingPrice) || 0;
    
    if (quantity <= 0 || sellingPrice <= 0) {
      toast.error('Vui lòng nhập số lượng và giá bán hợp lệ');
      return;
    }

    const totalRevenue = quantity * sellingPrice;
    const totalProfit = quantity * (sellingPrice - importPrice);
    
    const notes = `Giá nhập: ${importPrice.toLocaleString('vi-VN')}₫ | Lãi: ${totalProfit.toLocaleString('vi-VN')}₫. ${cannedGasForm.notes}`;

    const result = await addDeliveryReport({
      employeeId: user!.id,
      employeeName: user!.name,
      date: new Date().toISOString().split('T')[0],
      customerName: cannedGasForm.customerName.trim() || 'Khách lẻ (Gas lon)',
      quantity,
      containerType: 'Gas lon',
      unitPrice: sellingPrice,
      total: totalRevenue,
      actualReceived: totalRevenue,
      notes: notes,
    });

    if (result && !result.success) {
      toast.error(result.message || 'Lỗi khi ghi nhận gas lon');
      return;
    }

    toast.success('Ghi nhận doanh thu gas lon thành công!');
    setCannedGasForm({ customerName: '', quantity: '', importPrice: '', sellingPrice: '', notes: '' });
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này? (Số lượng gas sẽ được hoàn lại vào kho)')) return;
    
    const result = await deleteDeliveryReport(id);
    if (result && !result.success) {
      toast.error(result.message || 'Lỗi khi xóa báo cáo');
    } else {
      toast.success('Đã xóa báo cáo thành công!');
      if (editingReportId === id) handleCancelEdit();
    }
  };

  const myReportsToday = deliveryReports.filter(
    report => report.employeeId === user!.id && report.date === new Date().toISOString().split('T')[0]
  );

  const totalDeliveredToday = myReportsToday.reduce((sum, report) => sum + report.quantity, 0);
  const totalRevenueToday = myReportsToday.reduce((sum, report) => sum + report.total, 0);
  const totalActualReceivedToday = myReportsToday.reduce((sum, report) => sum + report.actualReceived, 0);

  // --- Chi phí hôm nay ---
  const today = new Date().toISOString().split('T')[0];
  const myExpensesToday = expenses.filter(e => e.employeeId === user!.id && e.date === today);
  const totalExpenseToday = myExpensesToday.reduce((sum, e) => sum + e.amount, 0);
  const netToday = totalActualReceivedToday - totalExpenseToday;

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description.trim()) { toast.error('Vui lòng nhập mô tả khoản chi'); return; }
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount < 0) { toast.error('Số tiền chi không hợp lệ'); return; }

    if (editingExpenseId) {
      const res = await updateExpense(editingExpenseId, { description: expenseForm.description, amount, notes: expenseForm.notes });
      if (!res.success) { toast.error(res.message || 'Lỗi cập nhật'); return; }
      toast.success('Đã cập nhật khoản chi!');
      setEditingExpenseId(null);
    } else {
      const res = await addExpense({ employeeId: user!.id, date: today, description: expenseForm.description, amount, notes: expenseForm.notes });
      if (!res.success) { toast.error(res.message || 'Lỗi thêm khoản chi'); return; }
      toast.success('Đã ghi nhận khoản chi!');
    }
    setExpenseForm({ description: '', amount: '', notes: '' });
  };

  const handleStartEditExpense = (exp: any) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({ description: exp.description, amount: String(exp.amount), notes: exp.notes || '' });
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await deleteExpense(id);
    if (!res.success) { toast.error(res.message || 'Lỗi xóa'); return; }
    toast.success('Đã xóa khoản chi!');
  };

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
                  onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setFormData({ ...formData, unitPrice: newVal }))}
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
                  onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setFormData({ ...formData, actualReceived: newVal }))}
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
            <div className="overflow-x-auto rounded-xl border-2 border-slate-600 shadow-sm">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b-2 border-slate-600">
                    <th className="text-left py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Khách hàng</th>
                    <th className="text-center py-4 px-5 text-sm font-extrabold border-2 border-slate-600">SL</th>
                    <th className="text-left py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Loại bình</th>
                    <th className="text-right py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Đơn giá</th>
                    <th className="text-right py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Thành tiền</th>
                    <th className="text-right py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Thực nhận</th>
                    <th className="text-left py-4 px-5 text-sm font-extrabold border-2 border-slate-600">Ghi chú</th>
                    <th className="text-center py-4 px-5 text-sm font-extrabold border-2 border-slate-600 w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {myReportsToday.map((report, index) => (
                    <tr key={report.id} className={`transition-colors ${
                      index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    } hover:bg-slate-100`}>
                      <td className="py-4 px-5 text-sm font-bold text-slate-900 border-2 border-slate-600">{report.customerName}</td>
                      <td className="py-4 px-5 text-sm text-center font-extrabold text-slate-900 border-2 border-slate-600">{report.quantity}</td>
                      <td className="py-4 px-5 text-sm font-semibold text-slate-700 border-2 border-slate-600">{report.containerType}</td>
                      <td className="py-4 px-5 text-sm text-right font-semibold text-slate-700 border-2 border-slate-600">{report.unitPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-4 px-5 text-sm text-right font-extrabold text-slate-900 border-2 border-slate-600">
                        {report.total.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-4 px-5 text-sm text-right font-extrabold text-slate-900 border-2 border-slate-600">{report.actualReceived.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-4 px-5 text-sm font-medium text-slate-600 border-2 border-slate-600">{report.notes || '-'}</td>
                      <td className="py-4 px-5 text-sm text-center border-2 border-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(report)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                            title="Chỉnh sửa báo cáo"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
                            title="Xóa báo cáo"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 text-slate-900 border-t-2 border-slate-600">
                    <td className="py-4 px-5 text-sm font-black border-2 border-slate-600">Tổng</td>
                    <td className="py-4 px-5 text-sm text-center font-black border-2 border-slate-600">{totalDeliveredToday}</td>
                    <td className="py-4 px-5 border-2 border-slate-600"></td>
                    <td className="py-4 px-5 border-2 border-slate-600"></td>
                    <td className="py-4 px-5 text-sm text-right font-black border-2 border-slate-600">{totalRevenueToday.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-4 px-5 text-sm text-right font-black border-2 border-slate-600">{totalActualReceivedToday.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-4 px-5 border-2 border-slate-600"></td>
                    <td className="py-4 px-5 border-2 border-slate-600"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* === FORM CHI PHÍ === */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 bg-gradient-to-br ${editingExpenseId ? 'from-blue-500 to-indigo-600' : 'from-slate-600 to-slate-800'} rounded-2xl flex items-center justify-center shadow-lg`}>
              {editingExpenseId ? <Pencil className="w-7 h-7 text-white" /> : <Minus className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{editingExpenseId ? 'Sửa khoản chi' : 'Ghi nhận chi phí'}</h2>
              <p className="text-sm text-gray-500 mt-1">📅 Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          <form onSubmit={handleExpenseSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả khoản chi</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm"
                  placeholder="VD: Tiền xăng, phí cầu đường..." required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Số tiền chi (₫)</label>
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setExpenseForm({ ...expenseForm, amount: newVal }))}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm"
                  placeholder="Số tiền (VND)" min="0" step="1000" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Ghi chú</label>
              <input type="text" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm"
                placeholder="Ghi chú thêm (nếu có)" />
            </div>
            <div className="flex gap-4">
              {editingExpenseId && (
                <button type="button" onClick={() => { setEditingExpenseId(null); setExpenseForm({ description: '', amount: '', notes: '' }); }}
                  className="w-1/3 bg-gray-500 text-white py-3.5 rounded-xl font-bold hover:bg-gray-600 transition-all flex items-center justify-center gap-2">
                  <X className="w-5 h-5" /> Hủy
                </button>
              )}
              <button type="submit"
                className={`${editingExpenseId ? 'w-2/3 bg-gradient-to-r from-blue-500 to-indigo-600' : 'w-full bg-gradient-to-r from-slate-600 to-slate-800'} text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2`}>
                {editingExpenseId ? <><Pencil className="w-5 h-5" /> Cập nhật khoản chi</> : <><Plus className="w-5 h-5" /> Ghi nhận khoản chi</>}
              </button>
            </div>
          </form>
        </div>

        {/* === FORM BÁO CÁO GAS LON === */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Báo cáo Gas Lon</h2>
              <p className="text-sm text-gray-500 mt-1">Ghi nhận doanh thu và tính lợi nhuận gas lon bán lẻ</p>
            </div>
          </div>
          <form onSubmit={handleCannedGasSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">Tên khách hàng</label>
                <input type="text" value={cannedGasForm.customerName} onChange={e => setCannedGasForm({ ...cannedGasForm, customerName: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
                  placeholder="VD: Chú Bảy (nếu để trống = Khách lẻ)" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">Số lượng (lon)</label>
                <input type="number" value={cannedGasForm.quantity} onChange={e => setCannedGasForm({ ...cannedGasForm, quantity: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
                  placeholder="VD: 5" min="1" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Giá nhập (₫/lon)</label>
                <input type="number" value={cannedGasForm.importPrice} onChange={e => setCannedGasForm({ ...cannedGasForm, importPrice: e.target.value })}
                  onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setCannedGasForm({ ...cannedGasForm, importPrice: newVal }))}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
                  placeholder="VD: 15000" min="0" step="500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Giá bán (₫/lon)</label>
                <input type="number" value={cannedGasForm.sellingPrice} onChange={e => setCannedGasForm({ ...cannedGasForm, sellingPrice: e.target.value })}
                  onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setCannedGasForm({ ...cannedGasForm, sellingPrice: newVal }))}
                  className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
                  placeholder="VD: 20000" min="0" step="500" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Ghi chú thêm</label>
              <input type="text" value={cannedGasForm.notes} onChange={e => setCannedGasForm({ ...cannedGasForm, notes: e.target.value })}
                className="w-full px-5 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm"
                placeholder="Khách mua vãng lai..." />
            </div>

            {/* Live Calculation Preview */}
            {(parseFloat(cannedGasForm.quantity) > 0 && (parseFloat(cannedGasForm.importPrice) > 0 || parseFloat(cannedGasForm.sellingPrice) > 0)) && (
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-5 my-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-teal-700 font-bold">Tổng vốn (nhập)</span>
                    <span className="font-extrabold text-teal-900 text-lg">
                      {((parseFloat(cannedGasForm.quantity) || 0) * (parseFloat(cannedGasForm.importPrice) || 0)).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-emerald-700 font-bold">Tổng thu (bán)</span>
                    <span className="font-extrabold text-emerald-900 text-lg">
                      {((parseFloat(cannedGasForm.quantity) || 0) * (parseFloat(cannedGasForm.sellingPrice) || 0)).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex flex-col border-t md:border-t-0 md:border-l border-teal-300 md:pl-5 pt-3 md:pt-0">
                    <span className="text-rose-600 font-bold uppercase tracking-wide text-xs mb-1">Lợi nhuận (Lãi)</span>
                    <span className="font-black text-rose-700 text-2xl">
                      {((parseFloat(cannedGasForm.quantity) || 0) * ((parseFloat(cannedGasForm.sellingPrice) || 0) - (parseFloat(cannedGasForm.importPrice) || 0))).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-extrabold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2">
              <Plus className="w-6 h-6" /> Ghi nhận doanh thu Gas Lon
            </button>
          </form>
        </div>

        {/* === BẢNG TỔNG HỢP THU / CHI === */}
        {(myReportsToday.length > 0 || myExpensesToday.length > 0) && (
          <div id="export-summary-section" className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-2xl font-extrabold text-gray-900">📊 Tổng hợp Thu – Chi hôm nay</h3>
              <button 
                data-html2canvas-ignore="true"
                onClick={handleExportToZalo}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0068ff] hover:bg-[#0054cc] text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                {isExporting ? 'Đang tạo ảnh...' : 'Gửi Zalo'}
              </button>
            </div>

            {/* Thẻ tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Tổng thu</div>
                  <div className="text-xl font-extrabold text-gray-900">{totalActualReceivedToday.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Tổng chi</div>
                  <div className="text-xl font-extrabold text-gray-900">{totalExpenseToday.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>
              <div className={`flex items-center gap-4 rounded-2xl p-5 border-2 ${netToday >= 0 ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-300'}`}>
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gray-800" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Còn lại (nộp về)</div>
                  <div className="text-xl font-extrabold text-gray-900">{netToday.toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>
            </div>

            {/* Bảng chi tiết THU */}
            {myReportsToday.length > 0 && (
              <div className="mb-6">
                <h4 className="text-base font-bold text-emerald-700 mb-3 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> Các khoản THU</h4>
                <div className="overflow-x-auto rounded-xl border-2 border-slate-600 shadow-sm">
                  <table className="w-full text-sm border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b-2 border-slate-600">
                        <th className="text-left py-3 px-4 font-extrabold border-2 border-slate-600">Khách hàng</th>
                        <th className="text-center py-3 px-4 font-extrabold border-2 border-slate-600">SL</th>
                        <th className="text-left py-3 px-4 font-extrabold border-2 border-slate-600">Loại bình</th>
                        <th className="text-right py-3 px-4 font-extrabold border-2 border-slate-600">Thành tiền</th>
                        <th className="text-right py-3 px-4 font-extrabold border-2 border-slate-600">Thực nhận</th>
                        <th className="text-left py-3 px-4 font-extrabold border-2 border-slate-600">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myReportsToday.map((r, i) => (
                        <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                          <td className="py-3 px-4 font-bold text-slate-900 border-2 border-slate-600">{r.customerName}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900 border-2 border-slate-600">{r.quantity}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700 border-2 border-slate-600">{r.containerType}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 border-2 border-slate-600">{r.total.toLocaleString('vi-VN')} ₫</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 border-2 border-slate-600">{r.actualReceived.toLocaleString('vi-VN')} ₫</td>
                          <td className="py-3 px-4 font-medium text-slate-600 border-2 border-slate-600">{r.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 text-slate-900 border-t-2 border-slate-600">
                        <td className="py-3 px-4 font-black border-2 border-slate-600">Tổng</td>
                        <td className="py-3 px-4 text-center font-black border-2 border-slate-600">{totalDeliveredToday}</td>
                        <td className="py-3 px-4 border-2 border-slate-600"></td>
                        <td className="py-3 px-4 text-right font-black border-2 border-slate-600">{totalRevenueToday.toLocaleString('vi-VN')} ₫</td>
                        <td className="py-3 px-4 text-right font-black border-2 border-slate-600">{totalActualReceivedToday.toLocaleString('vi-VN')} ₫</td>
                        <td className="py-3 px-4 border-2 border-slate-600"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Bảng chi tiết CHI */}
            {myExpensesToday.length > 0 && (
              <div>
                <h4 className="text-base font-bold text-red-700 mb-3 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" /> Các khoản CHI</h4>
                <div className="overflow-x-auto rounded-xl border-2 border-slate-600 shadow-sm">
                  <table className="w-full text-sm border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b-2 border-slate-600">
                        <th className="text-left py-3 px-4 font-extrabold border-2 border-slate-600">Mô tả</th>
                        <th className="text-right py-3 px-4 font-extrabold border-2 border-slate-600">Số tiền</th>
                        <th className="text-left py-3 px-4 font-extrabold border-2 border-slate-600">Ghi chú</th>
                        <th data-html2canvas-ignore="true" className="text-center py-3 px-4 font-extrabold border-2 border-slate-600 w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myExpensesToday.map((exp, i) => (
                        <tr key={exp.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                          <td className="py-3 px-4 font-bold text-slate-900 border-2 border-slate-600">{exp.description}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 border-2 border-slate-600">{exp.amount.toLocaleString('vi-VN')} ₫</td>
                          <td className="py-3 px-4 font-medium text-slate-600 border-2 border-slate-600">{exp.notes || '-'}</td>
                          <td data-html2canvas-ignore="true" className="py-3 px-4 text-center border-2 border-slate-600">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleStartEditExpense(exp)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Sửa"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Xóa"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 text-slate-900 border-t-2 border-slate-600">
                        <td className="py-3 px-4 font-black border-2 border-slate-600">Tổng chi</td>
                        <td className="py-3 px-4 text-right font-black border-2 border-slate-600">{totalExpenseToday.toLocaleString('vi-VN')} ₫</td>
                        <td className="border-2 border-slate-600" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
