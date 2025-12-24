// server/models/SiteConfig.js
const mongoose = require('mongoose');

const SiteConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // 예: 'kakao_link'
  value: { type: String, default: '' }, // 실제 링크 주소
}, { timestamps: true });

module.exports = mongoose.model('SiteConfig', SiteConfigSchema);