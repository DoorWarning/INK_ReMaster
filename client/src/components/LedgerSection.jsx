import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IoWalletOutline, IoAdd, IoTrashOutline, IoReceiptOutline, IoChevronDown, IoChevronUp, IoPencil } from 'react-icons/io5';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';
import LedgerModal from './LedgerModal';

const LedgerSection = () => {
  const { user } = useAuthStore();
  const { showConfirm, showAlert } = useAlertStore();
  
  const [semesters, setSemesters] = useState([]); 
  const [selectedSemester, setSelectedSemester] = useState(''); 
  const [ledgers, setLedgers] = useState([]); 
  
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [targetLedger, setTargetLedger] = useState(null);

  const [openReceipts, setOpenReceipts] = useState({});

  // 1. 학기 목록 불러오기
  const fetchSemesters = useCallback(async () => {
    try {
      // 🔥 [수정] /api 제거
      const res = await api.get('/ledgers/semesters');
      const list = res.data;
      setSemesters(list);

      if (list.length > 0 && !selectedSemester) {
        setSelectedSemester(list[0]);
      }
      else if (list.length > 0 && !list.includes(selectedSemester)) {
        setSelectedSemester(list[0]);
      }
    } catch (err) {
      console.error("학기 목록 로드 실패", err);
    }
  }, [selectedSemester]);

  // 2. 장부 데이터 불러오기
  const fetchLedgers = useCallback(async () => {
    if (!selectedSemester) return; 

    try {
      // 🔥 [수정] /api 제거
      const res = await api.get(`/ledgers?semester=${selectedSemester}`);
      setLedgers(res.data);
    } catch (err) { console.error(err); }
  }, [selectedSemester]);

  useEffect(() => {
    fetchSemesters();
  }, []); 

  useEffect(() => {
    fetchLedgers();
  }, [selectedSemester, fetchLedgers]);

  const handleUpdate = async () => {
    await fetchSemesters(); 
    await fetchLedgers();   
  };

  const toggleReceipt = (id) => {
    setOpenReceipts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = (id) => {
    showConfirm("정말 이 장부를 삭제하시겠습니까?", async () => {
      try {
        // 🔥 [수정] /api 제거
        await api.delete(`/ledgers/${id}`, { data: { userId: user._id } });
        fetchLedgers(); 
        showAlert("삭제되었습니다.");
      } catch (err) { showAlert("권한이 없거나 오류 발생"); }
    });
  };

  const handleOpenCreate = () => {
    setTargetLedger(null);
    setIsWriteModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setTargetLedger(item);
    setIsWriteModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto mb-20">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b-2 border-ink pb-4 gap-4">
        <div className="flex items-center gap-4">
          <IoWalletOutline size={32} className="text-ink" />
          <h2 className="text-3xl font-display text-ink whitespace-nowrap">회계 장부</h2>
          
          <div className="ml-4">
            {semesters.length > 0 ? (
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)} 
                className="border-2 border-ink p-2 font-bold text-lg bg-white focus:outline-none focus:bg-yellow-50 cursor-pointer min-w-[150px]"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            ) : (
              <span className="text-gray-400 font-bold text-sm ml-2">등록된 내역 없음</span>
            )}
          </div>
        </div>

        {user?.role === 'admin' && (
          <button onClick={handleOpenCreate} className="flex items-center gap-1 bg-ink text-white px-4 py-2 font-bold border-2 border-ink hover:bg-gray-800 shadow-md active:translate-y-1 whitespace-nowrap">
            <IoAdd /> 내역 추가
          </button>
        )}
      </div>

      <div className="space-y-8">
        {ledgers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-300">
            {semesters.length === 0 
              ? "아직 등록된 회계 장부가 없습니다. 첫 내역을 추가해보세요!" 
              : `'${selectedSemester}'의 회계 내역이 없습니다.`}
          </div>
        ) : (
          ledgers.map((ledger) => (
            <div key={ledger._id} className="bg-white border-3 border-ink shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden">
              <div className="bg-gray-100 border-b-2 border-ink p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-ink">{ledger.title}</h3>
                  <span className="text-xs text-gray-500 font-bold">{new Date(ledger.createdAt).toLocaleDateString()} 작성</span>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(ledger)} className="text-blue-500 hover:text-blue-700 p-2">
                      <IoPencil size={20} />
                    </button>
                    <button onClick={() => handleDelete(ledger._id)} className="text-red-400 hover:text-red-600 p-2">
                      <IoTrashOutline size={20} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 md:p-6">
                <table className="w-full text-sm text-left mb-6">
                  <thead className="bg-ink text-white">
                    <tr>
                      <th className="p-2 w-10 text-center">No</th>
                      <th className="p-2">내역</th>
                      <th className="p-2 text-right">금액</th>
                      <th className="p-2 text-gray-300 hidden sm:table-cell">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ledger.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-medium">
                          {item.description} 
                          <span className="text-xs text-gray-400 block sm:hidden">{item.qty > 1 ? `${item.price.toLocaleString()}x${item.qty}` : ''}</span>
                        </td>
                        <td className="p-2 text-right font-bold text-ink">{item.amount.toLocaleString()}원</td>
                        <td className="p-2 text-gray-500 hidden sm:table-cell">{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-yellow-50 border-t-2 border-ink">
                    <tr>
                      <td colSpan="2" className="p-3 text-right font-bold text-ink">합계</td>
                      <td className="p-3 text-right font-display text-lg text-ink decoration-double underline">{ledger.totalAmount.toLocaleString()}원</td>
                      <td className="hidden sm:table-cell"></td>
                    </tr>
                  </tfoot>
                </table>
                {ledger.images && ledger.images.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <button onClick={() => toggleReceipt(ledger._id)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-ink transition-colors">
                      <IoReceiptOutline /> 영수증 {openReceipts[ledger._id] ? '접기' : '펼쳐보기'} {openReceipts[ledger._id] ? <IoChevronUp /> : <IoChevronDown />}
                    </button>
                    <AnimatePresence>
                      {openReceipts[ledger._id] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="flex gap-4 overflow-x-auto py-4 mt-2 bg-gray-50 p-4 rounded border border-gray-200">
                            {ledger.images.map((img, i) => (
                              <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                                <img src={img.url} alt="receipt" className="h-40 border-2 border-gray-300 hover:border-ink cursor-zoom-in" />
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isWriteModalOpen && (
        <LedgerModal 
          onClose={() => setIsWriteModalOpen(false)} 
          onUpdate={handleUpdate} 
          initialData={targetLedger} 
        />
      )}
    </div>
  );
};

export default LedgerSection;