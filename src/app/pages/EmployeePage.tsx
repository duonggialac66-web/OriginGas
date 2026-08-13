import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { FileText, Users, BookOpen, LogOut, Flame } from 'lucide-react';
import { ReportTab } from './employee/ReportTab';
import { CustomerTab } from './employee/CustomerTab';
import { DebtTab } from './employee/DebtTab';

export function EmployeePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'report' | 'customer' | 'debt'>('report');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      {/* HEADER CLEAN & MINIMAL */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
             <Flame className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Xin chào, {user?.name}</h1>
            <p className="text-xs text-gray-500 font-medium">Nhân viên giao hàng</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-4 max-w-3xl mx-auto">
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'customer' && <CustomerTab />}
        {activeTab === 'debt' && <DebtTab />}
      </main>

      {/* BOTTOM NAVIGATION BARS FOR MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] md:max-w-3xl md:mx-auto md:bottom-4 md:rounded-2xl md:border">
        <NavButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<FileText className="w-6 h-6" />} label="Báo cáo" />
        <NavButton active={activeTab === 'customer'} onClick={() => setActiveTab('customer')} icon={<Users className="w-6 h-6" />} label="Khách hàng" />
        <NavButton active={activeTab === 'debt'} onClick={() => setActiveTab('debt')} icon={<BookOpen className="w-6 h-6" />} label="Sổ nợ" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center w-20 py-2 transition-colors ${active ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className={`mb-1 transition-transform ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-orange-600' : 'text-gray-500'}`}>{label}</span>
    </button>
  );
}
