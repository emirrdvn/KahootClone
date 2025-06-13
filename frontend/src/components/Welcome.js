import React, { useEffect, useRef } from 'react';
import './css/welcome.css';

function Footer() {
  return (
    <footer className="main-footer">
      Kahoot! &copy; {new Date().getFullYear()} - Tüm hakları saklıdır.
    </footer>
  );
}

function Welcome() { // <-- Büyük harfle başlat
  const bgRef = useRef(null);

  // Dinamik arka plan renkleri için
  useEffect(() => {
    let step = 0;
    const colors = [
      [255, 0, 85],    // pembe
      [0, 184, 255],   // mavi
      [255, 221, 51],  // sarı
      [0, 217, 126],   // yeşil
      [255, 94, 0],    // turuncu
      [170, 0, 255],   // mor
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
    // Temizlik
    return () => {};
  }, []);

  return (
    <div ref={bgRef} className="kahoot-bg">
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot ! ' a Hoşgeldiniz</a>
        </div>
      </header>

      <main>
        <div className="main-action-buttons">
          <a href="/lobbies" className="no-underline">
            <button className="action-button join-game">
              <div className="icon-container">
                <i className="fas fa-play-circle"></i>
              </div>
              <span>Join a Lobby</span>
            </button>
          </a>
          <a href="/create-lobby" className="no-underline">
            <button className="action-button create-game">
              <div className="icon-container">
                <i className="fas fa-plus-circle"></i>
              </div>
              <span>Create a Lobby</span>
            </button>
          </a>
          <a href="/login" className="no-underline">
            <button className="action-button login">
              <div className="icon-container">
                <i className="fas fa-sign-in-alt"></i>
              </div>
              <span>Login</span>
            </button> 
          </a>
          <a href="/register" className="no-underline">
            <button className="action-button register">
              <div className="icon-container">
                <i className="fas fa-user-plus"></i>
              </div>
              <span>Register</span>
            </button>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Welcome; // <-- Büyük harfle export et