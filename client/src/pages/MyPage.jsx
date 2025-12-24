import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import useAlertStore from '../store/useAlertStore';

const MyPage = () => {
  const { user, checkAuth } = useAuthStore(); // checkAuth로 최신 정보 갱신 가능
  const { showAlert } = useAlertStore();

  // 초기 상태를 빈 값으로 둠 (user가 아직 로드 안 됐을 수 있음)
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    generation: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true); // 로딩 상태 관리

  // 🔥 [핵심] user 정보가 변경(로드)되면 폼 데이터에 동기화
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        studentId: user.studentId || '',     // 학번
        generation: user.generation || '',   // 기수
        email: user.email || ''
      }));
      setLoading(false); // 데이터 로드 완료
    }
  }, [user]); // user가 바뀌면 실행됨

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return showAlert("새 비밀번호가 일치하지 않습니다.");
    }

    try {
      // 정보 수정 요청 (비밀번호 변경 포함)
      await api.put('/auth/update', {
        name: formData.name,
        generation: formData.generation, // 기수 수정 포함
        // studentId는 보통 수정 불가하게 막지만, 필요하면 포함
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      showAlert("회원 정보가 수정되었습니다.");
      
      // 🔥 수정 후 최신 정보 다시 가져오기 (Store 갱신)
      await checkAuth(); 
      
      // 비밀번호 필드 초기화
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || "정보 수정 실패");
    }
  };

  if (loading) return <div className="p-10 text-center">정보를 불러오는 중...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 mb-20 p-6 bg-white border-2 border-ink shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-display text-ink mb-6 text-center">내 정보 수정</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 (수정 불가) */}
        <div>
          <label className="block font-bold text-sm mb-1">이메일</label>
          <input 
            type="text" 
            name="email" 
            value={formData.email} 
            disabled 
            className="w-full bg-gray-100 border-2 border-gray-300 p-2 text-gray-500 font-bold cursor-not-allowed"
          />
        </div>

        {/* 이름 */}
        <div>
          <label className="block font-bold text-sm mb-1">이름</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            className="w-full border-2 border-ink p-2 font-medium focus:bg-yellow-50 focus:outline-none"
          />
        </div>

        <div className="flex gap-4">
          {/* 학번 (수정 불가 또는 가능) */}
          <div className="flex-1">
            <label className="block font-bold text-sm mb-1">학번</label>
            <input 
              type="text" 
              name="studentId" 
              value={formData.studentId} 
              disabled // 학번은 보통 수정 불가능하게 처리
              className="w-full bg-gray-100 border-2 border-gray-300 p-2 text-gray-500 font-bold"
            />
          </div>

          {/* 🔥 기수 (수정 가능하게 처리) */}
          <div className="flex-1">
            <label className="block font-bold text-sm mb-1">기수</label>
            <div className="relative">
              <input 
                type="number" 
                name="generation" 
                value={formData.generation} 
                onChange={handleChange}
                className="w-full border-2 border-ink p-2 font-medium focus:bg-yellow-50 focus:outline-none pr-8"
              />
              <span className="absolute right-3 top-2.5 font-bold text-gray-400">기</span>
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-gray-200 my-4 border-dashed" />

        {/* 비밀번호 변경 영역 */}
        <div>
          <label className="block font-bold text-sm mb-1">현재 비밀번호 (정보 수정 시 필수)</label>
          <input 
            type="password" 
            name="currentPassword" 
            value={formData.currentPassword} 
            onChange={handleChange}
            className="w-full border-2 border-ink p-2 focus:bg-yellow-50 focus:outline-none"
            placeholder="변경하려면 현재 비밀번호 입력"
          />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">새 비밀번호</label>
          <input 
            type="password" 
            name="newPassword" 
            value={formData.newPassword} 
            onChange={handleChange}
            className="w-full border-2 border-ink p-2 focus:bg-yellow-50 focus:outline-none"
            placeholder="변경할 비밀번호 (선택)"
          />
        </div>

        <div>
          <label className="block font-bold text-sm mb-1">새 비밀번호 확인</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange}
            className="w-full border-2 border-ink p-2 focus:bg-yellow-50 focus:outline-none"
            placeholder="새 비밀번호 다시 입력"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-ink text-white font-bold py-3 mt-4 hover:bg-gray-800 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
        >
          정보 수정 저장
        </button>
      </form>
    </div>
  );
};

export default MyPage;