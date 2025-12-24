// server/routes/contests.js
const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const Event = require('../models/Event'); // 캘린더 연동용
const auth = require('../middleware/auth'); // (로그인 미들웨어 필요 시 사용, 여기선 로직 위주)

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

    // 🔥 [핵심] 공모전(contest)인 경우 달력에 'important' 일정 자동 추가
    if (category === 'contest' && votingStart && votingEnd) {
      const newEvent = new Event({
        title: `[투표] ${title}`, // 달력에 표시될 이름
        start: votingStart,
        end: votingEnd,
        type: 'important', // 빨간색 강조
        description: `${title} 투표 기간입니다.`
      });
      
      const savedEvent = await newEvent.save();
      newContest.linkedEventId = savedEvent._id; // 연결 고리 저장
    }

    await newContest.save();
    res.status(201).json({ msg: "생성 완료", contest: newContest });

  } catch (err) {
    console.error(err);
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

// 3. 특정 공모전 조회 (작품 목록 포함 + 순위 숨김 로직)
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "존재하지 않는 공모전입니다." });

    let entries = await ContestEntry.find({ contest: contest._id })
      .populate('author', 'name generation studentId'); // 작가 정보 가져오기

    const now = new Date();

    // 🔥 [핵심] 결과 공개 로직 처리
    // 공모전(contest)이고, 아직 투표 종료 전이라면 -> 투표 수(rank)를 숨김
    if (contest.category === 'contest' && new Date(contest.votingEnd) > now) {
      entries = entries.map(entry => ({
        _id: entry._id,
        imageUrl: entry.imageUrl,
        title: entry.title,
        description: entry.description,
        author: entry.author,
        // votes 배열을 숨기고, 내가 투표했는지 여부만 알려줄 수도 있음 (여기선 단순화)
        voteCount: null, // 개수 숨김
        isHidden: true   // 프론트에서 "집계 중" 표시용
      }));
      
      // 순서도 섞어버리는 것이 공정함 (Fisher-Yates Shuffle 등 적용 권장)
      entries.sort(() => Math.random() - 0.5);

    } else {
      // 정기모임(regular)이거나 투표가 끝난 공모전 -> 투표 수 공개 및 정렬
      entries = entries.map(entry => ({
        ...entry.toObject(),
        voteCount: entry.votes.length, // 개수 공개
        isHidden: false
      }));

      // 투표 순 내림차순 정렬
      entries.sort((a, b) => b.voteCount - a.voteCount);
    }

    res.json({ contest, entries });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 4. 작품 출품 (업로드)
router.post('/:id/upload', async (req, res) => {
  try {
    const { authorId, imageUrl, title, description } = req.body;
    const contest = await Contest.findById(req.params.id);

    // 기간 체크 (공모전인 경우만)
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

// 5. 투표하기 / 투표 취소 (토글)
router.post('/entry/:entryId/vote', async (req, res) => {
  try {
    const { userId } = req.body; // 로그인한 유저 ID
    const entry = await ContestEntry.findById(req.params.entryId).populate('contest');
    
    if (!entry) return res.status(404).json({ msg: "작품을 찾을 수 없습니다." });

    const contest = entry.contest;

    // 투표 기간 체크 (공모전인 경우만)
    if (contest.category === 'contest') {
      const now = new Date();
      if (now < new Date(contest.votingStart) || now > new Date(contest.votingEnd)) {
        return res.status(400).json({ msg: "지금은 투표 기간이 아닙니다." });
      }
    }

    // 이미 투표했는지 확인
    const voteIndex = entry.votes.indexOf(userId);

    if (voteIndex === -1) {
      // 투표 안했으면 -> 추가
      entry.votes.push(userId);
      await entry.save();
      res.json({ msg: "투표 완료!", voted: true, total: entry.votes.length });
    } else {
      // 이미 했으면 -> 취소
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