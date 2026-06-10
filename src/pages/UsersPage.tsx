import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch('/admin/users')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user: any) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Đổi quyền của ${user.email} thành ${newRole}?`)) return;
    setUpdatingId(user.id);
    try {
      await apiFetch(`/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      load();
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <h3>👥 Người dùng</h3>
          <p>{users.length} tài khoản trong hệ thống</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Đang tải...</span></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">👤</span><span>Chưa có người dùng nào</span></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Quyền</th>
              <th>Nhật ký</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name || '—'}</strong></td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className="badge badge-green">{u._count?.moodEntries ?? 0} mục</span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.role === 'ADMIN' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => toggleRole(u)}
                    disabled={updatingId === u.id}
                  >
                    {updatingId === u.id ? '⏳' : u.role === 'ADMIN' ? '⬇️ Hạ quyền' : '⬆️ Cấp Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
