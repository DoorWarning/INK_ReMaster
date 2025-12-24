// server/routes/ledgers.js
const router = require('express').Router();
const Ledger = require('../models/Ledger');
const User = require('../models/User');

// 🔥 [추가] 저장된 학기 목록 가져오기 (중복 제거 & 내림차순 정렬)
router.get('/semesters', async (req, res) => {
  try {
    // semester 필드의 고유값만 가져옴
    const semesters = await Ledger.distinct('semester');
    
    // 내림차순 정렬 (문자열 비교: 2025 > 2024)
    semesters.sort((a, b) => {
      if (a > b) return -1;
      if (a < b) return 1;
      return 0;
    });

    res.json(semesters);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 1. 장부 목록 가져오기 (학기별 필터 가능)
router.get('/', async (req, res) => {
  try {
    const { semester } = req.query;
    const query = semester ? { semester } : {};
    const ledgers = await Ledger.find(query).sort({ createdAt: -1 });
    res.json(ledgers);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. 장부 작성 (관리자만)
router.post('/', async (req, res) => {
  try {
    const { semester, title, items, totalAmount, imageUrls, userId } = req.body;
    
    // 권한 체크
    const user = await User.findById(userId);
    if (user.role !== 'admin') return res.status(403).json({ msg: "권한 없음" });

    const imageObjects = imageUrls.map(url => ({ url }));

    const newLedger = new Ledger({
      semester, title, items, totalAmount, images: imageObjects, author: userId
    });
    
    await newLedger.save();
    res.status(201).json(newLedger);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. 삭제 (관리자만)
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (user.role !== 'admin') return res.status(403).json({ msg: "권한 없음" });

    await Ledger.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. 🔥 장부 수정하기 (PUT) - 추가됨
router.put('/:id', async (req, res) => {
  try {
    const { date, description, type, amount, category, semester } = req.body;
    
    // ID로 찾아서 업데이트 (new: true는 수정된 최신 데이터를 반환하라는 뜻)
    const updatedLedger = await Ledger.findByIdAndUpdate(
      req.params.id,
      { date, description, type, amount, category, semester },
      { new: true } 
    );

    if (!updatedLedger) {
      return res.status(404).json({ msg: "해당 내역을 찾을 수 없습니다." });
    }

    res.json(updatedLedger);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 에러" });
  }
});

module.exports = router;