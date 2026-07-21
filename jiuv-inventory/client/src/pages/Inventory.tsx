import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { centsToYuan } from '../lib/format';
import Loading from '../components/Loading';

interface Keg {
  id: string;
  batchNo: string;
  volumeLiters: number;
  initialVolumeLiters: number;
  costCents: number;
  tapId: number | null;
  isEmpty: boolean;
  isLowStock: boolean;
  receivedAt: string;
  beer: {
    id: string;
    name: string;
    brewery: string;
    style: string;
    abv: number;
  };
  supplier: { id: string; name: string } | null;
}

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [kegs, setKegs] = useState<Keg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  useEffect(() => {
    const lowStock = searchParams.get('lowStock');
    if (lowStock === 'true') setFilter('low');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    api<Keg[]>(`/inventory/kegs${filter === 'low' ? '?lowStock=true' : ''}`)
      .then(setKegs)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('low')}
          className={filter === 'low' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
        >
          ⚠️ 低库存
        </button>
      </div>

      {kegs.length === 0 ? (
        <p className="text-center text-cyber-text-dim py-12">暂无库存</p>
      ) : (
        kegs.map((keg) => {
          const percent = Math.round((keg.volumeLiters / keg.initialVolumeLiters) * 100);
          return (
            <div key={keg.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{keg.beer.name}</h3>
                    {keg.tapId && <span className="badge-gold">龙头 {keg.tapId}</span>}
                    {keg.isLowStock && <span className="badge-danger">低库存</span>}
                  </div>
                  <p className="text-xs text-cyber-text-dim mt-0.5">
                    {keg.beer.brewery} · {keg.beer.style} · 批次 {keg.batchNo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-cyber-gold">{keg.volumeLiters}L</p>
                  <p className="text-xs text-cyber-text-dim">/ {keg.initialVolumeLiters}L</p>
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-cyber-bg rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    percent > 30 ? 'bg-cyber-gold' : 'bg-cyber-danger'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-cyber-text-dim">
                <span>剩余 {percent}%</span>
                <span>成本 ¥{centsToYuan(keg.costCents)}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
