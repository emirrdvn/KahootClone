import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mouseClickSound from '../sounds/mouse-click.mp3';
import './css/mainscreen.css';

function MainScreen({ username }) {
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);
  const navigate = useNavigate();

  // Dinamik arka plan animasyonu (aynı)
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

    function updateGradient() {
      if (!bgRef.current) return;
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
      requestAnimationFrame(updateGradient);
    }
    updateGradient();
    return () => {};
  }, []);

  const playAndNavigate = (path) => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }
    setTimeout(() => navigate(path), 150);
  };
  
  return (
    <div ref={bgRef} className="mainscreen-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot !  </a>
          <h2 className="mainscreen-title">Hoş Geldin, {username} !</h2>
        </div>
      </header>

      <div className="mainscreen-container">
       
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <i className="fas fa-user-circle" style={{ fontSize: '6rem', color: '#2c9b46' }}></i>
        </div>
        <div className="mainscreen-actions">
          <button
            onClick={() => playAndNavigate('/lobbies')}
            className="mainscreen-btn join"
          >
            <i className="fas fa-play-circle"></i> Oyuna Katıl
          </button>
          <button
            onClick={() => playAndNavigate('/create-lobby')}
            className="mainscreen-btn create"
          >
            <i className="fas fa-plus-circle"></i> Oyun Oluştur
          </button>
          <button
            onClick={() => playAndNavigate('/quiz-history')}
            className="mainscreen-btn history"
          >
            <i className="fas fa-history"></i> Quiz Geçmişi
          </button>
          <button
            className="logout-icon-btn"
            title="Çıkış Yap"
            onClick={() => {
              if (clickAudioRef.current) {
                try {
                  clickAudioRef.current.currentTime = 0;
                  clickAudioRef.current.play().catch(() => {});
                } catch (e) {}
              }
              setTimeout(() => navigate('/'), 150);
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
      <footer className="mainscreen-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default MainScreen;