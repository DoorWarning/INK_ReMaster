// client/src/store/useAuthStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // 👈 저장 기능 추가

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // 로그인 동작
      login: (userData) => set({ user: userData, isAuthenticated: true }),

      // 로그아웃 동작
      logout: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('ink-auth-storage'); // 저장소 비우기
      },
    }),
    {
      name: 'ink-auth-storage', // 브라우저 LocalStorage에 저장될 이름
      storage: createJSONStorage(() => localStorage), // 저장 위치 설정
    }
  )
);

export default useAuthStore;