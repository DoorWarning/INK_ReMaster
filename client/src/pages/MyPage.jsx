// client/src/pages/MyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import { IoArrowBack, IoSaveOutline } from 'react-icons/io5';

const MyPage = () => {
  const { user, login } = useAuthStore(); // login 함수로 스토어 정보 업데이트
  const { showAlert } = useAlertStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      setName(user.name);
    } else {
      showAlert("로그인이 필요합니다.");
      navigate('/login');
    }
  }, [user, navigate, showAlert]);

  const handleUpdate = async () => {
    if (!name.trim()) return showAlert("이름을 입력해주세요.");
    
    // 비밀번호 변경 시도 시 체크
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return showAlert("비밀번호가 일치하지 않습니다.");
      }
      if (password.length < 6) {
        return showAlert("비밀번호는 6자 이상이어야 합니다.");
      }
    }

    try {
      const res = await api.put(`/users/profile/${user._id}`, {
        userId: user._id, // 본인 확인용
        name,
        password: password || undefined // 비어있으면 안 보냄
      });

      // 스토어 정보 업데이트 (이름이 바뀌었을 수 있으므로)
      // 기존 user 정보에 새로운 name 등을 덮어씌움
      login({ ...user, name: res.data.name }); 
      
      showAlert("정보가 수정되었습니다! 🎉");
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showAlert("수정 실패. 서버 오류가 발생했습니다.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8 font-sans flex items-center justify-center">
      <div className="w-full max-w-lg bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)] rounded-sm">
        
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-display text-ink">내 정보 수정</h2>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <IoArrowBack size={24} />
          </button>
        </div>

        {/* 읽기 전용 정보 (수정 불가) */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">이메일 (아이디)</label>
            <div className="font-bold text-ink">{user.email}</div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">학번</label>
              <div className="font-bold text-ink">{user.studentId}</div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">기수</label>
              <div className="font-bold text-ink">{user.generation}기</div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1">역할</label>
              <div className="font-bold text-ink uppercase">{user.role === 'admin' ? '임원진' : '부원'}</div>
            </div>
          </div>
        </div>

        {/* 수정 가능 정보 */}
        <div className="space-y-4">
          <div>
            <label className="block font-bold mb-2 text-ink">이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-ink p-3 focus:outline-none focus:bg-yellow-50 font-medium"
            />
          </div>

          <hr className="border-gray-200 my-4" />
          
          <p className="text-sm text-gray-500 font-bold">👇 비밀번호 변경 (비워두면 변경 안 됨)</p>

          <div>
            <label className="block font-bold mb-2 text-ink">새 비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="변경할 경우에만 입력"
              className="w-full border-2 border-ink p-3 focus:outline-none focus:bg-yellow-50 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-ink">비밀번호 확인</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="한 번 더 입력"
              className="w-full border-2 border-ink p-3 focus:outline-none focus:bg-yellow-50 font-medium"
            />
          </div>
        </div>

        <button 
          onClick={handleUpdate}
          className="w-full mt-8 bg-ink text-white font-bold py-3 border-2 border-ink shadow-md hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
        >
          <IoSaveOutline size={20} />
          저장하기
        </button>

      </div>
    </div>
  );
};

export default MyPage;