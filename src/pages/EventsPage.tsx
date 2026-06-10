import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import ImageUploadInput from '../components/ImageUploadInput';

const EMPTY = { name: '', imageUrl: '', color: '#8b5cf6', backgroundColor: '#f0f0ff', descriptionVi: '', descriptionEn: '' };

export default function EventsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/events').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, imageUrl: item.imageUrl || '', color: item.color || '#8b5cf6', backgroundColor: item.backgroundColor || '#f0f0ff', descriptionVi: item.descriptionVi || '', descriptionEn: item.descriptionEn || '' });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/admin/events/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/admin/events', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false); load();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa sự kiện này?')) return;
    try { await apiFetch(`/admin/events/${id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div><h3>📅 Sự kiện</h3><p>{items.length} sự kiện trong hệ thống</p></div>
          <button id="create-event-btn" className="btn btn-primary" onClick={openCreate}>＋ Thêm mới</button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">📅</span><span>Chưa có sự kiện nào</span></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Tên sự kiện</th><th>Màu</th><th>Mô tả (VI)</th><th>Ngày tạo</th><th>Hành động</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <strong>{item.name}</strong>
                    </div>
                  </td>
                  <td>
                    {item.color && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: item.color, border: '1px solid rgba(255,255,255,0.15)' }} />
                        <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: item.backgroundColor, border: '1px solid rgba(255,255,255,0.15)' }} />
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.descriptionVi || '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
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
              <h3>{editing ? '✏️ Sửa Sự kiện' : '➕ Thêm Sự kiện mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Tên sự kiện *</label>
              <input className="form-input" placeholder="Tết Nguyên Đán 2025" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Hình ảnh</label>
              <ImageUploadInput value={form.imageUrl} onChange={v => set('imageUrl', v)} folder="events" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Màu chủ đạo</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                  <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Màu nền</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.backgroundColor} onChange={e => set('backgroundColor', e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                  <input className="form-input" value={form.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} style={{ fontFamily: 'monospace' }} />
                </div>
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
