// server/models/ContestEntry.js
const mongoose = require('mongoose');

const ContestEntrySchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 작가
  
  imageUrl: { type: String, required: true }, // 작품 이미지
  title: { type: String, required: true },    // 작품명
  description: { type: String },              // 작품 설명
  
  // 투표한 유저들의 ID 목록 (중복 투표 방지)
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('ContestEntry', ContestEntrySchema);