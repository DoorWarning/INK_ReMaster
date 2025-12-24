// server/routes/events.js
const router = require('express').Router();
const Event = require('../models/Event');
const User = require('../models/User');

// 1. 월별 일정 가져오기
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query;
    // 해당 월의 1일 ~ 말일 범위 설정
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await Event.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. 일정 추가 (관리자 전용은 프론트에서 막고, 백엔드에서도 체크 가능)
router.post('/', async (req, res) => {
  try {
    const { title, description, date, type, userId } = req.body;
    const newEvent = new Event({
      title, description, date, type, author: userId
    });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. 일정 수정
router.put('/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. 일정 삭제
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 1. 일정 가져오기 (월별 또는 일별)
router.get('/', async (req, res) => {
  try {
    const { year, month, day } = req.query; // day 추가
    
    let startDate, endDate;

    if (day) {
      // 🔥 날짜(day)가 지정되면 그 날 하루만 조회 (00:00 ~ 23:59)
      startDate = new Date(year, month - 1, day);
      endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      // 날짜가 없으면 기존처럼 한 달 전체 조회
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const events = await Event.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }); // 시간 순 정렬

    res.json(events);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;