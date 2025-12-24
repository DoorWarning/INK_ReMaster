// server/routes/contests.js
const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const Event = require('../models/Event'); 
// ❌ const auth = require('../middleware/auth'); // 이 줄을 삭제했습니다. (기존 로직 사용)

// 1. 공모전/정기모임 생성 (관리자용)
router.post('/create', async (req, res) => {
  try {
    const { 
      title, description, category, 
      submissionStart, submissionEnd, votingStart, votingEnd 
    } = req.body;

    const newContest = new Contest({
      title, description, category,
      submissionStart, submissionEnd, votingStart, votingEnd
    });

    // 🔥 [수정됨] Event 모델의 'date' 필드에 맞춰 수정
    if (category === 'contest' && votingStart && votingEnd) {
      const newEvent = new Event({
        title: `[투표] ${title}`, 
        
        // ❌ [삭제] 모델에 없는 필드라 에러 발생
        // start: votingStart,
        // end: votingEnd,

        // ✅ [수정] 모델에 정의된 'date' 필드 사용 (투표 시작일을 기준으로 등록)
        date: votingStart, 
        
        type: 'important', 
        // 설명에 종료일을 적어주어 정보 보완
        description: `${title} 투표 기간입니다. (~${new Date(votingEnd).toLocaleDateString()}까지)`
      });
      
      const savedEvent = await newEvent.save();
      newContest.linkedEventId = savedEvent._id; 
    }

    await newContest.save();
    res.status(201).json({ msg: "생성 완료", contest: newContest });

  } catch (err) {
    console.error(err); // 에러 로그 확인용
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 2. 공모전 목록 조회
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find({ isVisible: true }).sort({ createdAt: -1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 3. 특정 공모전 조회
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "존재하지 않는 공모전입니다." });

    let entries = await ContestEntry.find({ contest: contest._id })
      .populate('author', 'name generation studentId'); 

    const now = new Date();

    // 공모전(contest)이고 투표 기간 중이면 순위 비공개 (섞기)
    if (contest.category === 'contest' && new Date(contest.votingEnd) > now) {
      entries = entries.map(entry => ({
        _id: entry._id,
        imageUrl: entry.imageUrl,
        title: entry.title,
        description: entry.description,
        author: entry.author,
        voteCount: null, // 개수 숨김
        isHidden: true   
      }));
      entries.sort(() => Math.random() - 0.5);

    } else {
      // 결과 공개
      entries = entries.map(entry => ({
        ...entry.toObject(),
        voteCount: entry.votes.length,
        isHidden: false
      }));
      entries.sort((a, b) => b.voteCount - a.voteCount);
    }

    res.json({ contest, entries });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 4. 작품 출품
router.post('/:id/upload', async (req, res) => {
  try {
    // 🔥 기존 posts.js 방식처럼 body에서 정보 받음
    const { authorId, imageUrl, title, description } = req.body; 
    
    if (!authorId) return res.status(401).json({ msg: "로그인이 필요합니다." });

    const contest = await Contest.findById(req.params.id);

    if (contest.category === 'contest') {
      const now = new Date();
      if (now < new Date(contest.submissionStart) || now > new Date(contest.submissionEnd)) {
        return res.status(400).json({ msg: "지금은 작품 제출 기간이 아닙니다." });
      }
    }

    const newEntry = new ContestEntry({
      contest: contest._id,
      author: authorId,
      imageUrl,
      title,
      description
    });

    await newEntry.save();
    res.json({ msg: "출품 완료" });

  } catch (err) {
    res.status(500).json({ msg: "업로드 실패" });
  }
});

// 5. 투표하기 / 투표 취소
router.post('/entry/:entryId/vote', async (req, res) => {
  try {
    // 🔥 기존 방식: body에서 userId 받기
    const { userId } = req.body; 
    
    if (!userId) return res.status(401).json({ msg: "로그인이 필요합니다." });

    const entry = await ContestEntry.findById(req.params.entryId).populate('contest');
    if (!entry) return res.status(404).json({ msg: "작품을 찾을 수 없습니다." });

    const contest = entry.contest;

    if (contest.category === 'contest') {
      const now = new Date();
      if (now < new Date(contest.votingStart) || now > new Date(contest.votingEnd)) {
        return res.status(400).json({ msg: "지금은 투표 기간이 아닙니다." });
      }
    }

    const voteIndex = entry.votes.indexOf(userId);

    if (voteIndex === -1) {
      entry.votes.push(userId);
      await entry.save();
      res.json({ msg: "투표 완료!", voted: true, total: entry.votes.length });
    } else {
      entry.votes.splice(voteIndex, 1);
      await entry.save();
      res.json({ msg: "투표 취소", voted: false, total: entry.votes.length });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "투표 처리 중 오류" });
  }
});

module.exports = router;