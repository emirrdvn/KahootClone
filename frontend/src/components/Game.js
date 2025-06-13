import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

function Game({ username }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState({
    question: 'Soru buraya gelecek...',
    options: [],
    timer: 'Bekleniyor...',
    players: [],
    scores: {}
  });
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      const token = localStorage.getItem('token'); // Token'ı al
      socket.emit('join_lobby', { token, lobbyId, username }); // Token'ı da gönder
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    socket.on('lobby_update', (lobby) => {
      console.log('lobby_update alındı:', lobby);
    });
    socket.on('new_round', (data) => {
      console.log('new_round alındı:', JSON.stringify(data, null, 2));
      setGameData({
        question: data.question || 'Soru yüklenemedi',
        options: data.options || [],
        timer: data.timer || 15,
        players: data.players || [],
        scores: data.scores || {}
      });
      setResult(null);
      // Timer'ı başlat
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setGameData(prev => {
          const newTimer = prev.timer - 1;
          if (newTimer <= 0) {
            clearInterval(timerRef.current);
            return { ...prev, timer: 0 };
          }
          return { ...prev, timer: newTimer };
        });
      }, 1000);
    });
    socket.on('round_result', (data) => {
      console.log('round_result alındı:', data);
      setResult(data);
      // Timer'ı durdur
      if (timerRef.current) clearInterval(timerRef.current);
      setGameData(prev => ({ ...prev, timer: 0 }));
    });
    socket.on('game_over', ({ winners, scores }) => {
      console.log('game_over alındı:', { winners, scores });
      // Timer'ı durdur
      if (timerRef.current) clearInterval(timerRef.current);
      setGameData(prev => ({ ...prev, timer: 0 }));
      alert(`Oyun bitti! Kazananlar: ${winners.length > 0 ? winners.join(', ') : 'Yok'}`);
      socket.emit('leave_lobby', { lobbyId, username });
      navigate('/mainscreen');
    });
    socket.on('error', ({ message }) => {
      console.log('error alındı:', message);
      // Timer'ı durdur
      if (timerRef.current) clearInterval(timerRef.current);
      alert(message);
      setTimeout(() => navigate('/lobbies'), 500);
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby_update');
      socket.off('new_round');
      socket.off('round_result');
      socket.off('game_over');
      socket.off('error');
      // Cleanup timer
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lobbyId, username, navigate]);

  useEffect(() => {
    console.log('gameData güncellendi:', gameData);
  }, [gameData]);

  const handleGuess = (guess) => {
    console.log('Gönderilen guess:', guess);
    socket.emit('submit_guess', { lobbyId, username, guess });
  };

  const handleLeave = () => {
    console.log('Lobiden çıkılıyor:', lobbyId, username);
    socket.emit('leave_lobby', { lobbyId, username });
    navigate('/lobbies');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Oyun - {lobbyId}</h2>
        <p className="text-lg mb-4">{gameData.question}</p>
        <div className="mb-4">
          {gameData.options && gameData.options.length > 0 ? (
            gameData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleGuess(option)}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
                disabled={gameData.timer === 0}
              >
                {option}
              </button>
            ))
          ) : (
            <p>Şıklar yükleniyor...</p>
          )}
        </div>
        <p className="mb-4">Kalan Süre: {gameData.timer} saniye</p>
        <h3 className="text-md font-semibold mb-2">Oyuncular ve Skorlar:</h3>
        <ul className="mb-4">
          {gameData.players.map(player => (
            <li key={player}>
              {player}: {gameData.scores[player] || 0}
            </li>
          ))}
        </ul>
        {result && (
          <div className="mb-4">
            <p>Doğru Cevap: {result.correctAnswer}</p>
            <p>
              Kazananlar:{' '}
              {result.winners && result.winners.length > 0 ? result.winners.join(', ') : 'Yok'}
            </p>
          </div>
        )}
        <button
          onClick={handleLeave}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Terk Et
        </button>
      </div>
    </div>
  );
}

export default Game;