import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function QuizHistory({ username }) {
  const navigate = useNavigate();
  
  // Static quiz history data - replace this with API call later
  const [quizHistory] = useState([
    {
      id: 1,
      topic: 'Spor',
      date: '2024-01-15',
      totalQuestions: 5,
      correctAnswers: 3,
      score: 60,
      questions: [
        {
          question: 'Futbol maçı normal sürede kaç dakika oynanır?',
          options: ['90', '80', '100', '120'],
          correctAnswer: '90',
          userAnswer: '90',
          isCorrect: true
        },
        {
          question: 'Basketbol takımında kaç oyuncu bulunur?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '5',
          userAnswer: '6',
          isCorrect: false
        },
        {
          question: 'Olimpiyat oyunları kaç yılda bir düzenlenir?',
          options: ['2', '3', '4', '5'],
          correctAnswer: '4',
          userAnswer: '4',
          isCorrect: true
        },
        {
          question: 'Tenis kortunda kaç set oynanır?',
          options: ['2', '3', '5', '1'],
          correctAnswer: '3',
          userAnswer: '2',
          isCorrect: false
        },
        {
          question: 'Dünya Kupası kaç yılda bir düzenlenir?',
          options: ['2', '3', '4', '5'],
          correctAnswer: '4',
          userAnswer: '4',
          isCorrect: true
        }
      ]
    },
    {
      id: 2,
      topic: 'Tarih',
      date: '2024-01-12',
      totalQuestions: 3,
      correctAnswers: 2,
      score: 67,
      questions: [
        {
          question: 'Osmanlı İmparatorluğu ne zaman kuruldu?',
          options: ['1299', '1453', '1071', '1923'],
          correctAnswer: '1299',
          userAnswer: '1299',
          isCorrect: true
        },
        {
          question: 'Türkiye Cumhuriyeti ne zaman kuruldu?',
          options: ['1920', '1921', '1922', '1923'],
          correctAnswer: '1923',
          userAnswer: '1922',
          isCorrect: false
        },
        {
          question: 'İstanbul hangi yıl fethedildi?',
          options: ['1451', '1452', '1453', '1454'],
          correctAnswer: '1453',
          userAnswer: '1453',
          isCorrect: true
        }
      ]
    },
    {
      id: 3,
      topic: 'Bilim',
      date: '2024-01-10',
      totalQuestions: 4,
      correctAnswers: 4,
      score: 100,
      questions: [
        {
          question: 'Hangi gezegen "Kızıl Gezegen" olarak bilinir?',
          options: ['Mars', 'Jüpiter', 'Venüs', 'Merkür'],
          correctAnswer: 'Mars',
          userAnswer: 'Mars',
          isCorrect: true
        },
        {
          question: 'Su hangi sıcaklıkta donar?',
          options: ['0°C', '1°C', '-1°C', '2°C'],
          correctAnswer: '0°C',
          userAnswer: '0°C',
          isCorrect: true
        },
        {
          question: 'Atomun merkezinde ne bulunur?',
          options: ['Elektron', 'Nötron', 'Çekirdek', 'Proton'],
          correctAnswer: 'Çekirdek',
          userAnswer: 'Çekirdek',
          isCorrect: true
        },
        {
          question: 'DNA\'nın açılımı nedir?',
          options: ['Deoksiribonükleik asit', 'Dikarbonükleik asit', 'Deokleonik asit', 'Deksiribonükleik asit'],
          correctAnswer: 'Deoksiribonükleik asit',
          userAnswer: 'Deoksiribonükleik asit',
          isCorrect: true
        }
      ]
    }
  ]);

  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const handleViewDetails = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleBackToList = () => {
    setSelectedQuiz(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (selectedQuiz) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handleBackToList}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                ← Geri Dön
              </button>
              <h1 className="text-2xl font-bold">Quiz Detayları</h1>
              <div></div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2">{selectedQuiz.topic}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tarih:</span>
                  <p>{formatDate(selectedQuiz.date)}</p>
                </div>
                <div>
                  <span className="font-medium">Toplam Soru:</span>
                  <p>{selectedQuiz.totalQuestions}</p>
                </div>
                <div>
                  <span className="font-medium">Doğru Cevap:</span>
                  <p>{selectedQuiz.correctAnswers}</p>
                </div>
                <div>
                  <span className="font-medium">Skor:</span>
                  <p className={`font-bold ${getScoreColor(selectedQuiz.score)}`}>
                    %{selectedQuiz.score}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Sorular ve Cevaplar</h3>
              {selectedQuiz.questions.map((q, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    q.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-800">
                      {index + 1}. {q.question}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        q.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {q.isCorrect ? 'Doğru' : 'Yanlış'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {q.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-2 rounded text-sm ${
                          option === q.correctAnswer
                            ? 'bg-green-100 border-2 border-green-300 text-green-800'
                            : option === q.userAnswer && !q.isCorrect
                            ? 'bg-red-100 border-2 border-red-300 text-red-800'
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {option}
                        {option === q.correctAnswer && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                        {option === q.userAnswer && !q.isCorrect && (
                          <span className="ml-1 text-red-600">✗</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Doğru Cevap:</span> {q.correctAnswer}
                    </p>
                    <p>
                      <span className="font-medium">Senin Cevabın:</span> {q.userAnswer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Quiz Geçmişi</h1>
            <button
              onClick={() => navigate('/mainscreen')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Ana Sayfa
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">Hoş geldiniz, <span className="font-semibold">{username}</span>!</p>
            <p className="text-sm text-gray-500">Geçmiş quiz sonuçlarınızı görüntüleyebilirsiniz.</p>
          </div>

          {quizHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Henüz quiz geçmişiniz bulunmuyor.</p>
              <button
                onClick={() => navigate('/index')}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                İlk Quiz'inizi Oluşturun
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizHistory.map((quiz) => (
                <div
                  key={quiz.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{quiz.topic}</h3>
                      <p className="text-sm text-gray-500">{formatDate(quiz.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(quiz.score)}`}>
                        %{quiz.score}
                      </p>
                      <p className="text-sm text-gray-500">
                        {quiz.correctAnswers}/{quiz.totalQuestions} doğru
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>📋 {quiz.totalQuestions} soru</span>
                      <span>✅ {quiz.correctAnswers} doğru</span>
                      <span>❌ {quiz.totalQuestions - quiz.correctAnswers} yanlış</span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(quiz)}
                      className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                    >
                      Detayları Gör
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          quiz.score >= 80
                            ? 'bg-green-500'
                            : quiz.score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${quiz.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">Toplam Quiz</p>
                <p className="text-lg font-bold text-gray-800">{quizHistory.length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">Ortalama Skor</p>
                <p className="text-lg font-bold text-gray-800">
                  %{quizHistory.length > 0 
                    ? Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / quizHistory.length)
                    : 0
                  }
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">En Yüksek Skor</p>
                <p className="text-lg font-bold text-gray-800">
                  %{quizHistory.length > 0 ? Math.max(...quizHistory.map(q => q.score)) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizHistory;