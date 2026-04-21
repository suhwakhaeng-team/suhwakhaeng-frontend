import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { havrutaClient } from '../../lib/havrutaClient';
import { tokenStorage } from '../../lib/tokenStorage';
import {
  categoryLabel,
  displayTitle,
  isUserMessage,
  shortDate,
  type HavrutaMessageResponse,
  type HavrutaSessionResponse,
} from '../../types/havruta';

interface LocationState {
  questionId?: number;
}

export default function AIConceptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const questionId = (location.state as LocationState | null)?.questionId ?? null;
  const uid = tokenStorage.getUid();

  const [sessions, setSessions] = useState<HavrutaSessionResponse[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<HavrutaMessageResponse[]>([]);
  const [input, setInput] = useState('');
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<number | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');

  const messageEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.sessionId === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const loadSessions = useCallback(async () => {
    if (!uid) return;
    setIsSessionsLoading(true);
    try {
      const list = await havrutaClient.fetchSessions(uid);
      setSessions(list);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '세션 목록 조회 실패');
    } finally {
      setIsSessionsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isProcessing]);

  const handleNewChat = () => {
    setSelectedSessionId(null);
    setMessages([]);
    setInput('');
    setErrorMessage(null);
  };

  const handleSelectSession = async (sessionId: number) => {
    if (!uid) return;
    if (selectedSessionId === sessionId) return;
    setSelectedSessionId(sessionId);
    setMessages([]);
    setInput('');
    setErrorMessage(null);
    setIsMessagesLoading(true);
    try {
      const list = await havrutaClient.fetchMessages(sessionId, uid);
      setMessages(list);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '메시지 조회 실패');
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSend = async () => {
    const transcript = input.trim();
    if (!uid || !transcript || isProcessing) return;

    const tempId = -Date.now();
    const optimistic: HavrutaMessageResponse = {
      messageId: tempId,
      senderType: 'USER',
      content: transcript,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (selectedSessionId === null) {
        const res = await havrutaClient.startSession({ uid, questionId, transcript });
        setSelectedSessionId(res.session.sessionId);
        setSessions((prev) => [res.session, ...prev.filter((s) => s.sessionId !== res.session.sessionId)]);
        setMessages((prev) => [
          ...prev.filter((m) => m.messageId !== tempId),
          res.exchange.userMessage,
          res.exchange.aiMessage,
        ]);
      } else {
        const res = await havrutaClient.sendMessage(selectedSessionId, {
          uid,
          questionId,
          transcript,
        });
        setMessages((prev) => [
          ...prev.filter((m) => m.messageId !== tempId),
          res.userMessage,
          res.aiMessage,
        ]);
        setSessions((prev) => {
          const target = prev.find((s) => s.sessionId === selectedSessionId);
          if (!target) return prev;
          const updated: HavrutaSessionResponse = {
            ...target,
            updatedAt: res.aiMessage.createdAt ?? target.updatedAt,
          };
          return [updated, ...prev.filter((s) => s.sessionId !== selectedSessionId)];
        });
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      setErrorMessage(e instanceof Error ? e.message : '메시지 전송 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRename = (session: HavrutaSessionResponse) => {
    setRenameTargetId(session.sessionId);
    setRenameText(displayTitle(session));
    setMenuOpenSessionId(null);
  };

  const confirmRename = async () => {
    if (!uid || renameTargetId === null) return;
    const title = renameText.trim();
    if (!title) return;
    try {
      const updated = await havrutaClient.updateSession(renameTargetId, { uid, title });
      setSessions((prev) => prev.map((s) => (s.sessionId === renameTargetId ? updated : s)));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '세션 수정 실패');
    } finally {
      setRenameTargetId(null);
      setRenameText('');
    }
  };

  const handleDelete = async (sessionId: number) => {
    if (!uid) return;
    setMenuOpenSessionId(null);
    if (!window.confirm('이 채팅을 삭제할까요?')) return;
    try {
      await havrutaClient.deleteSession(sessionId, uid);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([]);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '세션 삭제 실패');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: spacing.xl,
        height: 'calc(100vh - 100px)',
      }}
    >
      <SessionListPanel
        isLoading={isSessionsLoading}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        menuOpenSessionId={menuOpenSessionId}
        onBack={() => navigate('/main/home')}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        onToggleMenu={(id) => setMenuOpenSessionId((cur) => (cur === id ? null : id))}
        onRename={openRename}
        onDelete={handleDelete}
      />

      <ChatPanel
        headerTitle={selectedSession ? displayTitle(selectedSession) : 'AI 개념 정리'}
        headerSubtitle={selectedSession ? categoryLabel(selectedSession) : null}
        messages={messages}
        isMessagesLoading={isMessagesLoading}
        isProcessing={isProcessing}
        errorMessage={errorMessage}
        onDismissError={() => setErrorMessage(null)}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        messageEndRef={messageEndRef}
      />

      {renameTargetId !== null && (
        <RenameDialog
          value={renameText}
          onChange={setRenameText}
          onCancel={() => {
            setRenameTargetId(null);
            setRenameText('');
          }}
          onConfirm={confirmRename}
        />
      )}
    </div>
  );
}

interface SessionListPanelProps {
  isLoading: boolean;
  sessions: HavrutaSessionResponse[];
  selectedSessionId: number | null;
  menuOpenSessionId: number | null;
  onBack: () => void;
  onNewChat: () => void;
  onSelect: (sessionId: number) => void;
  onToggleMenu: (sessionId: number) => void;
  onRename: (session: HavrutaSessionResponse) => void;
  onDelete: (sessionId: number) => void;
}

function SessionListPanel(props: SessionListPanelProps) {
  const {
    isLoading,
    sessions,
    selectedSessionId,
    menuOpenSessionId,
    onBack,
    onNewChat,
    onSelect,
    onToggleMenu,
    onRename,
    onDelete,
  } = props;

  return (
    <div
      style={{
        borderRight: `1px solid ${colors.gray200}`,
        paddingRight: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <button
        onClick={onBack}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          ...typography.bodyTextXLSemiBold,
          color: colors.gray700,
          marginBottom: spacing.md,
          textAlign: 'left',
        }}
      >
        ← 뒤로가기
      </button>

      <button
        onClick={onNewChat}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          background: colors.brand600,
          color: colors.white,
          border: 'none',
          borderRadius: radius.sm,
          ...typography.bodyTextXLSemiBold,
          cursor: 'pointer',
          marginBottom: spacing.lg,
        }}
      >
        + 새 채팅
      </button>

      <div style={{ ...typography.headingMdBold, color: colors.gray800, marginBottom: spacing.sm }}>
        최근 채팅
      </div>

      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: spacing.sm, minHeight: 0 }}>
        {isLoading ? (
          <p style={{ ...typography.bodyTextXLRegular, color: colors.gray500 }}>불러오는 중...</p>
        ) : sessions.length === 0 ? (
          <p style={{ ...typography.bodyTextXLRegular, color: colors.gray500 }}>
            아직 저장된 노트가 없어요
          </p>
        ) : (
          sessions.map((s) => (
            <SessionRow
              key={s.sessionId}
              session={s}
              isSelected={s.sessionId === selectedSessionId}
              isMenuOpen={menuOpenSessionId === s.sessionId}
              onSelect={() => onSelect(s.sessionId)}
              onToggleMenu={() => onToggleMenu(s.sessionId)}
              onRename={() => onRename(s)}
              onDelete={() => onDelete(s.sessionId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SessionRowProps {
  session: HavrutaSessionResponse;
  isSelected: boolean;
  isMenuOpen: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function SessionRow(props: SessionRowProps) {
  const { session, isSelected, isMenuOpen, onSelect, onToggleMenu, onRename, onDelete } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      setMenuPos(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      onToggleMenu();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleMenu();
    };
    const handleScroll = () => onToggleMenu();
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isMenuOpen, onToggleMenu]);

  return (
    <div
      style={{
        padding: spacing.md,
        border: `1px solid ${isSelected ? colors.brand600 : colors.gray200}`,
        background: isSelected ? colors.brand50 : colors.white,
        borderRadius: radius.sm,
        cursor: 'pointer',
      }}
      onClick={onSelect}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <span style={{ ...typography.captionSemiBold, color: colors.gray500 }}>
          {categoryLabel(session)}
        </span>
        <span style={{ ...typography.captionSemiBold, color: colors.gray400 }}>
          {shortDate(session)}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <span
          style={{
            ...typography.bodyTextXLSemiBold,
            color: colors.gray800,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {displayTitle(session) || '제목 없음'}
        </span>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: colors.gray500,
            padding: `0 ${spacing.xs}px`,
            fontSize: 18,
          }}
        >
          ⋯
        </button>
      </div>
      {isMenuOpen && menuPos && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPos.top,
            right: menuPos.right,
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.sm,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 1000,
            minWidth: 140,
          }}
        >
          <MenuItem label="이름 변경" color={colors.gray800} onClick={onRename} />
          <MenuItem label="삭제" color={colors.red500} onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: `${spacing.sm}px ${spacing.md}px`,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        ...typography.bodyTextXLRegular,
        color,
      }}
    >
      {label}
    </button>
  );
}

interface ChatPanelProps {
  headerTitle: string;
  headerSubtitle: string | null;
  messages: HavrutaMessageResponse[];
  isMessagesLoading: boolean;
  isProcessing: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
}

function ChatPanel(props: ChatPanelProps) {
  const {
    headerTitle,
    headerSubtitle,
    messages,
    isMessagesLoading,
    isProcessing,
    errorMessage,
    onDismissError,
    input,
    onInputChange,
    onSend,
    messageEndRef,
  } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ marginBottom: spacing.md }}>
        <h3 style={{ ...typography.headingXLBold, color: colors.gray900, margin: 0 }}>{headerTitle}</h3>
        {headerSubtitle && (
          <span style={{ ...typography.captionSemiBold, color: colors.gray500 }}>{headerSubtitle}</span>
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${spacing.sm}px ${spacing.md}px`,
            background: '#FEE2E2',
            border: `1px solid ${colors.red500}`,
            borderRadius: radius.sm,
            marginBottom: spacing.sm,
          }}
        >
          <span style={{ ...typography.bodyTextXLRegular, color: colors.red500 }}>{errorMessage}</span>
          <button
            onClick={onDismissError}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: colors.red500,
              ...typography.bodyTextXLSemiBold,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: spacing.lg,
          background: colors.gray50,
          borderRadius: radius.md,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {isMessagesLoading ? (
          <p style={{ textAlign: 'center', color: colors.gray500, marginTop: spacing.xl }}>
            메시지를 불러오는 중...
          </p>
        ) : messages.length === 0 && !isProcessing ? (
          <p
            style={{
              textAlign: 'center',
              color: colors.gray400,
              marginTop: spacing.x3l,
              ...typography.bodyTextXLRegular,
            }}
          >
            궁금한 개념을 질문해보세요!
          </p>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.messageId} message={m} />
            ))}
            {isProcessing && <ProcessingBubble />}
          </>
        )}
        <div ref={messageEndRef} />
      </div>

      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="질문을 입력하세요..."
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: spacing.md,
            border: `1px solid ${colors.gray300}`,
            borderRadius: radius.sm,
            ...typography.bodyTextXLRegular,
            fontSize: 15,
            outline: 'none',
          }}
        />
        <button
          onClick={onSend}
          disabled={isProcessing || !input.trim()}
          style={{
            padding: `${spacing.md}px ${spacing.xl}px`,
            background: isProcessing || !input.trim() ? colors.gray300 : colors.brand600,
            color: colors.white,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            fontSize: 15,
            cursor: isProcessing || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: HavrutaMessageResponse }) {
  const isUser = isUserMessage(message);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: spacing.md,
      }}
    >
      <div
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          borderRadius: radius.md,
          maxWidth: '75%',
          background: isUser ? colors.brand600 : colors.gray100,
          color: isUser ? colors.white : colors.gray900,
          ...typography.bodyTextXLRegular,
          fontSize: 15,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function ProcessingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: spacing.md }}>
      <div
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          borderRadius: radius.md,
          background: colors.gray100,
          color: colors.gray500,
          ...typography.bodyTextXLRegular,
          fontSize: 15,
          fontStyle: 'italic',
        }}
      >
        AI가 분석 중입니다...
      </div>
    </div>
  );
}

interface RenameDialogProps {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function RenameDialog({ value, onChange, onCancel, onConfirm }: RenameDialogProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.white,
          padding: spacing.xl,
          borderRadius: radius.md,
          minWidth: 320,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <h4 style={{ ...typography.headingMdBold, color: colors.gray900, margin: 0, marginBottom: spacing.md }}>
          이름 변경
        </h4>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          autoFocus
          style={{
            width: '100%',
            padding: spacing.sm,
            border: `1px solid ${colors.gray300}`,
            borderRadius: radius.sm,
            ...typography.bodyTextXLRegular,
            outline: 'none',
            marginBottom: spacing.lg,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.sm }}>
          <button
            onClick={onCancel}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              background: colors.gray100,
              color: colors.gray700,
              border: 'none',
              borderRadius: radius.sm,
              ...typography.bodyTextXLSemiBold,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!value.trim()}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              background: value.trim() ? colors.brand600 : colors.gray300,
              color: colors.white,
              border: 'none',
              borderRadius: radius.sm,
              ...typography.bodyTextXLSemiBold,
              cursor: value.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
