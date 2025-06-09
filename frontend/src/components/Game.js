import { useEffect, useState } from 'react';
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

  useEffect(() => {
    socket.emit('join_lobby', { lobbyId, username });
    socket.on('new_round', (data) => {
      setGameData(data);
      setResult(null);
    });
    socket.on('round_result', (data) => {
      setResult(data);
    });
    socket.on('game_over', ({ winner, scores }) => {
      alert(`Oyun bitti! Kazanan: ${winner || 'Yok'}`);
      navigate('/lobbies');
    });
    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/lobbies');
    });
    return () => {
      socket.off('new_round');
      socket.off('round_result');
      socket.off('game_over');
      socket.off('error');
    };
  }, [lobbyId, username, navigate]);

  const handleGuess = (guess) => {
    socket.emit('submit_guess', { lobbyId, username, guess });
  };

  const handleLeave = () => {
    socket.emit('leave_lobby', { lobbyId, username });
    navigate('/lobbies');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Oyun - {lobbyId}</h2>
        <p className="text-lg mb-4">{gameData.question}</p>
        <div className="mb-4">
          {gameData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleGuess(option)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-2"
            >
              {option}
            </button>
          ))}
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
              {result.winners.length > 0 ? result.winners.join(', ') : 'Yok'}
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