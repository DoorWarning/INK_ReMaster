// client/src/pages/LoginPage.jsx (부분 수정이 많아 전체 코드 제공)
import React, { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios'
import useAlertStore from '../store/useAlertStore';
import useAuthStore from '../store/useAuthStore';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlertStore();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login'); 
  const [isGooglePending, setIsGooglePending] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    studentId: '',
    generation: '',
    googleId: ''
  });

  // URL 에러 처리
  useEffect(() => {
    const failReason = searchParams.get('fail');
    const googleStatus = searchParams.get('google');

    if (failReason === 'ajou_only') {
      showAlert("🚫 구글 로그인은 아주대학교 메일(@ajou.ac.kr)만 가능합니다.");
      navigate('/login', { replace: true });
    }

    if (googleStatus === 'pending') {
      setIsGooglePending(true);
      setFormData(prev => ({
        ...prev,
        email: searchParams.get('email') || '',
        name: searchParams.get('name') || '',
        googleId: searchParams.get('googleId') || ''
      }));
      showAlert("첫 방문을 환영합니다! 🎉\n학번과 기수를 입력하면 가입이 완료됩니다.");
    }
  }, [searchParams, showAlert, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  // 폼 제출 핸들러 (로그인 / 가입 / 비번찾기)
  const handleSubmit = async () => {
    // 1. 로그인
    if (mode === 'login') {
      if (!formData.email || !formData.password) return showAlert("이메일과 비밀번호를 입력해주세요.");
      try {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(res.data);
        showAlert(`${res.data.name}님 환영합니다! 👋`);
        navigate('/');
      } catch (err) {
        if (err.response && err.response.data.msg === 'approval_pending') {
          showAlert("⚠️ 아직 승인되지 않은 계정입니다.\n운영자의 승인을 기다려주세요.");
        } else {
          showAlert(err.response?.data?.msg || "로그인 실패");
        }
      }
    } 
    // 2. 회원가입
    else if (mode === 'register') {
      if (!formData.email || !formData.password || !formData.name) return showAlert("필수 정보를 입력해주세요.");
      try {
        await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          studentId: formData.studentId,
          generation: Number(formData.generation)
        });
        showAlert("가입 신청 완료! 📨\n운영자의 승인 후 로그인이 가능합니다.");
        setMode('login');
      } catch (err) {
        showAlert(err.response?.data?.msg || "가입 실패");
      }
    }
    // 3. 비밀번호 찾기 (이메일 전송 요청)
    else if (mode === 'forgot') {
      if (!formData.email || !formData.name || !formData.studentId) return showAlert("이메일, 이름, 학번을 모두 입력해주세요.");
      try {
        await api.post('/auth/forgot-password', {
          email: formData.email,
          name: formData.name,
          studentId: formData.studentId
        });
        showAlert("📧 이메일로 비밀번호 재설정 링크가 전송되었습니다.\n메일함을 확인해주세요!");
        setMode('login');
      } catch (err) {
        showAlert(err.response?.data?.msg || "정보가 일치하는 회원을 찾을 수 없습니다.");
      }
    }
  };

  // 구글 가입 마무리
  const handleGoogleFinish = async () => {
    try {
      const res = await api.post('/auth/google/register', {
        email: formData.email, googleId: formData.googleId, name: formData.name,
        studentId: formData.studentId, generation: Number(formData.generation)
      });
      window.location.href = `/?login=success&email=${res.data.user.email}`;
    } catch (err) { showAlert("가입 처리 중 오류 발생"); }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)] relative z-10 rounded-sm"
      >
        <div className="text-center mb-6">
          <h1 className="text-5xl font-display mb-2 text-ink">INK</h1>
          <p className="text-gray-600 font-bold">아주대학교 만화소학회</p>
        </div>

        {isGooglePending ? (
           /* 구글 추가 정보 입력 폼 (생략 - 기존과 동일) */
           <div className="space-y-4">
             {/* ... (이전 코드와 동일, 생략) ... */}
             <button onClick={handleGoogleFinish} className="w-full bg-ink text-white font-bold py-3 border-2 border-ink hover:bg-gray-800 transition-all shadow-md">가입 완료하기</button>
           </div>
        ) : (
          <>
            {/* 탭 버튼 (로그인 / 회원가입) */}
            {mode !== 'forgot' && (
              <div className="flex mb-6 border-b-2 border-gray-200">
                <button onClick={() => setMode('login')} className={`flex-1 pb-2 font-bold ${mode === 'login' ? 'text-ink border-b-4 border-ink' : 'text-gray-400'}`}>로그인</button>
                <button onClick={() => setMode('register')} className={`flex-1 pb-2 font-bold ${mode === 'register' ? 'text-ink border-b-4 border-ink' : 'text-gray-400'}`}>회원가입</button>
              </div>
            )}

            {/* 비밀번호 찾기 모드 헤더 */}
            {mode === 'forgot' && (
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-ink mb-2">비밀번호 찾기</h2>
                <p className="text-sm text-gray-500">가입 시 입력한 정보를 입력해주세요.</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold mb-1 text-ink">이메일</label>
                <input name="email" type="email" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
              </div>

              {/* 로그인 모드 */}
              {mode === 'login' && (
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-ink">비밀번호</label>
                  <input name="password" type="password" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                </div>
              )}

              {/* 회원가입 OR 비밀번호 찾기 모드 */}
              {(mode === 'register' || mode === 'forgot') && (
                <>
                  {!mode.includes('login') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                      <div>
                        <label className="block text-sm font-extrabold mb-1 text-ink">이름</label>
                        <input name="name" type="text" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                      </div>
                      <div className="flex gap-2">
                         <div className="flex-1">
                           <label className="block text-sm font-extrabold mb-1 text-ink">학번</label>
                           <input name="studentId" type="text" maxLength={9} onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                         </div>
                         {mode === 'register' && (
                           <div className="w-24">
                             <label className="block text-sm font-extrabold mb-1 text-ink">기수</label>
                             <input name="generation" type="number" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                           </div>
                         )}
                      </div>
                      {mode === 'register' && (
                         <div>
                           <label className="block text-sm font-extrabold mb-1 text-ink">비밀번호</label>
                           <input name="password" type="password" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                         </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}

              <button onClick={handleSubmit} className="w-full bg-ink text-white font-bold py-3 border-2 border-ink hover:bg-gray-800 transition-all shadow-md mt-2">
                {mode === 'login' ? '로그인' : (mode === 'register' ? '가입하기' : '인증메일 보내기')}
              </button>

              {/* 비밀번호 찾기 버튼 & 취소 버튼 */}
              <div className="text-center mt-3">
                {mode === 'login' ? (
                  <button onClick={() => setMode('forgot')} className="text-sm font-bold text-gray-400 hover:text-ink hover:underline">
                    비밀번호를 잊으셨나요?
                  </button>
                ) : (
                  <button onClick={() => setMode('login')} className="text-sm font-bold text-gray-500 hover:text-ink underline">
                    로그인으로 돌아가기
                  </button>
                )}
              </div>

              {/* 구글 로그인 (로그인/회원가입 모드에서만) */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t-2 border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">OR</span>
                    <div className="flex-grow border-t-2 border-gray-200"></div>
                  </div>
                  <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-ink py-3 font-bold hover:bg-gray-50 transition-all shadow-sm">
                    <FcGoogle size={24} />
                    <span className="text-ink">아주대 메일로 시작하기</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;