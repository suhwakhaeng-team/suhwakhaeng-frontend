import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function LiveNotice() {
  const { isAuthenticated, logout } = useAuth();
  if (!(import.meta.env.DEV && import.meta.env.VITE_LIVE_READONLY === 'true')) return null;
  return <aside style={{ padding: 10, background: '#fff3cd', textAlign: 'center' }}>
    운영 API 연결 · 웹 수정은 로컬에만 반영 · 답 제출/수정 차단 (로그인 기록은 운영 DB에 저장될 수 있음)
    {isAuthenticated && <button onClick={() => void logout()} style={{ marginLeft: 12 }}>로그아웃</button>}
  </aside>;
}

function App() {
  return (
    <AuthProvider>
      <LiveNotice />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
