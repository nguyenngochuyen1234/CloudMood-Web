import { useState, useEffect } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import EmotionsPage from './pages/EmotionsPage';
import EmojiTypesPage from './pages/EmojiTypesPage';
import EmojisPage from './pages/EmojisPage';
import ThemesPage from './pages/ThemesPage';
import EventsPage from './pages/EventsPage';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard:    { title: '📊 Dashboard',              subtitle: 'Tổng quan hệ thống DailyMood' },
  users:        { title: '👥 Quản lý người dùng',    subtitle: 'Xem danh sách và phân quyền tài khoản' },
  emotions:     { title: '😊 Quản lý cảm xúc',       subtitle: 'Thêm, sửa, xóa các cảm xúc trong hệ thống' },
  'emoji-types':{ title: '🎨 Quản lý loại Emoji',    subtitle: 'Phân loại và quản lý các nhóm emoji' },
  emojis:       { title: '🖼️ Quản lý Emoji',          subtitle: 'Quản lý kho emoji và liên kết cảm xúc' },
  themes:       { title: '🎭 Quản lý giao diện',      subtitle: 'Tùy chỉnh màu sắc và giao diện ứng dụng' },
  events:       { title: '📅 Quản lý sự kiện',        subtitle: 'Tạo và quản lý các sự kiện đặc biệt' },
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || 'null'); } catch { return null; }
  });
  const [page, setPage] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
  }, [user]);

  const handleLogin = (t: string, u: any) => {
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    if (showRegister) {
      return <RegisterAdminPage onBack={() => setShowRegister(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
  }

  const meta = PAGE_META[page] || { title: 'Admin', subtitle: '' };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <DashboardPage />;
      case 'users':        return <UsersPage />;
      case 'emotions':     return <EmotionsPage />;
      case 'emoji-types':  return <EmojiTypesPage />;
      case 'emojis':       return <EmojisPage />;
      case 'themes':       return <ThemesPage />;
      case 'events':       return <EventsPage />;
      default:             return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} user={user} onLogout={handleLogout} />

      <div className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>
          <div className="header-actions">
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}>
              🟢 Backend: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>localhost:3001</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
