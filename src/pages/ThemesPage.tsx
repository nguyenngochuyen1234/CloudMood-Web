import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import ImageUploadInput from '../components/ImageUploadInput';

const EMPTY = {
  name: '', mode: 'light', isActive: true, isPro: false,
  colorsJson: '{\n  "primary": "#8b5cf6",\n  "background": "#ffffff",\n  "text": "#1a1a2e"\n}',
};

const IMAGE_TYPES = ['home', 'add', 'detail', 'stats', 'background', 'header', 'thumbnail'];

export default function ThemesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');

  // Quản lý ảnh giao diện
  const [themeImages, setThemeImages] = useState<any[]>([]);
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newImgType, setNewImgType] = useState('home');
  const [imgAdding, setImgAdding] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/themes').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm({ ...EMPTY }); setJsonError('');
    setThemeImages([]); setNewImgUrl(''); setNewImgType('home');
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, mode: item.mode || 'light', isActive: item.isActive, isPro: item.isPro, colorsJson: JSON.stringify(item.colorsJson, null, 2) });
    setThemeImages(item.themeImages ?? []);
    setNewImgUrl(''); setNewImgType('home');
    setJsonError(''); setShowModal(true);
  };

  const validateJson = (val: string) => {
    try { JSON.parse(val); setJsonError(''); return true; }
    catch { setJsonError('JSON không hợp lệ'); return false; }
  };

  const save = async () => {
    if (!validateJson(form.colorsJson)) return;
    setSaving(true);
    try {
      const payload = { ...form, colorsJson: JSON.parse(form.colorsJson) };
      if (editing) {
        await apiFetch(`/admin/themes/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/admin/themes', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false); load();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa giao diện này?')) return;
    try { await apiFetch(`/admin/themes/${id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const addImage = async () => {
    if (!newImgUrl || !newImgType || !editing) return;
    setImgAdding(true);
    try {
      const created = await apiFetch('/admin/theme-images', {
        method: 'POST',
        body: JSON.stringify({ themeId: editing.id, type: newImgType, imageUrl: newImgUrl }),
      });
      setThemeImages(prev => [...prev, created]);
      setNewImgUrl('');
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    finally { setImgAdding(false); }
  };

  const removeImage = async (id: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await apiFetch(`/admin/theme-images/${id}`, { method: 'DELETE' });
      setThemeImages(prev => prev.filter(img => img.id !== id));
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div><h3>🎭 Giao diện (Themes)</h3><p>{items.length} giao diện trong hệ thống</p></div>
          <button id="create-theme-btn" className="btn btn-primary" onClick={openCreate}>＋ Thêm mới</button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">🎭</span><span>Chưa có giao diện nào</span></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Tên</th><th>Chế độ</th><th>Màu sắc</th><th>Trạng thái</th><th>Pro</th><th>Ảnh</th><th>Hành động</th></tr></thead>
            <tbody>
              {items.map(item => {
                const colors = item.colorsJson as Record<string, string>;
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className={`badge ${item.mode === 'dark' ? 'badge-purple' : 'badge-gray'}`}>{item.mode === 'dark' ? '🌙 Dark' : '☀️ Light'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {Object.entries(colors).slice(0, 4).map(([k, v]) => (
                          <div key={k} title={`${k}: ${v}`} style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: v as string, border: '1px solid rgba(255,255,255,0.15)' }} />
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-red'}`}>{item.isActive ? 'Hoạt động' : 'Tắt'}</span></td>
                    <td><span className={`badge ${item.isPro ? 'badge-orange' : 'badge-gray'}`}>{item.isPro ? '⭐ Pro' : 'Free'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.themeImages?.length ?? 0} ảnh</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>✏️ Sửa</button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa Giao diện' : '➕ Thêm Giao diện mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Tên giao diện *</label>
              <input className="form-input" placeholder="Ocean Blue" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Chế độ</label>
              <select className="form-select" value={form.mode} onChange={e => set('mode', e.target.value)}>
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Màu sắc (JSON)
                {jsonError && <span style={{ color: 'var(--accent-red)', marginLeft: 8, fontWeight: 400, textTransform: 'none' }}>{jsonError}</span>}
              </label>
              <textarea
                className="form-textarea"
                style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 120, borderColor: jsonError ? 'var(--accent-red)' : undefined }}
                value={form.colorsJson}
                onChange={e => { set('colorsJson', e.target.value); validateJson(e.target.value); }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <label className="form-check">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                <span>✅ Đang hoạt động</span>
              </label>
              <label className="form-check">
                <input type="checkbox" checked={form.isPro} onChange={e => set('isPro', e.target.checked)} />
                <span>⭐ Chỉ dành cho Pro</span>
              </label>
            </div>

            {/* ── Ảnh giao diện (chỉ hiện khi đang edit) ── */}
            {editing && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🖼️ Ảnh giao diện</div>

                {/* Danh sách ảnh hiện có */}
                {themeImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    {themeImages.map(img => (
                      <div key={img.id} style={{
                        position: 'relative', borderRadius: 10, overflow: 'hidden',
                        border: '1.5px solid var(--border)', background: 'var(--bg-glass)',
                        width: 100, flexShrink: 0,
                      }}>
                        <img src={img.imageUrl} alt={img.type}
                          style={{ width: 100, height: 72, objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                        <div style={{ padding: '4px 6px', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                          {img.type}
                        </div>
                        <button
                          onClick={() => removeImage(img.id)}
                          title="Xóa ảnh"
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 4,
                            color: '#fff', cursor: 'pointer', width: 22, height: 22, fontSize: 13, lineHeight: '22px', padding: 0,
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form thêm ảnh mới */}
                <div style={{
                  border: '1.5px dashed var(--border)', borderRadius: 10,
                  padding: 14, background: 'var(--bg-glass)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>
                    ＋ Thêm ảnh mới
                  </div>
                  <div className="form-row" style={{ marginBottom: 10 }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label" style={{ fontSize: 12 }}>Loại ảnh</label>
                      <select
                        className="form-input"
                        value={newImgType}
                        onChange={e => setNewImgType(e.target.value)}
                        style={{ fontSize: 13 }}
                      >
                        {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <ImageUploadInput value={newImgUrl} onChange={setNewImgUrl} folder="backgrounds" />
                  <button
                    className="btn btn-secondary"
                    onClick={addImage}
                    disabled={!newImgUrl || imgAdding}
                    style={{ marginTop: 10, width: '100%' }}
                  >
                    {imgAdding ? '⏳ Đang thêm...' : '＋ Thêm ảnh'}
                  </button>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !!jsonError}>{saving ? '⏳ Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
