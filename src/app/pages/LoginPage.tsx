/// <reference types="vite/client" />
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Flame, UserCircle, Shield } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');

    const API_BASE_URL = import.meta.env.PROD ? '' : 'https://origin-gas.vercel.app';

    try {
      // Gọi API thực tế
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // data.user có chứa role
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/employee');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Glowing Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-red-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-orange-500 to-red-500 rounded-2xl mb-6 shadow-[0_0_40px_rgba(249,115,22,0.5)] relative transform rotate-12 transition-transform hover:rotate-0 duration-500">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-orange-500 animate-ping opacity-20"></div>
            <Flame className="w-12 h-12 text-white relative z-10 -rotate-12 hover:rotate-0 transition-transform duration-500" />
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-3 tracking-tight">
            Hệ Thống Gas
          </h1>
          <p className="text-slate-400 text-lg font-medium">Quản lý giao hàng chuyên nghiệp</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-800/50 text-white border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-inner placeholder-slate-500"
                placeholder="VD: admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-800/50 text-white border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-inner placeholder-slate-500"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={!username || !password}
              className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white py-4 rounded-xl font-bold hover:from-orange-400 hover:via-red-400 hover:to-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-[1.02] transform"
            >
              Đăng nhập
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 font-medium">
          🔥 Đã kết nối Database thực tế
        </p>
      </div>
    </div>
  );
}
