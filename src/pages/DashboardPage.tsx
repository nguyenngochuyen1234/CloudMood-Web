import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface Stats {
  totalUsers: number;
  totalMoodEntries: number;
  totalEmotions: number;
  totalThemes: number;
  totalEvents: number;
}

const STAT_CONFIG = [
  { key: 'totalUsers', icon: '👥', label: 'Người dùng', color: '#8b5cf6' },
  { key: 'totalMoodEntries', icon: '📝', label: 'Nhật ký tâm trạng', color: '#6366f1' },
  { key: 'totalEmotions', icon: '😊', label: 'Cảm xúc', color: '#14b8a6' },
  { key: 'totalThemes', icon: '🎭', label: 'Giao diện', color: '#ec4899' },
  { key: 'totalEvents', icon: '📅', label: 'Sự kiện', color: '#f97316' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admin/dashboard')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        {STAT_CONFIG.map(({ key, icon, label, color }) => (
          <div className="stat-card" key={key}>
            <div
              className="stat-icon"
              style={{ background: `${color}22`, border: `1px solid ${color}33` }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
            </div>
            <div className="stat-info">
              <p>{label}</p>
              <h3 style={{ color }}>{stats?.[key as keyof Stats] ?? 0}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Chào mừng đến Admin Panel 👋</h3>
            <p>Sử dụng menu bên trái để quản lý hệ thống DailyMood</p>
          </div>
        </div>
        <div style={{ padding: '28px 22px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 2 }}>
          <p>🎯 Quản lý <strong style={{ color: 'var(--text-primary)' }}>cảm xúc</strong> và <strong style={{ color: 'var(--text-primary)' }}>emoji</strong> của người dùng</p>
          <p>🎨 Tùy chỉnh <strong style={{ color: 'var(--text-primary)' }}>giao diện</strong> (themes) và màu sắc</p>
          <p>📅 Tạo và quản lý <strong style={{ color: 'var(--text-primary)' }}>sự kiện</strong> đặc biệt</p>
          <p>👥 Xem danh sách <strong style={{ color: 'var(--text-primary)' }}>người dùng</strong> và phân quyền</p>
        </div>
      </div>
    </div>
  );
}
