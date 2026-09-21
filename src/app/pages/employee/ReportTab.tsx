import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FileText, Flame, TrendingUp, Pencil, Plus, MapPin, Navigation, X, Share2, ArrowUpCircle, ArrowDownCircle, CheckSquare, Menu, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { Customer } from '../../types';
import { ExpenseTab } from './ExpenseTab';

export function ReportTab() {
  const { user } = useAuth();
  const { addDeliveryReport, updateDeliveryReport, deleteDeliveryReport, deliveryReports, inventory, expenses, updateReportPaymentStatus, customers, addCustomer, retryDeliveryReport } = useData();

  const [activeSection, setActiveSection] = useState<'gas-big' | 'gas-small' | 'expense' | 'summary'>('gas-big');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // FORMS
  const [formData, setFormData] = useState({
    customerName: '',
    quantity: '',
    containerType: inventory.length > 0 ? inventory[0].containerType : '',
    unitPrice: '',
    actualReceived: '',
    notes: '',
    paymentStatus: 'paid' as 'paid' | 'debt',
  });
  
  const [cannedGasForm, setCannedGasForm] = useState({ customerName: '', quantity: '', importPrice: '', sellingPrice: '', notes: '' });
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // CUSTOMER AUTOCOMPLETE
  const [customerFilter, setCustomerFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // DEBT FILTER
  const [debtFilter, setDebtFilter] = useState<'all' | 'debt' | 'paid'>('all');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerFilter.toLowerCase()) || 
    (c.phone && c.phone.includes(customerFilter))
  ).slice(0, 8);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerFilter(c.name);
    setShowSuggestions(false);
    
    // Auto-fill từ bill gần nhất
    const lastBill = deliveryReports
      .filter(r => r.customerId === c.id && r.containerType !== 'Gas lon')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
    if (lastBill) {
      setFormData(prev => ({
        ...prev,
        customerName: c.name,
        containerType: lastBill.containerType,
        quantity: String(lastBill.quantity),
        unitPrice: String(lastBill.unitPrice),
      }));
      toast.info(`Đã điền dữ liệu từ đơn gần nhất (${lastBill.date})`);
    } else {
      setFormData(prev => ({ ...prev, customerName: c.name }));
    }
  };

  const handlePriceBlur = (val: string, updater: (newVal: string) => void) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num < 10000) {
      updater((num * 1000).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = formData.quantity === '' ? 0 : parseFloat(formData.quantity);
    const unitPrice = formData.unitPrice === '' ? 0 : parseFloat(formData.unitPrice);
    const total = quantity * unitPrice;
    const actualReceived = formData.actualReceived === '' ? 0 : parseFloat(formData.actualReceived);
    
    let finalCustomerId = selectedCustomerId;
    const inputCustomerName = customerFilter.trim() || formData.customerName;

    if (!finalCustomerId) {
       const exactMatch = customers.find(c => c.name.toLowerCase() === inputCustomerName.toLowerCase());
       if (exactMatch) {
         finalCustomerId = exactMatch.id;
       } else {
         if (window.confirm(`Khách hàng "${inputCustomerName}" chưa có sẵn trong CSDL.\nBạn có muốn lưu khách hàng này vào CSDL không?`)) {
           // Chạy ngầm - không chờ kết quả
           addCustomer({ name: inputCustomerName })
             .then(() => toast.success('Đã lưu khách hàng mới vào CSDL'))
             .catch((error: any) => toast.error('Lỗi khi lưu khách hàng: ' + error.message));
         }
       }
    }

    const payload = {
      employeeId: user!.id,
      employeeName: user!.name,
      date: selectedDate,
      customerName: inputCustomerName,
      customerId: finalCustomerId || undefined,
      quantity,
      containerType: formData.containerType,
      unitPrice,
      total,
      actualReceived,
      notes: formData.notes,
      paymentStatus: formData.paymentStatus,
    };

    if (editingReportId) {
      const res = await updateDeliveryReport(editingReportId, payload);
      if (res && !res.success) { toast.error(res.message); return; }
      toast.success('Cập nhật thành công');
      setEditingReportId(null);
    } else {
      const res = await addDeliveryReport(payload);
      if (res && !res.success) { toast.error(res.message); return; }
      toast.success('Đã gửi báo cáo');
    }

    setFormData({ customerName: '', quantity: '', containerType: inventory[0]?.containerType || '', unitPrice: '', actualReceived: '', notes: '', paymentStatus: 'paid' });
    setCustomerFilter('');
    setSelectedCustomerId(null);
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setFormData({ customerName: '', quantity: '', containerType: inventory[0]?.containerType || '', unitPrice: '', actualReceived: '', notes: '', paymentStatus: 'paid' });
    setCustomerFilter('');
  };

  const handleStartEdit = (report: any) => {
    setEditingReportId(report.id);
    setCustomerFilter(report.customerName);
    setSelectedCustomerId(report.customerId);
    setFormData({
      customerName: report.customerName,
      quantity: String(report.quantity),
      containerType: report.containerType,
      unitPrice: String(report.unitPrice),
      actualReceived: String(report.actualReceived),
      notes: report.notes || '',
      paymentStatus: report.paymentStatus,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCannedGasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(cannedGasForm.quantity, 10) || 0;
    const importPrice = parseInt(cannedGasForm.importPrice, 10) || 0;
    const sellingPrice = parseInt(cannedGasForm.sellingPrice, 10) || 0;
    if (quantity <= 0 || sellingPrice < 0 || importPrice < 0) {
      toast.error('Vui lòng nhập số hợp lệ'); return;
    }
    const notes = `Giá nhập: ${importPrice.toLocaleString('vi-VN')} ₫ | Lãi: ${(quantity * (sellingPrice - importPrice)).toLocaleString('vi-VN')} ₫. ${cannedGasForm.notes}`;

    const customerName = cannedGasForm.customerName.trim() || 'Khách lẻ (Gas lon)';
    let customerId = undefined;

    if (customerName !== 'Khách lẻ (Gas lon)') {
      const exactMatch = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      if (exactMatch) {
        customerId = exactMatch.id;
      } else {
        if (window.confirm(`Khách hàng "${customerName}" chưa có sẵn trong CSDL.\nBạn có muốn lưu khách hàng này vào CSDL không?`)) {
          // Chạy ngầm - không chờ kết quả
          addCustomer({ name: customerName })
            .then(() => toast.success('Đã lưu khách hàng mới vào CSDL'))
            .catch((error: any) => toast.error('Lỗi khi lưu khách hàng: ' + error.message));
        }
      }
    }

    const res = await addDeliveryReport({
      employeeId: user!.id,
      employeeName: user!.name,
      date: selectedDate,
      customerName,
      customerId,
      quantity,
      containerType: 'Gas lon',
      unitPrice: sellingPrice,
      total: quantity * sellingPrice,
      actualReceived: quantity * sellingPrice,
      notes,
      paymentStatus: 'paid',
    });
    if (res && !res.success) { toast.error(res.message); return; }
    toast.success('Ghi nhận gas lon thành công');
    setCannedGasForm({ customerName: '', quantity: '', importPrice: '', sellingPrice: '', notes: '' });
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
          if (node instanceof HTMLElement) return node.getAttribute('data-html2canvas-ignore') !== 'true';
          return true;
        }
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const file = new File([blob], `baocao-${selectedDate}.png`, { type: 'image/png' });

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Báo cáo doanh thu', files: [file] });
      } else {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        toast.success('ĐÃ COPY ẢNH! Hãy dán vào khung chat Zalo.');
      }
    } catch (error) {
      toast.error('Lỗi khi xuất ảnh');
    } finally {
      setIsExporting(false);
    }
  };

  const myReportsFiltered = deliveryReports.filter(r => r.employeeId === user!.id && r.date === selectedDate);
  const gasReportsFiltered = myReportsFiltered.filter(r => r.containerType !== 'Gas lon');
  const cannedGasReportsFiltered = myReportsFiltered.filter(r => r.containerType === 'Gas lon');

  const filteredGasReports = gasReportsFiltered.filter(r => debtFilter === 'all' || r.paymentStatus === debtFilter);

  const totalDeliveredFiltered = gasReportsFiltered.reduce((sum, r) => sum + r.quantity, 0);
  const totalCannedDeliveredFiltered = cannedGasReportsFiltered.reduce((sum, r) => sum + r.quantity, 0);
  const totalRevenueFiltered = myReportsFiltered.reduce((sum, r) => sum + r.total, 0);
  const totalActualReceivedFiltered = myReportsFiltered.reduce((sum, r) => sum + r.actualReceived, 0);
  const totalExpenseFiltered = expenses.filter(e => e.employeeId === user!.id && e.date === selectedDate).reduce((s, e) => s + e.amount, 0);
  const netFiltered = totalActualReceivedFiltered - totalExpenseFiltered;

  const menuOptions = [
    { id: 'gas-big', label: 'Báo cáo Gas Lớn', icon: <Flame className="w-5 h-5 text-orange-500" /> },
    { id: 'gas-small', label: 'Báo cáo Gas Lon', icon: <CheckSquare className="w-5 h-5 text-teal-500" /> },
    { id: 'expense', label: 'Báo cáo Chi Phí', icon: <Receipt className="w-5 h-5 text-red-500" /> },
    { id: 'summary', label: 'Tổng hợp Thu/Chi', icon: <FileText className="w-5 h-5 text-blue-500" /> },
  ] as const;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6">
      {/* DATE FILTER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 gap-2 sm:gap-3">
        <div className="font-bold text-gray-700 flex items-center gap-2">
          Xem báo cáo ngày:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} 
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${selectedDate === new Date().toISOString().split('T')[0] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Hôm nay
          </button>
          <button 
            onClick={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().split('T')[0])} 
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Hôm qua
          </button>
          <button 
            onClick={() => setSelectedDate(new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0])} 
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${selectedDate === new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Hôm kia
          </button>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-700 outline-none"
          />
        </div>
      </div>

      {/* 3 CARDS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="text-[10px] sm:text-sm font-bold text-gray-500">Số đơn</div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-gray-900">{gasReportsFiltered.length}</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="text-[10px] sm:text-sm font-bold text-gray-500">Số bình</div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-gray-900">{totalDeliveredFiltered}</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="text-[10px] sm:text-sm font-bold text-gray-500">Doanh thu</div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-gray-900">{(totalRevenueFiltered / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      {/* HEADER VỚI HAMBURGER MENU */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 relative z-50">
        <div className="font-extrabold text-base sm:text-lg text-gray-900 flex items-center gap-2">
          {menuOptions.find(o => o.id === activeSection)?.icon}
          {menuOptions.find(o => o.id === activeSection)?.label}
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
          
          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
              {menuOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setActiveSection(opt.id); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-bold transition-colors text-left ${activeSection === opt.id ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      {activeSection === 'gas-big' && (
        <div className="space-y-6 animate-fade-in">
          {/* FORM BÁO CÁO GAS LỚN */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 border border-gray-200 relative z-40">
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
              {editingReportId ? <Pencil className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-orange-600" />}
              {editingReportId ? 'Sửa báo cáo' : 'Thêm báo cáo'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="relative">
                  <label className="block text-base font-bold text-gray-800 mb-2">Tên khách hàng</label>
                  <input
                    type="text"
                    value={customerFilter}
                    onChange={(e) => {
                      setCustomerFilter(e.target.value);
                      setFormData({ ...formData, customerName: e.target.value });
                      setShowSuggestions(true);
                      setSelectedCustomerId(null);
                    }}
                    onFocus={() => { if(customers.length) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-orange-500 outline-none text-slate-900 font-bold"
                    placeholder="🔍 Tìm khách hàng..."
                    required
                  />
                  {showSuggestions && filteredCustomers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onMouseDown={(e) => e.preventDefault()} 
                          onClick={() => handleSelectCustomer(c)}
                          className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 flex items-center justify-between"
                        >
                          <div className="font-bold text-slate-900">{c.name} {c.phone && <span className="text-gray-400 font-normal ml-2">({c.phone})</span>}</div>
                          {c.latitude && <MapPin className="w-4 h-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Thanh toán</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as 'paid' | 'debt'})}
                    className={`w-full px-4 py-3 border rounded-xl outline-none font-bold ${formData.paymentStatus === 'debt' ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'}`}
                  >
                    <option value="paid">✅ Đã thu đủ tiền</option>
                    <option value="debt">🔴 Khách nợ tiền</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Số lượng</label>
                    <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-slate-900" placeholder="SL" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Loại bình</label>
                    <select value={formData.containerType} onChange={e => setFormData({...formData, containerType: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-slate-900" required>
                      {inventory.map(inv => <option key={inv.id} value={inv.containerType}>{inv.containerType}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Đơn giá</label>
                  <input type="number" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} onBlur={e => handlePriceBlur(e.target.value, val => setFormData({...formData, unitPrice: val}))} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-slate-900" placeholder="VND" />
                </div>

                {/* THÀNH TIỀN - computed */}
                {(parseFloat(formData.quantity) > 0 && parseFloat(formData.unitPrice) > 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-800">💰 Thành tiền</span>
                    <span className="text-lg font-extrabold text-amber-900">
                      {(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Thực nhận</label>
                  <input type="number" value={formData.actualReceived} onChange={e => setFormData({...formData, actualReceived: e.target.value})} onBlur={e => handlePriceBlur(e.target.value, val => setFormData({...formData, actualReceived: val}))} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-slate-900" placeholder="VND" />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-800 mb-2">Ghi chú</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-slate-900" placeholder="Ghi chú thêm" />
              </div>
              
              <div className="flex gap-4 pt-2">
                {editingReportId && (
                  <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-300"><X className="w-5 h-5"/> Hủy</button>
                )}
                <button type="submit" className={`w-full flex justify-center items-center gap-2 ${editingReportId ? 'bg-blue-600' : 'bg-orange-600'} text-white font-bold py-3 rounded-xl shadow-sm transition-all hover:opacity-90`}>
                  {editingReportId ? <><Pencil className="w-5 h-5"/> Cập nhật</> : <><Plus className="w-5 h-5"/> Lưu báo cáo</>}
                </button>
              </div>
            </form>
          </div>

          {/* LỊCH SỬ GAS LỚN */}
          {gasReportsFiltered.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm p-4 sm:p-6 border border-gray-200 z-10 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">Lịch sử Gas lớn</h3>
                <div className="flex gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                  <button onClick={() => setDebtFilter('all')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-bold text-xs ${debtFilter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Tất cả</button>
                  <button onClick={() => setDebtFilter('debt')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-bold text-xs ${debtFilter === 'debt' ? 'bg-red-500 text-white shadow' : 'text-red-500 hover:bg-red-50'}`}>🔴 Nợ</button>
                  <button onClick={() => setDebtFilter('paid')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-bold text-xs ${debtFilter === 'paid' ? 'bg-green-500 text-white shadow' : 'text-green-600 hover:bg-green-50'}`}>✅ Đã TT</button>
                </div>
              </div>

              {/* MOBILE: Card layout */}
              <div className="md:hidden space-y-3">
                {filteredGasReports.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{r.customerName}</span>
                          {r.customer?.latitude && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${r.customer.latitude},${r.customer.longitude}`} target="_blank" rel="noreferrer" className="text-blue-500"><Navigation className="w-4 h-4"/></a>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.containerType}</div>
                        {r.syncStatus === 'pending' && <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Đang gửi...</span>}
                        {r.syncStatus === 'error' && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">❌ Lỗi gửi</span>
                            <button onClick={() => retryDeliveryReport(r.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded shadow hover:bg-red-700">Gửi lại</button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          const newStatus = r.paymentStatus === 'debt' ? 'paid' : 'debt';
                          const res = await updateReportPaymentStatus(r.id, newStatus);
                          if (res?.success) {
                            toast.success(`Đã đổi trạng thái thành: ${newStatus === 'debt' ? 'Khách nợ' : 'Đã thu tiền'}`);
                          } else {
                            toast.error(res?.message || 'Lỗi khi cập nhật trạng thái');
                          }
                        }}
                        className={`ml-2 shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border-2 ${r.paymentStatus === 'debt' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'}`}
                      >
                        {r.paymentStatus === 'debt' ? '🔴 Nợ' : '✅ Đã TT'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SL:</span>
                        <span className="font-extrabold text-slate-900">{r.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Đơn giá:</span>
                        <span className="font-bold text-slate-700">{r.unitPrice.toLocaleString()} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thành tiền:</span>
                        <span className="font-extrabold text-slate-900">{r.total.toLocaleString()} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thực nhận:</span>
                        <span className="font-extrabold text-blue-700">{r.actualReceived.toLocaleString()} ₫</span>
                      </div>
                    </div>
                    {r.notes && <div className="text-xs text-gray-500 mb-3 truncate">📝 {r.notes}</div>}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <button onClick={() => handleStartEdit(r)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-blue-600 bg-white border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-50">
                        <Pencil className="w-3.5 h-3.5"/> Sửa
                      </button>
                      <button onClick={() => window.confirm('Xóa?') && deleteDeliveryReport(r.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 bg-white border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50">
                        <X className="w-3.5 h-3.5"/> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP: Table layout */}
              <div className="hidden md:block overflow-x-auto pb-4">
                <table className="w-full text-sm border-collapse bg-white border border-slate-400">
                  <thead className="bg-slate-100 text-slate-900 border-b border-slate-400">
                    <tr>
                      <th className="p-2 text-left font-extrabold border border-slate-400">Khách hàng</th>
                      <th className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">Trạng thái</th>
                      <th className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">SL</th>
                      <th className="p-2 text-left font-extrabold border border-slate-400">Loại bình</th>
                      <th className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">Đơn giá</th>
                      <th className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">Thành tiền</th>
                      <th className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">Thực nhận</th>
                      <th className="p-2 text-left font-extrabold border border-slate-400">Ghi chú</th>
                      <th className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGasReports.map((r, i) => (
                      <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                        <td className="p-2 font-bold text-slate-900 border border-slate-400">
                          <div className="flex items-center gap-1.5">
                            {r.customerName}
                            {r.customer?.latitude && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${r.customer.latitude},${r.customer.longitude}`} target="_blank" rel="noreferrer" className="text-blue-500"><Navigation className="w-4 h-4"/></a>
                            )}
                          </div>
                          {r.syncStatus === 'pending' && <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Đang gửi...</span>}
                          {r.syncStatus === 'error' && (
                            <div className="mt-1 flex items-center gap-2">
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">❌ Lỗi gửi</span>
                               <button onClick={() => retryDeliveryReport(r.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded shadow hover:bg-red-700">Gửi lại</button>
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-center border border-slate-400">
                          <button 
                            onClick={async () => {
                              const newStatus = r.paymentStatus === 'debt' ? 'paid' : 'debt';
                              const res = await updateReportPaymentStatus(r.id, newStatus);
                              if (res?.success) {
                                toast.success(`Đã đổi trạng thái thành: ${newStatus === 'debt' ? 'Khách nợ' : 'Đã thu tiền'}`);
                              } else {
                                toast.error(res?.message || 'Lỗi khi cập nhật trạng thái');
                              }
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-bold border-2 ${r.paymentStatus === 'debt' ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'}`}
                          >
                            {r.paymentStatus === 'debt' ? '🔴 Nợ' : '✅ Đã TT'}
                          </button>
                        </td>
                        <td className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">{r.quantity}</td>
                        <td className="p-2 font-bold text-gray-700 border border-slate-400">{r.containerType}</td>
                        <td className="p-2 text-right whitespace-nowrap font-bold text-gray-700 border border-slate-400">{r.unitPrice.toLocaleString()}  ₫</td>
                        <td className="p-2 text-right whitespace-nowrap font-extrabold text-slate-900 border border-slate-400">{r.total.toLocaleString()}  ₫</td>
                        <td className="p-2 text-right whitespace-nowrap font-extrabold text-blue-700 border border-slate-400">{r.actualReceived.toLocaleString()}  ₫</td>
                        <td className="p-2 text-left text-gray-600 border border-slate-400 text-xs max-w-[120px] truncate">{r.notes}</td>
                        <td className="p-2 text-center border border-slate-400">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleStartEdit(r)} className="p-2 text-blue-600 bg-white border-2 border-gray-300 rounded-md shadow-sm hover:bg-gray-50"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => window.confirm('Xóa?') && deleteDeliveryReport(r.id)} className="p-2 text-red-600 bg-white border-2 border-gray-300 rounded-md shadow-sm hover:bg-gray-50"><X className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'gas-small' && (
        <div className="space-y-6 animate-fade-in">
          {/* FORM GAS LON */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2"><Plus className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" /> Bán Gas Lon</h2>
            <form onSubmit={handleCannedGasSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Khách hàng</label>
                  <input type="text" value={cannedGasForm.customerName} onChange={e => setCannedGasForm({...cannedGasForm, customerName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl" placeholder="VD: Khách lẻ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Số lượng</label>
                    <input type="number" value={cannedGasForm.quantity} onChange={e => setCannedGasForm({...cannedGasForm, quantity: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-2">Giá nhập</label>
                    <input type="number" value={cannedGasForm.importPrice} onChange={e => setCannedGasForm({...cannedGasForm, importPrice: e.target.value})} onBlur={e => handlePriceBlur(e.target.value, v => setCannedGasForm({...cannedGasForm, importPrice: v}))} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl" required />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Giá bán</label>
                  <input type="number" value={cannedGasForm.sellingPrice} onChange={e => setCannedGasForm({...cannedGasForm, sellingPrice: e.target.value})} onBlur={e => handlePriceBlur(e.target.value, v => setCannedGasForm({...cannedGasForm, sellingPrice: v}))} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl" required />
                </div>

                {/* THÀNH TIỀN GAS LON - computed */}
                {(parseInt(cannedGasForm.quantity) > 0 && parseInt(cannedGasForm.sellingPrice) > 0) && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-800">💰 Thành tiền</span>
                    <span className="text-lg font-extrabold text-teal-900">
                      {(parseInt(cannedGasForm.quantity) * parseInt(cannedGasForm.sellingPrice)).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-base font-bold text-gray-800 mb-2">Ghi chú</label>
                  <input type="text" value={cannedGasForm.notes} onChange={e => setCannedGasForm({...cannedGasForm, notes: e.target.value})} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl" placeholder="Ghi chú thêm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">Lưu Gas Lon</button>
            </form>
          </div>

          {/* LỊCH SỬ GAS LON */}
          {cannedGasReportsFiltered.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm p-4 sm:p-6 border border-gray-200">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4">Lịch sử Gas lon</h3>

              {/* MOBILE: Card layout */}
              <div className="md:hidden space-y-3">
                {cannedGasReportsFiltered.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-900 text-sm">{r.customerName}</span>
                        {r.syncStatus === 'pending' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Đang gửi...</span>}
                        {r.syncStatus === 'error' && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">❌ Lỗi gửi</span>
                            <button onClick={() => retryDeliveryReport(r.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded shadow hover:bg-red-700">Gửi lại</button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => window.confirm('Xóa?') && deleteDeliveryReport(r.id)} className="ml-2 shrink-0 p-2 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SL:</span>
                        <span className="font-extrabold text-slate-900">{r.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Giá bán:</span>
                        <span className="font-bold text-slate-700">{r.unitPrice.toLocaleString()} ₫</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Thực nhận:</span>
                        <span className="font-extrabold text-teal-700">{r.actualReceived.toLocaleString()} ₫</span>
                      </div>
                    </div>
                    {r.notes && <div className="text-xs text-gray-500 mt-2 truncate">📝 {r.notes}</div>}
                  </div>
                ))}
              </div>

              {/* DESKTOP: Table layout */}
              <div className="hidden md:block overflow-x-auto pb-4">
                <table className="w-full text-sm border-collapse bg-white border border-slate-400">
                  <thead className="bg-slate-100 text-slate-900 border-b border-slate-400">
                    <tr>
                      <th className="p-2 text-left font-extrabold border border-slate-400">Khách hàng</th>
                      <th className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">SL</th>
                      <th className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">Giá bán</th>
                      <th className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">Thực nhận</th>
                      <th className="p-2 text-left font-extrabold border border-slate-400">Ghi chú</th>
                      <th className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cannedGasReportsFiltered.map((r, i) => (
                      <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="p-2 font-bold border border-slate-400">
                          {r.customerName}
                          {r.syncStatus === 'pending' && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Đang gửi...</span>}
                          {r.syncStatus === 'error' && (
                            <div className="mt-1 flex items-center gap-2">
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">❌ Lỗi gửi</span>
                               <button onClick={() => retryDeliveryReport(r.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded shadow hover:bg-red-700">Gửi lại</button>
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-center whitespace-nowrap font-extrabold border border-slate-400">{r.quantity}</td>
                        <td className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">{r.unitPrice.toLocaleString()}  ₫</td>
                        <td className="p-2 text-right whitespace-nowrap font-extrabold border border-slate-400">{r.actualReceived.toLocaleString()}  ₫</td>
                        <td className="p-2 border border-slate-400 text-xs max-w-[120px] truncate">{r.notes}</td>
                        <td className="p-2 text-center border border-slate-400">
                          <button onClick={() => window.confirm('Xóa?') && deleteDeliveryReport(r.id)} className="p-2 text-red-600 bg-white rounded shadow-sm border-2 border-gray-300 hover:bg-gray-50"><X className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'expense' && (
        <ExpenseTab selectedDate={selectedDate} />
      )}

      {activeSection === 'summary' && (
        <div className="animate-fade-in space-y-6">
          {/* TỔNG HỢP VỚI TABLE */}
          {(gasReportsFiltered.length > 0 || expenses.length > 0) ? (
            <div id="export-summary-section" className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-slate-900">📊 Thu / Chi</h3>
                <button data-html2canvas-ignore="true" onClick={handleExportToZalo} disabled={isExporting} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors"><Share2 className="w-4 h-4"/> Gửi Zalo</button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1"><ArrowUpCircle className="w-4 h-4" /> Thu</div>
                  <div className="text-lg font-extrabold text-green-900">{totalActualReceivedFiltered.toLocaleString()}  ₫</div>
                </div>
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-red-700 uppercase mb-1 flex items-center gap-1"><ArrowDownCircle className="w-4 h-4" /> Chi</div>
                  <div className="text-lg font-extrabold text-red-900">{totalExpenseFiltered.toLocaleString()}  ₫</div>
                </div>
                <div className="col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
                  <div className="text-sm font-bold text-blue-800 uppercase flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Thực nhận (Cầm về)</div>
                  <div className="text-2xl font-extrabold text-blue-900">{netFiltered.toLocaleString()}  ₫</div>
                </div>
              </div>

              {/* Bảng chi tiết THU: Gas lớn */}
              {gasReportsFiltered.length > 0 && (
                <div className="mt-8 mb-6">
                  <h4 className="text-base font-bold text-emerald-700 mb-3 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> Bảng kê Gas lớn</h4>
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-[8px] sm:text-xs lg:text-sm border-collapse bg-white border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Khách hàng</th>
                          <th className="text-center px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">SL</th>
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Loại bình</th>
                          <th className="text-right px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Đơn giá</th>
                          <th className="text-right px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Thành tiền</th>
                          <th className="text-right px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Thực nhận</th>
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gasReportsFiltered.map((r, i) => (
                          <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                            <td className="px-0.5 py-0.5 sm:p-2 font-bold text-slate-900 border border-slate-400">{r.customerName}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-center font-bold text-slate-900 border border-slate-400">{r.quantity}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 font-bold text-gray-700 border border-slate-400">{r.containerType}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-bold text-slate-900 border border-slate-400">{r.unitPrice.toLocaleString('vi-VN')}  ₫</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-bold text-slate-900 border border-slate-400">{r.total.toLocaleString('vi-VN')}  ₫</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-blue-700 border border-slate-400">{r.actualReceived.toLocaleString('vi-VN')}  ₫</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-gray-600 border border-slate-400 text-[10px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate">{r.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 text-gray-900 border-t border-slate-400">
                          <td className="px-0.5 py-0.5 sm:p-2 font-bold border border-slate-400">Tổng</td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-center font-bold border border-slate-400">{totalDeliveredFiltered}</td>
                          <td className="px-0.5 py-0.5 sm:p-2 border border-slate-400"></td>
                          <td className="px-0.5 py-0.5 sm:p-2 border border-slate-400"></td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-bold border border-slate-400">{gasReportsFiltered.reduce((sum, r) => sum + r.total, 0).toLocaleString('vi-VN')}  ₫</td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-blue-700 border border-slate-400">{gasReportsFiltered.reduce((sum, r) => sum + r.actualReceived, 0).toLocaleString('vi-VN')}  ₫</td>
                          <td className="px-0.5 py-0.5 sm:p-2 border border-slate-400"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Bảng chi tiết THU: Gas lon */}
              {cannedGasReportsFiltered.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base font-bold text-teal-700 mb-3 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> Bảng kê Gas lon</h4>
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-[8px] sm:text-xs lg:text-sm border-collapse bg-white border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Khách hàng</th>
                          <th className="text-center px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">SL (lon)</th>
                          <th className="text-right px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Thực nhận</th>
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cannedGasReportsFiltered.map((r, i) => (
                          <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                            <td className="px-0.5 py-0.5 sm:p-2 font-bold text-slate-900 border border-slate-400">{r.customerName}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-center font-bold text-slate-900 border border-slate-400">{r.quantity}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-teal-700 border border-slate-400">{r.actualReceived.toLocaleString('vi-VN')}  ₫</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-gray-600 border border-slate-400 text-[10px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate">{r.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 text-gray-900 border-t border-slate-400">
                          <td className="px-0.5 py-0.5 sm:p-2 font-bold border border-slate-400">Tổng</td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-center font-bold border border-slate-400">{totalCannedDeliveredFiltered}</td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-teal-700 border border-slate-400">{cannedGasReportsFiltered.reduce((sum, r) => sum + r.actualReceived, 0).toLocaleString('vi-VN')}  ₫</td>
                          <td className="px-0.5 py-0.5 sm:p-2 border border-slate-400"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Bảng chi tiết CHI */}
              {expenses.filter(e => e.employeeId === user!.id && e.date === selectedDate).length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-red-700 mb-3 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" /> Bảng kê Chi phí</h4>
                  <div className="overflow-x-auto pb-4">
                    <table className="w-full text-[8px] sm:text-xs lg:text-sm border-collapse bg-white border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Mô tả</th>
                          <th className="text-right px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Số tiền</th>
                          <th className="text-left px-0.5 py-0.5 sm:p-2 font-extrabold border border-slate-400">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.filter(e => e.employeeId === user!.id && e.date === selectedDate).map((exp, i) => (
                          <tr key={exp.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                            <td className="px-0.5 py-0.5 sm:p-2 font-bold text-slate-900 border border-slate-400">{exp.description}</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-red-600 border border-slate-400">{exp.amount.toLocaleString('vi-VN')}  ₫</td>
                            <td className="px-0.5 py-0.5 sm:p-2 text-gray-600 border border-slate-400 text-[10px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate">{exp.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 text-gray-900 border-t border-slate-400">
                          <td className="px-0.5 py-0.5 sm:p-2 font-bold border border-slate-400">Tổng chi</td>
                          <td className="px-0.5 py-0.5 sm:p-2 text-right whitespace-nowrap font-extrabold text-red-700 border border-slate-400">{totalExpenseFiltered.toLocaleString('vi-VN')}  ₫</td>
                          <td className="px-0.5 py-0.5 sm:p-2 border border-slate-400"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-lg font-bold text-gray-400">Chưa có giao dịch hôm nay.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
