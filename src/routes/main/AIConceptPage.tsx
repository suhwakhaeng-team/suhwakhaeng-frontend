import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AIConceptPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    // TODO: AI API 연동
    setMessages((prev) => [...prev, { role: 'ai', text: '(AI 응답 준비 중 - API 연동 필요)' }]);
    setInput('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: 'calc(100vh - 100px)' }}>
      {/* 왼쪽: 노트 목록 */}
      <div style={{ borderRight: '1px solid #eee', paddingRight: '24px' }}>
        <button onClick={() => navigate('/main/home')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '16px' }}>
          ← 뒤로가기
        </button>
        <h3>저장된 노트</h3>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['경우의 수 > 순열 (04/08)', '확률 > 조건부확률 (04/07)'].map((note, i) => (
            <div key={i} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              {note}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽: AI 채팅 */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>AI 개념 정리</h3>

        {/* 메시지 영역 */}
        <div style={{ flex: 1, marginTop: '12px', padding: '16px', background: '#f9f9f9', borderRadius: '12px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>
              궁금한 개념을 질문해보세요!
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  maxWidth: '70%',
                  background: msg.role === 'user' ? '#2563EB' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'ai' ? '1px solid #eee' : 'none',
                }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 입력 영역 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="질문을 입력하세요..."
            style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
          <button
            onClick={handleSend}
            style={{ padding: '12px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
