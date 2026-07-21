import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { centsToYuan, formatDateShort } from '../lib/format';
import Loading from '../components/Loading';

interface Stats {
  totalRevenueCents: number;
  totalOrders: number;
  totalVolumeMl: number;
  topBeers: { beerId: string; beerName: string; quantity: number; revenueCents: number }[];
  byDay: { date: string; revenueCents: number; orders: number }[];
}

export default function Stats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    api<Stats>(`/sales/stats?days=${days}`)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <Loading />;
  if (!stats) return <p className="text-center text-cyber-text-dim py-12">加载失败</p>;

  const maxRevenue = Math.max(...stats.byDay.map((d) => d.revenueCents), 1);

  return (
    <div className="p-4 space-y-4">
      {/* 时间筛选 */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={days === d ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {d} 天
          </button>
        ))}
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-cyber-text-dim">总收入</p>
          <p className="text-lg font-bold text-cyber-gold mt-1">¥{centsToYuan(stats.totalRevenueCents)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-cyber-text-dim">订单数</p>
          <p className="text-lg font-bold text-cyber-gold mt-1">{stats.totalOrders}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-cyber-text-dim">售出</p>
          <p className="text-lg font-bold text-cyber-gold mt-1">{(stats.totalVolumeMl / 1000).toFixed(1)}L</p>
        </div>
      </div>

      {/* 每日柱状图 */}
      <div className="card">
        <h3 className="text-sm font-medium mb-3">每日营收</h3>
        <div className="space-y-2">
          {stats.byDay.map((day) => (
            <div key={day.date} className="flex items-center gap-2">
              <span className="text-xs text-cyber-text-dim w-12">{formatDateShort(day.date)}</span>
              <div className="flex-1 bg-cyber-bg rounded-full h-6 overflow-hidden">
                <div
                  className="h-6 bg-cyber-gold/80 flex items-center justify-end px-2"
                  style={{ width: `${(day.revenueCents / maxRevenue) * 100}%` }}
                >
                  <span className="text-[10px] text-cyber-bg font-bold">¥{centsToYuan(day.revenueCents)}</span>
                </div>
              </div>
              <span className="text-xs text-cyber-text-dim w-6 text-right">{day.orders}单</span>
            </div>
          ))}
        </div>
      </div>

      {/* 热销 */}
      <div className="card">
        <h3 className="text-sm font-medium mb-3">热销 TOP 5</h3>
        <div className="space-y-2">
          {stats.topBeers.map((beer, idx) => (
            <div key={beer.beerId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cyber-gold font-bold w-5">{idx + 1}</span>
                <span>{beer.beerName}</span>
              </div>
              <div className="text-right">
                <span className="text-cyber-text-dim">{beer.quantity} 杯</span>
                <span className="text-cyber-gold ml-2">¥{centsToYuan(beer.revenueCents)}</span>
              </div>
            </div>
          ))}
          {stats.topBeers.length === 0 && (
            <p className="text-center text-cyber-text-dim text-sm py-4">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
