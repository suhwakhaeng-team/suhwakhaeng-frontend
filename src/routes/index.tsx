import { createBrowserRouter, Navigate } from 'react-router-dom';
import OnboardingLayout from '../layouts/OnboardingLayout';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from '../components/PrivateRoute';
import SplashPage from './SplashPage';
import LoginPage from './onboarding/LoginPage';
import GradeSelectionPage from './onboarding/GradeSelectionPage';
import SubjectSelectionPage from './onboarding/SubjectSelectionPage';
import UnitSelectionPage from './onboarding/UnitSelectionPage';
import NicknameInputPage from './onboarding/NicknameInputPage';
import TestIntroPage from './onboarding/TestIntroPage';
import LevelTestPage from './onboarding/LevelTestPage';
import CurriculumResultPage from './onboarding/CurriculumResultPage';
import HomePage from './main/HomePage';
import ProblemSolvingPage from './main/ProblemSolvingPage';
import ProblemResultPage from './main/ProblemResultPage';
import MyPagePage from './main/MyPagePage';
import AIConceptPage from './main/AIConceptPage';
import ReviewListPage from './main/ReviewListPage';
import ReviewDetailPage from './main/ReviewDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SplashPage />,
  },
  {
    path: '/onboarding',
    element: (
      <OnboardingProvider>
        <OnboardingLayout />
      </OnboardingProvider>
    ),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'grade', element: <GradeSelectionPage /> },
      { path: 'subject', element: <SubjectSelectionPage /> },
      { path: 'unit', element: <UnitSelectionPage /> },
      { path: 'nickname', element: <NicknameInputPage /> },
      { path: 'test-intro', element: <TestIntroPage /> },
      { path: 'level-test', element: <LevelTestPage /> },
      { path: 'result', element: <CurriculumResultPage /> },
    ],
  },
  {
    path: '/main',
    element: <PrivateRoute><MainLayout /></PrivateRoute>,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'problem/:id', element: <ProblemSolvingPage /> },
      { path: 'problem-result', element: <ProblemResultPage /> },
      { path: 'mypage', element: <MyPagePage /> },
      { path: 'ai-concept', element: <AIConceptPage /> },
      { path: 'review', element: <ReviewListPage /> },
      { path: 'review/:tagId', element: <ReviewDetailPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
