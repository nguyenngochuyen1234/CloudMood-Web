import { useRef, useState } from 'react';
import { API_BASE } from '../api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Thư mục lưu trên server, mặc định 'emojis' */
  folder?: string;
}

export default function ImageUploadInput({ value, onChange, folder = 'emojis' }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/admin/upload?folder=${folder}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onChange(data.url);
    } catch (e: any) {
      alert('Upload thất bại: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const hasImage = !!value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Vùng kéo thả / preview */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          position: 'relative',
          border: `2px dashed ${dragOver ? 'var(--primary)' : hasImage ? 'transparent' : 'var(--border)'}`,
          borderRadius: 10,
          minHeight: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          background: dragOver
            ? 'rgba(99,102,241,0.06)'
            : hasImage
            ? 'var(--bg-glass)'
            : 'var(--bg-glass)',
          overflow: 'hidden',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, zIndex: 2,
          }}>
            <div className="spinner" />
          </div>
        )}

        {hasImage ? (
          <>
            <img
              src={value}
              alt="preview"
              style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Overlay khi hover */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s', color: '#fff', fontSize: 13, fontWeight: 600, gap: 6,
            }}
              className="img-hover-overlay"
            >
              <span style={{ opacity: 0 }} className="img-hover-label">🔄 Thay ảnh</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13 }}>Kéo ảnh vào đây</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              hoặc <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>chọn từ thiết bị</span>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
      </div>

      {/* Input URL thủ công */}
      <input
        className="form-input"
        placeholder="hoặc dán URL ảnh vào đây..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ fontSize: 12 }}
      />

      <style>{`
        div:hover > .img-hover-overlay { background: rgba(0,0,0,0.45) !important; }
        div:hover > .img-hover-overlay .img-hover-label { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
