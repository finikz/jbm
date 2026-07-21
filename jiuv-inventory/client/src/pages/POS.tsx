import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { centsToYuan } from '../lib/format';
import Loading from '../components/Loading';

interface Beer {
  id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  plato: number;
  ibu: number;
  priceLarge: number;
  priceMedium: number;
  isActive: boolean;
}

interface CartItem {
  beer: Beer;
  cupSize: 'LARGE' | 'MEDIUM';
  quantity: number;
  priceCents: number;
}

export default function POS() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api<Beer[]>('/beers?active=true')
      .then(setBeers)
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (beer: Beer, cupSize: 'LARGE' | 'MEDIUM') => {
    const priceCents = cupSize === 'LARGE' ? beer.priceLarge : beer.priceMedium;
    setCart((prev) => {
      const existing = prev.find((i) => i.beer.id === beer.id && i.cupSize === cupSize);
      if (existing) {
        return prev.map((i) =>
          i.beer.id === beer.id && i.cupSize === cupSize
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { beer, cupSize, quantity: 1, priceCents }];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) newCart.splice(index, 1);
      return newCart;
    });
  };

  const totalCents = cart.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((i) => ({
            beerId: i.beer.id,
            cupSize: i.cupSize,
            quantity: i.quantity,
          })),
        }),
      });
      setCart([]);
      setToast('✅ 下单成功');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setToast(`❌ ${(err as Error).message}`);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col h-full pb-20">
      {/* 啤酒列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-medium text-cyber-text-dim mb-3">点单（点击选择杯型）</h2>
        <div className="space-y-3">
          {beers.map((beer) => (
            <div key={beer.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{beer.name}</h3>
                  <p className="text-xs text-cyber-text-dim mt-0.5">
                    {beer.brewery} · {beer.style} · {beer.abv}%ABV
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(beer, 'LARGE')}
                  className="flex-1 bg-cyber-surface2 border border-cyber-border rounded-lg px-3 py-2 text-sm active:scale-95 transition-transform"
                >
                  <span className="text-cyber-text-dim">大杯 500ml</span>
                  <span className="text-cyber-gold font-bold ml-2">¥{centsToYuan(beer.priceLarge)}</span>
                </button>
                <button
                  onClick={() => addToCart(beer, 'MEDIUM')}
                  className="flex-1 bg-cyber-surface2 border border-cyber-border rounded-lg px-3 py-2 text-sm active:scale-95 transition-transform"
                >
                  <span className="text-cyber-text-dim">中杯 350ml</span>
                  <span className="text-cyber-gold font-bold ml-2">¥{centsToYuan(beer.priceMedium)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 购物车 */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 bg-cyber-surface border-t border-cyber-border p-4 z-10 max-h-[50vh] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">购物车 ({cart.length})</h3>
            <button onClick={() => setCart([])} className="text-xs text-cyber-danger">清空</button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 mb-3">
            {cart.map((item, idx) => (
              <div key={`${item.beer.id}-${item.cupSize}`} className="flex items-center justify-between text-sm">
                <span className="flex-1">
                  {item.beer.name} · {item.cupSize === 'LARGE' ? '大杯' : '中杯'}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded bg-cyber-bg text-cyber-gold">-</button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded bg-cyber-bg text-cyber-gold">+</button>
                  <span className="w-16 text-right text-cyber-gold">¥{centsToYuan(item.priceCents * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-cyber-border pt-3">
            <div>
              <span className="text-sm text-cyber-text-dim">合计</span>
              <span className="text-xl font-bold text-cyber-gold ml-2">¥{centsToYuan(totalCents)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? '下单中...' : '结算'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-cyber-surface border border-cyber-border rounded-lg px-4 py-2 text-sm z-30">
          {toast}
        </div>
      )}
    </div>
  );
}
