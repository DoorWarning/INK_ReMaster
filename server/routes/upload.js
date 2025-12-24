// server/routes/upload.js (전체 수정)
const router = require('express').Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

// 🔥 single -> array로 변경 (최대 10장)
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files; // 여러 파일이 여기에 담김
    if (!files || files.length === 0) return res.status(400).json({ msg: '파일이 없습니다.' });

    // 여러 파일을 동시에 R2로 업로드 (Promise.all 사용)
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}_${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await r2.send(command);
      return `${process.env.R2_PUBLIC_URL}/${fileName}`; // 업로드 된 URL 반환
    });

    const urls = await Promise.all(uploadPromises);

    res.json({ urls }); // 배열 형태의 URL 반환 (['http...', 'http...'])

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: '업로드 실패' });
  }
});

module.exports = router;