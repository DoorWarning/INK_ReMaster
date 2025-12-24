// client/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios'
import useAlertStore from '../store/useAlertStore';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();
  
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!password || !confirmPassword) return showAlert("비밀번호를 입력해주세요.");
    if (password !== confirmPassword) return showAlert("비밀번호가 일치하지 않습니다.");
    if (password.length < 6) return showAlert("비밀번호는 6자 이상이어야 합니다.");

    try {
      await api.post('http://localhost:4000/api/auth/reset-password', {
        token,
        newPassword: password
      });
      showAlert("비밀번호가 변경되었습니다! 🎉\n새 비밀번호로 로그인해주세요.");
      navigate('/login');
    } catch (err) {
      showAlert(err.response?.data?.msg || "변경 실패. 링크가 만료되었을 수 있습니다.");
    }
  };

  if (!token) {
    return <div className="text-center p-10 font-bold text-red-500">잘못된 접근입니다.</div>;
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)] rounded-sm">
        <h2 className="text-2xl font-bold text-ink mb-6 text-center">새 비밀번호 설정</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-extrabold mb-1 text-ink">새 비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" placeholder="6자 이상 입력" />
          </div>
          <div>
            <label className="block text-sm font-extrabold mb-1 text-ink">비밀번호 확인</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-ink p-3 font-medium" placeholder="한 번 더 입력" />
          </div>
          
          <button onClick={handleSubmit} className="w-full bg-ink text-white font-bold py-3 border-2 border-ink hover:bg-gray-800 transition-all shadow-md mt-4">
            비밀번호 변경하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;