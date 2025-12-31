// client/src/pages/AdminContestPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAlertStore from '../store/useAlertStore';
import { IoArrowBack } from 'react-icons/io5';

const AdminContestPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'contest', // 'contest' or 'regular'
    submissionStart: '',
    submissionEnd: '',
    votingStart: '',
    votingEnd: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. 기존 formData 복사
      const payload = { ...formData };

      // 2. 🔥 [핵심 수정] "이 시간은 한국 시간(+09:00)입니다"라고 명시적으로 지정
      // datetime-local의 값은 "2025-12-31T09:32" 형태입니다.
      // 여기에 ":00+09:00"을 붙여서 "2025-12-31T09:32:00+09:00"으로 만듭니다.
      // 이렇게 보내면 서버는 "아, 한국 9시니까 UTC로는 0시구나"라고 정확히 계산해서 저장합니다.
      
      if (payload.category === 'contest') {
        if (payload.submissionStart) {
          payload.submissionStart = `${payload.submissionStart}:00+09:00`; 
        }
        if (payload.submissionEnd) {
          payload.submissionEnd = `${payload.submissionEnd}:00+09:00`;
        }
        if (payload.votingStart) {
          payload.votingStart = `${payload.votingStart}:00+09:00`;
        }
        if (payload.votingEnd) {
          payload.votingEnd = `${payload.votingEnd}:00+09:00`;
        }
      }

      // 3. 서버로 전송
      await api.post('/contests/create', payload);
      
      showAlert("공모전/정기모임이 생성되었습니다! 🎉");
      navigate('/contests');
    } catch (err) {
      console.error(err);
      showAlert("생성 실패");
    }
  };

  return (
    <div className="min-h-screen bg-paper p-6 font-sans">
      <div className="max-w-2xl mx-auto bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)]">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 font-bold text-gray-500 hover:text-ink">
          <IoArrowBack /> 뒤로가기
        </button>
        
        <h1 className="text-3xl font-display text-ink mb-6">공모전/모임 생성</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">제목</label>
            <input name="title" onChange={handleChange} className="w-full border-2 border-ink p-2 font-medium" required placeholder="예: 2024년 1학기 정기 공모전" />
          </div>

          <div>
            <label className="block font-bold mb-1">설명</label>
            <textarea name="description" onChange={handleChange} className="w-full border-2 border-ink p-2 font-medium h-24" placeholder="설명을 입력하세요" />
          </div>

          <div>
            <label className="block font-bold mb-1">유형</label>
            <select name="category" onChange={handleChange} className="w-full border-2 border-ink p-2 font-medium bg-white">
              <option value="contest">🏆 공모전 (투표/제출 기간 있음)</option>
              <option value="regular">🎨 정기모임 (기간 없음, 자유 업로드)</option>
            </select>
          </div>

          {/* 공모전일 때만 날짜 입력 노출 */}
          {formData.category === 'contest' && (
            <div className="p-4 bg-yellow-50 border-2 border-ink border-dashed space-y-4">
              <h3 className="font-bold text-ink">📅 기간 설정 (자동으로 캘린더에 등록됨)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-blue-600">작품 제출 시작</label>
                  <input type="datetime-local" name="submissionStart" onChange={handleChange} className="w-full border-2 border-ink p-1" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-blue-600">작품 제출 마감</label>
                  <input type="datetime-local" name="submissionEnd" onChange={handleChange} className="w-full border-2 border-ink p-1" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-red-600">투표 시작</label>
                  <input type="datetime-local" name="votingStart" onChange={handleChange} className="w-full border-2 border-ink p-1" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-red-600">투표 종료 (결과 공개)</label>
                  <input type="datetime-local" name="votingEnd" onChange={handleChange} className="w-full border-2 border-ink p-1" required />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-ink text-white font-bold py-3 mt-4 hover:bg-gray-800 transition shadow-md">
            생성하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminContestPage;