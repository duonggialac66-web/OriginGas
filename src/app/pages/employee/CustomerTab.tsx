import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { MapPin, Navigation, Pencil, Plus, Search, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Customer } from '../../types';
import { hashCustomerName } from '../../lib/hashName';

export function CustomerTab() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, updateCustomerLocation, customerMap } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for form (Add / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const [isGettingLocation, setIsGettingLocation] = useState<string | null>(null);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.phone && c.phone.includes(term))
    );
  }, [customers, searchTerm]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      notes: c.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    // Validate unique name using hash
    const newHash = hashCustomerName(formData.name);
    const existing = customerMap.get(newHash);
    
    if (existing && existing.id !== editingId) {
      toast.error('Tên khách hàng đã tồn tại (hoặc tương tự nhau)');
      return;
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, {
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          notes: formData.notes.trim() || null
        });
        toast.success('Cập nhật thông tin thành công');
      } else {
        await addCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined
        });
        toast.success('Thêm khách hàng thành công');
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    const res = await deleteCustomer(id);
    if (res.success) {
      toast.success('Xóa khách hàng thành công');
    } else {
      toast.error(res.message || 'Không thể xóa');
    }
  };

  const handlePinGPS = (id: string) => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setIsGettingLocation(id);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateCustomerLocation(id, position.coords.latitude, position.coords.longitude);
          toast.success(`Đã cập nhật vị trí khách hàng`);
        } catch (err: any) {
          toast.error('Lỗi khi lưu vị trí');
        } finally {
          setIsGettingLocation(null);
        }
      },
      (error) => {
        setIsGettingLocation(null);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật GPS.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Không thể xác định vị trí.');
            break;
          case error.TIMEOUT:
            toast.error('Hết thời gian chờ GPS.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* HEADER & SEARCH */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm khách hàng theo tên hoặc SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 font-medium"
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Thêm khách hàng mới
        </button>
      </div>

      {/* FORM ADD/EDIT */}
      {showForm && (
        <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-blue-100 relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-extrabold text-gray-800 mb-6">
            {editingId ? 'Chỉnh sửa thông tin khách' : 'Thêm khách hàng mới'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tên khách hàng (*)</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOMER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  {customer.name}
                  {customer.latitude && customer.longitude && (
                    <span className="text-green-500 text-xs bg-green-50 px-2 py-1 rounded-md border border-green-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Đã ghim
                    </span>
                  )}
                </h4>
                {customer.phone && <p className="text-gray-600 text-sm mt-1 font-medium">{customer.phone}</p>}
              </div>
            </div>
            
            {(customer.address || customer.notes) && (
              <div className="mb-6 space-y-2 flex-grow">
                {customer.address && <p className="text-sm text-gray-700"><span className="text-gray-400">Đ/c:</span> {customer.address}</p>}
                {customer.notes && <p className="text-sm text-gray-700"><span className="text-gray-400">Ghi chú:</span> {customer.notes}</p>}
              </div>
            )}
            
            <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              <button 
                onClick={() => handleOpenEdit(customer)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
              >
                <Pencil className="w-4 h-4" /> Sửa
              </button>
              
              <button 
                onClick={() => handlePinGPS(customer.id)}
                disabled={isGettingLocation === customer.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-bold transition-colors"
              >
                <MapPin className={`w-4 h-4 ${isGettingLocation === customer.id ? 'animate-bounce' : ''}`} /> 
                {customer.latitude ? 'Cập nhật GPS' : 'Ghim GPS'}
              </button>

              {customer.latitude && customer.longitude && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-bold transition-colors ml-auto"
                >
                  <Navigation className="w-4 h-4" /> Maps
                </a>
              )}
              
              <button 
                onClick={() => handleDelete(customer.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg text-sm font-bold transition-colors ml-auto md:ml-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100">
            Không tìm thấy khách hàng nào.
          </div>
        )}
      </div>
    </div>
  );
}
