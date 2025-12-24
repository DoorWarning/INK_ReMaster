// server/routes/config.js
const router = require('express').Router();
const SiteConfig = require('../models/SiteConfig');
const User = require('../models/User');

// 1. 카카오 링크 가져오기 (누구나 가능)
router.get('/kakao', async (req, res) => {
  try {
    let config = await SiteConfig.findOne({ key: 'kakao_link' });
    if (!config) {
      // 없으면 빈 값으로 생성
      config = new SiteConfig({ key: 'kakao_link', value: '' });
      await config.save();
    }
    res.json({ link: config.value });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. 카카오 링크 수정하기 (관리자만)
router.post('/kakao', async (req, res) => {
  try {
    const { userId, link } = req.body;
    
    // 권한 체크
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: "관리자 권한이 필요합니다." });
    }

    // 업데이트 (upsert: true -> 없으면 만듦)
    const config = await SiteConfig.findOneAndUpdate(
      { key: 'kakao_link' },
      { value: link },
      { new: true, upsert: true }
    );

    res.json({ link: config.value });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. 디스코드 링크 가져오기
router.get('/discord', async (req, res) => {
  try {
    let config = await SiteConfig.findOne({ key: 'discord_link' });
    if (!config) {
      config = new SiteConfig({ key: 'discord_link', value: '' });
      await config.save();
    }
    res.json({ link: config.value });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. 디스코드 링크 수정하기 (관리자만)
router.post('/discord', async (req, res) => {
  try {
    const { userId, link } = req.body;
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: "관리자 권한이 필요합니다." });
    }

    const config = await SiteConfig.findOneAndUpdate(
      { key: 'discord_link' },
      { value: link },
      { new: true, upsert: true }
    );

    res.json({ link: config.value });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;