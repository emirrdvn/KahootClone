import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Index({ username }) {
  const [formData, setFormData] = useState({ username, topic: 'Spor', questionCount: 5 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/create_lobby', formData, { withCredentials: true });
      navigate(`/lobby/${response.data.lobbyId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lobi oluşturma başarısız');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/logout', { withCredentials: true });
      localStorage.removeItem('username');
      navigate('/login');
    } catch (err) {
      setError('Çıkış yapma başarısız');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Hoş geldiniz, {username}!</h2>
          <button
            onClick={handleLogout}
            className="text-blue-500 hover:underline"
          >
            Çıkış Yap
          </button>
        </div>
        <h3 className="text-lg font-semibold mb-4">Yeni Lobi Oluştur</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              readOnly
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Konu Seçin</label>
            <select
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Spor">Spor</option>
              <option value="Tarih">Tarih</option>
              <option value="Coğrafya">Coğrafya</option>
              <option value="Genel Kültür">Genel Kültür</option>
              <option value="Bilim">Bilim</option>
              <option value="Filmler ve Diziler">Filmler ve Diziler</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Soru Sayısı (1-10)</label>
            <input
              type="number"
              name="questionCount"
              value={formData.questionCount}
              onChange={handleChange}
              min="1"
              max="10"
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Lobi Oluştur
          </button>
        </form>
        <button
          onClick={() => navigate('/lobbies')}
          className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 mt-4"
        >
          Mevcut Lobilere Göz Atın
        </button>
      </div>
    </div>
  );
}

export default Index;