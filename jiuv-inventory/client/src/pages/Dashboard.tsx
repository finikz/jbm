import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { centsToYuan } from '../lib/format';
import Loading from '../components/Loading';

interface DashboardData {
  activeTaps: number;
  totalKegs: number;
  lowStockKegs: number;
  totalBeers: number;
  totalVolumeLiters: number;
  totalValueCents: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>('/inventory/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <p className="text-center text-cyber-text-dim py-12">加载失败</p>;

  return (
    <div className="p-4 space-y-4">
      {/* 预警卡片 */}
      {data.lowStockKegs > 0 && (
        <div
          onClick={() => navigate('/inventory?lowStock=true')}
          className="bg-cyber-danger/10 border border-cyber-danger/30 rounded-xl p-4 flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-cyber-danger font-bold text-lg">⚠️ {data.lowStockKegs} 个 Keg 库存不足</p>
            <p className="text-sm text-cyber-text-dim">低于 2L，需要补货</p>
          </div>
          <span className="text-cyber-danger">›</span>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-sm text-cyber-text-dim">活跃龙头</p>
          <p className="text-2xl font-bold text-cyber-gold mt-1">{data.activeTaps}<span className="text-sm text-cyber-text-dim">/11</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-cyber-text-dim">在售 Keg</p>
          <p className="text-2xl font-bold text-cyber-gold mt-1">{data.totalKegs}</p>
        </div>
        <div className="card">
          <p className="text-sm text-cyber-text-dim">总库存</p>
          <p className="text-2xl font-bold text-cyber-gold mt-1">{data.totalVolumeLiters}<span className="text-sm text-cyber-text-dim">L</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-cyber-text-dim">库存价值</p>
          <p className="text-2xl font-bold text-cyber-gold mt-1">¥{centsToYuan(data.totalValueCents)}</p>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-cyber-text-dim px-1">快捷操作</h2>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/pos')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">🍺</span>
            <span className="text-xs">点单收银</span>
          </button>
          <button onClick={() => navigate('/purchases')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">🚚</span>
            <span className="text-xs">进货录入</span>
          </button>
          <button onClick={() => navigate('/taps')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">🚰</span>
            <span className="text-xs">龙头管理</span>
          </button>
          <button onClick={() => navigate('/beers')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">📋</span>
            <span className="text-xs">酒单管理</span>
          </button>
          <button onClick={() => navigate('/stats')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">📈</span>
            <span className="text-xs">销售统计</span>
          </button>
          <button onClick={() => navigate('/suppliers')} className="card flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">🏭</span>
            <span className="text-xs">供应商</span>
          </button>
        </div>
      </div>
    </div>
  );
}
