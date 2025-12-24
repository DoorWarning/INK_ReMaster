import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { IoTrashOutline, IoPencil, IoAdd } from 'react-icons/io5';
import LedgerModal from './LedgerModal'; // 🔥 모달 import 필수!
import useAuthStore from '../store/useAuthStore'; // 권한 확인용

const LedgerSection = ({ isAdmin }) => {
  const [ledgers, setLedgers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('2024-2'); // 기본값 혹은 API 로드 필요

  // 모달 및 선택된 데이터 상태
  const [showModal, setShowModal] = useState(false);
  const [targetLedger, setTargetLedger] = useState(null);

  // 1. 학기 목록 불러오기 (예시)
  const fetchSemesters = useCallback(async () => {
    try {
      const res = await api.get('/ledgers/semesters'); // 백엔드 라우트 필요
      if (res.data.length > 0) setSemesters(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 2. 장부 목록 불러오기
  const fetchLedgers = useCallback(async () => {
    try {
      // selectedSemester가 바뀔 때마다 호출됨
      const res = await api.get(`/ledgers?semester=${selectedSemester}`);
      setLedgers(res.data);
    } catch (err) {
      console.error("장부 로드 실패", err);
    }
  }, [selectedSemester]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  // 삭제 핸들러
  const handleDelete = async (id) => {
    if(!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/ledgers/${id}`);
      fetchLedgers(); // 목록 갱신
    } catch (err) {
      alert("삭제 실패");
    }
  };

  // 🔥 [핵심] 생성 모드로 모달 열기
  const handleOpenCreate = () => {
    setTargetLedger(null); // 데이터 없음 -> 생성 모드
    setShowModal(true);
  };

  // 🔥 [핵심] 수정 모드로 모달 열기
  const handleOpenEdit = (item) => {
    setTargetLedger(item); // 데이터 있음 -> 수정 모드
    setShowModal(true);
  };

  return (
    <div className="w-full p-4">
      {/* 상단 컨트롤 바 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display text-ink">회계 장부</h2>
        
        <div className="flex gap-3">
           {/* 학기 선택 셀렉트박스 (간단 구현) */}
           <select 
             className="border-2 border-ink p-2 font-bold"
             value={selectedSemester}
             onChange={(e) => setSelectedSemester(e.target.value)}
           >
             {/* 예시 옵션들, 실제론 semesters map */}
             <option value="2025-1학기">2025-1학기</option>
             <option value="2024-2학기">2024-2학기</option>
           </select>

           {isAdmin && (
            <button 
              onClick={handleOpenCreate} 
              className="flex items-center gap-2 bg-ink text-white px-4 py-2 font-bold hover:bg-gray-800 transition"
            >
              <IoAdd /> 내역 추가
            </button>
           )}
        </div>
      </div>

      {/* 장부 리스트 */}
      <div className="space-y-4">
        {ledgers.length === 0 ? (
          <p className="text-center text-gray-500 py-10">등록된 내역이 없습니다.</p>
        ) : (
          ledgers.map((item) => (
            <div key={item._id} className="border-2 border-ink p-4 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 font-bold mb-1 rounded">{item.semester}</span>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">총 지출: <span className="text-ink font-bold">{Number(item.totalAmount).toLocaleString()}원</span></p>
                
                {/* 세부 항목 미리보기 */}
                <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                  {item.items.slice(0, 2).map((sub, i) => (
                    <li key={i}>{sub.description} ({sub.amount.toLocaleString()}원)</li>
                  ))}
                  {item.items.length > 2 && <li>...외 {item.items.length - 2}건</li>}
                </ul>
              </div>

              {/* 관리자 버튼 영역 */}
              {isAdmin && (
                <div className="flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                  <button 
                    onClick={() => handleOpenEdit(item)} 
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-bold text-sm"
                  >
                    <IoPencil /> 수정
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id)} 
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-sm"
                  >
                    <IoTrashOutline /> 삭제
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 🔥 [핵심] 모달 연결 */}
      {showModal && (
        <LedgerModal
          onClose={() => {
            setShowModal(false);
            setTargetLedger(null); // 닫을 때 타겟 초기화
          }}
          onUpdate={fetchLedgers}      // 저장 성공 시 목록 새로고침
          initialData={targetLedger}   // 수정할 데이터 전달 (없으면 생성)
        />
      )}
    </div>
  );
};

export default LedgerSection;