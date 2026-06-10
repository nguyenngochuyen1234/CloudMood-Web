import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const EMPTY_FORM = {
  id: '', nameEn: '', nameVi: '', descriptionEn: '', descriptionVi: '',
  color: '#8b5cf6', score: '0', isPro: false,
};

export default function EmotionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/emotions')
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      id: String(item.id),
      nameEn: item.nameEn,
      nameVi: item.nameVi,
      descriptionEn: item.descriptionEn || '',
      descriptionVi: item.descriptionVi || '',
      color: item.color || '#8b5cf6',
      score: String(item.score),
      isPro: item.isPro,
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/admin/emotions/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...form, score: Number(form.score) }),
        });
      } else {
        await apiFetch('/admin/emotions', {
          method: 'POST',
          body: JSON.stringify({ ...form, id: Number(form.id), score: Number(form.score) }),
        });
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Xóa cảm xúc này?')) return;
    try {
      await apiFetch(`/admin/emotions/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>😊 Cảm xúc</h3>
            <p>{items.length} cảm xúc trong hệ thống</p>
          </div>
          <button id="create-emotion-btn" className="btn btn-primary" onClick={openCreate}>
            ＋ Thêm mới
          </button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">😐</span><span>Chưa có cảm xúc nào</span></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên (VI)</th>
                <th>Tên (EN)</th>
                <th>Màu</th>
                <th>Điểm</th>
                <th>Pro</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{String(item.id)}</td>
                  <td><strong>{item.nameVi}</strong></td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.nameEn}</td>
                  <td>
                    {item.color && (
                      <>
                        <span className="color-dot" style={{ backgroundColor: item.color }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.color}</span>
                      </>
                    )}
                  </td>
                  <td><span className="badge badge-blue" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{item.score}</span></td>
                  <td>
                    <span className={`badge ${item.isPro ? 'badge-orange' : 'badge-gray'}`}>
                      {item.isPro ? '⭐ Pro' : 'Free'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️ Sửa</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(item.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa cảm xúc' : '➕ Thêm cảm xúc mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {!editing && (
              <div className="form-group">
                <label className="form-label">ID (số nguyên duy nhất)</label>
                <input className="form-input" type="number" placeholder="Ví dụ: 1" value={form.id} onChange={e => set('id', e.target.value)} />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tên Tiếng Việt *</label>
                <input className="form-input" placeholder="Vui vẻ" value={form.nameVi} onChange={e => set('nameVi', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Tiếng Anh *</label>
                <input className="form-input" placeholder="Happy" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mô tả (VI)</label>
                <textarea className="form-textarea" placeholder="Mô tả tiếng Việt..." value={form.descriptionVi} onChange={e => set('descriptionVi', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả (EN)</label>
                <textarea className="form-textarea" placeholder="Description in English..." value={form.descriptionEn} onChange={e => set('descriptionEn', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Màu sắc</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                  <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Điểm số</label>
                <input className="form-input" type="number" min={0} max={100} value={form.score} onChange={e => set('score', e.target.value)} />
              </div>
            </div>

            <label className="form-check">
              <input type="checkbox" checked={form.isPro} onChange={e => set('isPro', e.target.checked)} />
              <span>⭐ Chỉ dành cho người dùng Pro</span>
            </label>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
