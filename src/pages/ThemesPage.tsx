import { useEffect, useRef, useState } from 'react';
import { API_BASE, apiFetch } from '../api';

const EMPTY = {
  name: '', mode: 'lightMode', isActive: true, isPro: false,
  colorsJson: '{\n  "primary": "#E4864D",\n  "secondary": "#E4864D",\n  "background": "#FCF6EF",\n  "backgroundCard": "#FCF6EF",\n  "text": "#0F172A",\n  "title": "#512B0D",\n  "muted": "#e8a87d",\n  "textOnDark": "#FFFFFF",\n  "border": "#E2E8F0",\n  "tabBar": "#FFFFFF",\n  "success": "#22C55E",\n  "error": "#EF4444"\n}',
};

const COLOR_LABELS: Record<string, string> = {
  primary:         'Màu chính',
  secondary:       'Màu phụ',
  background:      'Nền',
  backgroundCard:  'Nền thẻ',
  text:            'Màu chữ',
  title:           'Tiêu đề',
  muted:           'Chữ mờ',
  textOnDark:      'Chữ trên nền tối',
  border:          'Viền',
  tabBar:          'Thanh tab',
  success:         'Thành công',
  error:           'Lỗi',
};

const IMAGE_TYPES = ['home', 'stats', 'add', 'detail'];

const normalizeMode = (mode?: string) => {
  if (mode === 'dark' || mode === 'darkMode') return 'darkMode';
  return 'lightMode';
};

const modeMeta = (mode?: string) => {
  const normalized = normalizeMode(mode);
  return normalized === 'darkMode'
    ? { className: 'badge-purple', label: '🌙 Dark', value: normalized }
    : { className: 'badge-gray', label: '☀️ Light', value: normalized };
};

const getHomeImage = (themeImages?: any[]) =>
  themeImages?.find(img => img.type === 'home')?.imageUrl;

function ThemeSlot({
  type, existing, themeId, onAdd, onRemove,
}: {
  type: string; existing: any; themeId: string;
  onAdd: (img: any) => void; onRemove: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/admin/upload?folder=backgrounds`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      if (existing) {
        await apiFetch(`/admin/theme-images/${existing.id}`, { method: 'DELETE' });
        onRemove(existing.id);
      }
      const created = await apiFetch('/admin/theme-images', {
        method: 'POST',
        body: JSON.stringify({ themeId, type, imageUrl: url }),
      });
      onAdd(created);
    } catch (e: any) { alert('Upload thất bại: ' + e.message); }
    finally { setUploading(false); }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!existing) return;
    try {
      await apiFetch(`/admin/theme-images/${existing.id}`, { method: 'DELETE' });
      onRemove(existing.id);
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
        {type}
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          position: 'relative',
          borderRadius: 12,
          border: `2px dashed ${dragOver ? 'var(--accent-purple)' : existing ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
          aspectRatio: '16/10',
          overflow: 'hidden',
          cursor: uploading ? 'wait' : 'pointer',
          background: existing ? 'transparent' : dragOver ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.03)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {existing && (
          <>
            <img src={existing.imageUrl} alt={type} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div className="slot-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}>
              <span className="slot-hint" style={{ opacity: 0, color: '#fff', fontSize: 12, fontWeight: 600, transition: 'opacity 0.15s', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 6 }}>🔄 Thay ảnh</span>
            </div>
            <button onClick={handleRemove} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 6, background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: '24px', padding: 0 }}>×</button>
          </>
        )}

        {!existing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 20 }}>☁️</div>
            <div style={{ fontSize: 11 }}>Kéo ảnh vào đây</div>
          </div>
        )}

        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
      </div>
      <style>{`.slot-overlay:hover { background: rgba(0,0,0,0.45) !important; } .slot-overlay:hover .slot-hint { opacity: 1 !important; }`}</style>
    </div>
  );
}

export default function ThemesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [colorEditorMode, setColorEditorMode] = useState<'visual' | 'raw'>('visual');

  const [themeImages, setThemeImages] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/themes').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setForm({ ...EMPTY }); setJsonError('');
    setThemeImages([]); setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, mode: normalizeMode(item.mode), isActive: item.isActive, isPro: item.isPro, colorsJson: JSON.stringify(item.colorsJson, null, 2) });
    setThemeImages(item.themeImages ?? []);
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

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const getParsedColors = (): Record<string, string> => {
    try { return JSON.parse(form.colorsJson) as Record<string, string>; }
    catch { return {}; }
  };

  const updateColor = (key: string, value: string) => {
    try {
      const parsed = JSON.parse(form.colorsJson) as Record<string, string>;
      parsed[key] = value;
      set('colorsJson', JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch { setJsonError('JSON không hợp lệ'); }
  };

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
                const mode = modeMeta(item.mode);
                const homeImageUrl = getHomeImage(item.themeImages);
                return (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className={`badge ${mode.className}`} title={mode.value}>{mode.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {Object.entries(colors).slice(0, 4).map(([k, v]) => (
                          <div key={k} title={`${k}: ${v}`} style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: v as string, border: '1px solid rgba(255,255,255,0.15)' }} />
                        ))}
                      </div>
                    </td>
                    <td><span className={`badge ${item.isActive ? 'badge-green' : 'badge-red'}`}>{item.isActive ? 'Hoạt động' : 'Tắt'}</span></td>
                    <td><span className={`badge ${item.isPro ? 'badge-orange' : 'badge-gray'}`}>{item.isPro ? '⭐ Pro' : 'Free'}</span></td>
                    <td>
                      {homeImageUrl ? (
                        <img
                          src={homeImageUrl}
                          alt={`${item.name} Home`}
                          title="Home"
                          style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Chưa có Home</span>
                      )}
                    </td>
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
                <option value="lightMode">☀️ Light</option>
                <option value="darkMode">🌙 Dark</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Màu sắc
                  {jsonError && <span style={{ color: 'var(--accent-red)', marginLeft: 8, fontWeight: 400, textTransform: 'none' }}>{jsonError}</span>}
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: 11, padding: '3px 10px' }}
                  onClick={() => setColorEditorMode(m => m === 'visual' ? 'raw' : 'visual')}
                >
                  {colorEditorMode === 'visual' ? '{ } JSON' : '🎨 Visual'}
                </button>
              </div>

              {colorEditorMode === 'visual' ? (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--bg-glass)',
                }}>
                  {(() => {
                    const parsed = getParsedColors();
                    const allKeys = Array.from(new Set([
                      ...Object.keys(COLOR_LABELS),
                      ...Object.keys(parsed),
                    ]));
                    return allKeys.map((key, i) => {
                      const hexVal = parsed[key] ?? '#000000';
                      const label = COLOR_LABELS[key] ?? key;
                      return (
                        <div key={key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '9px 14px',
                          borderBottom: i < allKeys.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                          {/* Color picker */}
                          <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                            <div style={{
                              width: 32, height: 32,
                              borderRadius: 8,
                              backgroundColor: hexVal,
                              border: '2px solid rgba(255,255,255,0.15)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(hexVal) ? hexVal : '#000000'}
                              onChange={e => updateColor(key, e.target.value)}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                            />
                          </label>

                          {/* Label */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{key}</div>
                          </div>

                          {/* Hex input */}
                          <input
                            type="text"
                            value={hexVal}
                            onChange={e => updateColor(key, e.target.value)}
                            style={{
                              width: 94,
                              padding: '5px 8px',
                              background: 'var(--bg-glass-strong)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              fontSize: 12,
                              fontFamily: 'monospace',
                              outline: 'none',
                            }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <textarea
                  className="form-textarea"
                  style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 180, borderColor: jsonError ? 'var(--accent-red)' : undefined }}
                  value={form.colorsJson}
                  onChange={e => { set('colorsJson', e.target.value); validateJson(e.target.value); }}
                />
              )}
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
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🖼️ Ảnh giao diện</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {IMAGE_TYPES.map(type => (
                    <ThemeSlot
                      key={type}
                      type={type}
                      themeId={editing.id}
                      existing={themeImages.find(img => img.type === type) ?? null}
                      onAdd={img => setThemeImages(prev => [...prev.filter(x => x.type !== type), img])}
                      onRemove={id => setThemeImages(prev => prev.filter(x => x.id !== id))}
                    />
                  ))}
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
