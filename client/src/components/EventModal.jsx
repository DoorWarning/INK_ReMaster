import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTrashOutline, IoPencilOutline, IoAdd, IoTimeOutline } from 'react-icons/io5';
import api from '../api/axios'
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';

const EventModal = ({ date, events: initialEvents, onClose, onUpdate }) => {
  const { user } = useAuthStore();
  const { showConfirm, showAlert } = useAlertStore();
  const isAdmin = user && user.role === 'admin';

  // 🔥 [수정] props로 받은 events는 초기값일 뿐, 실제로는 state로 관리
  const [currentEvents, setCurrentEvents] = useState(initialEvents);
  
  const [viewMode, setViewMode] = useState('list'); // list, form
  const [formData, setFormData] = useState({ id: null, title: '', description: '', type: 'meet' });

  // 🔥 [추가] 모달이 열리면(또는 날짜가 바뀌면) 서버에서 그날의 최신 일정 다시 가져오기
  useEffect(() => {
    const fetchDailyEvents = async () => {
      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 백엔드에 하루치 데이터 요청
        const res = await api.get(`http://localhost:4000/api/events?year=${year}&month=${month}&day=${day}`);
        setCurrentEvents(res.data);
      } catch (err) {
        console.error("일정 상세 로드 실패", err);
      }
    };

    fetchDailyEvents();
  }, [date]); // 날짜가 변경될 때마다 실행

  // 폼 초기화 및 열기
  const openForm = (event = null) => {
    if (event) {
      setFormData({ id: event._id, title: event.title, description: event.description || '', type: event.type });
    } else {
      setFormData({ id: null, title: '', description: '', type: 'meet' });
    }
    setViewMode('form');
  };

  // 저장 (추가 or 수정)
  const handleSubmit = async () => {
    if (!formData.title.trim()) return showAlert("일정 제목을 입력하세요.");
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: date, // 현재 선택된 날짜
        userId: user._id
      };

      if (formData.id) {
        await api.put(`http://localhost:4000/api/events/${formData.id}`, payload);
      } else {
        await api.post(`http://localhost:4000/api/events`, payload);
      }
      
      // 저장 후 달력 갱신 (부모 컴포넌트용)
      onUpdate();
      
      // 🔥 저장 후 현재 모달 리스트도 즉시 갱신 (사용자 경험 향상)
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const res = await api.get(`http://localhost:4000/api/events?year=${year}&month=${month}&day=${day}`);
      setCurrentEvents(res.data);

      setViewMode('list'); // 목록으로 복귀
    } catch (err) {
      showAlert("저장 실패");
    }
  };

  // 삭제
  const handleDelete = (id) => {
    showConfirm("이 일정을 삭제하시겠습니까?", async () => {
      try {
        await api.delete(`http://localhost:4000/api/events/${id}`);
        
        // 삭제 후 리스트 갱신
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const res = await api.get(`http://localhost:4000/api/events?year=${year}&month=${month}&day=${day}`);
        setCurrentEvents(res.data);

        onUpdate(); // 달력 점 갱신
      } catch (err) { showAlert("삭제 실패"); }
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md border-4 border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]"
        >
          {/* 헤더 */}
          <div className="bg-ink p-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-display flex items-center gap-2">
              <IoTimeOutline />
              {date.getFullYear()}. {date.getMonth() + 1}. {date.getDate()}
            </h2>
            <button onClick={onClose}><IoClose size={24} /></button>
          </div>

          {/* 본문 */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            
            {viewMode === 'list' ? (
              <>
                {/* 🔥 state인 currentEvents를 사용해서 렌더링 */}
                {currentEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">일정이 없습니다.</div>
                ) : (
                  <div className="space-y-3">
                    {currentEvents.map((evt) => (
                      <div key={evt._id} className={`p-4 border-2 rounded-sm relative group ${evt.type === 'important' ? 'border-red-500 bg-red-50' : (evt.type === 'party' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white')}`}>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-ink">{evt.title}</h3>
                          {isAdmin && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openForm(evt)} className="text-gray-500 hover:text-ink"><IoPencilOutline /></button>
                              <button onClick={() => handleDelete(evt._id)} className="text-gray-500 hover:text-red-500"><IoTrashOutline /></button>
                            </div>
                          )}
                        </div>
                        {evt.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{evt.description}</p>}
                        <div className="mt-2 text-xs font-bold uppercase text-gray-400 tracking-wider text-right">{evt.type}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isAdmin && (
                  <button 
                    onClick={() => openForm()}
                    className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 text-gray-400 font-bold hover:border-ink hover:text-ink hover:bg-gray-50 transition flex justify-center items-center gap-2"
                  >
                    <IoAdd size={20} /> 새 일정 추가
                  </button>
                )}
              </>
            ) : (
              /* 입력 폼 (Admin Only) */
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-sm mb-1">제목</label>
                  <input 
                    type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full border-2 border-ink p-2 focus:outline-none focus:bg-yellow-50"
                    placeholder="일정 제목"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">타입</label>
                  <div className="flex gap-2">
                    {['meet', 'important', 'party'].map(type => (
                      <button 
                        key={type}
                        onClick={() => setFormData({...formData, type})}
                        className={`flex-1 py-2 text-xs font-bold border-2 capitalize transition-colors
                          ${formData.type === type 
                            ? (type === 'important' ? 'bg-red-500 text-white border-red-500' : (type === 'party' ? 'bg-yellow-400 text-ink border-yellow-400' : 'bg-ink text-white border-ink'))
                            : 'bg-white text-gray-400 border-gray-200'
                          }
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">설명</label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border-2 border-ink p-2 h-24 resize-none focus:outline-none focus:bg-yellow-50"
                    placeholder="상세 내용을 입력하세요..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setViewMode('list')} className="flex-1 py-2 font-bold text-gray-500 hover:bg-gray-100">취소</button>
                  <button onClick={handleSubmit} className="flex-1 py-2 bg-ink text-white font-bold border-2 border-ink shadow-sm hover:translate-y-1">저장</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventModal;