// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // 구글 로그인은 없을 수 있음
  googleId: { type: String },
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  generation: { type: Number, required: true },
  role: { type: String, default: 'member' },
  isApproved: { type: Boolean, default: false },
  hasPaidDues: { type: Boolean, default: false },

  // 🔥 [추가] 비밀번호 재설정용 필드
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);