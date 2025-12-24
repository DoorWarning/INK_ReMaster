// client/src/store/useAlertStore.js
import { create } from 'zustand';

const useAlertStore = create((set) => ({
  isOpen: false,
  message: '',
  type: 'alert', // 'alert' | 'confirm'
  onConfirm: null, // 확인 버튼 눌렀을 때 실행할 함수

  // 일반 알림 띄우기
  showAlert: (msg) => set({ isOpen: true, message: msg, type: 'alert', onConfirm: null }),

  // 확인/취소 알림 띄우기 (콜백 함수 받음)
  showConfirm: (msg, callback) => set({ isOpen: true, message: msg, type: 'confirm', onConfirm: callback }),

  // 닫기
  closeAlert: () => set({ isOpen: false }),
}));

export default useAlertStore;