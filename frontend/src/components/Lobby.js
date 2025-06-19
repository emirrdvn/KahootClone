import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './css/lobby.css';
import mouseClickSound from '../sounds/mouse-click.mp3';

function Lobby({ username }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);

  // Dinamik renkli arka plan animasyonu
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

    // Animasyonu başlatmak için bir sonraki frame'i bekle
    animationFrameId = requestAnimationFrame(updateGradient);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socket.emit('join_lobby', { token, lobbyId, username });

    socket.on('lobby_update', (lobbyData) => {
      setLobby(lobbyData);
    });
    socket.on('start_game', ({ lobbyId }) => {
      navigate(`/game/${lobbyId}`);
    });
    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/lobbies');
    });
    return () => {
      socket.off('lobby_update');
      socket.off('start_game');
      socket.off('error');
    };
  }, [lobbyId, username, navigate]);

  const handleReady = () => {
    socket.emit('ready', { lobbyId, username });
  };

  const handleLeave = () => {
    socket.emit('leave_lobby', { lobbyId, username });
    navigate('/lobbies');
  };

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

  if (!lobby) return <div className="lobby-loading">Yükleniyor...</div>;

  return (
    <div ref={bgRef} className="lobby-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot !  </a>
          <h2 className="mainscreen-title">Bekleme Odası</h2>
        </div>
      </header>
      <div className="lobby-container">
        <div className="lobby-title-area">
          <div className="lobby-title-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="lobby-title">Lobby</div>
          <div className="lobby-id">#{lobbyId}</div>
        </div>
        <div className="lobby-topic">
          <i className="fas fa-lightbulb"></i> <b>Konu:</b> {lobby.topic}
        </div>
        <div className="lobby-players-title">
          <i className="fas fa-user-friends"></i> Oyuncular
        </div>
        <ul className="lobby-players-list">
          {Object.keys(lobby.players).map(player => (
            <li key={player} className={lobby.players[player].ready ? 'ready' : ''}>
              <span>
                <i className={`fas ${lobby.players[player].ready ? 'fa-check-circle' : 'fa-user'}`}></i>
                {player}
              </span>
              <span className="lobby-player-status">
                {lobby.players[player].ready ? 'Hazır' : 'Bekliyor'}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            if (clickAudioRef.current) {
              clickAudioRef.current.currentTime = 0;
              clickAudioRef.current.play().catch(() => {});
            }
            handleReady();
          }}
          className={`lobby-btn ready-btn${lobby.players[username]?.ready ? ' disabled' : ''}`}
          disabled={lobby.players[username]?.ready}
        >
          <i className="fas fa-check"></i> Hazırım
        </button>
        <button
          className="lobby-leave-btn-bottom"
          title="Ana Sayfa"
          onClick={() => playAndNavigate('/mainscreen')}
        >
          <i className="fas fa-home"></i>
        </button>
      </div>
      <footer className="mainscreen-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Lobby;