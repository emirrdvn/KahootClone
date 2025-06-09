
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const logger = require('pino')({ base: { pid: process.pid, hostname: require('os').hostname() } });
const session = require('express-session');
const { Pool } = require('pg');
const cors = require('cors');

// .env dosyasını yükle
dotenv.config();

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

// Dummy sorular
const dummyQuestions = {
  'Spor': [
    { question: 'Futbolda bir mac kac dakika surer (normal sure)?', answer: 90 },
    { question: 'Bir basketbol macinda her ceyrek kac dakikadir (NBA)?', answer: 12 },
    { question: 'Olimpiyat oyunlari kac yilda bir duzenlenir?', answer: 4 },
    { question: 'Teniste bir seti kazanmak icin kac oyun gerekir (minimum)?', answer: 6 },
    { question: 'Formula 1\'de bir yarista kac tur donulur (ortalama)?', answer: 70 }
  ],
  'Tarih': [
    { question: 'Osmanli Imparatorlugu kac yilinda kuruldu?', answer: 1299 },
    { question: 'Fransiz Devrimi hangi yilda basladi?', answer: 1789 },
    { question: 'Ilk Ay’a inis hangi yilda gerceklesti?', answer: 1969 },
    { question: 'Birinci Dunya Savasi kac yilinda sona erdi?', answer: 1918 },
    { question: 'Berlin Duvari kac yilinda yikildi?', answer: 1989 }
  ],
  'Cografya': [
    { question: 'Dunyadaki kita sayisi kactir?', answer: 7 },
    { question: 'Everest Dagi’nin yuksekligi yaklasik kac metredir?', answer: 8848 },
    { question: 'Amazon Nehri’nin uzunlugu yaklasik kac kilometredir?', answer: 6575 },
    { question: 'Afrika’daki ulke sayisi kactir?', answer: 54 },
    { question: 'Avustralya’nin yuzolcumu yaklasik kac milyon kilometrekaredir?', answer: 7 }
  ],
  'Genel Kultur': [
    { question: 'Bir yilda kac gun vardir?', answer: 365 },
    { question: 'Insan vucudunda kac kemik bulunur?', answer: 206 },
    { question: 'Piyanonun tus sayisi kactir?', answer: 88 },
    { question: 'Bir satranc tahtasinda kac kare vardir?', answer: 64 },
    { question: 'Bir deste iskambil kagidinda kac kart vardir?', answer: 52 }
  ],
  'Bilim': [
    { question: 'Isigin hizi yaklasik kac kilometre/saniyedir?', answer: 300000 },
    { question: 'Insan vucudunda kac kromozom bulunur?', answer: 46 },
    { question: 'Dunya’nin Gunes’e ortalama uzakligi kac milyon kilometredir?', answer: 150 },
    { question: 'Periyodik tabloda kac element vardir (2025 itibariyla)?', answer: 118 },
    { question: 'Bir mol gazda kac molekul bulunur (Avogadro sayisi)?', answer: 602000000000000000000000 }
  ],
  'Filmler ve Diziler': [
    { question: 'Yuzuklerin Efendisi uclemesinde kac film vardir?', answer: 3 },
    { question: 'Harry Potter serisinde kac film cekildi?', answer: 8 },
    { question: 'Ilk Star Wars filmi kac yilinda yayinlandi?', answer: 177 },
    { question: 'James Bond serisinde kac film vardir (2025 itibariyla)?', answer: 25 },
    { question: 'Breaking Bad dizisi kac sezon surdu?', answer: 5 }
  ]
};

// Soru üretme fonksiyonu
function generateQuestions(topic) {
  logger.info(`Returning dummy questions for topic: ${topic}`);
  const questions = dummyQuestions[topic] || [];
  return questions;
}

// Oyun başlatma
function startGame(lobbyId) {
  logger.info(`Starting game in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  if (!lobby) return;
  lobby.status = 'playing';
  lobby.currentQuestion = 0;
  lobby.guesses = {};
  const questions = generateQuestions(lobby.topic);
  lobby.questionQueue = questions;
  setTimeout(() => startNewRound(lobbyId), 1000);
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
  const options = shuffleOptions([
    questionData.answer,
    questionData.answer + 5,
    questionData.answer - 5,
    questionData.answer + 10
  ]);
  logger.info(`Sending new_round to lobby ${lobbyId}: ${questionData.question}`);
  io.to(lobbyId).emit('new_round', {
    question: questionData.question,
    options,
    players: Object.keys(lobby.players),
    scores: lobby.scores,
    timer: TIMER_DURATION
  });
  setTimeout(() => evaluateGuesses(lobbyId), TIMER_DURATION * 1000);
}

// Seçenekleri karıştırma
function shuffleOptions(options) {
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

// Tahminleri değerlendirme
function evaluateGuesses(lobbyId) {
  if (!lobbies[lobbyId]) return;
  logger.info(`Evaluating guesses in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  const correctAnswer = lobby.currentQuestionData.answer;
  const guesses = lobby.guesses;
  let result;
  const winners = Object.keys(guesses).filter(player => guesses[player] === correctAnswer);
  if (winners.length > 0) {
    winners.forEach(winner => {
      lobby.scores[winner] += 1;
    });
    result = { correctAnswer, winners };
  } else {
    result = { correctAnswer, winners: [] };
  }
  io.to(lobbyId).emit('round_result', result);
  setTimeout(() => {
    if (!lobbies[lobbyId]) return;
    if (Math.max(...Object.values(lobby.scores)) >= 3 || !lobby.questionQueue.length) {
      endGame(lobbyId);
    } else {
      startNewRound(lobbyId);
    }
  }, BREAK_DURATION * 1000);
}

// Oyunu bitirme
function endGame(lobbyId) {
  if (!lobbies[lobbyId]) return;
  logger.info(`Ending game in lobby ${lobbyId}`);
  const lobby = lobbies[lobbyId];
  const winner = Object.keys(lobby.scores).reduce((a, b) =>
    lobby.scores[a] > lobby.scores[b] ? a : b, null
  );
  // Bet özelliği kaldırıldı çünkü tanımlı değil
  io.to(lobbyId).emit('game_over', { winner, scores: lobby.scores });
}

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS için true yapın
}));

// Oturum kontrolü
function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// API rotaları
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    req.session.username = username;
    res.json({ message: 'Login successful', username });
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
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    req.session.username = username;
    res.json({ message: 'Registration successful', username });
  } catch (err) {
    logger.error('Error during registration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout successful' });
  });
});

app.get('/lobbies', (req, res) => {
  res.json({ lobbies });
});

app.post('/create_lobby', isAuthenticated, (req, res) => {
  const { username, topic } = req.body;
  if (!username || !topic) {
    return res.status(400).json({ message: 'Username and topic are required' });
  }
  const lobbyId = `lobby_${Object.keys(lobbies).length + 1}`;
  lobbies[lobbyId] = {
    owner: username,
    players: { [username]: { ready: false } },
    scores: { [username]: 0 },
    topic,
    status: 'waiting'
  };
  logger.info(`New lobby created: ${lobbyId} by ${username}`);
  res.json({ lobbyId, username });
});

// Socket.IO olayları
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  socket.on('join_lobby', ({ lobbyId, username }) => {
    if (!lobbies[lobbyId]) {
      socket.emit('error', { message: 'Lobi bulunamadı' });
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
    socket.join(lobbyId);
    io.to(lobbyId).emit('lobby_update', lobby);
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
    try {
      const guessValue = parseInt(guess);
      if (username in lobbies[lobbyId].players) {
        lobbies[lobbyId].guesses[username] = guessValue;
      }
    } catch (error) {
      socket.emit('error', { message: 'Geçersiz sayı formatı!' });
    }
  });

  socket.on('leave_lobby', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && username in lobbies[lobbyId].players) {
      delete lobbies[lobbyId].players[username];
      delete lobbies[lobbyId].scores[username];
      socket.leave(lobbyId);
      if (!Object.keys(lobbies[lobbyId].players).length) {
        delete lobbies[lobbyId];
      } else if (Object.keys(lobbies[lobbyId].players).length === 1 &&
                 lobbies[lobbyId].status === 'playing') {
        endGame(lobbyId);
      }
      if (lobbies[lobbyId]) {
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