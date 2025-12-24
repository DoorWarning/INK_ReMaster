// server/models/Contest.js
const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 제목 (예: 2024 하계 공모전)
  description: { type: String },
  category: { 
    type: String, 
    enum: ['contest', 'regular'], 
    default: 'contest' 
  }, // contest: 공모전, regular: 정기모임
  
  // 공모전용 기간 설정 (정기모임은 null 가능)
  submissionStart: { type: Date }, // 제출 시작일
  submissionEnd: { type: Date },   // 제출 마감일
  votingStart: { type: Date },     // 투표 시작일
  votingEnd: { type: Date },       // 투표 종료일 (결과 공개일)

  // 캘린더 자동 연동을 위한 참조 ID
  linkedEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },

  isVisible: { type: Boolean, default: true } // 목록 노출 여부
}, { timestamps: true });

module.exports = mongoose.model('Contest', ContestSchema);