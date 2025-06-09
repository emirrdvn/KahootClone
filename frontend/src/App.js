import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainScreen from './components/MainScreen';
import Lobbies from './components/Lobbies';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Index from './components/Index';
import './styles/tailwind.css';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUsername={setUsername} />} />
        <Route path="/register" element={<Register setUsername={setUsername} />} />
        <Route path="/mainscreen" element={username ? <MainScreen username={username} /> : <Navigate to="/login" />} />
        <Route path="/lobbies" element={username ? <Lobbies username={username} /> : <Navigate to="/login" />} />
        <Route path="/lobby/:lobbyId" element={username ? <Lobby username={username} /> : <Navigate to="/login" />} />
        <Route path="/game/:lobbyId" element={username ? <Game username={username} /> : <Navigate to="/login" />} />
        <Route path="/Index" element={<Index username={username} />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;