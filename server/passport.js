// server/passport/index.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

module.exports = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://lyricssync.duckdns.org/INKSERVER/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          // 1. [규칙 2] 아주대 메일 체크
          if (!email.endsWith('@ajou.ac.kr')) {
            return done(null, false, { message: 'not_ajou' });
          }

          // 2. 기존 유저 확인
          const user = await User.findOne({ email });
          
          if (user) {
            // [규칙 2] 이미 존재하면 -> 로그인 (기존 계정과 연동됨)
            // 혹시 구글 ID가 없었다면 업데이트 (선택사항)
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          } else {
            // [규칙 3] 유저가 없다면 -> 바로 가입시키지 않음!
            // "new_user"라는 신호와 함께 프로필 정보를 넘김
            return done(null, false, { message: 'new_user', profile });
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // serializeUser, deserializeUser는 그대로 둡니다.
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