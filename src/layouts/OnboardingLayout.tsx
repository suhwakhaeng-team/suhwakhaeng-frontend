import { Outlet, useLocation } from 'react-router-dom';

const stepNames: Record<string, string> = {
  login: '로그인',
  grade: '학년 선택',
  subject: '과목 선택',
  unit: '단원 선택',
  nickname: '닉네임 입력',
  'test-intro': '테스트 안내',
  'level-test': '레벨 테스트',
  result: '진단 리포트',
};

export default function OnboardingLayout() {
  const location = useLocation();
  const currentStep = location.pathname.split('/').pop() || '';
  const isResultPage = currentStep === 'result';

  return (
    <div className="onboarding-shell">
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        온보딩 &gt; {stepNames[currentStep] || currentStep}
      </div>
      <div className="onboarding-content" style={{ maxWidth: isResultPage ? 960 : 480 }}>
        <Outlet />
      </div>
    </div>
  );
}
