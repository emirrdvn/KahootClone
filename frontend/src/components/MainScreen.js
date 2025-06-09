import { useNavigate } from 'react-router-dom';

function MainScreen({ username }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Hoş geldiniz, {username}!</h2>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate('/lobbies')}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Oyuna Katıl
          </button>
          <button
            onClick={() => navigate('/index')}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Oyun Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;