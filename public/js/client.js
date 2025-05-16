const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

socket.on('connect', () => {
  console.log('Socket.IO bağlantısı kuruldu');
  // Yeniden bağlantı sonrası mevcut lobby'ye katıl
  const urlParams = new URLSearchParams(window.location.search);
  const lobbyId = window.location.pathname.split('/').pop();
  const username = urlParams.get('username');
  const credits = urlParams.get('credits') || 0;
  if (lobbyId && username) {
    console.log(`Yeniden bağlandı, lobiye katılıyor: ${lobbyId}, ${username}`);
    socket.emit('join_lobby', { lobbyId, username, credits });
  }
});

socket.on('disconnect', () => {
  console.log('Socket.IO bağlantısı koptu');
});

socket.on('reconnect', (attempt) => {
  console.log(`Socket.IO yeniden bağlandı, deneme: ${attempt}`);
});

socket.on('reconnect_error', (error) => {
  console.log('Socket.IO yeniden bağlantı hatası:', error);
});

socket.on('error', (error) => {
  console.log('Socket.IO hata:', error);
});