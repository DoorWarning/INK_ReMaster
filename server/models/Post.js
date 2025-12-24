const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // 작성자 (User 모델의 _id를 저장)
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // 게시판 종류 (공지, 작품, 잡담 등)
  category: { 
    type: String, 
    enum: ['notice', 'art', 'free'], 
    default: 'free' 
  },

  title: { type: String, required: true },
  content: { type: String },
  
  // 이미지 목록 (여러 장의 만화 원고를 순서대로 저장)
  images: [{
    url: { type: String, required: true }, // 이미지 주소 (R2/S3)
    caption: String
  }],

  // 조회수 & 좋아요
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: String,
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);