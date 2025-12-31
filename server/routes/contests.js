// server/routes/contests.js
const express = require('express');
const router = express.Router();
const Contest = require('../models/Contest');
const ContestEntry = require('../models/ContestEntry');
const Event = require('../models/Event');

// 1. 공모전/정기모임 생성
router.post('/create', async (req, res) => {
  try {
    const { 
      title, description, category, 
      submissionStart, submissionEnd, votingStart, votingEnd 
    } = req.body;

    const newContest = new Contest({
      title, description, category,
      submissionStart, submissionEnd, votingStart, votingEnd,
      linkedEventIds: [] // 초기화
    });

    // 🔥 [수정] 공모전인 경우 기간 내 '모든 날짜'에 이벤트 생성
    if (category === 'contest' && votingStart && votingEnd) {
      const startDate = new Date(votingStart);
      const endDate = new Date(votingEnd);
      const createdEvents = [];

      // 날짜 반복문 (시작일 ~ 종료일)
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const newEvent = new Event({
          title: `[투표] ${title}`,
          date: new Date(d), // 해당 날짜 하루
          type: 'important',
          description: `${title} 투표가 진행 중입니다.`,
        });
        
        // 병렬 처리를 위해 저장 프로미스를 배열에 담음
        createdEvents.push(newEvent.save());
      }

      // 한 번에 저장 후 ID들 가져오기
      const savedEvents = await Promise.all(createdEvents);
      newContest.linkedEventIds = savedEvents.map(e => e._id);
    }

    await newContest.save();
    res.status(201).json({ msg: "생성 완료", contest: newContest });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 2. 목록 조회
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find({ isVisible: true }).sort({ createdAt: -1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 3. 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "존재하지 않는 공모전입니다." });

    let entries = await ContestEntry.find({ contest: contest._id })
      .populate('author', 'name generation studentId');

    const now = new Date();

    // 공모전이고 투표 진행 중이면 -> 순위 비공개 (섞기)
    if (contest.category === 'contest' && new Date(contest.votingEnd) > now) {
      entries = entries.map(entry => ({
        _id: entry._id,
        imageUrl: entry.imageUrl,
        title: entry.title,
        description: entry.description,
        author: entry.author,
        voteCount: null,
        isHidden: true
      }));
      entries.sort(() => Math.random() - 0.5);
    } else {
      // 종료됨 or 정기모임 -> 결과 공개
      entries = entries.map(entry => ({
        ...entry.toObject(),
        voteCount: entry.votes.length,
        isHidden: false
      }));
      entries.sort((a, b) => b.voteCount - a.voteCount);
    }

    res.json({ contest, entries });
  } catch (err) {
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 4. 출품하기
router.post('/:id/upload', async (req, res) => {
  try {
    const { authorId, imageUrl, title, description } = req.body;
    
    // 1. 필수 정보 체크
    if (!authorId) return res.status(401).json({ msg: "로그인이 필요합니다." });
    if (!imageUrl || !title) return res.status(400).json({ msg: "제목과 이미지는 필수입니다." });

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "공모전이 존재하지 않습니다." });

    // 2. 🔥 [수정] 기간 체크 로직 (로그 추가)
    if (contest.category === 'contest') {
      const now = new Date();
      const start = new Date(contest.submissionStart);
      const end = new Date(contest.submissionEnd);

      // 서버 로그에 시간 출력 (디버깅용)
      console.log(`[Upload Check] Current: ${now.toLocaleString()} / Start: ${start.toLocaleString()} / End: ${end.toLocaleString()}`);

      if (now < start) {
        return res.status(400).json({ msg: `아직 제출 기간이 아닙니다. (${start.toLocaleString()} 부터 시작)` });
      }
      
      if (now > end) {
        return res.status(400).json({ msg: `제출 기간이 마감되었습니다. (${end.toLocaleString()} 종료)` });
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
    console.error(err);
    res.status(500).json({ msg: "업로드 실패 (서버 오류)" });
  }
});

// 5. 투표하기
router.post('/entry/:entryId/vote', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(401).json({ msg: "로그인이 필요합니다." });

    const entry = await ContestEntry.findById(req.params.entryId).populate('contest');
    if (!entry) return res.status(404).json({ msg: "작품 없음" });

    const contest = entry.contest;
    if (contest.category === 'contest') {
      const now = new Date();
      if (now < new Date(contest.votingStart) || now > new Date(contest.votingEnd)) {
        return res.status(400).json({ msg: "투표 기간이 아닙니다." });
      }
    }

    const voteIndex = entry.votes.indexOf(userId);
    if (voteIndex === -1) {
      entry.votes.push(userId);
      await entry.save();
      res.json({ msg: "투표 완료!", voted: true });
    } else {
      entry.votes.splice(voteIndex, 1);
      await entry.save();
      res.json({ msg: "투표 취소", voted: false });
    }
  } catch (err) {
    res.status(500).json({ msg: "오류 발생" });
  }
});

// 🔥 [추가] 6. 공모전 삭제 (관리자용)
router.delete('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "공모전 없음" });

    // 1. 연동된 달력 이벤트 삭제
    if (contest.linkedEventIds && contest.linkedEventIds.length > 0) {
      await Event.deleteMany({ _id: { $in: contest.linkedEventIds } });
    }
    
    // 2. 출품작 삭제
    await ContestEntry.deleteMany({ contest: contest._id });

    // 3. 공모전 자체 삭제
    await Contest.findByIdAndDelete(req.params.id);

    res.json({ msg: "공모전과 관련 데이터가 모두 삭제되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "삭제 실패" });
  }
});

// 🔥 [추가] 7. 조기 마감 (관리자용)
router.put('/:id/close', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ msg: "공모전 없음" });

    const now = new Date();
    // 마감 시간을 현재로 변경하여 즉시 종료 처리
    contest.submissionEnd = now;
    contest.votingEnd = now;
    
    await contest.save();
    res.json({ msg: "공모전이 조기 마감되었습니다.", contest });
  } catch (err) {
    res.status(500).json({ msg: "마감 처리 실패" });
  }
});

module.exports = router;