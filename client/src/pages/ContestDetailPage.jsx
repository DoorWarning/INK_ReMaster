// client/src/pages/ContestDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import { IoHeart, IoHeartOutline, IoAddCircle, IoArrowBack } from 'react-icons/io5';

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [contest, setContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // 업로드 폼 상태
  const [uploadData, setUploadData] = useState({ title: '', description: '', file: null });

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/contests/${id}`);
      setContest(res.data.contest);
      setEntries(res.data.entries);
    } catch (err) { showAlert("불러오기 실패"); navigate('/contests'); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  // 투표 핸들러
  const handleVote = async (entryId) => {
    if (!user) return showAlert("로그인이 필요합니다.");
    try {
      const res = await api.post(`/contests/entry/${entryId}/vote`, { userId: user._id });
      showAlert(res.data.msg); // "투표 완료" or "취소"
      fetchDetails(); // 갱신 (투표 수 반영)
    } catch (err) {
      showAlert(err.response?.data?.msg || "투표 실패");
    }
  };

  // 이미지 업로드 핸들러
  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return showAlert("제목과 이미지는 필수입니다.");
    
    try {
      // 1. 이미지 서버 업로드 (기존 upload 라우트 활용 가정)
      const formData = new FormData();
      formData.append('file', uploadData.file);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = uploadRes.data.url;

      // 2. 작품 등록
      await api.post(`/contests/${id}/upload`, {
        authorId: user._id,
        imageUrl: imageUrl,
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

  if (!contest) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* 상단 헤더 */}
      <div className="max-w-7xl mx-auto mb-8">
        <button onClick={() => navigate('/contests')} className="mb-4 flex items-center gap-1 font-bold text-gray-500 hover:text-ink">
          <IoArrowBack /> 목록으로
        </button>
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <span className="text-ink font-bold border-2 border-ink px-2 py-0.5 text-xs bg-white mb-2 inline-block">
              {contest.category === 'contest' ? 'COMPETITION' : 'EXHIBITION'}
            </span>
            <h1 className="text-4xl font-display text-ink">{contest.title}</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">{contest.description}</p>
          </div>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-ink text-white px-6 py-3 font-bold shadow-md hover:bg-gray-800 transition rounded-sm"
          >
            <IoAddCircle size={20} />
            작품 출품하기
          </button>
        </div>
      </div>

      {/* 작품 그리드 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {entries.map((entry, idx) => {
          const isVoted = entry.votes && entry.votes.includes(user?._id); // (백엔드에서 votes 배열을 안 보내주면 이 로직 수정 필요. 일단 백엔드가 votes 배열을 숨기는 경우엔 isHidden으로 처리)
          
          return (
            <div key={entry._id} className="bg-white group relative border-2 border-gray-200 hover:border-ink transition-all shadow-sm hover:shadow-lg rounded-sm overflow-hidden">
              {/* 순위 뱃지 (투표 종료 후 공개) */}
              {!entry.isHidden && idx < 3 && contest.category === 'contest' && (
                <div className="absolute top-0 left-0 bg-yellow-400 text-ink font-display font-bold px-3 py-1 border-b-2 border-r-2 border-ink z-10">
                  {idx + 1}등
                </div>
              )}

              {/* 이미지 */}
              <div className="aspect-square overflow-hidden bg-gray-100 relative">
                <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="font-bold text-lg truncate">{entry.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{entry.author?.name} ({entry.author?.generation}기)</p>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleVote(entry._id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 font-bold transition-all ${isVoted ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'}`}
                  >
                    {isVoted ? <IoHeart /> : <IoHeartOutline />}
                    <span>{entry.isHidden ? '?' : entry.voteCount}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 업로드 모달 */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded shadow-xl border-2 border-ink">
            <h2 className="text-2xl font-bold mb-4">작품 업로드</h2>
            <input 
              type="text" 
              placeholder="작품 제목" 
              className="w-full border-2 border-gray-300 p-2 mb-2 font-medium"
              value={uploadData.title}
              onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
            />
            <textarea 
              placeholder="작품 설명" 
              className="w-full border-2 border-gray-300 p-2 mb-2 h-24 font-medium"
              value={uploadData.description}
              onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
            />
            <input 
              type="file" 
              accept="image/*"
              className="w-full mb-4"
              onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
            />
            <div className="flex gap-2">
              <button onClick={handleUpload} className="flex-1 bg-ink text-white font-bold py-2 hover:bg-gray-800">업로드</button>
              <button onClick={() => setIsUploadOpen(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 hover:bg-gray-300">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestDetailPage;