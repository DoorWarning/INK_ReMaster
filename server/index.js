require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport'); // 👈 라이브러리 가져오기

// 우리가 만든 설정 파일 가져오기
const passportConfig = require('./passport'); 
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const uploadRoute = require('./routes/upload');
const userRoute = require('./routes/users');
const contestRoutes = require('./routes/contests');

const app = express();

app.set('trust proxy', 1);

// 1. DB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ DB Connection Error:', err));

// 2. 미들웨어 설정
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mediaink.vercel.app',      // Vercel 배포 주소 (여기가 핵심!)
    process.env.CLIENT_URL              // 환경변수로 설정한 주소 (혹시 몰라서 추가)
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Passport 설정 실행
app.use(passport.initialize());
passportConfig(); // 👈 여기서 ./passport.js의 설정을 실행합니다.

// 4. 라우트 연결
app.use('/api/auth', authRoute);   // 로그인 관련 (여기에 google 인증 로직이 있음)
app.use('/api/posts', postRoute);  // 게시글 관련
app.use('/api/upload', uploadRoute); // 업로드 관련
app.use('/api/users', userRoute);  // 유저 관리 관련
app.use('/api/events', require('./routes/events'));  // 달력 일정 관련
app.use('/api/ledgers', require('./routes/ledgers')); // 회계 관련
app.use('/api/config', require('./routes/config')); // 카카오톡 관련
app.use('/api/contests', contestRoutes); // 공모전 관련

// 5. 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});