interface NavItem {
  id: string;
  icon: string;
  label: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'Tổng quan' },
  { id: 'users', icon: '👥', label: 'Người dùng', section: 'Quản lý' },
  { id: 'emotions', icon: '😊', label: 'Cảm xúc' },
  { id: 'emoji-types', icon: '🎨', label: 'Loại Emoji' },
  { id: 'emojis', icon: '🖼️', label: 'Emoji' },
  { id: 'themes', icon: '🎭', label: 'Giao diện' },
  { id: 'events', icon: '📅', label: 'Sự kiện' },
  { id: 'app-versions', icon: '📱', label: 'App Versions' },
];

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activePage, onNavigate, user, onLogout }: Props) {
  let lastSection = '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">😊</div>
        <div className="sidebar-logo-text">
          <h1>DailyMood</h1>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <div key={item.id}>
              {showSection && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <button
                id={`nav-${item.id}`}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Admin'}
            </p>
            <span>{user?.role || 'ADMIN'}</span>
          </div>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="btn btn-sm"
            title="Đăng xuất"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
