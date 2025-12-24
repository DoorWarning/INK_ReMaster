// client/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import api from './api/axios'
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import WritePage from './pages/WritePage';
import AdminPage from './pages/AdminPage';
import IntroPage from './pages/IntroPage';
import MyPage from './pages/MyPage';
import useAuthStore from './store/useAuthStore';
import useAlertStore from './store/useAlertStore';
import GlobalAlert from './components/GlobalAlert';
import Footer from './components/Footer'; // 👈 Footer 임포트
import ResetPasswordPage from './pages/ResetPasswordPage';
import ContestListPage from './pages/ContestListPage';
import ContestDetailPage from './pages/ContestDetailPage';
import AdminContestPage from './pages/AdminContestPage';
import ScrollToTop from './components/ScrollToTop';

// 로그인 처리 및 메인 페이지 분기 컴포넌트
const AuthHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processLogin = async () => {
      const email = searchParams.get('email');
      const loginStatus = searchParams.get('login');

      if (loginStatus === 'success' && email) {
        setIsProcessing(true);
        try {
          const res = await api.post('/auth/sync', { email });
          login(res.data);
          console.log("로그인 동기화 완료:", res.data);
          navigate('/'); 
        } catch (err) {
          if (err.response && err.response.data.msg === 'approval_pending') {
            showAlert("⚠️ 아직 승인되지 않은 계정입니다.\n운영자의 승인을 기다려주세요.");
            navigate('/login');
          } else {
            console.error(err);
            showAlert("로그인 정보 동기화 실패");
            navigate('/login');
          }
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    processLogin();
  }, [searchParams, login, navigate, showAlert]);

  if (isProcessing) {
    return (
      <div className="flex justify-center items-center h-screen bg-paper">
        <p className="text-xl font-bold animate-pulse text-ink">로그인 정보를 불러오는 중...</p>
      </div>
    );
  }

  return <MainPage />;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalAlert />
      {/* 🔥 전체 레이아웃 래퍼: 내용이 짧아도 Footer가 바닥에 붙게 함 */}
      <div className="flex flex-col min-h-screen">
        
        {/* 메인 컨텐츠 영역 (남은 공간 모두 차지) */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<AuthHandler />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/intro" element={<IntroPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/contests" element={<ContestListPage />} />
            <Route path="/contests/:id" element={<ContestDetailPage />} />
            <Route path="/admin/contest/create" element={<AdminContestPage />} />
          </Routes>
        </div>

        {/* 🔥 모든 페이지 하단에 Footer 추가 */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;