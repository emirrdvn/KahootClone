import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainScreen from './components/MainScreen';
import Lobbies from './components/Lobbies';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Index from './components/Index';
import PrivateRoute from './PrivateRoute';
import './styles/tailwind.css';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUsername={setUsername} />} />
        <Route path="/register" element={<Register setUsername={setUsername} />} />
        <Route path="/mainscreen" element={<PrivateRoute><MainScreen username={username} /></PrivateRoute>} />
        <Route path="/lobbies" element={<PrivateRoute><Lobbies username={username} /></PrivateRoute>} />
        <Route path="/lobby/:lobbyId" element={<PrivateRoute><Lobby username={username} /></PrivateRoute>} />
        <Route path="/game/:lobbyId" element={<PrivateRoute><Game username={username} /></PrivateRoute>} />
        <Route path="/Index" element={<PrivateRoute><Index username={username} /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;