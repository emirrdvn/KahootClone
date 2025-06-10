import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Lobbies({ username }) {
  const [lobbies, setLobbies] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/lobbies', { withCredentials: true });
        setLobbies(response.data.lobbies);
      } catch (err) {
        console.error('Lobi listesi alınamadı:', err);
      }
    };
    fetchLobbies();
  }, []);

  const handleJoin = (lobbyId) => {
    navigate(`/lobby/${lobbyId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Mevcut Lobiler</h2>
        {Object.keys(lobbies).length === 0 ? (
          <p className="text-center">Henüz lobi yok.</p>
        ) : (
          <ul className="space-y-4">
            {Object.entries(lobbies).map(([lobbyId, lobby]) => (
              <li key={lobbyId} className="border p-4 rounded">
                <p>Lobi: {lobbyId} | Konu: {lobby.topic} | Soru Sayısı: {lobby.questionCount}</p>
                <button
                  onClick={() => handleJoin(lobbyId)}
                  className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Katıl
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => navigate('/mainscreen')}
          className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 mt-4"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}

export default Lobbies;