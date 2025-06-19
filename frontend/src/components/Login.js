import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mouseClickSound from "../sounds/mouse-click.mp3";
import api from '../axiosConfig';
import './css/login.css';

function Login({ setUsername }) {
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dinamik arka plan animasyonu
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

  // Güvenli ses oynatma fonksiyonu
  const playClickSound = () => {
    if (clickAudioRef.current) {
      try {
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play().catch(() => {});
      } catch {}
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    playClickSound();
    if (!form.username || !form.password) {
      setError('Kullanıcı adı ve şifre gerekli.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/login', form);
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', form.username);
      setUsername(form.username);
      navigate('/mainscreen');
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={bgRef} className="login-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <i className="fas fa-sign-in-alt" style={{ fontSize: '5rem', color: '#2c9b46' }}></i>
          </div>
          <h2>Giriş Yap</h2>
          <input
            type="text"
            name="username"
            placeholder="Kullanıcı Adı"
            value={form.username}
            onChange={handleChange}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Şifre"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          {(error || loading) && (
            <div className="login-error">
              {loading && <span className="login-spinner"></span>}
              {error}
            </div>
          )}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            onClick={playClickSound}
          >
            {loading ? 'Yükleniyor...' : 'Giriş Yap'}
          </button>
          <div className="login-links">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                playClickSound();
                setTimeout(() => navigate('/register'), 150);
              }}
            >
              Hesabın yok mu? Kayıt ol
            </a>
          </div>
          <button
            className="logout-icon-btn"
            title="Çıkış Yap"
            type="button"
            onClick={() => {
              playClickSound();
              setTimeout(() => navigate('/'), 150);
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </form>
      </div>
      <footer className="login-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Login;