import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainScreen from './components/MainScreen';
import Lobbies from './components/Lobbies';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Index from './components/Index';
import PrivateRoute from './PrivateRoute';
import QuizHistory from './components/QuizHistory';
import Welcome from './components/Welcome';
import backgroundMusic from './sounds/backgraund-kahoot.mp3';

import './styles/tailwind.css';

function App() {
  const [username, setUsername] = useState('');
  const musicRef = useRef(null);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    // Token'dan username'i decode et
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
        localStorage.setItem('username', payload.username);
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    }
  }, []);

  const startMusic = () => {
    if (!musicStarted && musicRef.current) {
      musicRef.current.volume = 0.25;
      musicRef.current.play().catch(() => {});
      setMusicStarted(true);
    }
  };

  return (
    <BrowserRouter>
      <div onClick={startMusic} style={{ minHeight: '100vh' }}>
        <audio
          ref={musicRef}
          src={backgroundMusic}
          loop
          preload="auto"
        />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login setUsername={setUsername} />} />
          <Route path="/register" element={<Register setUsername={setUsername} />} />
          <Route path="/mainscreen" element={<PrivateRoute><MainScreen username={username} /></PrivateRoute>} />
          <Route path="/lobbies" element={<PrivateRoute><Lobbies username={username} /></PrivateRoute>} />
          <Route path="/lobby/:lobbyId" element={<PrivateRoute><Lobby username={username} /></PrivateRoute>} />
          <Route path="/game/:lobbyId" element={<PrivateRoute><Game username={username} /></PrivateRoute>} />
          <Route path="/create-lobby" element={<PrivateRoute><Index username={username} /></PrivateRoute>} />
          <Route path="/quiz-history" element={<PrivateRoute><QuizHistory username={username} /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/welcome" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;