import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

function Login({ setUsername }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', formData);
      const { token } = response.data;
      localStorage.setItem('token', token); // Store the token
      setUsername(formData.username);
      navigate('/mainscreen');
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Giriş Yap</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Kullanıcı Adı"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Şifre</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Şifre"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Giriş Yap
          </button>
        </form>
        <p className="mt-4 text-center">
          Hesabın yok mu? <a href="/register" className="text-blue-500">Kayıt Ol</a>
        </p>
        <p className="mt-2 text-center">
          <a href="/" className="text-blue-500">Ana Sayfaya Dön</a>
        </p>
      </div>
    </div>
  );
}

export default Login;