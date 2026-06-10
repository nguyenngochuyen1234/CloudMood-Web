import { useState } from 'react';
import { apiFetch } from '../api';

interface Props {
  onBack: () => void;
}

export default function RegisterAdminPage({ onBack }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      setSuccess(`✅ Tạo tài khoản admin thành công! Email: ${data.email}`);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="login-logo">
          <div className="login-logo-icon">🛡️</div>
          <div className="login-logo-text">
            <h1>DailyMood</h1>
            <span>Tạo tài khoản Admin</span>
          </div>
        </div>

        {/* Warning banner */}
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.4)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 13,
          color: '#ffc107',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ⚠️ <span>Trang tạm thời — chỉ dùng để khởi tạo tài khoản admin đầu tiên</span>
        </div>

        <h2 style={{ marginBottom: 4 }}>Đăng ký Admin</h2>
        <p>Tài khoản sẽ được tạo với quyền <strong style={{ color: 'var(--accent-purple)' }}>ADMIN</strong></p>

        {error && <div className="login-error">{error}</div>}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: '#22c55e',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Tên hiển thị</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="admin@dailymood.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Mật khẩu</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm-password">Xác nhận mật khẩu</label>
            <input
              id="reg-confirm-password"
              type="password"
              className="form-input"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="register-admin-submit-btn"
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? '⏳ Đang tạo tài khoản...' : '🛡️ Tạo tài khoản Admin'}
          </button>
        </form>

        {/* Back to login */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              textDecoration: 'underline',
            }}
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
