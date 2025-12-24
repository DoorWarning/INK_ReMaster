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
      await api.post('/contests/create', formData);
      showAlert("공모전/정기모임이 생성되었습니다! 🎉\n(공모전은 캘린더에도 등록되었습니다.)");
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