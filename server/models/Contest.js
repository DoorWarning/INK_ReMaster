// server/models/Contest.js
const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ['contest', 'regular'], 
    default: 'contest' 
  },
  
  submissionStart: { type: Date },
  submissionEnd: { type: Date },
  votingStart: { type: Date },
  votingEnd: { type: Date },

  // 🔥 [수정] 여러 날짜의 이벤트를 저장하기 위해 배열로 변경
  linkedEventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Contest', ContestSchema);