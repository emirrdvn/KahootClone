const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const logger = require('pino')({ base: { pid: process.pid, hostname: require('os').hostname() } });
//const session = require('express-session');
const { Pool } = require('pg');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// JWT based auth
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const passport = require('./auth/passport');

// .env dosyasını yükle
dotenv.config();

// JWT Secret'ı loglayın
console.log('JWT_SECRET in app.js:', process.env.JWT_SECRET || 'default_jwt_secret');

// Gemini API ayarları
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// PostgreSQL bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:e7Zj1Urnd9bdPLCjWBIOUORJCONP3dF0@dpg-d0quc195pdvs73avc2m0-a.frankfurt-postgres.render.com/kahoot_t0pd',
  ssl: { rejectUnauthorized: false }
});

// PostgreSQL bağlantısını test et
pool.connect((err) => {
  if (err) {
    logger.error('PostgreSQL bağlantısı kurulamadı:', err);
  } else {
    logger.info('PostgreSQL veritabanına bağlanıldı');
  }
});

// Express ve Socket.IO ayarları
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }
});

// Oyun verileri
const lobbies = {};
const TIMER_DURATION = 15;
const BREAK_DURATION = 5;

async function generateQuestions(topic, questionCount) {
  logger.info(`Generating ${questionCount} questions for topic: ${topic} using Gemini API`);
  try {
    const prompt = `
      ${topic} konusunda ${questionCount} adet quiz sorusu üret. Her soru için:
      - Soruyu (question),
      - 4 adet şık (options, dizi olarak, karışık sıralı),
      - Doğru cevabı (correctAnswer, şıklardan biriyle aynı olmalı)
      JSON formatında döndür. Şıklar ve doğru cevap metin veya sayı olabilir.
      Sorular Türkçe, net ve ${topic} konusuna uygun olsun. Tüm metinler UTF-8 uyumlu olmalı, özel karakterler (ş, ı, ğ, ü, ç, ö) doğru kullanılmalı.
      
      Topic rehberi:
      - Genel Kültür: Gündelik bilgiler, popüler kültür, müzik, sanatçı, film, edebiyat, atasözleri.
      - Tarih: Dünya ve Türkiye tarihi, önemli olaylar, kişiler, savaşlar, devrimler.
      - Bilim: Fizik, kimya, biyoloji, astronomi, teknoloji.
      - Coğrafya: Ülkeler, başkentler, nehirler, dağlar, kıtalar.
      - Spor: Futbol, basketbol, olimpiyatlar, sporcular, kurallar.
      - Filmler ve Diziler: Popüler filmler, diziler, oyuncular, yönetmenler.
      
      Örnek format:
      [
        {
          "question": "Osmanlı İmparatorluğu ne zaman kuruldu?",
          "options": ["1299", "1453", "1071", "1923"],
          "correctAnswer": "1299"
        },
        ...
      ]
    `;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    logger.info(`Raw Gemini response: ${responseText}`);
    const cleanedText = Buffer.from(responseText.replace(/```json\n|\n```/g, '').trim(), 'utf8').toString('utf8');
    logger.info(`Cleaned Gemini response: ${cleanedText}`);
    // Kapsamlı karakter düzeltme
    const normalizedText = cleanedText
      .replace(/├▒/g, 'ı')
      .replace(/┼ş/g, 'ş')
      .replace(/├╝/g, 'ü')
      .replace(/├ğ/g, 'ğ')
      .replace(/├ç/g, 'ç')
      .replace(/├Â/g, 'ö')
      .replace(/─▒/g, '')
      .replace(/─ş/g, 'ş')
      .replace(/─ı/g, 'ı')
      .replace(/─ğ/g, 'ğ')
      .replace(/─ü/g, 'ü')
      .replace(/─ç/g, 'ç')
      .replace(/─ö/g, 'ö');
    logger.info(`Normalized Gemini response: ${normalizedText}`);
    // JSON geçerliliğini kontrol et
    try {
      const questions = JSON.parse(normalizedText);
      if (!Array.isArray(questions) || questions.length < questionCount) {
        logger.error(`Gemini API insufficient questions for topic: ${topic}, requested: ${questionCount}, received: ${questions.length}`);
        return [];
      }
      // Soruları sanitize et
      const sanitizedQuestions = questions.map(q => ({
        question: q.question.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, ''),
        options: q.options.map(opt => opt.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, '')),
        correctAnswer: q.correctAnswer.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, '')
      }));
      logger.info(`Sanitized questions: ${JSON.stringify(sanitizedQuestions, null, 2)}`);
      return sanitizedQuestions;
    } catch (parseError) {
      logger.error(`JSON parse error for topic ${topic}: ${parseError.message}`);
      return [];
    }
  } catch (error) {
    logger.error(`Gemini API error for topic ${topic}:`, error.stack);
    return [];
  }
}

// Oyun başlatma
function startGame(lobbyId) {
  logger.info(`Starting game in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  if (!lobby) return;
  lobby.status = 'playing';
  lobby.currentQuestion = 0;
  lobby.guesses = {};
  lobby.playerAnswers = {}; // Her oyuncunun cevaplarını saklamak için
  Object.keys(lobby.players).forEach(player => {
    lobby.playerAnswers[player] = [];
  });
  generateQuestions(lobby.topic, lobby.questionCount).then(questions => {
    if (questions.length === 0) {
      logger.error(`No questions generated for lobby ${lobbyId}`);
      io.to(lobbyId).emit('error', { message: 'Soru üretilemedi, lobi kapatılıyor' });
      endGame(lobbyId);
      return;
    }
    lobby.questionQueue = questions;
    setTimeout(() => startNewRound(lobbyId), 1000);
  }).catch(error => {
    logger.error(`Error generating questions for lobby ${lobbyId}:`, error);
    io.to(lobbyId).emit('error', { message: 'Soru üretilemedi, lobi kapatılıyor' });
    endGame(lobbyId);
  });
}

// Yeni tur başlatma
function startNewRound(lobbyId) {
  const lobby = lobbies[lobbyId];
  if (!lobby || !lobby.questionQueue || lobby.questionQueue.length === 0) {
    endGame(lobbyId);
    return;
  }
  const questionData = lobby.questionQueue.shift();
  lobby.currentQuestionData = questionData;
  lobby.guesses = {};
  logger.info(`Sending new_round to lobby ${lobbyId}: ${questionData.question}`);
  io.to(lobbyId).emit('new_round', {
    question: questionData.question,
    options: questionData.options,
    players: Object.keys(lobby.players),
    scores: lobby.scores,
    timer: TIMER_DURATION
  });
  // Timeoutu sakla
  lobby.timeoutId = setTimeout(() => evaluateGuesses(lobbyId), TIMER_DURATION * 1000);
}

// Tahminleri değerlendir
function evaluateGuesses(lobbyId) {
  if (!lobbies[lobbyId]) return;
  logger.info(`Evaluating guesses in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  const correctAnswer = lobby.currentQuestionData.correctAnswer;
  const guesses = lobby.guesses;
  const winners = Object.keys(guesses).filter(player => guesses[player] === correctAnswer);
  if (winners.length > 0) {
    winners.forEach(winner => {
      lobby.scores[winner]++;
    });
  }
  // Her oyuncunun cevabını kaydet
  Object.keys(lobby.players).forEach(player => {
    const userAnswer = guesses[player] || null; // Tahmin yoksa null
    lobby.playerAnswers[player].push({
      question: lobby.currentQuestionData.question,
      options: lobby.currentQuestionData.options,
      correctAnswer,
      userAnswer,
      isCorrect: userAnswer === correctAnswer
    });
  });
  const result = { correctAnswer, winners };
  io.to(lobbyId).emit('round_result', result);
  setTimeout(() => {
    if (!lobbies[lobbyId]) return;
    if (!lobby.questionQueue.length) {
      endGame(lobbyId);
    } else {
      startNewRound(lobbyId);
    }
  }, BREAK_DURATION * 1000);
}

// Oyunu bitir ve quiz geçmişini kaydet
async function endGame(lobbyId) {
  if (!lobbies[lobbyId]) return;
  logger.info(`Ending game in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  const maxScore = Math.max(...Object.values(lobby.scores));
  const winners = maxScore === 0 ? [] : Object.keys(lobby.scores).filter(player => lobby.scores[player] === maxScore);

  for (const player of Object.keys(lobby.players)) {
    try {
      const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [player]);
      if (userResult.rows.length === 0) {
        logger.error(`User not found for username: ${player}`);
        continue;
      }
      const userId = userResult.rows[0].id;
      const answers = lobby.playerAnswers[player] || [];
      if (!Array.isArray(answers)) {
        logger.error(`Invalid answers format for ${player} in lobby ${lobbyId}: ${JSON.stringify(answers)}`);
        continue;
      }
      // JSONB için güvenli ve sanitize edilmiş veri
      const safeAnswers = answers.map(a => ({
        question: a.question.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, ''),
        options: a.options.map(opt => opt.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, '')),
        correctAnswer: a.correctAnswer.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, ''),
        userAnswer: a.userAnswer ? a.userAnswer.replace(/[^\x20-\x7EşğıüçöŞİĞÜÇÖ]/g, '') : null,
        isCorrect: a.isCorrect
      }));
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      // logger.info(`Saving quiz history for ${player}: user_id=${userId}, topic=${lobby.topic}, total=${totalQuestions}, correct=${correctAnswers}, score=${score}, answers=${JSON.stringify(safeAnswers, null, 2)}`);
      // JSONB için stringified JSON
      const jsonAnswers = JSON.stringify(safeAnswers);
      await pool.query(
        `INSERT INTO quiz_history (user_id, topic, total_questions, correct_answers, score, questions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, lobby.topic, totalQuestions, correctAnswers, score, jsonAnswers]
      );
      logger.info(`Quiz history saved for user ${player} in lobby ${lobbyId}`);
    } catch (error) {
      logger.error(`Error saving quiz history for user ${player} in lobby ${lobbyId}: ${error.message}`, { stack: error.stack, answers: JSON.stringify(lobby.playerAnswers[player], null, 2) });
    }
  }

  io.to(lobbyId).emit('game_over', { winners, scores: lobby.scores });
  delete lobbies[lobbyId];
}
// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize()); // Passport'u başlat

// Oturum kontrolü
function isAuthenticated(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    console.log('JWT Authentication Error:', err);
    console.log('Authenticated User:', user);
    if (err || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  })(req, res, next);
}

// API rotaları
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  logger.info(`Login attempt for username: ${username}`);
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    logger.info(`User query result: ${JSON.stringify(userCheck.rows)}`);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const user = userCheck.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    logger.info(`Password validation result: ${valid}`);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    console.log('JWT_SECRET used for token creation:', JWT_SECRET);
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    logger.error('Error during login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Registration successful', token });
  } catch (err) {
    logger.error('Error during registration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/logout', (req, res) => {
  // JWT ile logout istemci tarafında token'ı silerek yapılır
  res.json({ message: 'Logout successful' });
});

app.get('/lobbies', (req, res) => {
  res.json({ lobbies });
});

app.post('/create_lobby', isAuthenticated, (req, res) => {
  const username = req.user.username;
  const { topic, questionCount } = req.body;
  if (!username || !topic || !questionCount) {
    return res.status(400).json({ message: 'Username, topic, and question count are required' });
  }
  const count = parseInt(questionCount);
  if (isNaN(count) || count < 1 || count > 10) {
    return res.status(400).json({ message: 'Question count must be between 1 and 10' });
  }
  const lobbyId = `lobby_${Object.keys(lobbies).length + 1}`;
  lobbies[lobbyId] = {
    owner: username,
    players: { [username]: { ready: false } },
    scores: { [username]: 0 },
    topic,
    questionCount: count,
    status: 'waiting',
    playerAnswers: { [username]: [] } // playerAnswers’ı başlat
  };
  logger.info(`New lobby created: ${lobbyId} by ${username} with ${count} questions`);
  res.json({ lobbyId, username });
});

// Socket.IO olayları
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('join_lobby', ({ token, lobbyId }) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        socket.emit('error', { message: 'Invalid or expired token' });
        return;
      }
      const username = decoded.username;
      if (!lobbies[lobbyId]) {
        socket.emit('error', { message: 'Lobby not found' });
        return;
      }
      const lobby = lobbies[lobbyId];
      if (username in lobby.players) {
        socket.join(lobbyId);
        io.to(lobbyId).emit('lobby_update', lobby);
        return;
      }
      lobby.players[username] = { ready: false };
      lobby.scores[username] = 0;
      if (!lobby.playerAnswers) {
        lobby.playerAnswers = {}; // playerAnswers yoksa başlat
      }
      lobby.playerAnswers[username] = []; // Yeni oyuncu için cevap dizisi
      socket.join(lobbyId);
      io.to(lobbyId).emit('lobby_update', lobby);
    });
  });

  socket.on('ready', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && username in lobbies[lobbyId].players) {
      lobbies[lobbyId].players[username].ready = true;
      io.to(lobbyId).emit('lobby_update', lobbies[lobbyId]);
      if (Object.values(lobbies[lobbyId].players).every(p => p.ready)) {
        io.to(lobbyId).emit('start_game', { lobbyId });
        startGame(lobbyId);
      }
    }
  });

  socket.on('submit_guess', ({ lobbyId, username, guess }) => {
    if (username in lobbies[lobbyId].players) {
      lobbies[lobbyId].guesses[username] = guess;
      logger.info(`Guess from ${username} in lobby ${lobbyId}: ${guess}`);
      // Tüm oyuncular tahmin yaptıysa turu sonlandır
      const lobby = lobbies[lobbyId];
      const allPlayersGuessed = Object.keys(lobby.players).every(player => player in lobby.guesses);
      if (allPlayersGuessed) {
        logger.info(`All players guessed in lobby ${lobbyId}, ending round early`);
        clearTimeout(lobby.timeoutId);
        evaluateGuesses(lobbyId);
      }
    }
  });

  socket.on('leave_lobby', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && username in lobbies[lobbyId].players) {
      delete lobbies[lobbyId].players[username];
      delete lobbies[lobbyId].scores[username];
      delete lobbies[lobbyId].playerAnswers[username];
      socket.leave(lobbyId);
      if (!Object.keys(lobbies[lobbyId].players).length) {
        delete lobbies[lobbyId];
      } else if (lobbies[lobbyId].status === 'playing' && Object.keys(lobbies[lobbyId].players).length === 1) {
        io.to(lobbyId).emit('game_over', {
          winners: [Object.keys(lobbies[lobbyId].players)[0]],
          scores: lobbies[lobbyId].scores
        });
      }
      if (lobbyId in lobbies) {
        io.to(lobbyId).emit('lobby_update', lobbies[lobbyId]);
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});