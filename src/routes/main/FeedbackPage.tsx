import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitFeedback } from '../../lib/feedbackClient';
import { tokenStorage } from '../../lib/tokenStorage';
import { FeedbackForm } from '../../components/FeedbackForm';

function schoolGradeFor(grade: number | null | undefined) {
  return grade === 4 ? '고등학교 1학년' : grade === 5 ? '고등학교 2학년' : grade === 6 ? '고등학교 3학년(N수생 포함)' : '';
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const presetGrade = useMemo(() => schoolGradeFor(user?.grade), [user?.grade]);
  return <FeedbackForm schoolGrade={presetGrade} onBack={() => navigate('/main/home')} onSubmit={async answers => {
    const uid = tokenStorage.getUid();
    if (!uid) throw new Error('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
    await submitFeedback(uid, answers);
  }} />;
}
