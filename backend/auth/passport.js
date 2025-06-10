const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// .env dosyasını yükle
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
console.log('JWT_SECRET in passport.js:', JWT_SECRET); // Bu logu da ekleyin

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
  console.log('=== JWT STRATEGY CALLED ==='); // Bu basit log ile başlayın
  console.log('JWT Payload:', jwt_payload);
  console.log('JWT Secret being used:', JWT_SECRET);
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [jwt_payload.username]);
    console.log('Database query result:', result.rows);
    console.log('Query username:', jwt_payload.username);
    if (result.rows.length > 0) {
      console.log('User found, returning user data');
      return done(null, result.rows[0]); // Kullanıcı bulundu
    } else {
      console.log('User not found, returning false');
      return done(null, false); // Kullanıcı bulunamadı
    }
  } catch (err) {
    console.error('Database query error:', err);
    return done(err, false);
  }
}));

module.exports = passport;
