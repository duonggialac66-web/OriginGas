import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function DebtTab() {
  const { user } = useAuth();
  const { deliveryReports, updateReportPaymentStatus } = useData();

  // Lấy danh sách nợ của nhân viên hiện tại
  const debtReports = useMemo(() => {
    return deliveryReports
      .filter(r => r.employeeId === user?.id && r.paymentStatus === 'debt')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deliveryReports, user]);

  const totalDebt = debtReports.reduce((sum, r) => sum + r.total, 0);

  const handleMarkPaid = async (reportId: string) => {
    if (!window.confirm('Xác nhận đã thu đủ tiền cho đơn hàng này?')) return;
    const res = await updateReportPaymentStatus(reportId, 'paid');
    if (res?.success) {
      toast.success('Đã cập nhật trạng thái: Đã thu tiền');
    } else {
      toast.error(res?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* HEADER SUMMARY */}
      <div className="bg-red-50 rounded-3xl p-6 border border-red-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-red-800 uppercase mb-1">Tổng công nợ cần thu</div>
            <div className="text-3xl font-extrabold text-red-600">{totalDebt.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-red-800">Số lượng: {debtReports.length} hóa đơn</div>
        </div>
      </div>

      {/* DANH SÁCH BẢNG NỢ */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6">
          Bảng kê chi tiết nợ
        </h3>
        
        {debtReports.length > 0 ? (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-base border-collapse bg-white border-2 border-slate-700 min-w-[600px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b-2 border-slate-700">
                  <th className="py-5 px-6 text-left font-extrabold border-2 border-slate-700">Tên người nợ</th>
                  <th className="py-5 px-6 text-left font-extrabold border-2 border-slate-700">Ngày nợ</th>
                  <th className="py-5 px-6 text-left font-extrabold border-2 border-slate-700">Chi tiết</th>
                  <th className="py-5 px-6 text-right font-extrabold border-2 border-slate-700">Số tiền nợ</th>
                  <th className="py-5 px-6 text-center font-extrabold border-2 border-slate-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {debtReports.map((r, i) => (
                  <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                    <td className="py-5 px-6 font-bold text-slate-900 border-2 border-slate-700">
                      <div>{r.customerName}</div>
                      {r.customer?.phone && <div className="text-xs text-gray-500 mt-1">{r.customer.phone}</div>}
                    </td>
                    <td className="py-5 px-6 font-bold text-gray-700 border-2 border-slate-700">{r.date}</td>
                    <td className="py-5 px-6 font-bold text-gray-700 border-2 border-slate-700">
                      {r.quantity} bình {r.containerType} {r.notes && <span className="text-xs text-gray-500 italic ml-1">({r.notes})</span>}
                    </td>
                    <td className="py-5 px-6 text-right font-extrabold text-red-600 border-2 border-slate-700">
                      {r.total.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-5 px-6 text-center border-2 border-slate-700">
                      <button 
                        onClick={() => handleMarkPaid(r.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Đã thu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <div className="text-lg font-bold text-gray-600">Hiện không có khoản nợ nào cần thu.</div>
          </div>
        )}
      </div>
    </div>
  );
}
