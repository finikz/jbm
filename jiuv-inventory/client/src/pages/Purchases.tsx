import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { centsToYuan, formatDate } from '../lib/format';
import Loading from '../components/Loading';

interface PurchaseOrder {
  id: string;
  status: string;
  totalCostCents: number;
  note: string | null;
  createdAt: string;
  supplier: { id: string; name: string } | null;
  items: {
    id: string;
    batchNo: string;
    volumeLiters: number;
    costCents: number;
    beer: { id: string; name: string };
  }[];
}

interface Beer { id: string; name: string; }
interface Supplier { id: string; name: string; }

export default function Purchases() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ beerId: '', batchNo: '', volumeLiters: '', costCents: '' }]);

  const load = () => {
    setLoading(true);
    api<PurchaseOrder[]>('/purchases?limit=30').then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api<Beer[]>('/beers?active=true').then(setBeers);
    api<Supplier[]>('/suppliers').then(setSuppliers);
  }, []);

  const addItem = () => setItems([...items, { beerId: '', batchNo: '', volumeLiters: '', costCents: '' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      supplierId: supplierId || undefined,
      items: items.map((i) => ({
        beerId: i.beerId,
        batchNo: i.batchNo,
        volumeLiters: parseFloat(i.volumeLiters),
        costCents: Math.round(parseFloat(i.costCents) * 100),
      })),
    };

    try {
      await api('/purchases', { method: 'POST', body: JSON.stringify(payload) });
      setShowForm(false);
      setSupplierId('');
      setItems([{ beerId: '', batchNo: '', volumeLiters: '', costCents: '' }]);
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-cyber-text-dim">进货记录</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ 录入</button>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-sm">{order.supplier?.name || '未指定供应商'}</p>
              <p className="text-xs text-cyber-text-dim mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <span className="badge-success">已入库</span>
          </div>
          <div className="space-y-1 pt-2 border-t border-cyber-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span>{item.beer.name} · {item.batchNo}</span>
                <span className="text-cyber-text-dim">{item.volumeLiters}L · ¥{centsToYuan(item.costCents)}</span>
              </div>
            ))}
          </div>
          <div className="text-right mt-2 pt-2 border-t border-cyber-border">
            <span className="text-sm font-bold text-cyber-gold">合计 ¥{centsToYuan(order.totalCostCents)}</span>
          </div>
        </div>
      ))}

      {/* 进货表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-cyber-surface w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">录入进货</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">供应商</label>
                <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">不指定</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="bg-cyber-bg rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyber-text-dim">批次 {idx + 1}</span>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-xs text-cyber-danger">删除</button>}
                  </div>
                  <div>
                    <label className="label">啤酒</label>
                    <select className="input" value={item.beerId} onChange={(e) => updateItem(idx, 'beerId', e.target.value)} required>
                      <option value="">选择啤酒</option>
                      {beers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">批次号</label>
                    <input className="input" value={item.batchNo} onChange={(e) => updateItem(idx, 'batchNo', e.target.value)} placeholder="IPA-20240101" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">容量 (L)</label>
                      <input className="input" type="number" step="0.5" value={item.volumeLiters} onChange={(e) => updateItem(idx, 'volumeLiters', e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">成本 (¥)</label>
                      <input className="input" type="number" step="0.01" value={item.costCents} onChange={(e) => updateItem(idx, 'costCents', e.target.value)} required />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addItem} className="btn-secondary w-full text-sm">+ 添加批次</button>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">取消</button>
                <button type="submit" className="btn-primary flex-1">入库</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
