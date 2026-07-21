import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { centsToYuan, formatDate } from '../lib/format';
import Loading from '../components/Loading';

interface SaleOrder {
  id: string;
  orderNo: string;
  status: string;
  totalCents: number;
  note: string | null;
  createdAt: string;
  items: {
    id: string;
    cupSize: string;
    volumeMl: number;
    priceCents: number;
    quantity: number;
    beer: { id: string; name: string };
  }[];
}

export default function Sales() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api<SaleOrder[]>('/sales?limit=50')
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-sm font-medium text-cyber-text-dim mb-2">销售记录（最近 50 单）</h2>
      {orders.length === 0 ? (
        <p className="text-center text-cyber-text-dim py-12">暂无销售记录</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="card cursor-pointer"
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{order.orderNo}</p>
                <p className="text-xs text-cyber-text-dim mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-cyber-gold">¥{centsToYuan(order.totalCents)}</p>
                <p className="text-xs text-cyber-text-dim">{order.items.length} 项</p>
              </div>
            </div>

            {expanded === order.id && (
              <div className="mt-3 pt-3 border-t border-cyber-border space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.beer.name} · {item.cupSize === 'LARGE' ? '大杯' : '中杯'} ×{item.quantity}</span>
                    <span className="text-cyber-text-dim">¥{centsToYuan(item.priceCents * item.quantity)}</span>
                  </div>
                ))}
                {order.note && <p className="text-xs text-cyber-text-dim mt-1">备注: {order.note}</p>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
