// client/src/pages/WritePage.jsx (전체 수정)
import React, { useState, useEffect } from 'react';
import api from '../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'; // useSearchParams 추가
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import { IoCloseCircle } from 'react-icons/io5';

const WritePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL에서 카테고리 읽기 (없으면 기본값 art)
  const category = searchParams.get('category') || 'art';

  // 카테고리별 한글 명칭
  const categoryName = {
    notice: '📢 공지사항',
    art: '🎨 작품',
    photo: '📷 행사 사진'
  };

  // 권한 체크
  useEffect(() => {
    if (!user) {
      showAlert('로그인이 필요합니다!');
      navigate('/login');
      return;
    }
    // 🔥 공지사항은 관리자만 작성 가능
    if (category === 'notice' && user.role !== 'admin') {
      showAlert('공지사항은 임원진만 작성할 수 있습니다. 👮‍♂️');
      navigate('/');
    }
  }, [user, category, navigate, showAlert]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    // 🔥 카테고리 정보가 있다면 해당 카테고리로 이동, 없으면 홈으로
    navigate(`/?category=${category}`);
  };

  const handleSubmit = async () => {
    if (!title) return showAlert('제목을 입력해주세요.');
    // 공지사항은 이미지가 없어도 됨, 아트/사진은 필수
    if (category !== 'notice' && files.length === 0) {
      return showAlert('최소 1장의 이미지를 넣어주세요! 📸');
    }

    try {
      let imageUrls = [];

      // 이미지가 있을 때만 업로드
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls = uploadRes.data.urls;
      }

      // 게시글 저장 (카테고리 포함)
      await api.post('/posts', {
        title,
        content,
        imageUrls,
        email: user.email,
        category // 🔥 카테고리 전송
      });

      showAlert('등록 완료! 🎉');
      navigate('/'); 

    } catch (err) {
      console.error(err);
      showAlert('업로드 실패');
    }
  };

  return (
    <div className="min-h-screen bg-paper p-8 flex justify-center items-center font-sans">
      <div className="w-full max-w-3xl bg-white border-3 border-ink p-8 shadow-[8px_8px_0px_0px_var(--color-ink)] rounded-sm">
        <h2 className="text-3xl font-display text-ink mb-6">
          {categoryName[category]} 올리기
        </h2>

        <div className="mb-4">
          <label className="block font-bold mb-2 text-ink">제목</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-ink p-3 focus:outline-none focus:bg-yellow-50 font-medium"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2 text-ink">내용</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border-2 border-ink p-3 h-40 resize-none focus:outline-none focus:bg-yellow-50 font-medium"
            placeholder="내용을 입력하세요"
          />
        </div>

        <div className="mb-6">
          <label className="block font-bold mb-2 text-ink">
            {category === 'notice' ? '첨부 이미지 (선택)' : '이미지 (필수)'}
          </label>
          <div className="border-2 border-dashed border-ink bg-gray-50 p-4 text-center relative cursor-pointer hover:bg-gray-100 transition-colors mb-4 rounded-sm">
            <span className="text-2xl block">📷</span>
            <span className="text-sm text-gray-500 font-bold">클릭해서 사진 추가하기</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 min-h-[130px]">
            {previews.map((src, idx) => (
              <div key={idx} className="relative flex-shrink-0 w-32 h-32 border border-gray-300 shadow-sm group bg-white">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 text-red-500 bg-white rounded-full hover:scale-110 transition shadow-sm z-10"
                >
                  <IoCloseCircle size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={handleCancel} // 👈 navigate('/') 대신 handleCancel 호출
            className="px-6 py-3 font-bold border-2 border-transparent hover:bg-gray-100 transition-colors">
             취소
          </button>
          <button onClick={handleSubmit} className="px-6 py-3 bg-ink text-white font-bold border-2 border-ink shadow-md hover:-translate-y-1 transition-transform">
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritePage;