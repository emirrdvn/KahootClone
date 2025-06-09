import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

function Lobby({ username }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);

  useEffect(() => {
    socket.emit('join_lobby', { lobbyId, username });
    socket.on('lobby_update', (lobbyData) => {
      setLobby(lobbyData);
    });
    socket.on('start_game', ({ lobbyId }) => {
      navigate(`/game/${lobbyId}`);
    });
    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/lobbies');
    });
    return () => {
      socket.off('lobby_update');
      socket.off('start_game');
      socket.off('error');
    };
  }, [lobbyId, username, navigate]);

  const handleReady = () => {
    socket.emit('ready', { lobbyId, username });
  };

  const handleLeave = () => {
    socket.emit('leave_lobby', { lobbyId, username });
    navigate('/lobbies');
  };

  if (!lobby) return <div className="text-center mt-10">Yükleniyor...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Lobi: {lobbyId}</h2>
        <p className="text-lg mb-4">Konu: {lobby.topic}</p>
        <h3 className="text-md font-semibold mb-2">Oyuncular:</h3>
        <ul className="mb-4">
          {Object.keys(lobby.players).map(player => (
            <li key={player} className="mb-2">
              {player} {lobby.players[player].ready ? '(Hazır)' : '(Bekliyor)'}
            </li>
          ))}
        </ul>
        <button
          onClick={handleReady}
          className={`w-full p-2 rounded text-white mb-2 ${
            lobby.players[username]?.ready
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
          disabled={lobby.players[username]?.ready}
        >
          Hazırım
        </button>
        <button
          onClick={handleLeave}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Lobiden Ayrıl
        </button>
      </div>
    </div>
  );
}

export default Lobby;