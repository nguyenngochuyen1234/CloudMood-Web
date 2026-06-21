import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

type Platform = 'ios' | 'android';

interface AppVersionItem {
  platform: Platform;
  latest_version: string;
  min_supported_version: string;
  store_url: string;
  is_active: boolean;
}

const DEFAULT_ROWS: AppVersionItem[] = [
  {
    platform: 'ios',
    latest_version: '',
    min_supported_version: '',
    store_url: '',
    is_active: true,
  },
  {
    platform: 'android',
    latest_version: '',
    min_supported_version: '',
    store_url: '',
    is_active: true,
  },
];

function buildRows(items: unknown): AppVersionItem[] {
  const list = Array.isArray(items) ? items : [];

  return DEFAULT_ROWS.map((fallback) => {
    const match = list.find((item: any) => item?.platform === fallback.platform);

    return {
      platform: fallback.platform,
      latest_version: typeof match?.latest_version === 'string' ? match.latest_version : fallback.latest_version,
      min_supported_version:
        typeof match?.min_supported_version === 'string'
          ? match.min_supported_version
          : fallback.min_supported_version,
      store_url: typeof match?.store_url === 'string' ? match.store_url : fallback.store_url,
      is_active: typeof match?.is_active === 'boolean' ? match.is_active : fallback.is_active,
    };
  });
}

export default function AppVersionsPage() {
  const [rows, setRows] = useState<AppVersionItem[]>(DEFAULT_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/admin/app-versions');
      setRows(buildRows(data));
    } catch (e: any) {
      setError(e.message || 'Khong the tai cau hinh app versions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = <K extends keyof AppVersionItem>(
    platform: Platform,
    key: K,
    value: AppVersionItem[K],
  ) => {
    setRows((current) =>
      current.map((item) => (item.platform === platform ? { ...item, [key]: value } : item)),
    );
    setSuccess('');
  };

  const resetRow = (platform: Platform) => {
    const fallback = DEFAULT_ROWS.find((item) => item.platform === platform);
    if (!fallback) return;

    setRows((current) =>
      current.map((item) => (item.platform === platform ? { ...fallback } : item)),
    );
    setSuccess('');
  };

  const saveAll = async () => {
    const invalid = rows.find(
      (item) => !item.latest_version.trim() || !item.min_supported_version.trim(),
    );

    if (invalid) {
      alert(`Vui long nhap day du version cho ${invalid.platform}.`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = rows.map((item) => ({
        ...item,
        latest_version: item.latest_version.trim(),
        min_supported_version: item.min_supported_version.trim(),
        store_url: item.store_url.trim(),
      }));

      const data = await apiFetch('/admin/app-versions', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setRows(buildRows(data.length ? data : payload));
      setSuccess('Da luu cau hinh app versions thanh cong.');
    } catch (e: any) {
      setError(e.message || 'Khong the luu cau hinh app versions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div
        className="table-card"
        style={{
          padding: 18,
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(20,184,166,0.08) 100%)',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h3 style={{ fontSize: 16 }}>Mobile version update config</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Trang nay quan ly dong thoi 2 platform `ios` va `android`. Nut Save All se gui
            `PUT /admin/app-versions` theo dung response item `snake_case`.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Public app/mobile se doc du lieu active tu `GET /app-versions`.
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>📱 App Versions</h3>
            <p>Chinh sua version hien tai, min supported version va store url cho tung platform</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={load} disabled={loading || saving}>
              Reload
            </button>
            <button className="btn btn-primary" onClick={saveAll} disabled={loading || saving}>
              {saving ? 'Dang luu...' : 'Save All'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              margin: '18px 22px 0',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.24)',
              color: 'var(--accent-red)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              margin: '18px 22px 0',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.24)',
              color: 'var(--accent-green)',
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Dang tai app versions...</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Latest Version</th>
                <th>Min Supported</th>
                <th>Store URL</th>
                <th>Active</th>
                <th>Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.platform}>
                  <td>
                    <strong style={{ textTransform: 'uppercase' }}>{item.platform}</strong>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={item.latest_version}
                      onChange={(e) =>
                        updateRow(item.platform, 'latest_version', e.target.value)
                      }
                      placeholder="1.0.0"
                    />
                  </td>
                  <td>
                    <input
                      className="form-input"
                      value={item.min_supported_version}
                      onChange={(e) =>
                        updateRow(item.platform, 'min_supported_version', e.target.value)
                      }
                      placeholder="1.0.0"
                    />
                  </td>
                  <td style={{ minWidth: 280 }}>
                    <input
                      className="form-input"
                      value={item.store_url}
                      onChange={(e) => updateRow(item.platform, 'store_url', e.target.value)}
                      placeholder={
                        item.platform === 'android'
                          ? 'https://play.google.com/store/apps/details?id=...'
                          : 'https://apps.apple.com/...'
                      }
                    />
                  </td>
                  <td>
                    <label
                      className="form-check"
                      style={{ justifyContent: 'center', minHeight: 40 }}
                    >
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) => updateRow(item.platform, 'is_active', e.target.checked)}
                      />
                    </label>
                  </td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => resetRow(item.platform)}
                      disabled={saving}
                    >
                      Reset row
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
