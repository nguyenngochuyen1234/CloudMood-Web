import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const EMPTY = { id: '', nameEn: '', nameVi: '', descriptionEn: '', descriptionVi: '', isActive: true, isPro: false, isProVN: false };

export default function EmojiTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/emoji-types').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      id: String(item.id),
      nameEn: item.nameEn,
      nameVi: item.nameVi,
      descriptionEn: item.descriptionEn || '',
      descriptionVi: item.descriptionVi || '',
      isActive: item.isActive,
      isPro: item.isPro,
      isProVN: item.isProVN ?? false,
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await apiFetch(`/admin/emoji-types/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/admin/emoji-types', { method: 'POST', body: JSON.stringify({ ...payload, id: Number(form.id) }) });
      }
      setShowModal(false); load();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Xóa loại emoji này?')) return;
    try { await apiFetch(`/admin/emoji-types/${id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div><h3>🎨 Loại Emoji</h3><p>{items.length} loại trong hệ thống</p></div>
          <button id="create-emoji-type-btn" className="btn btn-primary" onClick={openCreate}>＋ Thêm mới</button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">🎨</span><span>Chưa có loại emoji nào</span></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>ID</th><th>Tên (VI)</th><th>Tên (EN)</th><th>Trạng thái</th><th>Pro</th><th>Pro VN</th><th>Hành động</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{String(item.id)}</td>
                  <td><strong>{item.nameVi}</strong></td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.nameEn}</td>
                  <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-red'}`}>{item.isActive ? 'Hoạt động' : 'Tắt'}</span></td>
                  <td><span className={`badge ${item.isPro ? 'badge-orange' : 'badge-gray'}`}>{item.isPro ? '⭐ Pro' : 'Free'}</span></td>
                  <td><span className={`badge ${item.isProVN ? 'badge-orange' : 'badge-gray'}`}>{item.isProVN ? '⭐ Pro VN' : 'Free'}</span></td>
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
              <h3>{editing ? '✏️ Sửa loại Emoji' : '➕ Thêm loại Emoji mới'}</h3>
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
                <input className="form-input" placeholder="Hoạt hình" value={form.nameVi} onChange={e => set('nameVi', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Tiếng Anh *</label>
                <input className="form-input" placeholder="Cartoon" value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mô tả (VI)</label>
                <textarea className="form-textarea" value={form.descriptionVi} onChange={e => set('descriptionVi', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả (EN)</label>
                <textarea className="form-textarea" value={form.descriptionEn} onChange={e => set('descriptionEn', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
              <label className="form-check">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                <span>✅ Đang hoạt động</span>
              </label>
              <label className="form-check">
                <input type="checkbox" checked={form.isPro} onChange={e => set('isPro', e.target.checked)} />
                <span>⭐ Chỉ dành cho Pro</span>
              </label>
              <label className="form-check">
                <input type="checkbox" checked={form.isProVN} onChange={e => set('isProVN', e.target.checked)} />
                <span>⭐ Chỉ dành cho Pro VN</span>
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳ Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
