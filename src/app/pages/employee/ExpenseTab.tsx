import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Pencil, Minus, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseTab() {
  const { user } = useAuth();
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();

  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', notes: '' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const handlePriceBlur = (val: string, updater: (newVal: string) => void) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num < 10000) {
      updater((num * 1000).toString());
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const myExpensesToday = expenses.filter(e => e.employeeId === user?.id && e.date === today);
  const totalExpenseToday = myExpensesToday.reduce((sum, e) => sum + e.amount, 0);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
    const res = await deleteExpense(id);
    if (!res.success) { toast.error(res.message || 'Lỗi xóa'); return; }
    toast.success('Đã xóa khoản chi!');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* FORM CHI PHÍ */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          {editingExpenseId ? <Pencil className="w-6 h-6 text-blue-600" /> : <Minus className="w-6 h-6 text-red-600" />}
          {editingExpenseId ? 'Sửa khoản chi' : 'Ghi nhận chi phí'}
        </h2>
        
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Mô tả khoản chi</label>
              <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full px-4 py-3 text-slate-900 border border-gray-200 bg-gray-50 rounded-xl outline-none focus:border-red-500"
                placeholder="VD: Tiền xăng, phí cầu đường..." required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Số tiền chi (₫)</label>
              <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                onBlur={(e) => handlePriceBlur(e.target.value, (newVal) => setExpenseForm({ ...expenseForm, amount: newVal }))}
                className="w-full px-4 py-3 text-slate-900 border border-gray-200 bg-gray-50 rounded-xl outline-none focus:border-red-500"
                placeholder="Số tiền (VND)" min="0" step="1000" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Ghi chú</label>
            <input type="text" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              className="w-full px-4 py-3 text-slate-900 border border-gray-200 bg-gray-50 rounded-xl outline-none focus:border-red-500"
              placeholder="Ghi chú thêm (nếu có)" />
          </div>
          <div className="flex gap-4 pt-2">
            {editingExpenseId && (
              <button type="button" onClick={() => { setEditingExpenseId(null); setExpenseForm({ description: '', amount: '', notes: '' }); }}
                className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-300">
                <X className="w-5 h-5" /> Hủy
              </button>
            )}
            <button type="submit"
              className={`w-full flex justify-center items-center gap-2 ${editingExpenseId ? 'bg-blue-600' : 'bg-red-600'} text-white font-bold py-3 rounded-xl shadow-sm transition-all hover:opacity-90`}>
              {editingExpenseId ? <><Pencil className="w-5 h-5" /> Cập nhật</> : <><Plus className="w-5 h-5" /> Ghi nhận chi phí</>}
            </button>
          </div>
        </form>
      </div>

      {/* BẢNG LỊCH SỬ CHI PHÍ */}
      {myExpensesToday.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-extrabold text-slate-900">Lịch sử hôm nay</h3>
          </div>
          
          <div className="overflow-x-auto rounded-xl border-2 border-slate-700 shadow-sm">
            <table className="w-full text-sm border-collapse bg-white whitespace-nowrap">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b-2 border-slate-700">
                  <th className="text-left py-4 px-5 font-extrabold border-2 border-slate-700">Mô tả</th>
                  <th className="text-right py-4 px-5 font-extrabold border-2 border-slate-700">Số tiền</th>
                  <th className="text-left py-4 px-5 font-extrabold border-2 border-slate-700">Ghi chú</th>
                  <th className="text-center py-4 px-5 font-extrabold border-2 border-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {myExpensesToday.map((exp, i) => (
                  <tr key={exp.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}>
                    <td className="py-4 px-5 font-bold text-slate-900 border-2 border-slate-700">{exp.description}</td>
                    <td className="py-4 px-5 text-right font-extrabold text-red-600 border-2 border-slate-700">{exp.amount.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-4 px-5 font-bold text-gray-600 border-2 border-slate-700">{exp.notes || '-'}</td>
                    <td className="py-4 px-5 text-center flex justify-center gap-2 border-2 border-slate-700">
                      <button onClick={() => handleStartEditExpense(exp)} className="p-2 text-blue-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50"><Pencil className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-red-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50"><X className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 text-slate-900 border-t-2 border-slate-700">
                  <td className="py-4 px-5 font-bold border-2 border-slate-700">Tổng chi</td>
                  <td className="py-4 px-5 text-right font-extrabold border-2 border-slate-700 text-red-700">{totalExpenseToday.toLocaleString('vi-VN')} ₫</td>
                  <td colSpan={2} className="border-2 border-slate-700"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
