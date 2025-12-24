// server/routes/users.js
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../models/User');

// 1. 전체 회원 목록 가져오기 (관리자용)
router.get('/', async (req, res) => {
  try {
    // 생성일 역순(최신 가입순)으로 정렬
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. 회원 정보 수정 (권한, 회비 납부 여부)
router.put('/:id', async (req, res) => {
  try {
    const { role, hasPaidDues, isApproved } = req.body; // isApproved 추가
    
    const updateData = {};
    if (role) updateData.role = role;
    if (typeof hasPaidDues !== 'undefined') updateData.hasPaidDues = hasPaidDues;
    
    // 🔥 [추가] 승인 상태 업데이트
    if (typeof isApproved !== 'undefined') updateData.isApproved = isApproved;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // 유저 삭제
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ msg: '유저를 찾을 수 없습니다.' });
    }

    // (선택사항) 해당 유저가 쓴 글도 다 지우려면 여기서 Post.deleteMany({ author: req.params.id }) 를 수행할 수도 있습니다.
    // 현재는 유저 정보만 깔끔하게 날립니다. (글에는 작성자가 '알 수 없음'으로 뜨게 됨)
    
    res.json({ msg: '회원이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '삭제 실패' });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    const { userId, name, password } = req.body;

    // 본인 확인 (요청한 사람과 수정하려는 대상이 같은지)
    if (req.params.id !== userId) {
      return res.status(403).json({ msg: "본인의 정보만 수정할 수 있습니다." });
    }

    const updateData = { name };

    // 비밀번호 변경 요청이 있을 경우 암호화해서 저장
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password'); // 비밀번호는 빼고 돌려줌

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '수정 실패' });
  }
});

module.exports = router;