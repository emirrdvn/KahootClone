import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import mouseClickSound from '../sounds/mouse-click.mp3';
import clockTickingSound from '../sounds/Clock-Ticking.mp3';
import './css/game.css';

function Game({ username }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    question: 'Soru Yükleniyor...',
    options: [],
    timer: 0,
    players: [],
    scores: {}
  });
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerList, setWinnerList] = useState([]);
  const timerRef = useRef(null);
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);
  const tickingAudioRef = useRef(null);

  // Renkli arka plan animasyonu
  useEffect(() => {
    let step = 0;
    const colors = [
      [255, 0, 85],
      [0, 184, 255],
      [255, 221, 51],
      [0, 217, 126],
      [255, 94, 0],
      [170, 0, 255],
    ];
    let colorIndices = [0, 1, 2, 3];
    let animationFrameId;

    function updateGradient() {
      if (!bgRef.current) {
        animationFrameId = requestAnimationFrame(updateGradient);
        return;
      }
      let c0_0 = colors[colorIndices[0]];
      let c0_1 = colors[colorIndices[1]];
      let c1_0 = colors[colorIndices[2]];
      let c1_1 = colors[colorIndices[3]];

      let istep = 1 - step;
      let r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
      let g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
      let b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
      let r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
      let g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
      let b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);

      bgRef.current.style.background = `linear-gradient(120deg, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`;

      step += 0.001;
      if (step >= 1) {
        step = 0;
        colorIndices[0] = colorIndices[1];
        colorIndices[2] = colorIndices[3];
        colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
        colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
      }
      animationFrameId = requestAnimationFrame(updateGradient);
    }
    animationFrameId = requestAnimationFrame(updateGradient);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      const token = localStorage.getItem('token');
      socket.emit('join_lobby', { token, lobbyId, username });
    });
    socket.on('disconnect', () => {});
    socket.on('lobby_update', (lobby) => {});
    socket.on('new_round', (data) => {
      setGameData({
        question: data.question || 'Soru yüklenemedi',
        options: data.options || [],
        timer: (data.timer || 15) * 1000,
        players: data.players || [],
        scores: data.scores || {}
      });
      setResult(null);
      setSelected(null);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setGameData(prev => {
          const newTimer = prev.timer - 100;

        if (newTimer <= 6000 && newTimer > 0) {
          if (tickingAudioRef.current && tickingAudioRef.current.paused) {
            tickingAudioRef.current.currentTime = 0;
            tickingAudioRef.current.play().catch(() => {});
          }
        } else if (newTimer <= 0) {
          if (tickingAudioRef.current) tickingAudioRef.current.pause();
          clearInterval(timerRef.current);
          return { ...prev, timer: 0 };
        }
          return { ...prev, timer: newTimer };
        });
      }, 100);
    });
    socket.on('round_result', (data) => {
      setResult(data);
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickingAudioRef.current) tickingAudioRef.current.pause();
      setGameData(prev => ({ ...prev, timer: 0 }));
    });
    socket.on('game_over', ({ winners, scores }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickingAudioRef.current) tickingAudioRef.current.pause();
      setGameData(prev => ({ ...prev, timer: 0 }));
      setWinnerList(winners);
      setShowWinner(true);
      socket.emit('leave_lobby', { lobbyId, username });
    });
    socket.on('error', ({ message }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickingAudioRef.current) tickingAudioRef.current.pause();
      alert(message);
      setTimeout(() => navigate('/lobbies'), 500);
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby_update');
      socket.off('new_round');
      socket.off('round_result');
      socket.off('game_over');
      socket.off('error');
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickingAudioRef.current) tickingAudioRef.current.pause();
    };
  }, [lobbyId, username, navigate]);

  const handleGuess = (guess) => {
    setSelected(guess);
    socket.emit('submit_guess', { lobbyId, username, guess });
  };

  const handleLeave = () => {
    socket.emit('leave_lobby', { lobbyId, username });
    navigate('/lobbies');
  };

  const maxScore = Math.max(1, ...Object.values(gameData.scores));
  const timerDisplay = (gameData.timer / 1000).toFixed(1);

  const playClickSound = () => {
    if (clickAudioRef.current) {
      try {
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play().catch(() => {});
      } catch {}
    }
  };

  const playAndNavigate = (path) => {
    playClickSound();
    setTimeout(() => navigate(path), 150);
  };

  return (
    <div ref={bgRef} className="game-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <audio ref={tickingAudioRef} src={clockTickingSound} preload="auto" />
      {showWinner ? (
        <div className="game-winner-modal">
          <div className="game-winner-content">
            <div className="game-winner-icon"><i className="fas fa-trophy"></i></div>
            <h2>Kazanan{winnerList.length > 1 ? 'lar' : ''}!</h2>
            <div className="game-winner-list">
              {winnerList.length > 0
                ? winnerList.map((w, i) => <div key={i} className="game-winner-name">{w}</div>)
                : <div className="game-winner-name">Yok</div>
              }
            </div>
            <button
              className="game-winner-btn"
              onClick={() => playAndNavigate('/mainscreen')}
            >
              <i className="fas fa-home"></i> Ana Sayfa
            </button>
          </div>
        </div>
      ) : (
        <div className="game-panels">
          <div className="game-container">
            <div className="game-question-area">
              <div className="game-question-icon">
                <i className="fas fa-question-circle"></i>
              </div>
              <div className="game-question">{gameData.question}</div>
            </div>
            <div className="game-options">
              {gameData.options && gameData.options.length > 0 ? (
                gameData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      playClickSound();
                      handleGuess(option);
                    }}
                    className={`game-option-btn${selected === option ? ' selected' : ''}${result ? (
                      result.correctAnswer === option
                        ? ' correct'
                        : selected === option
                          ? ' wrong'
                          : ''
                    ) : ''}`}
                    disabled={gameData.timer === 0 || !!result}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <p className="game-loading">Şıklar yükleniyor...</p>
              )}
            </div>
            {result && (
              <div className="game-result">
                <div>
                  <b>Doğru Cevap:</b> <span className="game-correct">{result.correctAnswer}</span>
                </div>
                <div>
                  <b>Kazananlar:</b> {result.winners && result.winners.length > 0 ? result.winners.join(', ') : 'Yok'}
                </div>
              </div>
            )}
          </div>
          <div className="game-sidepanel">
            <div className={`game-timer${gameData.timer <= 5000 ? ' danger' : ''}`}>
              <i className="fas fa-clock"></i> <span>Kalan Süre:</span> <b>{timerDisplay}</b>
            </div>
            <div className="game-players-title">
              <i className="fas fa-users"></i> Oyuncular & Skorlar
            </div>
            <ul className="game-players-list">
              {gameData.players.map(player => (
                <li key={player}>
                  <span className="game-player-name">{player}</span>
                  <div className="game-score-bar-wrap">
                    <div
                      className="game-score-bar"
                      style={{
                        width: `${(gameData.scores[player] || 0) / maxScore * 100}%`
                      }}
                    ></div>
                    <span className="game-score">{gameData.scores[player] || 0}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (window.confirm("Oyundan çıkmak istediğinize emin misiniz?")) {
                  playClickSound();
                  handleLeave();
                }
              }}
              className="game-leave-btn"
              title="Oyundan çık"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
