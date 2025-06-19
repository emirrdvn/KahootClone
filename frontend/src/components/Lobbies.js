import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import './css/lobbies.css';
import mouseClickSound from '../sounds/mouse-click.mp3';

function Lobbies({ username }) {
  const [lobbies, setLobbies] = useState({});
  const navigate = useNavigate();
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);

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
    const fetchLobbies = async () => {
      try {
        const response = await api.get('/lobbies');
        setLobbies(response.data.lobbies);
      } catch (err) {
        console.error('Lobi listesi alınamadı:', err);
      }
    };
    fetchLobbies();
  }, []);

  const playAndNavigate = (path) => {
    if (clickAudioRef.current) {
      try {
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play().catch(() => {});
      } catch {}
    }
    setTimeout(() => navigate(path), 150);
  };

  const handleJoin = (lobbyId) => {
    playAndNavigate(`/lobby/${lobbyId}`);
  };

  return (
    <div ref={bgRef} className="lobbies-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot ! </a>
          <h2 className="mainscreen-title">Mevcut Lobiler </h2>
        </div>
      </header>
      <div className="lobbies-container">
        <div className="lobbies-title-area">
          <div className="lobbies-title-icon">
            <i className="fas fa-list-ul"></i>
          </div>
        </div>
        {Object.keys(lobbies).length === 0 ? (
          <p className="lobbies-empty">Henüz lobi yok.</p>
          
        ) : (
          <ul className="lobbies-list">
            {Object.entries(lobbies).map(([lobbyId, lobby]) => (
              <li key={lobbyId} className="lobbies-list-item">
                <div>
                  <span className="lobbies-list-id">
                    <i className="fas fa-hashtag"></i> {lobbyId}
                  </span>
                  <span className="lobbies-list-topic">
                    <i className="fas fa-lightbulb"></i> {lobby.topic}
                  </span>
                  <span className="lobbies-list-qcount">
                    <i className="fas fa-question"></i> {lobby.questionCount}
                  </span>
                </div>
                <button
                  onClick={() => handleJoin(lobbyId)}
                  className="lobbies-join-btn"
                >
                  <i className="fas fa-sign-in-alt"></i> Katıl
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => playAndNavigate('/mainscreen')}
          className="lobbies-main-btn"
          title="Ana Sayfa"
        >
          <i className="fas fa-home"></i>
        </button>
      </div>
      <footer className="index-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Lobbies;