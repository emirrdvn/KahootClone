const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const logger = require('pino')({ base: { pid: process.pid, hostname: require('os').hostname() } });
const session = require('express-session');

// .env dosyasını yükle
dotenv.config();

// Express ve Socket.IO ayarları
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Oyun verileri
const lobbies = {};
const TIMER_DURATION = 15; // Soru süresi (saniye)
const BREAK_DURATION = 5;  // Mola süresi (saniye)

// In-memory user store (use a database in production)
const users = {};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Statik dosyalar için (CSS, JS vs.)
app.set('view engine', 'ejs'); // Template engine olarak EJS kullanıyoruz

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

// Soru üretme fonksiyonu (AI yerine dummy sorular)
function generateQuestions(topic) {
  logger.info(`Returning dummy questions for topic: ${topic}`);
  const questions = dummyQuestions[topic] || [];
  if (questions.length < 5) {
    logger.error(`Not enough questions for topic: ${topic}`);
    return [];
  }
  logger.info(`Generated questions: ${JSON.stringify(questions, null, 2)}`);
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
  logger.info(`Questions for lobby ${lobbyId}: ${JSON.stringify(questions, null, 2)}`);
  lobby.questionQueue = questions;
  startNewRound(lobbyId);
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

  // Sorulara seçenekler ekle
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

// Seçenekleri karıştırma fonksiyonu
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

  logger.info(`Round result for lobby ${lobbyId}: ${JSON.stringify(result, null, 2)}`);
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
  const bet = lobby.bet;

  for (const player in lobby.players) {
    if (player === winner) {
      lobby.players[player].credits += bet;
    } else {
      lobby.players[player].credits -= bet;
    }
  }

  logger.info(`Game over in lobby ${lobbyId}. Winner: ${winner}, Scores: ${JSON.stringify(lobby.scores, null, 2)}`);
  io.to(lobbyId).emit('game_over', { winner, scores: lobby.scores });
}

// Add session middleware
app.use(session({
  secret: 'your-secret-key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  }
  res.redirect('/login');
}

// Login route
app.get('/login', (req, res) => {
  res.render('login'); // Render login.ejs
});

// ANA EKRAN İÇİN ROUTE
app.get('/mainscreen', (req, res) => {
    res.render('mainscreen'); // Bu, views/mainscreen.ejs dosyasını render eder
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    req.session.username = username;
    res.redirect('/mainscreen'); // Redirect to mainscreen after login
    logger.info(`User ${username} logged in successfully`);
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// Register route
app.get('/register', (req, res) => {
  res.render('register'); // Render register.ejs
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    res.status(400).send('User already exists');
  } else {
    users[username] = { password };
    req.session.username = username;
    res.redirect('/mainscreen'); // Redirect to mainscreen after registration
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Protect routes
app.get('/', isAuthenticated, (req, res) => {
  logger.info('Rendering mainscreen page');
  res.render('mainscreen', { username: req.session.username });
});

app.get('/lobbies', (req, res) => {
  logger.info('Rendering lobbies page');
  res.render('lobbies', { lobbies });
});

app.get('/index',isAuthenticated, (req, res) => {
  logger.info('Rendering index page');
  res.render('index', { username: req.session.username }); // Render index.ejs
});

app.post('/create_lobby', (req, res) => {
  const { username, topic } = req.body; // Sadece username ve topic alın
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

app.get('/lobby/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;
  if (!lobbies[lobbyId]) {
    logger.error(`Lobby ${lobbyId} not found`);
    return res.status(404).send('Lobby not found');
  }
  logger.info(`Rendering lobby page for ${lobbyId}`);
  res.render('lobby', { lobbyId });
});

app.get('/game/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;
  if (!lobbies[lobbyId] || lobbies[lobbyId].status !== 'playing') {
    logger.error(`Game not found or not started for lobby ${lobbyId}`);
    return res.status(404).send('Game not found or not started');
  }
  logger.info(`Rendering game page for ${lobbyId}`);
  res.render('game', { lobbyId });
});

// Socket.IO olayları
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  socket.on('join_lobby', ({ lobbyId, username }) => {
    if (!lobbies[lobbyId]) {
      socket.emit('error', { message: 'Lobi bulunamadı' });
      logger.error(`Join attempt to non-existent lobby: ${lobbyId}`);
      return;
    }

    const lobby = lobbies[lobbyId];
    if (username in lobby.players) {
      logger.info(`${username} already in lobby ${lobbyId}, updating connection`);
      socket.join(lobbyId);
      io.to(lobbyId).emit('lobby_update', lobby);
      return;
    }

    lobby.players[username] = { ready: false };
    lobby.scores[username] = 0;
    socket.join(lobbyId);
    logger.info(`${username} joined lobby ${lobbyId}`);
    io.to(lobbyId).emit('lobby_update', lobby);
  });

  socket.on('ready', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && username in lobbies[lobbyId].players) {
      lobbies[lobbyId].players[username].ready = true;
      logger.info(`${username} is ready in ${lobbyId}`);
      io.to(lobbyId).emit('lobby_update', lobbies[lobbyId]);

      if (Object.keys(lobbies[lobbyId].players).length === 2 &&
          Object.values(lobbies[lobbyId].players).every(p => p.ready)) {
        logger.info(`All players ready in ${lobbyId}, starting game`);
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
        logger.info(`${username} submitted guess ${guessValue} in ${lobbyId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Geçersiz sayı formatı!' });
      logger.error(`Invalid guess format from ${username} in ${lobbyId}: ${guess}`);
    }
  });

  socket.on('leave_lobby', ({ lobbyId, username }) => {
    if (lobbies[lobbyId] && username in lobbies[lobbyId].players) {
      delete lobbies[lobbyId].players[username];
      delete lobbies[lobbyId].scores[username];
      socket.leave(lobbyId);
      logger.info(`${username} left lobby ${lobbyId}`);

      if (!Object.keys(lobbies[lobbyId].players).length) {
        delete lobbies[lobbyId];
        logger.info(`Lobby ${lobbyId} deleted, no players left`);
      } else if (Object.keys(lobbies[lobbyId].players).length === 1 &&
                 lobbies[lobbyId].status === 'playing') {
        const winner = Object.keys(lobbies[lobbyId].players)[0];
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