import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { IoTrashOutline, IoPencil, IoAdd } from 'react-icons/io5';
// ... imports

const LedgerSection = ({ isAdmin }) => {
  // 1. 상태 관리 (State)
  const [ledgers, setLedgers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('2024-2'); // 학기 선택 (Selection)

  // 🔥 [수정] 모달과 선택 데이터를 확실히 분리
  const [showModal, setShowModal] = useState(false); // 오직 "창이 열렸나?"만 관리
  const [targetLedger, setTargetLedger] = useState(null); // 오직 "수정할 놈이 누구냐?"만 관리

  const [formData, setFormData] = useState({
    date: '',
    description: '',
    type: 'expense',
    amount: '',
    category: '회식비',
    semester: '2024-2'
  });

  // ... (fetchSemesters, fetchLedgers 등 조회 로직은 동일)

  // 2. [Case A] "추가하기" 버튼 눌렀을 때
  const handleOpenCreate = () => {
    setTargetLedger(null); // 타겟 없음 (생성 모드)
    setFormData({          // 폼 초기화
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'expense',
      amount: '',
      category: '회식비',
      semester: selectedSemester // 현재 보고 있는 학기로 자동 설정
    });
    setShowModal(true);    // 모달 열기
  };

  // 3. [Case B] "수정(연필)" 버튼 눌렀을 때
  const handleOpenEdit = (item) => {
    setTargetLedger(item); // 타겟 설정 (수정 모드)
    setFormData({          // 기존 데이터 폼에 채우기
      date: item.date.split('T')[0],
      description: item.description,
      type: item.type,
      amount: item.amount,
      category: item.category,
      semester: item.semester
    });
    setShowModal(true);    // 모달 열기
  };

  // 4. 저장 (Submit) 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (targetLedger) {
        // [수정 로직] targetLedger가 있으면 PUT
        await api.put(`/ledgers/${targetLedger._id}`, formData);
        alert("수정되었습니다.");
      } else {
        // [생성 로직] targetLedger가 없으면 POST
        await api.post('/ledgers', formData);
        alert("추가되었습니다.");
      }

      // 공통 마무리
      setShowModal(false);
      setTargetLedger(null);
      fetchLedgers(); // 목록 갱신
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="w-full p-4">
      {/* ... 상단 학기 선택 드롭다운 등 ... */}

      {/* 추가 버튼 */}
      {isAdmin && (
        <button onClick={handleOpenCreate} className="...">
          <IoAdd /> 내역 추가
        </button>
      )}

      {/* 리스트 영역 */}
      {/* ... 테이블 렌더링 ... */}
      {ledgers.map((item) => (
        <div key={item._id} className="...">
          {/* 내용들... */}
          
          {/* 관리자 버튼 영역 */}
          {isAdmin && (
            <div className="flex gap-2">
              {/* 수정 버튼: handleOpenEdit 호출 */}
              <button onClick={() => handleOpenEdit(item)}>
                <IoPencil />
              </button>
              {/* 삭제 버튼 */}
              <button onClick={() => handleDelete(item._id)}>
                <IoTrashOutline />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* 모달 영역 */}
      {showModal && (
        <div className="fixed inset-0 ...">
          <div className="bg-white ...">
            <h2>{targetLedger ? '내역 수정' : '새 내역 추가'}</h2>
            <form onSubmit={handleSubmit}>
              {/* input 필드들은 formData와 연결 */}
              {/* ... */}
              <button type="submit">저장</button>
              <button type="button" onClick={() => setShowModal(false)}>취소</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerSection;