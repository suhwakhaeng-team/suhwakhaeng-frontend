export default function UT1ConnectionNotice({ message, deleted, onRetry, onStartNew }: {
  message: string; deleted: boolean; onRetry: () => void; onStartNew: () => void;
}) {
  if (!message) return null;
  return <div className="ut-error ut-connection-notice" role="alert">
    <p>{message}</p>
    <div className="ut-connection-actions">
      {deleted && <button type="button" className="ut-new-session-button" onClick={onStartNew}>새 참가자로 시작</button>}
      <button type="button" className="ut-reconnect-button" onClick={onRetry}>다시 연결</button>
    </div>
  </div>;
}
