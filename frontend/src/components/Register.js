import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import './css/register.css';

function Register({ setUsername }) {
  const bgRef = useRef(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/register', formData);
      const { token } = response.data;
      localStorage.setItem('token', token);
      setUsername(formData.username);
      navigate('/mainscreen');
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt başarısız');
    }
  };

  return (
    <div ref={bgRef} className="register-bg">
      <div className="register-container">

        <form className="register-form" onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <i className="fas fa-user-plus" style={{ fontSize: '5rem', color: '#0078d4' }}></i>
          </div>
          <h2>Hesap Oluştur</h2>
          <input
            type="text"
            name="username"
            placeholder="Kullanıcı Adı"
            value={formData.username}
            onChange={handleChange}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Şifre"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {error && <div className="register-error">{error}</div>}
          <button type="submit" className="register-btn">Kayıt Ol</button>
          <div className="register-links">
            <a href="/login">Zaten hesabın var mı? Giriş Yap</a>
          </div>
          <button
            className="logout-icon-btn"
            title="Çıkış Yap"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              navigate('/welcome');
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </form>
      </div>
      <footer className="register-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Register;