import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Loading from '../components/Loading';

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  _count?: { kegs: number };
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', address: '' });

  const load = () => {
    setLoading(true);
    api<Supplier[]>('/suppliers').then(setSuppliers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          contact: form.contact || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
        }),
      });
      setShowForm(false);
      setForm({ name: '', contact: '', phone: '', address: '' });
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-cyber-text-dim">供应商管理</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ 新增</button>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-center text-cyber-text-dim py-12">暂无供应商</p>
      ) : (
        suppliers.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold">{s.name}</h3>
                {s.contact && <p className="text-xs text-cyber-text-dim mt-1">联系人: {s.contact}</p>}
                {s.phone && <p className="text-xs text-cyber-text-dim">电话: {s.phone}</p>}
                {s.address && <p className="text-xs text-cyber-text-dim">地址: {s.address}</p>}
              </div>
              {s._count && (
                <span className="badge-gold">{s._count.kegs} 批次</span>
              )}
            </div>
          </div>
        ))
      )}

      {/* 表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-cyber-surface w-full rounded-t-2xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">新增供应商</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">名称 *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">联系人</label>
                <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div>
                <label className="label">电话</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">地址</label>
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">取消</button>
                <button type="submit" className="btn-primary flex-1">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
