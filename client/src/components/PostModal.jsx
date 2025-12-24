// client/src/components/PostModal.jsx (전체 수정본)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoHeart, IoHeartOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5';
import api from '../api/axios'
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore'; // 👈 커스텀 알림 스토어

const PostModal = ({ post, onClose, onUpdate }) => {
  const { user } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore(); // 👈 Hook 사용
  const [commentText, setCommentText] = useState('');
  const [currentPost, setCurrentPost] = useState(post);
  
  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content || '');

  // 1. 최신 데이터 불러오기 (작성자 정보 포함)
  useEffect(() => {
    const fetchLatestPost = async () => {
      try {
        const res = await api.get('/posts');
        const found = res.data.find(p => String(p._id) === String(post._id));
        if (found) {
          setCurrentPost(found);
          setEditTitle(found.title);
          setEditContent(found.content);
        }
      } catch (err) { console.error(err); }
    };
    fetchLatestPost();
  }, [post._id]);

  // 권한 체크
  const canEdit = user && (String(currentPost.author?._id) === String(user._id) || user.role === 'admin');
  
  // 좋아요 체크
  const isLiked = user && currentPost?.likes?.some(id => String(id) === String(user._id));

  // 🔥 삭제 핸들러 (커스텀 컨펌 적용)
  const handleDelete = () => {
    showConfirm("정말 이 작품을 삭제하시겠습니까? 🗑️", async () => {
      try {
        await api.delete(`http://localhost:4000/api/posts/${currentPost._id}`, {
          data: { userId: user._id }
        });
        
        showAlert("삭제되었습니다.");
        onUpdate();
        onClose();
      } catch (err) {
        showAlert("삭제 권한이 없거나 오류가 발생했습니다.");
      }
    });
  };

  // 수정 저장 핸들러
  const handleEditSave = async () => {
    try {
      const res = await api.put(`http://localhost:4000/api/posts/${currentPost._id}`, {
        userId: user._id,
        title: editTitle,
        content: editContent
      });
      setCurrentPost(res.data);
      setIsEditing(false);
      onUpdate();
      showAlert("수정되었습니다! ✏️"); // 👈 알림 추가
    } catch (err) {
      showAlert("수정 실패");
    }
  };

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!user) return showAlert('로그인이 필요합니다!'); // 👈 커스텀 알림
    
    let newLikes = [...currentPost.likes];
    if (isLiked) {
      newLikes = newLikes.filter(id => String(id) !== String(user._id));
    } else {
      newLikes.push(user._id);
    }
    setCurrentPost(prev => ({ ...prev, likes: newLikes }));

    try {
      const res = await api.put(`http://localhost:4000/api/posts/${currentPost._id}/like`, { userId: user._id });
      setCurrentPost(prev => ({ ...prev, likes: res.data }));
      onUpdate();
    } catch (err) {
      setCurrentPost(post); 
    }
  };

  // 댓글 핸들러
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return showAlert('로그인이 필요합니다!'); // 👈 커스텀 알림

    try {
      await api.post(`http://localhost:4000/api/posts/${currentPost._id}/comment`, {
        userId: user._id,
        userName: user.name || user.email.split('@')[0],
        text: commentText
      });
      
      // 댓글 갱신 (서버에서 다시 가져오기)
      const fetchAgain = await api.get('/posts');
      const found = fetchAgain.data.find(p => String(p._id) === String(post._id));
      if(found) setCurrentPost(found);
      
      setCommentText('');
    } catch (err) { console.error(err); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-5xl h-[85vh] rounded-sm flex flex-col md:flex-row shadow-2xl border-3 border-ink overflow-hidden"
        >
          {/* 왼쪽: 이미지 영역 */}
          <div className="w-full md:w-3/5 bg-gray-100 overflow-y-auto p-4 border-b-2 md:border-b-0 md:border-r-2 border-ink flex flex-col gap-4 items-center">
             {currentPost.images && currentPost.images.map((img, idx) => (
               <img 
                key={idx}
                src={img.url} 
                alt={`Art ${idx}`} 
                className="w-full h-auto object-contain shadow-md border border-gray-200 bg-white"
              />
             ))}
          </div>

          {/* 오른쪽: 정보 영역 */}
          <div className="w-full md:w-2/5 flex flex-col bg-paper relative">
            
            {/* 상단 버튼 그룹 */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {canEdit && !isEditing && (
                <>
                  <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-gray-200 rounded-full transition text-gray-600" title="수정">
                    <IoPencilOutline size={20} />
                  </button>
                  <button onClick={handleDelete} className="p-1 hover:bg-red-100 rounded-full transition text-red-500" title="삭제">
                    <IoTrashOutline size={20} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                <IoClose size={28} />
              </button>
            </div>

            {/* 작성자 프로필 */}
            <div className="p-6 border-b-2 border-gray-200 mt-8 md:mt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center font-bold text-lg border border-black">
                  {currentPost.author?.name?.[0] || 'I'}
                </div>
                <div>
                  {/* 🔥 Populate 덕분에 이제 여기서 이름이 ??로 뜨지 않습니다 */}
                  <h3 className="font-bold text-lg text-ink leading-tight">
                    {currentPost.author?.name || '알 수 없음'}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">
                    {currentPost.author?.generation ? `${currentPost.author.generation}기` : '??기'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full border-b-2 border-ink p-2 font-display text-2xl focus:outline-none bg-yellow-50"
                  />
                  <textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full border-2 border-gray-300 p-2 h-40 resize-none focus:outline-none focus:border-ink"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm font-bold text-gray-500">취소</button>
                    <button onClick={handleEditSave} className="px-3 py-1 text-sm font-bold bg-ink text-white">저장</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-display text-ink mb-2">{currentPost.title}</h2>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{currentPost.content}</p>
                  <p className="text-xs text-gray-400 mt-2 font-bold">{new Date(currentPost.createdAt).toLocaleDateString()}</p>
                </div>
              )}
              
              <hr className="border-gray-300 border-dashed" />
              
              {/* 댓글 목록 */}
              <div className="space-y-4">
                {currentPost.comments && currentPost.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-sm">
                    <span className="font-bold text-ink shrink-0">{comment.userName}</span>
                    <span className="text-gray-700 leading-snug">{comment.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 좋아요/댓글 입력창 */}
            {!isEditing && (
              <div className="p-4 bg-white border-t-2 border-ink">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={handleLike} className="group">
                    {isLiked ? (
                      <IoHeart size={30} className="text-red-500 transition-transform group-active:scale-90" />
                    ) : (
                      <IoHeartOutline size={30} className="text-ink transition-transform group-active:scale-90" />
                    )}
                  </button>
                  <span className="font-bold text-sm">좋아요 {currentPost.likes?.length || 0}개</span>
                </div>

                <form onSubmit={handleComment} className="flex gap-2">
                  <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="감상평 남기기..." 
                    className="flex-1 bg-gray-100 border-2 border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink focus:bg-white"
                  />
                  <button type="submit" disabled={!commentText.trim()} className="text-ink font-bold px-3 disabled:opacity-30">
                    게시
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PostModal;