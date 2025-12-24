import React, { useState } from 'react'; // useEffect 제거 (초기값 직접 설정 시 불필요)
import api from '../api/axios'
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoAdd, IoTrashOutline, IoReceiptOutline } from 'react-icons/io5';
import useAuthStore from '../store/useAuthStore';
import useAlertStore from '../store/useAlertStore';

const LedgerModal = ({ onClose, onUpdate }) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  
  // 🔥 [수정] 초기값을 빈 값으로 두고 직접 입력받음
  const [semester, setSemester] = useState(''); 
  const [title, setTitle] = useState('');
  
  const [items, setItems] = useState([
    { description: '', qty: 1, price: 0, amount: 0, note: '' }
  ]);
  
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'qty' || field === 'price') {
      newItems[index].amount = Number(newItems[index].qty) * Number(newItems[index].price);
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', qty: 1, price: 0, amount: 0, note: '' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    setPreviews(prev => [...prev, ...selected.map(f => URL.createObjectURL(f))]);
  };

  const handleSubmit = async () => {
    // 유효성 검사 추가
    if (!semester.trim()) return showAlert("학기(기간)를 입력해주세요.");
    if (!title.trim()) return showAlert("행사 이름을 입력해주세요.");
    
    try {
      let imageUrls = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append('images', f));
        const upRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrls = upRes.data.urls;
      }

      await api.post('/ledgers', {
        semester, title, items, totalAmount, imageUrls, userId: user._id
      });

      showAlert("장부가 등록되었습니다! 💰");
      onUpdate();
      onClose();
    } catch (err) {
      showAlert("등록 실패");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-4xl border-4 border-ink shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* 헤더 */}
          <div className="bg-ink p-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-display flex items-center gap-2"><IoReceiptOutline /> 회계 내역 작성</h2>
            <button onClick={onClose}><IoClose size={24} /></button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* 기본 정보 */}
            <div className="flex gap-4 mb-4">
              <div className="w-1/3">
                <label className="block font-bold text-sm mb-1">기간/학기</label>
                {/* 🔥 [수정] Select -> Input으로 변경 */}
                <input 
                  type="text" 
                  value={semester} 
                  onChange={e => setSemester(e.target.value)} 
                  className="w-full border-2 border-ink p-2 font-bold focus:outline-none focus:bg-yellow-50"
                  placeholder="예: 2025-1학기"
                />
              </div>
              <div className="w-2/3">
                <label className="block font-bold text-sm mb-1">행사명 (제목)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full border-2 border-ink p-2 focus:outline-none focus:bg-yellow-50" 
                  placeholder="예: 신입생 환영회" 
                />
              </div>
            </div>

            {/* 엑셀 입력 테이블 (기존 동일) */}
            <div className="border-2 border-ink mb-4 overflow-hidden rounded-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 border-b-2 border-ink text-ink">
                  <tr>
                    <th className="p-2 w-8">#</th>
                    <th className="p-2">품목/내용</th>
                    <th className="p-2 w-20">단가</th>
                    <th className="p-2 w-16">수량</th>
                    <th className="p-2 w-24">금액</th>
                    <th className="p-2">비고</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                      <td className="p-2"><input type="text" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="w-full bg-gray-50 border border-gray-300 p-1" placeholder="품목" /></td>
                      <td className="p-2"><input type="number" value={item.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} className="w-full bg-gray-50 border border-gray-300 p-1 text-right" /></td>
                      <td className="p-2"><input type="number" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full bg-gray-50 border border-gray-300 p-1 text-center" /></td>
                      <td className="p-2"><input type="text" value={item.amount.toLocaleString()} disabled className="w-full bg-gray-100 border border-transparent p-1 text-right font-bold text-ink" /></td>
                      <td className="p-2"><input type="text" value={item.note} onChange={e => handleItemChange(idx, 'note', e.target.value)} className="w-full bg-gray-50 border border-gray-300 p-1" /></td>
                      <td className="p-2 text-center"><button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><IoTrashOutline /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 bg-gray-50 border-t border-gray-300">
                <button onClick={addItem} className="flex items-center gap-1 text-sm font-bold text-ink hover:underline"><IoAdd /> 항목 추가</button>
              </div>
            </div>

            {/* 합계 및 영수증 */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1">
                <label className="block font-bold text-sm mb-2">영수증 첨부 (선택)</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-ink file:text-sm file:font-bold file:bg-white file:text-ink hover:file:bg-gray-50"/>
                <div className="flex gap-2 mt-2">
                  {previews.map((src, i) => <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover border border-gray-300" />)}
                </div>
              </div>
              <div className="bg-yellow-50 border-2 border-ink p-4 min-w-[200px] text-right">
                <span className="block text-sm font-bold text-gray-500">총 지출 합계</span>
                <span className="block text-3xl font-display text-ink">{totalAmount.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t-2 border-gray-200 bg-gray-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2 font-bold text-gray-500 border-2 border-gray-300 bg-white hover:bg-gray-100">취소</button>
             <button onClick={handleSubmit} className="px-6 py-2 font-bold text-white bg-ink border-2 border-ink hover:bg-gray-800">등록하기</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LedgerModal;