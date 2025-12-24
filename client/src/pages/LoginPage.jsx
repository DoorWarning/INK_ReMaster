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

  // URL 에러 및 상태 처리
  useEffect(() => {
    const failReason = searchParams.get('fail');
    const googleStatus = searchParams.get('google');

    if (failReason === 'ajou_only') {
      showAlert("🚫 구글 로그인은 아주대학교 메일(@ajou.ac.kr)만 가능합니다.");
      navigate('/login', { replace: true });
    }

    if (googleStatus === 'pending') {
      setIsGooglePending(true);
      // URL 파라미터로 넘어온 구글 정보(이메일, 이름 등)를 폼 상태에 저장
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
    // 백엔드 주소에 맞춰 수정
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/google`;
  };

  // 1. 일반 로그인/가입/비번찾기 제출
  const handleSubmit = async () => {
    if (mode === 'login') {
      if (!formData.email || !formData.password) return showAlert("이메일과 비밀번호를 입력해주세요.");
      try {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        const { token } = res.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
    } else if (mode === 'register') {
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
    } else if (mode === 'forgot') {
      if (!formData.email || !formData.name || !formData.studentId) return showAlert("모든 정보를 입력해주세요.");
      try {
        await api.post('/auth/forgot-password', {
          email: formData.email, name: formData.name, studentId: formData.studentId
        });
        showAlert("📧 비밀번호 재설정 메일을 보냈습니다.");
        setMode('login');
      } catch (err) {
        showAlert("정보가 일치하는 않습니다.");
      }
    }
  };

  // 2. 구글 가입 마무리 (학번/기수 저장)
  const handleGoogleFinish = async () => {
    // 유효성 검사 추가: 입력 안 했으면 막아야 함
    if (!formData.studentId || !formData.generation) {
      return showAlert("학번과 기수를 모두 입력해주세요!");
    }

    try {
      const res = await api.post('/auth/google/register', {
        email: formData.email, 
        googleId: formData.googleId, 
        name: formData.name,
        studentId: formData.studentId, 
        generation: Number(formData.generation)
      });
      // 성공 시 메인으로 이동 (로그인 성공 처리)
      window.location.href = `/?login=success&email=${res.data.user.email}`;
    } catch (err) { 
      showAlert("가입 처리 중 오류 발생"); 
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)] relative z-10 rounded-sm"
      >
        {/* 🔥 [추가] 뒤로가기 버튼 */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 text-gray-400 hover:text-ink transition-colors"
          title="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h1 className="text-5xl font-display mb-2 text-ink">INK</h1>
          <p className="text-gray-600 font-bold">아주대학교 만화소학회</p>
        </div>

        {/* 🔥 [수정됨] 구글 로그인 추가 정보 입력 화면 🔥 */}
        {isGooglePending ? (
           <div className="space-y-4">
             <div className="text-center bg-gray-100 p-3 rounded mb-4">
               <p className="text-sm text-gray-600">
                 <span className="font-bold text-ink">{formData.name}</span>님, 환영합니다!<br/>
                 서비스 이용을 위해 <br/><span className="font-bold text-red-500">학번과 기수</span>를 입력해주세요.
               </p>
             </div>

             {/* 🔥 여기가 없어서 데이터가 비어서 저장된 것입니다! 복구했습니다. 🔥 */}
             <div>
               <label className="block text-sm font-extrabold mb-1 text-ink">학번 (필수)</label>
               <input 
                 name="studentId" 
                 type="text" 
                 value={formData.studentId}
                 onChange={handleChange} 
                 maxLength={9}
                 placeholder="학번 9자리를 입력하세요"
                 className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" 
               />
             </div>
             <div>
               <label className="block text-sm font-extrabold mb-1 text-ink">기수 (필수)</label>
               <input 
                 name="generation" 
                 type="number" 
                 value={formData.generation}
                 onChange={handleChange} 
                 placeholder="예: 38"
                 className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" 
               />
             </div>

             <button 
               onClick={handleGoogleFinish} 
               className="w-full bg-ink text-white font-bold py-3 border-2 border-ink hover:bg-gray-800 transition-all shadow-md mt-4"
             >
               가입 완료하기
             </button>
           </div>
        ) : (
          /* 기존 로그인/회원가입 화면 (그대로 유지) */
          <>
            {mode !== 'forgot' && (
              <div className="flex mb-6 border-b-2 border-gray-200">
                <button onClick={() => setMode('login')} className={`flex-1 pb-2 font-bold ${mode === 'login' ? 'text-ink border-b-4 border-ink' : 'text-gray-400'}`}>로그인</button>
                <button onClick={() => setMode('register')} className={`flex-1 pb-2 font-bold ${mode === 'register' ? 'text-ink border-b-4 border-ink' : 'text-gray-400'}`}>회원가입</button>
              </div>
            )}

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

              {mode === 'login' && (
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-ink">비밀번호</label>
                  <input name="password" type="password" onChange={handleChange} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" />
                </div>
              )}

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