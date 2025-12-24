// client/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  // .env에서 주소를 불러옴 (없으면 로컬호스트 기본값)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// (선택사항) 요청 인터셉터: 나중에 토큰 자동 첨부 등을 여기서 할 수 있음
api.interceptors.request.use(
  (config) => {
    // 예: 로컬스토리지에 토큰이 있다면 헤더에 자동 추가
    // const token = JSON.parse(localStorage.getItem('auth-storage'))?.state?.token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;