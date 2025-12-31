// client/src/pages/ContestDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import { IoHeart, IoHeartOutline, IoAddCircle, IoArrowBack } from 'react-icons/io5';

// 레이아웃 컴포넌트
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();

  const [contest, setContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 업로드 폼 상태
  const [uploadData, setUploadData] = useState({ title: '', description: '', file: null });

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/contests/${id}`);
      setContest(res.data.contest);
      setEntries(res.data.entries);
    } catch (err) {
      console.error(err);
      showAlert("불러오기 실패"); 
      navigate('/contests');
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  // 투표 핸들러
  const handleVote = async (entryId) => {
    if (!user) return showAlert("로그인이 필요합니다.");
    try {
      const res = await api.post(`/contests/entry/${entryId}/vote`, { userId: user._id });
      showAlert(res.data.msg);
      fetchDetails(); // 데이터 갱신
    } catch (err) {
      showAlert(err.response?.data?.msg || "투표 실패");
    }
  };

  // 작품 업로드 핸들러
  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return showAlert("제목과 이미지는 필수입니다.");
    try {
      // 1. 이미지 업로드
      const formData = new FormData();
      formData.append('file', uploadData.file);
      const uploadRes = await api.post('/upload', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      const imageUrl = uploadRes.data.url;

      // 2. 출품 정보 저장
      await api.post(`/contests/${id}/upload`, {
        authorId: user._id,
        imageUrl,
        title: uploadData.title,
        description: uploadData.description
      });
      
      showAlert("작품이 출품되었습니다! 🎨");
      setIsUploadOpen(false);
      setUploadData({ title: '', description: '', file: null });
      fetchDetails();
    } catch (err) {
      console.error(err);
      showAlert("업로드 실패 (기간을 확인해주세요)");
    }
  };

  // 🔥 [추가] 공모전 삭제 핸들러 (관리자용)
  const handleDelete = () => {
    showConfirm("정말 이 공모전을 삭제하시겠습니까?\n모든 출품작과 캘린더 일정도 함께 삭제됩니다.", async () => {
      try {
        await api.delete(`/contests/${id}`);
        showAlert("공모전이 삭제되었습니다.");
        navigate('/contests');
      } catch (err) {
        console.error(err);
        showAlert("삭제 실패");
      }
    });
  };

  // 🔥 [추가] 조기 마감 핸들러 (관리자용)
  const handleEarlyClose = () => {
    showConfirm("투표를 지금 즉시 마감하시겠습니까?\n(마감 후에는 투표 결과를 볼 수 있습니다.)", async () => {
      try {
        await api.put(`/contests/${id}/close`);
        showAlert("조기 마감되었습니다.");
        fetchDetails(); // 화면 갱신 (결과 공개됨)
      } catch (err) {
        console.error(err);
        showAlert("처리 실패");
      }
    });
  };

  if (!contest) return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* 헤더 & 사이드바 */}
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
        onCategoryChange={() => navigate('/')}
        isAuthenticated={isAuthenticated}
        handleLogout={logout}
        onLogin={() => navigate('/login')}
      />

      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto mb-8">
          <button onClick={() => navigate('/contests')} className="mb-4 flex items-center gap-1 font-bold text-gray-500 hover:text-ink transition-colors">
            <IoArrowBack /> 목록으로
          </button>
          
          {/* 상단 정보 영역 */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-gray-200 pb-6">
            <div className="flex-1">
              <span className="text-ink font-bold border-2 border-ink px-2 py-0.5 text-xs bg-white mb-2 inline-block shadow-[2px_2px_0px_0px_var(--color-ink)]">
                {contest.category === 'contest' ? 'COMPETITION' : 'EXHIBITION'}
              </span>
              <h1 className="text-4xl font-display text-ink">{contest.title}</h1>
              <p className="text-gray-600 mt-2 max-w-2xl font-medium whitespace-pre-line">{contest.description}</p>
              
              {/* 🔥 [추가] 관리자 전용 컨트롤 버튼 */}
              {user?.role === 'admin' && (
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={handleEarlyClose}
                    className="px-3 py-1 bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 rounded-sm shadow-sm transition-all"
                  >
                    ⛔ 조기 마감
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-600 text-white font-bold text-sm hover:bg-red-700 rounded-sm shadow-sm transition-all"
                  >
                    🗑️ 공모전 삭제
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 bg-ink text-white px-6 py-3 font-bold shadow-md hover:bg-gray-800 transition rounded-sm whitespace-nowrap"
            >
              <IoAddCircle size={20} />
              작품 출품하기
            </button>
          </div>
        </div>

        {/* 작품 목록 그리드 */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entries.map((entry, idx) => {
            const isVoted = entry.votes && entry.votes.includes(user?._id);
            
            return (
              <div key={entry._id} className="bg-white group relative border-2 border-gray-200 hover:border-ink transition-all shadow-sm hover:shadow-[6px_6px_0px_0px_var(--color-ink)] rounded-sm overflow-hidden">
                {/* 순위 뱃지 (비공개 아닐 때만 노출) */}
                {!entry.isHidden && idx < 3 && contest.category === 'contest' && (
                  <div className="absolute top-0 left-0 bg-yellow-400 text-ink font-display font-bold px-3 py-1 border-b-2 border-r-2 border-ink z-10 shadow-sm">
                    {idx + 1}등
                  </div>
                )}

                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                  <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg truncate text-ink">{entry.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 font-bold">
                    {entry.author?.name} <span className="font-normal text-xs">({entry.author?.generation}기)</span>
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => handleVote(entry._id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 font-bold transition-all active:scale-95 ${isVoted ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'}`}
                    >
                      {isVoted ? <IoHeart /> : <IoHeartOutline />}
                      <span>{entry.isHidden ? '?' : entry.voteCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {entries.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 font-bold border-2 border-dashed border-gray-300 rounded-sm">
              아직 등록된 작품이 없습니다. 첫 번째 주인공이 되어보세요! 🎨
            </div>
          )}
        </div>

        {/* 업로드 모달 */}
        {isUploadOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md p-6 rounded-sm border-2 border-ink shadow-[8px_8px_0px_0px_var(--color-ink)] animate-fadeIn">
              <h2 className="text-2xl font-display font-bold mb-4 text-ink">작품 업로드</h2>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="작품 제목" 
                  className="w-full border-2 border-ink p-3 font-medium focus:bg-yellow-50 outline-none transition-colors"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
                <textarea 
                  placeholder="작품 설명 (선택)" 
                  className="w-full border-2 border-ink p-3 h-24 font-medium focus:bg-yellow-50 outline-none resize-none transition-colors"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                />
                <div className="border-2 border-dashed border-gray-300 p-4 text-center hover:bg-gray-50 hover:border-ink transition cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  />
                  <p className="text-gray-500 font-bold group-hover:text-ink">
                    {uploadData.file ? `📄 ${uploadData.file.name}` : "이미지를 드래그하거나 클릭하세요"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleUpload} className="flex-1 bg-ink text-white font-bold py-3 hover:bg-gray-800 transition shadow-sm">
                  업로드
                </button>
                <button onClick={() => setIsUploadOpen(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 hover:bg-gray-300 transition shadow-sm">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestDetailPage;