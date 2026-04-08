import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/main/home', label: '홈' },
    { path: '/main/ai-concept', label: 'AI 개념정리' },
    { path: '/main/mypage', label: '마이페이지' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', gap: '16px', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
        <strong style={{ marginRight: 'auto' }}>수확행</strong>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: location.pathname === item.path ? 'bold' : 'normal',
              color: location.pathname === item.path ? '#2563EB' : '#666',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
}
