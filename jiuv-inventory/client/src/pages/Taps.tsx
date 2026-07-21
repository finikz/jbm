import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Loading from '../components/Loading';

interface Tap {
  id: number;
  status: string;
  keg: {
    id: string;
    volumeLiters: number;
    initialVolumeLiters: number;
    isLowStock: boolean;
    beer: { id: string; name: string; brewery: string; abv: number };
  } | null;
}

export default function Taps() {
  const [taps, setTaps] = useState<Tap[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api<Tap[]>('/inventory/taps')
      .then(setTaps)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUnmount = async (tapId: number) => {
    if (!confirm(`确认卸下龙头 ${tapId} 的 Keg？`)) return;
    try {
      await api(`/inventory/taps/${tapId}/unmount`, { method: 'POST' });
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-medium text-cyber-text-dim">龙头管理（1-11 号位）</h2>
      <div className="grid grid-cols-2 gap-3">
        {taps.map((tap) => (
          <div
            key={tap.id}
            className={`card ${tap.status === 'ACTIVE' ? 'border-cyber-gold/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-cyber-gold">#{tap.id}</span>
              {tap.status === 'ACTIVE' ? (
                <span className="badge-success">在线</span>
              ) : (
                <span className="badge bg-cyber-text-dim/20 text-cyber-text-dim">空闲</span>
              )}
            </div>

            {tap.keg ? (
              <>
                <h3 className="font-bold text-sm">{tap.keg.beer.name}</h3>
                <p className="text-xs text-cyber-text-dim mb-2">
                  {tap.keg.beer.brewery} · {tap.keg.beer.abv}%ABV
                </p>
                <div className="w-full bg-cyber-bg rounded-full h-1.5 mb-1">
                  <div
                    className={`h-1.5 rounded-full ${tap.keg.isLowStock ? 'bg-cyber-danger' : 'bg-cyber-gold'}`}
                    style={{ width: `${Math.round((tap.keg.volumeLiters / tap.keg.initialVolumeLiters) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyber-text-dim">{tap.keg.volumeLiters}L</span>
                  <button
                    onClick={() => handleUnmount(tap.id)}
                    className="text-xs text-cyber-danger"
                  >
                    卸下
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-cyber-text-dim py-2 text-center">未挂载</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
