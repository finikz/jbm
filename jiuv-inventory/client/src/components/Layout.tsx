import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const navItems = [
  { path: '/', label: '看板', icon: '📊' },
  { path: '/pos', label: '点单', icon: '🍺' },
  { path: '/taps', label: '龙头', icon: '🚰' },
  { path: '/inventory', label: '库存', icon: '📦' },
  { path: '/sales', label: '订单', icon: '🧾' },
  { path: '/stats', label: '统计', icon: '📈' },
  { path: '/beers', label: '酒单', icon: '📋' },
  { path: '/purchases', label: '进货', icon: '🚚' },
  { path: '/suppliers', label: '供应商', icon: '🏭' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-20 bg-cyber-bg/90 backdrop-blur-md border-b border-cyber-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold gradient-gold">九维进销存</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-cyber-text-dim">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-cyber-danger px-2 py-1"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-cyber-surface/95 backdrop-blur-md border-t border-cyber-border">
        <div className="flex overflow-x-auto no-scrollbar px-2 py-2 gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[60px] transition-all ${
                  active ? 'text-cyber-gold' : 'text-cyber-text-dim'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
