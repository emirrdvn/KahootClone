import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mouseClickSound from '../sounds/mouse-click.mp3';
import api from '../axiosConfig';
import './css/quizhistory.css';

function QuizHistory({ username }) {
  const bgRef = useRef(null);
  const clickAudioRef = useRef(null);
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const playClickSound = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }
  };

  const playAndNavigate = (path) => {
    playClickSound();
    setTimeout(() => navigate(path), 150);
  };

  const handleViewDetails = (quiz) => {
    playClickSound();
    setSelectedQuiz(quiz);
  };

  const handleBackToList = () => {
    playClickSound();
    setSelectedQuiz(null);
  };

  // Renkli arka plan animasyonu
  useEffect(() => {
    let step = 0;
    const colors = [
      [255, 0, 85],
      [0, 184, 255],
      [255, 221, 51],
      [0, 217, 126],
      [255, 94, 0],
      [170, 0, 255],
    ];
    let colorIndices = [0, 1, 2, 3];
    let animationFrameId;

    function updateGradient() {
      if (!bgRef.current) {
        animationFrameId = requestAnimationFrame(updateGradient);
        return;
      }
      let c0_0 = colors[colorIndices[0]];
      let c0_1 = colors[colorIndices[1]];
      let c1_0 = colors[colorIndices[2]];
      let c1_1 = colors[colorIndices[3]];

      let istep = 1 - step;
      let r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
      let g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
      let b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
      let r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
      let g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
      let b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);

      bgRef.current.style.background = `linear-gradient(120deg, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`;

      step += 0.001;
      if (step >= 1) {
        step = 0;
        colorIndices[0] = colorIndices[1];
        colorIndices[2] = colorIndices[3];
        colorIndices[1] = (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
        colorIndices[3] = (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) % colors.length;
      }
      animationFrameId = requestAnimationFrame(updateGradient);
    }
    animationFrameId = requestAnimationFrame(updateGradient);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await api.get('/quiz-history');
        setQuizHistory(res.data.history);
      } catch (err) {
        setError('Quiz geçmişi alınamadı.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 60) return 'score-yellow';
    return 'score-red';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // İstatistikler
  const totalQuiz = quizHistory.length;
  const avgScore = totalQuiz > 0 ? Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuiz) : 0;
  const maxScore = totalQuiz > 0 ? Math.max(...quizHistory.map(q => q.score)) : 0;

  if (loading) return (
    <div className="qh-center-text">
      <span className="qh-spinner"></span>
      Yükleniyor...
    </div>
  );
  if (error) return <div className="qh-center-text qh-error">{error}</div>;

  if (selectedQuiz) {
    return (
      <div ref={bgRef} className="qh-bg">
        <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
        <div className="qh-container">
          <div className="qh-header">
            <button onClick={handleBackToList} className="qh-btn qh-btn-gray">
              <i className="fas fa-arrow-left"></i> Geri Dön
            </button>
            <h1 className="qh-title">Quiz Detayları</h1>
            <div></div>
          </div>
          <div className="qh-quiz-summary">
            <div className="qh-topic">{selectedQuiz.topic}</div>
            <div className="qh-summary-row">
              <div>
                <span className="qh-label">Tarih:</span>
                <span>{formatDate(selectedQuiz.date)}</span>
              </div>
              <div>
                <span className="qh-label">Toplam Soru:</span>
                <span>{selectedQuiz.totalQuestions}</span>
              </div>
              <div>
                <span className="qh-label">Doğru Cevap:</span>
                <span>{selectedQuiz.correctAnswers}</span>
              </div>
              <div>
                <span className="qh-label">Skor:</span>
                <span className={`qh-score ${getScoreColor(selectedQuiz.score)}`}>%{selectedQuiz.score}</span>
              </div>
            </div>
          </div>
          <div className="qh-questions">
            <h3 className="qh-section-title">Sorular ve Cevaplar</h3>
            {selectedQuiz.questions.map((q, index) => (
              <div
                key={index}
                className={`qh-question-card ${q.isCorrect ? 'qh-correct' : 'qh-wrong'}`}
              >
                <div className="qh-question-row">
                  <div className="qh-question-text">
                    {index + 1}. {q.question}
                  </div>
                  <span className={`qh-answer-badge ${q.isCorrect ? 'qh-correct' : 'qh-wrong'}`}>
                    {q.isCorrect ? 'Doğru' : 'Yanlış'}
                  </span>
                </div>
                <div className="qh-options-row">
                  {q.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`qh-option
                        ${option === q.correctAnswer ? 'qh-option-correct' : ''}
                        ${option === q.userAnswer && !q.isCorrect ? 'qh-option-wrong' : ''}
                      `}
                    >
                      {option}
                      {option === q.correctAnswer && <span className="qh-correct-icon">✓</span>}
                      {option === q.userAnswer && !q.isCorrect && <span className="qh-wrong-icon">✗</span>}
                    </div>
                  ))}
                </div>
                <div className="qh-answer-row">
                  <span className="qh-label">Doğru Cevap:</span> {q.correctAnswer}
                  <span className="qh-label" style={{marginLeft: 16}}>Senin Cevabın:</span> {q.userAnswer || <span className="qh-muted">Cevap yok</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={bgRef} className="qh-bg">
      <audio ref={clickAudioRef} src={mouseClickSound} preload="auto" />
      <header className="main-header">
        <div className="logo">
          <a href="/" className="logo-text">Kahoot !   </a>
        </div>
      </header>
      <div className="qh-container">
        <div className="qh-header">
          <h1 className="qh-title"><i className="fas fa-history"></i> Quiz Geçmişi</h1>
          <button onClick={() => playAndNavigate('/mainscreen')} className="qh-btn qh-btn-gray">
            <i className="fas fa-home"></i>
          </button>
        </div>
        <div className="qh-welcome"></div>
        <div className="qh-stats-panel">
          <div className="qh-stat">
            <div className="qh-stat-label"><i className="fas fa-list-ol"></i> Toplam Quiz</div>
            <div className="qh-stat-value">{totalQuiz}</div>
          </div>
          <div className="qh-stat">
            <div className="qh-stat-label"><i className="fas fa-star"></i> Ortalama Skor</div>
            <div className="qh-stat-value">%{avgScore}</div>
          </div>
          <div className="qh-stat">
            <div className="qh-stat-label"><i className="fas fa-trophy"></i> En Yüksek Skor</div>
            <div className="qh-stat-value">%{maxScore}</div>
          </div>
        </div>
        {quizHistory.length === 0 ? (
          <div className="qh-empty">
            <p>Henüz quiz geçmişiniz bulunmuyor.</p>
            <button
              onClick={() => playAndNavigate('/create-lobby')}
              className="qh-btn qh-btn-blue"
            >
              <i className="fas fa-plus-circle"></i> İlk Quiz'inizi Oluşturun
            </button>
          </div>
        ) : (
          <div className="qh-list">
            {quizHistory.map((quiz) => (
              <div key={quiz.id} className="qh-list-item">
                <div className="qh-list-row">
                  <div>
                    <div className="qh-list-topic">{quiz.topic}</div>
                    <div className="qh-list-date">{formatDate(quiz.date)}</div>
                  </div>
                  <div className="qh-list-score">
                    <span className={`qh-score`}>%{quiz.score}</span>
                    <span className="qh-list-detail">{quiz.correctAnswers}/{quiz.totalQuestions} doğru</span>
                  </div>
                </div>
                <div className="qh-list-row qh-list-row-bottom">
                  <div className="qh-list-stats">
                    <span><i className="fas fa-question"></i> {quiz.totalQuestions} soru</span>
                    <span><i className="fas fa-check"></i> {quiz.correctAnswers} doğru</span>
                    <span><i className="fas fa-times"></i> {quiz.totalQuestions - quiz.correctAnswers} yanlış</span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(quiz)}
                    className="qh-btn qh-btn-blue qh-btn-small"
                  >
                    Detayları Gör
                  </button>
                </div>
                <div className="qh-progress-bar">
                  <div
                    className="qh-progress-fill"
                    data-score={quiz.score >= 80 ? 'high' : quiz.score >= 60 ? 'medium' : 'low'}
                    style={{ 
                      width: `${quiz.score}%`,
                      background: quiz.score >= 80 ? '#2c9b46' : quiz.score >= 60 ? '#ffd600' : '#ff5959'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <footer className="mainscreen-footer">
        Kahoot! &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default QuizHistory;