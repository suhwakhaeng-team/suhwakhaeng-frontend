import DiagnosticBnConnectionMap from '../../components/diagnostic/DiagnosticBnConnectionMap';
import { DIAGNOSTIC_REPORT_PREVIEWS } from '../../lib/diagnosticReport';

export default function DiagnosticTagWebPreviewPage() {
  const answers = DIAGNOSTIC_REPORT_PREVIEWS.mixed.diagnosticAnswers ?? [];
  return <main style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 18px' }}>
    <p style={{ color: '#64748b', fontSize: 13 }}>로컬 시안 · BN과 AN 문제 데이터는 화면 확인용 예시입니다. <a href="/dev/q-map" style={{ color: '#2563eb', fontWeight: 700, marginLeft: 8 }}>문제 중심 Q-Map 시안 보기 →</a></p>
    <DiagnosticBnConnectionMap answers={answers} demo />
  </main>;
}
