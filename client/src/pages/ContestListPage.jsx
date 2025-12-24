// client/src/pages/ContestListPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

// 🔥 [추가] 레이아웃 컴포넌트 임포트
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const ContestListPage = () => {
  const [contests, setContests] = useState([]);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  // 🔥 [추가] 사이드바 상태 관리
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    api.get('/contests').then(res => setContests(res.data)).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-paper font-sans">
      {/* 🔥 [추가] 헤더와 사이드바 적용 */}
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onLogoClick={() => navigate('/')} 
        user={user} 
        isAuthenticated={isAuthenticated} 
        navigate={navigate}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onCategoryChange={(cat) => {
          // 공모전 페이지에서 다른 메뉴 클릭 시 메인으로 이동 후 해당 카테고리 활성화 로직 필요
          // 간단하게 메인으로 보냄 (Sidebar 내부 로직이 처리함)
          navigate('/');
        }}
        isAuthenticated={isAuthenticated}
        handleLogout={logout}
        onLogin={() => navigate('/login')}
      />

      {/* 메인 컨텐츠 */}
      <div className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-4xl font-display text-ink">GALLERY & CONTEST</h1>
              <p className="text-gray-600 font-bold mt-2">작품을 감상하고 투표해보세요!</p>
            </div>
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
                className="bg-white border-3 border-ink p-6 cursor-pointer hover:-translate-y-1 transition-transform shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_var(--color-ink)] relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className={`px-2 py-1 text-xs font-bold border-2 border-ink ${contest.category === 'contest' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {contest.category === 'contest' ? '🏆 공모전' : '🎨 정기모임'}
                  </span>
                  {contest.category === 'contest' && (
                    <span className="text-xs font-bold text-gray-400 bg-white px-1 border border-gray-200">
                      {new Date() > new Date(contest.votingEnd) ? '종료됨' : '진행중'}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2 truncate relative z-10">{contest.title}</h2>
                <p className="text-gray-600 line-clamp-2 text-sm mb-4 relative z-10">{contest.description}</p>
                <div className="text-right text-xs font-bold text-gray-400 relative z-10">
                  {new Date(contest.createdAt).toLocaleDateString()}
                </div>
                
                {/* 장식용 배경 패턴 */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gray-100 rounded-full z-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestListPage;