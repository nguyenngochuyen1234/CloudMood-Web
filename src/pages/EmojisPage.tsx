import { useEffect, useRef, useState } from 'react';
import { API_BASE, apiFetch } from '../api';
import ImageUploadInput from '../components/ImageUploadInput';

const EMPTY = { id: '', imageUrl: '', typeId: '', emotionId: '' };

interface EmotionSlot {
  emotionId: string;
  emotionName: string;
  file: File | null;
  previewUrl: string;
  dragOver: boolean;
  uploading: boolean;
  uploaded: boolean;
  error: string;
}

export default function EmojisPage() {
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [emojiTypes, setEmojiTypes] = useState<any[]>([]);
  const [emotions, setEmotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('all');

  // modal đơn
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  // modal hàng loạt (grid)
  const [showBulk, setShowBulk] = useState(false);
  const [slots, setSlots] = useState<EmotionSlot[]>([]);
  const [bulkTypeId, setBulkTypeId] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const activeSlotId = useRef('');
  const slotFileRef = useRef<HTMLInputElement>(null);
  const loadSeq = useRef(0);

  const findDuplicate = (typeId: string, emotionId: string, excludeId?: string) =>
    allItems.find(item =>
      String(item.typeId) === String(typeId)
      && String(item.emotionId) === String(emotionId)
      && String(item.id) !== String(excludeId)
    );

  const loadMeta = () => {
    Promise.all([
      apiFetch('/admin/emoji-types'),
      apiFetch('/admin/emotions'),
    ])
      .then(([types, emos]) => {
        setEmojiTypes(types);
        setEmotions(emos);
      })
      .catch(console.error);
  };

  const load = async (typeId = selectedTypeId) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const path = typeId === 'all'
        ? '/admin/emojis'
        : `/admin/emojis?typeId=${encodeURIComponent(typeId)}`;
      const [visibleItems, everyItem] = await Promise.all([
        apiFetch(path),
        typeId === 'all' ? Promise.resolve(null) : apiFetch('/admin/emojis'),
      ]);
      if (seq !== loadSeq.current) return;
      setItems(visibleItems);
      setAllItems(everyItem ?? visibleItems);
    } catch (error) {
      if (seq !== loadSeq.current) return;
      console.error(error);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  };

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { load(selectedTypeId); }, [selectedTypeId]);

  const nextId = () => {
    const max = allItems.reduce((m, i) => Math.max(m, Number(i.id)), 0);
    return max + 1;
  };

  const filtered = items;

  // ── Modal đơn ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, typeId: selectedTypeId === 'all' ? '' : selectedTypeId });
    setShowModal(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ id: String(item.id), imageUrl: item.imageUrl, typeId: String(item.typeId), emotionId: String(item.emotionId) });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const duplicate = findDuplicate(form.typeId, form.emotionId, String(editing.id));
        if (duplicate && !confirm('Emoji này sẽ ghi đè emoji đang tồn tại cho cặp loại emoji và cảm xúc đã chọn. Tiếp tục?')) {
          return;
        }
        await apiFetch(`/admin/emojis/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ imageUrl: form.imageUrl, typeId: Number(form.typeId), emotionId: Number(form.emotionId) }),
        });
      } else {
        await apiFetch('/admin/emojis', {
          method: 'POST',
          body: JSON.stringify({ id: Number(form.id), imageUrl: form.imageUrl, typeId: Number(form.typeId), emotionId: Number(form.emotionId) }),
        });
      }
      setShowModal(false);
      await load();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Xóa emoji này?')) return;
    try { await apiFetch(`/admin/emojis/${id}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // ── Modal hàng loạt (grid) ─────────────────────────────────────────────────
  const openBulk = () => {
    setSlots(emotions.map(em => ({
      emotionId: String(em.id),
      emotionName: em.nameVi,
      file: null,
      previewUrl: '',
      dragOver: false,
      uploading: false,
      uploaded: false,
      error: '',
    })));
    setBulkTypeId(selectedTypeId === 'all' ? '' : selectedTypeId);
    setShowBulk(true);
  };

  const updateSlot = (emotionId: string, patch: Partial<EmotionSlot>) =>
    setSlots(prev => prev.map(s => s.emotionId === emotionId ? { ...s, ...patch } : s));

  const assignFile = (emotionId: string, file: File) => {
    if (!file.type.startsWith('image/')) return;
    updateSlot(emotionId, { file, previewUrl: URL.createObjectURL(file), uploaded: false, error: '' });
  };

  const onSlotDrop = (emotionId: string, e: React.DragEvent) => {
    e.preventDefault();
    updateSlot(emotionId, { dragOver: false });
    const file = e.dataTransfer.files[0];
    if (file) assignFile(emotionId, file);
  };

  const openSlotPicker = (emotionId: string) => {
    activeSlotId.current = emotionId;
    slotFileRef.current?.click();
  };

  const onSlotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSlotId.current) assignFile(activeSlotId.current, file);
    e.target.value = '';
  };

  const saveBulk = async () => {
    if (!bulkTypeId) { alert('Vui lòng chọn Loại emoji'); return; }
    const filled = slots.filter(s => s.file);
    if (!filled.length) { alert('Chưa có ảnh nào được kéo vào'); return; }

    setBulkSaving(true);
    let idCounter = nextId();
    const results: { id: number; imageUrl: string; typeId: number; emotionId: number }[] = [];

    for (const slot of filled) {
      updateSlot(slot.emotionId, { uploading: true, error: '' });
      try {
        const fd = new FormData();
        fd.append('file', slot.file!);
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/admin/upload?folder=emojis`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        results.push({ id: idCounter++, imageUrl: data.url, typeId: Number(bulkTypeId), emotionId: Number(slot.emotionId) });
        updateSlot(slot.emotionId, { uploading: false, uploaded: true });
      } catch (e: any) {
        updateSlot(slot.emotionId, { uploading: false, error: e.message });
      }
    }

    const failed = slots.filter(s => s.error);
    if (failed.length) {
      alert(`${failed.length} ảnh upload thất bại`);
      setBulkSaving(false);
      return;
    }

    try {
      const updates = results.filter(item => findDuplicate(String(item.typeId), String(item.emotionId)));
      const creates = results.filter(item => !findDuplicate(String(item.typeId), String(item.emotionId)));

      for (const item of updates) {
        const existing = findDuplicate(String(item.typeId), String(item.emotionId));
        if (!existing) continue;
        await apiFetch(`/admin/emojis/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ imageUrl: item.imageUrl, typeId: item.typeId, emotionId: item.emotionId }),
        });
      }

      if (creates.length) {
        await apiFetch('/admin/emojis/bulk', {
          method: 'POST',
          body: JSON.stringify({ emojis: creates }),
        });
      }
      setShowBulk(false);
      await load();
    } catch (e: any) {
      alert('Lỗi lưu: ' + e.message);
    } finally {
      setBulkSaving(false);
    }
  };

  const selectedTypeName = selectedTypeId === 'all'
    ? 'Tất cả'
    : emojiTypes.find(t => String(t.id) === selectedTypeId)?.nameVi || selectedTypeId;

  const filledCount = slots.filter(s => s.file).length;

  return (
    <>
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>🖼️ Emoji</h3>
            <p>{filtered.length} emoji{selectedTypeId !== 'all' ? ` trong bộ "${selectedTypeName}"` : ' trong hệ thống'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={openBulk}>📦 Thêm hàng loạt</button>
            <button className="btn btn-primary" onClick={openCreate}>＋ Thêm mới</button>
          </div>
        </div>

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 0 16px 0', borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'all', nameVi: 'Tất cả', count: allItems.length }, ...emojiTypes.map(t => ({ ...t, count: allItems.filter(i => String(i.typeId) === String(t.id)).length }))].map(t => {
            const active = selectedTypeId === String(t.id);
            return (
              <button key={t.id} onClick={() => setSelectedTypeId(String(t.id))} style={{
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
              }}>
                {t.nameVi} ({t.count})
              </button>
            );
          })}
        </div>

        {/* Lưới emoji */}
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">🖼️</span><span>Chưa có emoji nào</span></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12, paddingTop: 16 }}>
            {filtered.map(item => (
              <div key={item.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 12, border: '1.5px solid var(--border)',
                background: 'var(--bg-glass)', cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <img src={item.imageUrl} alt={item.emotion?.nameVi} style={{ width: 56, height: 56, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                  {item.emotion?.nameVi || String(item.emotionId)}
                </span>
                <div className="emoji-actions" style={{
                  position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s',
                }}>
                  <button title="Sửa" onClick={e => { e.stopPropagation(); openEdit(item); }}
                    style={{ background: 'var(--primary)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 5px', fontSize: 11 }}>✏️</button>
                  <button title="Xóa" onClick={e => { e.stopPropagation(); remove(item.id); }}
                    style={{ background: '#ef4444', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 5px', fontSize: 11 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        div:hover > .emoji-actions { opacity: 1 !important; }
        .slot-cell:hover { border-color: var(--primary) !important; }
      `}</style>

      {/* ── Modal đơn ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? '✏️ Sửa Emoji' : '➕ Thêm Emoji mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">ID (số nguyên duy nhất)</label>
                <input className="form-input" type="number" value={form.id} onChange={e => setF('id', e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Hình ảnh *</label>
              <ImageUploadInput value={form.imageUrl} onChange={v => setF('imageUrl', v)} folder="emojis" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Loại Emoji</label>
                <select className="form-input" value={form.typeId} onChange={e => setF('typeId', e.target.value)}>
                  <option value="">-- Chọn loại --</option>
                  {emojiTypes.map(t => <option key={t.id} value={String(t.id)}>{t.nameVi}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cảm xúc</label>
                <select className="form-input" value={form.emotionId} onChange={e => setF('emotionId', e.target.value)}>
                  <option value="">-- Chọn cảm xúc --</option>
                  {emotions.map(em => <option key={em.id} value={String(em.id)}>{em.nameVi}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳ Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal hàng loạt (grid) ── */}
      {showBulk && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBulk(false); }}>
          <div className="modal" style={{ maxWidth: 740, width: '95vw' }}>
            <div className="modal-header">
              <h3>📦 Thêm hàng loạt theo cảm xúc</h3>
              <button className="modal-close" onClick={() => setShowBulk(false)}>✕</button>
            </div>

            {/* Chọn loại emoji */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Loại emoji *
              </label>
              <select className="form-input" value={bulkTypeId} onChange={e => setBulkTypeId(e.target.value)}
                style={{ flex: 1, maxWidth: 300 }}>
                <option value="">-- Chọn loại emoji --</option>
                {emojiTypes.map(t => <option key={t.id} value={String(t.id)}>{t.nameVi}</option>)}
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {filledCount}/{slots.length} ảnh
              </span>
            </div>

            {/* Lưới cảm xúc — cuộn riêng */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: 16, paddingRight: 2 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 10,
              }}>
                {slots.map(slot => (
                  <div
                    key={slot.emotionId}
                    className="slot-cell"
                    onDragOver={e => { e.preventDefault(); updateSlot(slot.emotionId, { dragOver: true }); }}
                    onDragLeave={() => updateSlot(slot.emotionId, { dragOver: false })}
                    onDrop={e => onSlotDrop(slot.emotionId, e)}
                    onClick={() => !bulkSaving && openSlotPicker(slot.emotionId)}
                    style={{
                      position: 'relative',
                      borderRadius: 12,
                      border: `2px ${slot.dragOver ? 'solid var(--primary)' : slot.previewUrl ? 'solid var(--border)' : 'dashed var(--border)'}`,
                      background: slot.dragOver
                        ? 'rgba(99,102,241,0.1)'
                        : slot.uploaded
                        ? 'rgba(34,197,94,0.07)'
                        : 'var(--bg-glass)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: bulkSaving ? 'not-allowed' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                      padding: '12px 8px 8px',
                      minHeight: 130,
                      userSelect: 'none',
                    }}
                  >
                    {/* Spinner */}
                    {slot.uploading && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                      }}>
                        <div className="spinner" />
                      </div>
                    )}

                    {slot.previewUrl ? (
                      <>
                        <img
                          src={slot.previewUrl}
                          alt={slot.emotionName}
                          style={{ width: 70, height: 70, objectFit: 'contain' }}
                        />
                        {slot.uploaded && (
                          <div style={{
                            position: 'absolute', top: 5, right: 5,
                            background: '#22c55e', borderRadius: '50%',
                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, color: '#fff',
                          }}>✓</div>
                        )}
                        {!slot.uploading && (
                          <button
                            onClick={e => { e.stopPropagation(); updateSlot(slot.emotionId, { file: null, previewUrl: '', uploaded: false, error: '' }); }}
                            style={{
                              position: 'absolute', top: 4, left: 4,
                              background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 4,
                              color: '#fff', cursor: 'pointer', fontSize: 14, padding: '0 5px', lineHeight: '18px',
                            }}
                          >×</button>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6, opacity: 0.4 }}>+</div>
                        <div style={{ fontSize: 11 }}>Kéo ảnh vào</div>
                      </div>
                    )}

                    <div style={{
                      marginTop: 8, fontSize: 12, fontWeight: 600, textAlign: 'center',
                      color: slot.error ? '#ef4444' : 'var(--text-secondary)',
                      lineHeight: 1.3,
                    }}>
                      {slot.error ? '⚠ Lỗi' : slot.emotionName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <input ref={slotFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onSlotFileChange} />

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBulk(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveBulk}
                disabled={bulkSaving || filledCount === 0 || !bulkTypeId}>
                {bulkSaving ? '⏳ Đang lưu...' : `💾 Lưu ${filledCount} emoji`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
