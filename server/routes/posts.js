const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
// 👇 R2 삭제를 위해 AWS SDK 가져오기
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// R2 클라이언트 설정 (upload.js와 동일)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 1. 게시글 작성 (카테고리 추가)
router.post('/', async (req, res) => {
  try {
    // 🔥 category를 body에서 받습니다.
    const { title, content, imageUrls, email, category } = req.body; 

    const author = await User.findOne({ email });
    if (!author) return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });

    const imageObjects = imageUrls.map(url => ({ url }));

    const newPost = new Post({
      title,
      content,
      images: imageObjects,
      author: author._id,
      category: category || 'art' // 🔥 없으면 기본값 art
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '저장 실패' });
  }
});

// 2. 게시글 목록 가져오기 (카테고리 필터 추가)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query; // 쿼리 스트링 받기
    
    // 카테고리가 있으면 필터링, 없으면 전체(혹은 art)
    // 여기서는 카테고리가 지정되면 그것만 가져오도록 설정
    const query = category ? { category } : {}; 

    const posts = await Post.find(query)
      .populate('author', 'name generation studentId')
      .sort({ createdAt: -1 });
      
    res.json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. 좋아요 토글
router.put('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const { userId } = req.body;
    const likeStrings = post.likes.map(id => id.toString());

    if (likeStrings.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

/// 4. 댓글 작성 (수정됨: 업데이트된 게시글 정보 반환)
router.post('/:id/comment', async (req, res) => {
  try {
    const { userId, userName, text } = req.body;
    
    // 댓글 추가 후, 'new: true' 옵션으로 변경된 문서를 바로 받음
    // 🔥 중요: 바로 populate를 수행해서 프론트엔드에 즉시 렌더링 가능한 데이터를 줌
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          comments: { userId, userName, text, createdAt: new Date() } 
        } 
      },
      { new: true }
    ).populate('author', 'name generation studentId'); // 작성자 정보도 채워서 보냄

    res.json(post); // 갱신된 게시글 전체 반환
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 🔥 [추가] 댓글 수정
router.put('/:id/comment/:commentId', async (req, res) => {
  try {
    const { userId, text } = req.body;
    const post = await Post.findOne({ _id: req.params.id });

    // 해당 댓글 찾기
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "댓글을 찾을 수 없습니다." });

    // 권한 확인 (본인 혹은 관리자)
    const user = await User.findById(userId);
    if (comment.userId !== userId && user.role !== 'admin') {
      return res.status(403).json({ msg: "수정 권한이 없습니다." });
    }

    // 내용 수정
    comment.text = text;
    await post.save();

    // 정보 다시 채워서 반환
    const updatedPost = await Post.findById(post._id).populate('author', 'name generation studentId');
    res.json(updatedPost);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 🔥 [추가] 댓글 삭제
router.delete('/:id/comment/:commentId', async (req, res) => {
  try {
    const { userId } = req.body; // delete 요청은 body에 data를 담아 보내야 함
    const post = await Post.findOne({ _id: req.params.id });
    
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "댓글 없음" });

    const user = await User.findById(userId);
    if (comment.userId !== userId && user.role !== 'admin') {
      return res.status(403).json({ msg: "삭제 권한이 없습니다." });
    }

    // 댓글 배열에서 제거
    post.comments.pull(req.params.commentId);
    await post.save();

    const updatedPost = await Post.findById(post._id).populate('author', 'name generation studentId');
    res.json(updatedPost);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// 🔥 [추가] 특정 게시글 1개 가져오기 (최신 상태 조회용)
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name generation studentId'); // 작성자 정보 포함
      
    if (!post) {
      return res.status(404).json({ msg: '게시글을 찾을 수 없습니다.' });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '서버 에러' });
  }
});

// 5. 게시글 수정
router.put('/:id', async (req, res) => {
  try {
    const { userId, title, content } = req.body;
    const post = await Post.findById(req.params.id);
    const user = await User.findById(userId);

    if (post.author.toString() === userId || user.role === 'admin') {
      post.title = title;
      post.content = content;
      await post.save();
      
      // 수정된 데이터 반환 시 author 정보 다시 채워서 보내기 (중요)
      const populatedPost = await Post.findById(post._id).populate('author', 'name generation studentId');
      return res.json(populatedPost);
    } else {
      return res.status(403).json({ msg: "수정 권한이 없습니다." });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 6. 게시글 삭제 (🔥 R2 이미지 삭제 기능 추가)
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    const user = await User.findById(userId);

    if (!post) return res.status(404).json({ msg: "게시글이 없습니다." });

    // 권한 체크
    if (post.author.toString() === userId || user.role === 'admin') {
      
      // 🔥 [핵심] R2 파일 삭제 로직
      if (post.images && post.images.length > 0) {
        // 모든 이미지를 순회하며 삭제 요청
        const deletePromises = post.images.map(async (img) => {
          // URL 구조: https://pub-xxx.../파일명.jpg
          // 맨 뒤의 '파일명.jpg'만 잘라냄 (Key)
          const fileKey = img.url.split('/').pop();

          if (fileKey) {
            try {
              const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileKey,
              });
              await r2.send(command);
              console.log(`🗑️ R2 삭제 성공: ${fileKey}`);
            } catch (r2Err) {
              console.error(`⚠️ R2 삭제 실패 (파일: ${fileKey})`, r2Err);
              // 이미지 삭제 실패해도 DB 삭제는 계속 진행하도록 함
            }
          }
        });
        
        // 병렬 처리로 빠르게 삭제
        await Promise.all(deletePromises);
      }

      // DB 삭제
      await Post.findByIdAndDelete(req.params.id);
      return res.json({ msg: "삭제되었습니다." });
      
    } else {
      return res.status(403).json({ msg: "삭제 권한이 없습니다." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;