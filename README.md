# 🎯 Interactive Quiz Platform

Kahoot! benzeri, gerçek zamanlı çok oyunculu bir quiz uygulamasıdır. AI destekli soru üretimi, canlı oyun akışı ve detaylı quiz geçmişi ile hem öğrenciler hem eğitmenler için etkileşimli bir öğrenme deneyimi sunar.

---

## 🚀 Özellikler

- 🔐 **JWT Authentication** (güvenli giriş ve kayıt)
- 🤖 **Google Gemini AI** ile otomatik soru üretimi
- 🧑‍🤝‍🧑 **Gerçek zamanlı çok oyunculu oyunlar** (Socket.IO ile)
- 📊 **Quiz geçmişi ve istatistik analizi**
- 📱 **Mobil uyumlu modern React arayüzü**
- 🔊 **Ses efektleri ve geri bildirimler**
- 🎨 Basit ve sezgisel kullanıcı deneyimi

---

## 🧱 Kullanılan Teknolojiler

### Backend
- Node.js + Express.js
- PostgreSQL (JSONB destekli)
- Socket.IO (gerçek zamanlı iletişim)
- JWT + Bcrypt + Passport.js (güvenlik)

### Frontend
- React.js 
- Axios (HTTP istemcisi)
- Socket.IO Client
- CSS3 + Responsive tasarım

### AI Entegrasyonu
- Google Gemini API (soru üretimi)



## ⚙️ Kurulum

### 1. Repository'i Klonlayın

```bash
git clone https://github.com/kullaniciadi/interactive-quiz-platform.git
cd interactive-quiz-platform
```

### 2. Ortam Değişkenleri

Hem frontend hem backend için `.env` dosyaları oluşturun:

**Backend `.env`**

```env
PORT=5000
DATABASE_URL=postgresql://root:e7Zj1Urnd9bdPLCjWBIOUORJCONP3dF0@dpg-d0quc195pdvs73avc2m0-a.frankfurt-postgres.render.com/kahoot_t0pd
JWT_SECRET=emirrdvn
GEMINI_API_KEY= kendi api keyiniz
```

### 3. Backend Kurulumu

```bash
cd server
npm install
npm start
```

### 4. Frontend Kurulumu

```bash
cd client
npm install
npm run dev
```



## 📈 Gelişmiş Özellikler

- 🎯 Sınırsız AI destekli soru üretimi
- ⏱️ Süreli oyun akışı ve skor hesaplama
- 📂 JSONB ile esnek veri saklama
- 📶 Gerçek zamanlı senkronizasyon
- 🧠 Performans analizi: konu, doğruluk, skor

---

## 📺 Demo Videosu

Projenin kısa tanıtım videosunu YouTube üzerinden izleyin:

🔗 [YouTube Videosunu İzle](https://youtu.be/r2fVEGFXOd4)



## 🛡️ Güvenlik

- Tüm giriş/çıkışlar JWT ile korunur
- Şifreler bcrypt ile hashlenir
- AI çıktıları sanitize edilerek saklanır
- SQL Injection ve XSS korumaları uygulanmıştır

---

## 👥 Katkıda Bulunanlar

| İsim | Rol |
|------|-----|
| [Emir Rıdvan Toraman](https://github.com/emirrdvn) | Full Stack Developer|
| [Fatih Parmaksız](https://github.com/Fatihparm) | Backend Developer |
| [Süleyman Asım Gelişgen](https://github.com/gelisgen03) | Frontend Developer |

---

## 📬 İletişim

Herhangi bir soru, öneri veya katkı için:

📧 `toramanemir41@gmail.com`

---

## 📝 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

---

