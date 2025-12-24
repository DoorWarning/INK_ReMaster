import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTrashOutline, IoPencilOutline, IoChatbubbleEllipsesOutline, IoSend, IoSaveOutline, IoCloseCircleOutline } from 'react-icons/io5';
import api from '../api/axios'
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';

const NoticeModal = ({ post, onClose, onUpdate }) => {
  const { user } = useAuthStore();
  const { showAlert, showConfirm } = useAlertStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  
  // 댓글 및 현재 글 상태
  const [commentText, setCommentText] = useState('');
  const [currentPost, setCurrentPost] = useState(post); 
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const isAdmin = user && user.role === 'admin';

  // 모달이 열리면 서버에서 최신 데이터를 다시 가져옴
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const res = await api.get(`/posts/${post._id}`);
        setCurrentPost(res.data);
        setEditTitle(res.data.title);
        setEditContent(res.data.content);
      } catch (err) {
        console.error("최신 데이터 로드 실패:", err);
      }
    };
    fetchLatestData();
  }, [post._id]);

  const handlePostDelete = () => {
    showConfirm("이 공지사항을 삭제하시겠습니까? 🗑️", async () => {
      try {
        await api.delete(`/posts/${post._id}`, { data: { userId: user._id } });
        showAlert("삭제되었습니다.");
        onUpdate();
        onClose();
      } catch (err) { showAlert("삭제 실패"); }
    });
  };

  const handlePostEditSave = async () => {
    try {
      const res = await api.put(`/posts/${post._id}`, {
        userId: user._id, title: editTitle, content: editContent
      });
      setCurrentPost(prev => ({ ...prev, title: res.data.title, content: res.data.content }));
      setIsEditing(false);
      onUpdate();
      showAlert("수정되었습니다. ✏️");
    } catch (err) { showAlert("수정 실패"); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return showAlert('로그인이 필요합니다!');

    try {
      const res = await api.post(`/posts/${currentPost._id}/comment`, {
        userId: user._id,
        userName: user.name || user.email.split('@')[0],
        text: commentText
      });
      setCurrentPost(res.data);
      setCommentText('');
    } catch (err) { 
      console.error(err);
      showAlert("댓글 등록 실패");
    }
  };

  const handleCommentDelete = (commentId) => {
    showConfirm("댓글을 삭제하시겠습니까?", async () => {
      try {
        const res = await api.delete(`/posts/${currentPost._id}/comment/${commentId}`, {
          data: { userId: user._id }
        });
        setCurrentPost(res.data);
      } catch (err) { showAlert("삭제 실패"); }
    });
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
  };

  const saveEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/posts/${currentPost._id}/comment/${commentId}`, {
        userId: user._id,
        text: editCommentText
      });
      setCurrentPost(res.data);
      setEditingCommentId(null);
    } catch (err) { showAlert("수정 실패"); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        
        {/* 모달 박스 레이아웃: flex-col, max-h-[90vh]로 화면 넘어가는 것 방지 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl border-4 border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* 1. 상단바 (고정) */}
          <div className="h-4 bg-ink w-full flex-shrink-0"></div>

          {/* 2. 헤더 (고정) */}
          <div className="p-6 md:p-8 border-b-2 border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-ink mb-2">
                  <span className="bg-ink text-white text-xs px-2 py-1 font-bold rounded-sm">NOTICE</span>
                  <span className="text-sm font-bold text-gray-500">{new Date(currentPost.createdAt).toLocaleDateString()}</span>
                </div>
                {isEditing ? (
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-2xl font-display border-b-2 border-ink bg-yellow-50 focus:outline-none py-1" />
                ) : (
                  <h2 className="text-3xl font-display text-ink leading-tight">{currentPost.title}</h2>
                )}
                <p className="text-sm text-gray-600 font-bold mt-2">작성자: {currentPost.author?.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><IoClose size={28} /></button>
            </div>
          </div>

          {/* 3. 본문 영역 (남는 공간 차지, 스크롤 가능) */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white min-h-[150px]">
            {isEditing ? (
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-full border-2 border-gray-300 p-4 resize-none focus:outline-none focus:border-ink" />
            ) : (
              <div className="whitespace-pre-wrap leading-loose text-gray-800 text-lg">{currentPost.content}</div>
            )}
          </div>

          {/* 4. 댓글 영역 (하단 고정) */}
          {!isEditing && (
            <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <IoChatbubbleEllipsesOutline className="text-ink" size={20} />
                <span className="font-bold text-sm text-ink">댓글 {currentPost.comments?.length || 0}개</span>
              </div>

              {/* 🔥 댓글 리스트: 최대 높이 설정 및 내부 스크롤 */}
              <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-gray-100 rounded bg-gray-100/50 p-2">
                {currentPost.comments && currentPost.comments.length > 0 ? (
                  currentPost.comments.map((comment) => (
                    <div key={comment._id} className="bg-white p-3 rounded border border-gray-200 text-sm group shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-ink">{comment.userName}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={editCommentText} 
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="flex-1 border-b border-ink bg-yellow-50 focus:outline-none px-1"
                            autoFocus
                          />
                          <button onClick={() => saveEditComment(comment._id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><IoSaveOutline /></button>
                          <button onClick={() => setEditingCommentId(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded"><IoCloseCircleOutline /></button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-end">
                          <p className="text-gray-700 leading-snug break-all">{comment.text}</p>
                          
                          {user && (user._id === comment.userId || user.role === 'admin') && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditComment(comment)} className="text-xs font-bold text-gray-400 hover:text-ink">수정</button>
                              <button onClick={() => handleCommentDelete(comment._id)} className="text-xs font-bold text-gray-400 hover:text-red-500">삭제</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">아직 댓글이 없습니다.</p>
                )}
              </div>

              {/* 댓글 입력창 (항상 보임) */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="의견을 남겨주세요..." 
                  className="flex-1 bg-white border-2 border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-ink focus:bg-yellow-50 transition-colors"
                />
                <button type="submit" disabled={!commentText.trim()} className="bg-ink text-white px-4 py-2 rounded-sm hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold text-sm">
                  <IoSend size={14} /> 등록
                </button>
              </form>
            </div>
          )}

          {/* 관리자 버튼 (수정 모드일 때만 하단에 표시) */}
          {isAdmin && (
            <div className={`px-6 pb-6 pt-0 bg-gray-50 flex justify-end gap-3 flex-shrink-0 ${!isEditing && 'border-t border-gray-200 pt-4 mt-0'}`}>
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded">취소</button>
                  <button onClick={handlePostEditSave} className="px-4 py-2 bg-ink text-white font-bold border-2 border-ink shadow-sm hover:-translate-y-1 transition-transform">수정 완료</button>
                </>
              ) : (
                <div className="flex gap-2 w-full justify-end">
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-xs font-bold text-gray-600 hover:border-ink hover:text-ink transition bg-white"><IoPencilOutline /> 수정</button>
                  <button onClick={handlePostDelete} className="flex items-center gap-1 px-3 py-1 border border-red-200 rounded text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-500 transition bg-white"><IoTrashOutline /> 삭제</button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NoticeModal;