// client/src/pages/ContestListPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const ContestListPage = () => {
  const [contests, setContests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/contests').then(res => setContests(res.data)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-paper p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-4xl font-display text-ink">GALLERY & CONTEST</h1>
            <p className="text-gray-600 font-bold mt-2">작품을 감상하고 투표해보세요!</p>
          </div>
          {/* 관리자만 생성 버튼 보임 */}
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin/contest/create')}
              className="bg-yellow-400 border-2 border-ink px-4 py-2 font-bold shadow-[4px_4px_0px_0px_var(--color-ink)] hover:translate-y-1 hover:shadow-none transition-all"
            >
              + 새 공모전 만들기
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map(contest => (
            <div 
              key={contest._id} 
              onClick={() => navigate(`/contests/${contest._id}`)}
              className="bg-white border-3 border-ink p-6 cursor-pointer hover:-translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_var(--color-ink)]"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 text-xs font-bold border-2 border-ink ${contest.category === 'contest' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {contest.category === 'contest' ? '🏆 공모전' : '🎨 정기모임'}
                </span>
                {/* 진행 상태 표시 */}
                {contest.category === 'contest' && (
                  <span className="text-xs font-bold text-gray-400">
                    {new Date() > new Date(contest.votingEnd) ? '종료됨' : '진행중'}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2 truncate">{contest.title}</h2>
              <p className="text-gray-600 line-clamp-2 text-sm mb-4">{contest.description}</p>
              <div className="text-right text-xs font-bold text-gray-400">
                {new Date(contest.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContestListPage;