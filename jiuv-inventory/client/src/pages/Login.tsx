import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState('13800000001');
  const [password, setPassword] = useState('jiuv2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api<{ token: string; user: { id: string; phone: string; name: string; role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-cyber-bg">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🍺</div>
        <h1 className="text-2xl font-bold gradient-gold">九维进销存</h1>
        <p className="text-sm text-cyber-text-dim mt-1">精酿酒吧云端管理系统</p>
      </div>

      {/* 登录表单 */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="label">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="11 位手机号"
            maxLength={11}
          />
        </div>

        <div>
          <label className="label">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="登录密码"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="mt-8 text-xs text-cyber-text-dim text-center">
        默认账号: 13800000001 / jiuv2024
      </p>
    </div>
  );
}
