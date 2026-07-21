import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { centsToYuan } from '../lib/format';
import { useAuthStore } from '../store/auth';
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
  description: string | null;
  isActive: boolean;
}

export default function Beers() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Beer | null>(null);
  const [form, setForm] = useState({
    name: '', brewery: '', style: '', abv: '', plato: '', ibu: '',
    priceLarge: '', priceMedium: '', description: '',
  });

  const load = () => {
    setLoading(true);
    api<Beer[]>('/beers').then(setBeers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', brewery: '', style: '', abv: '', plato: '', ibu: '', priceLarge: '', priceMedium: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (beer: Beer) => {
    setEditing(beer);
    setForm({
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: String(beer.abv),
      plato: String(beer.plato),
      ibu: String(beer.ibu),
      priceLarge: String(beer.priceLarge / 100),
      priceMedium: String(beer.priceMedium / 100),
      description: beer.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      brewery: form.brewery,
      style: form.style,
      abv: parseFloat(form.abv),
      plato: parseFloat(form.plato),
      ibu: parseInt(form.ibu),
      priceLarge: Math.round(parseFloat(form.priceLarge) * 100),
      priceMedium: Math.round(parseFloat(form.priceMedium) * 100),
      description: form.description || undefined,
    };

    try {
      if (editing) {
        await api(`/beers/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/beers', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleToggle = async (beer: Beer) => {
    try {
      await api(`/beers/${beer.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !beer.isActive }) });
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-cyber-text-dim">啤酒 SKU 管理</h2>
        {isOwner && (
          <button onClick={openCreate} className="btn-primary text-sm">+ 新增</button>
        )}
      </div>

      {beers.map((beer) => (
        <div key={beer.id} className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{beer.name}</h3>
                {beer.isActive ? <span className="badge-success">在售</span> : <span className="badge bg-cyber-text-dim/20 text-cyber-text-dim">下架</span>}
              </div>
              <p className="text-xs text-cyber-text-dim mt-1">
                {beer.brewery} · {beer.style}
              </p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-cyber-text-dim">ABV {beer.abv}%</span>
                <span className="text-cyber-text-dim">°P {beer.plato}</span>
                <span className="text-cyber-text-dim">IBU {beer.ibu}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-sm text-cyber-gold">大杯 ¥{centsToYuan(beer.priceLarge)}</span>
                <span className="text-sm text-cyber-gold">中杯 ¥{centsToYuan(beer.priceMedium)}</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-cyber-border">
              <button onClick={() => openEdit(beer)} className="btn-secondary text-xs flex-1">编辑</button>
              <button onClick={() => handleToggle(beer)} className="btn-secondary text-xs flex-1">
                {beer.isActive ? '下架' : '上架'}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* 表单弹层 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-end" onClick={() => setShowForm(false)}>
          <div
            className="bg-cyber-surface w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">{editing ? '编辑啤酒' : '新增啤酒'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">名称</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">酒厂</label>
                <input className="input" value={form.brewery} onChange={(e) => setForm({ ...form, brewery: e.target.value })} required />
              </div>
              <div>
                <label className="label">风格</label>
                <input className="input" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="American IPA" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">ABV %</label>
                  <input className="input" type="number" step="0.1" value={form.abv} onChange={(e) => setForm({ ...form, abv: e.target.value })} required />
                </div>
                <div>
                  <label className="label">°P</label>
                  <input className="input" type="number" step="0.1" value={form.plato} onChange={(e) => setForm({ ...form, plato: e.target.value })} required />
                </div>
                <div>
                  <label className="label">IBU</label>
                  <input className="input" type="number" value={form.ibu} onChange={(e) => setForm({ ...form, ibu: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">大杯价格 ¥</label>
                  <input className="input" type="number" step="0.01" value={form.priceLarge} onChange={(e) => setForm({ ...form, priceLarge: e.target.value })} required />
                </div>
                <div>
                  <label className="label">中杯价格 ¥</label>
                  <input className="input" type="number" step="0.01" value={form.priceMedium} onChange={(e) => setForm({ ...form, priceMedium: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">描述</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">取消</button>
                <button type="submit" className="btn-primary flex-1">{editing ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
