import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import './css/index.css';
import mouseClickSound from '../sounds/mouse-click.mp3';

function Index({ username }) {
  const clickAudioRef = useRef(null);
  const [formData, setFormData] = useState({ username, topic: 'Spor', questionCount: 5 });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const bgRef = useRef(null);

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
  }, 
  []);

  const playClickSound = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }
  };

  const playAndNavigate = (path) => {
    playClickSound();
    setTimeout(() => navigate(path), 150);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClickSound();
    try {
      const response = await api.post('/create_lobby', formData);
      navigate(`/lobby/${response.data.lobbyId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lobi oluşturma başarısız');
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/logout');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      setError('Çıkış yapma başarısız');
    }
  };

  return (
    <div ref={bgRef} className="index-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot ! </a>
          <h2 className="mainscreen-title">Lobi Oluşturma Ekranı</h2>
        </div>
      </header>
      <div className="index-container">
        <div className="index-create-icon">
          <i className="fas fa-users-cog"></i>
        </div>
        <div className="index-header"></div>
        {error && <div className="index-error">{error}</div>}
        <form className="index-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="index-input"
            readOnly
          />
          <select
            name="topic"
            value={formData.topic}
            onChange={e => setFormData({ ...formData, topic: e.target.value })}
            className="index-input"
          >
            <option value="Spor">Spor</option>
            <option value="Tarih">Tarih</option>
            <option value="Coğrafya">Coğrafya</option>
            <option value="Genel Kültür">Genel Kültür</option>
            <option value="Bilim">Bilim</option>
            <option value="Filmler ve Diziler">Filmler ve Diziler</option>
          </select>
          <input
            type="number"
            name="questionCount"
            value={formData.questionCount}
            onChange={e => setFormData({ ...formData, questionCount: e.target.value })}
            min="1"
            max="10"
            className="index-input"
            placeholder="Soru Sayısı (1-10)"
          />
          <button type="submit" className="index-btn create" onClick={playClickSound}>
            <i className="fas fa-plus-circle"></i> Lobi Oluştur
          </button>
        </form>
        <button
          onClick={() => playAndNavigate('/lobbies')}
          className="index-btn browse"
        >
          <i className="fas fa-search"></i> Mevcut Lobilere Göz At
        </button>
        <button
          className="lobby-leave-btn-bottom"
          title="Ana Sayfa"
          onClick={() => playAndNavigate('/mainscreen')}
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

export default Index;