const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

module.exports = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback', 
        // 주의: 배포 환경에 맞춰 callbackURL을 환경변수로 관리하거나 정확히 기입하세요.
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          // 1. 아주대 메일 체크
          if (!email.endsWith('@ajou.ac.kr')) {
            return done(null, false, { message: 'not_ajou' });
          }

          // 2. 유저 조회
          let user = await User.findOne({ email });

          if (user) {
            // 이미 존재하면 구글 ID만 연동해주고 통과
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          } else {
            // 🔥 [수정 핵심] 유저가 없으면 -> 일단 DB에 생성해버린다!
            // 학번, 기수는 비어있는 상태로 생성됨 (User.js에서 required 뺐으므로 가능)
            const newUser = new User({
              email: email,
              name: profile.displayName || '이름없음',
              googleId: profile.id,
              isApproved: false, // 승인 대기
              // studentId, generation은 undefined 상태로 저장됨
            });
            
            await newUser.save();
            return done(null, newUser);
          }
        } catch (err) {
          console.error(err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};