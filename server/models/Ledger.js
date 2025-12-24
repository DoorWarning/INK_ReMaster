// server/models/Ledger.js
const mongoose = require('mongoose');

const LedgerSchema = new mongoose.Schema({
  semester: { type: String, required: true }, // 예: "2024-1학기"
  title: { type: String, required: true },    // 예: "신입생 환영회"
  items: [{ 
    description: String, // 품목
    qty: Number,         // 수량
    price: Number,       // 단가
    amount: Number,      // 금액 (qty * price)
    note: String         // 비고
  }],
  totalAmount: { type: Number, default: 0 }, // 총 합계
  images: [{ url: String }], // 영수증 사진들
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', LedgerSchema);