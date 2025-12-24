const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// 🔥 [중요] 비밀번호 찾기 기능을 위한 모듈 임포트
const crypto = require('crypto');
const nodemailer = require('nodemailer'); 

// JWT 토큰 생성 함수
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'secretKey',
    { expiresIn: '1d' }
  );
};

// 1. 일반 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, studentId, generation } = req.body;

    // 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "이미 가입된 이메일입니다." });

    // 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      studentId,
      generation,
      isApproved: false // 승인 대기
    });

    await newUser.save();
    res.status(201).json({ msg: "회원가입 신청 완료 (승인 대기)" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 2. 일반 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "가입되지 않은 이메일입니다." });

    // 구글 로그인으로 가입한 경우 비밀번호가 없을 수 있음
    if (!user.password) return res.status(400).json({ msg: "구글 로그인으로 가입된 계정입니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "비밀번호가 일치하지 않습니다." });

    // 승인 여부 체크
    if (!user.isApproved) return res.status(403).json({ msg: "approval_pending" });

    const token = generateToken(user);

    res.json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 3. 구글 로그인 시작
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 4. 구글 로그인 콜백
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?fail=true', session: false }),
  async (req, res) => {
    const user = req.user;
    
    // 🔥 [수정] 배포 주소(CLIENT_URL) 사용 (없으면 로컬호스트)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 신규 유저 -> 추가 정보 입력 페이지
    if (!user.studentId) {
      return res.redirect(`${clientUrl}/login?google=pending&email=${user.email}&name=${encodeURIComponent(user.name)}&googleId=${user.googleId}`);
    }

    // 미승인 유저
    if (!user.isApproved) {
      return res.redirect(`${clientUrl}/login?fail=approval_pending`);
    }

    // 로그인 성공 -> 메인으로
    res.redirect(`${clientUrl}/?login=success&email=${user.email}`);
  }
);

// 5. 구글 회원가입 마무리 (학번, 기수 입력)
router.post('/google/register', async (req, res) => {
  try {
    const { email, googleId, name, studentId, generation } = req.body;
    
    // 이메일로 유저 찾아서 업데이트
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "유저를 찾을 수 없습니다." });

    user.name = name;
    user.studentId = studentId;
    user.generation = generation;
    user.googleId = googleId;
    // user.isApproved = false; // 기본값 유지

    await user.save();
    res.json({ msg: "정보 등록 완료", user });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 6. 클라이언트 세션 동기화 (구글 로그인 후 호출)
router.post('/sync', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!user.isApproved) return res.status(403).json({ msg: "approval_pending" });

    const token = generateToken(user);
    res.json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ----------------------------------------------------
// 🔥 비밀번호 찾기 관련 라우트 (추가됨)
// ----------------------------------------------------

// 7. 비밀번호 재설정 요청 (실제 이메일 발송)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, name, studentId } = req.body;

    // 1. 정보가 일치하는 유저 찾기
    const user = await User.findOne({ email, name, studentId });
    if (!user) {
      return res.status(404).json({ msg: '일치하는 회원 정보를 찾을 수 없습니다.' });
    }

    // 2. 토큰 생성 (1시간 유효)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1시간
    await user.save();

    // 3. 재설정 링크 생성 (프론트엔드 주소)
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

    // 4. 이메일 전송 설정 (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // .env에서 가져옴
        pass: process.env.EMAIL_PASS  // .env에서 가져옴
      }
    });

    // 5. 메일 내용 구성
    const mailOptions = {
      from: `"INK Admin" <${process.env.EMAIL_USER}>`, // 보낸 사람 이름 설정
      to: user.email,
      subject: '[INK] 비밀번호 변경 요청',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #000; font-family: sans-serif;">
          <h1 style="color: #000; text-align: center;">INK Password Reset</h1>
          <p>안녕하세요, <strong>${user.name}</strong>님.</p>
          <p>비밀번호 재설정 요청이 접수되었습니다. 아래 버튼을 클릭하여 비밀번호를 변경해주세요.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px;">
              비밀번호 변경하기
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">* 이 링크는 1시간 동안만 유효합니다.<br/>* 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
        </div>
      `
    };

    // 6. 전송!
    await transporter.sendMail(mailOptions);
    console.log(`✅ 이메일 발송 성공: ${user.email}`);

    res.json({ msg: '이메일로 비밀번호 변경 링크가 전송되었습니다.' });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ msg: '이메일 전송 실패 (서버 로그 확인 필요)' });
  }
});

// 8. 비밀번호 재설정 (최종 변경)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 토큰이 일치하고, 유효기간이 지나지 않은 유저 찾기
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: '유효하지 않거나 만료된 링크입니다.' });
    }

    // 비밀번호 암호화 및 변경
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // 토큰 초기화
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.json({ msg: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ msg: '비밀번호 변경 실패' });
  }
});

module.exports = router;