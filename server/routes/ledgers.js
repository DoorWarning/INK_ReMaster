const router = require('express').Router();
const Ledger = require('../models/Ledger'); // 모델 경로 확인
const User = require('../models/User'); // 권한 체크용

// 1. 학기 목록 가져오기 (최신순) - 순서 중요! '/' 보다 먼저 와야 함
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await Ledger.distinct('semester');
    // 내림차순 정렬 (2025-1 > 2024-2)
    semesters.sort((a, b) => (a > b ? -1 : 1));
    res.json(semesters);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. 장부 목록 가져오기 (학기별 필터)
router.get('/', async (req, res) => {
  try {
    const { semester } = req.query;
    let query = {};
    if (semester) query.semester = semester;

    // 최신순 정렬
    const ledgers = await Ledger.find(query).sort({ createdAt: -1 });
    res.json(ledgers);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. 장부 추가하기 (POST)
router.post('/', async (req, res) => {
  try {
    // 권한 체크 로직이 필요하다면 여기에 추가 (예: req.body.userId로 admin 확인)
    const newLedger = new Ledger(req.body);
    const savedLedger = await newLedger.save();
    res.status(200).json(savedLedger);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. 장부 수정하기 (PUT)
router.put('/:id', async (req, res) => {
  try {
    const updatedLedger = await Ledger.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedLedger);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 5. 장부 삭제하기 (DELETE) - 🔥 이 부분이 있어야 삭제가 됩니다!
router.delete('/:id', async (req, res) => {
  try {
    // 혹시 권한 체크가 필요하다면 여기서 user role 확인
    // const user = await User.findById(req.body.userId);
    // if(!user || user.role !== 'admin') return res.status(403).json("권한 없음");

    await Ledger.findByIdAndDelete(req.params.id);
    res.status(200).json("Deleted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;