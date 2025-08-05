// main.js

(function() {
  const nickDisplay = document.getElementById('player-nick-display');
  const gameArea = document.getElementById('game-area');

  // Oyunu başlat (burada daha sonra gerçek oyun başlatılır)
  function startGame(nick) {
    nickDisplay.textContent = `Hoş geldin, ${nick}! Skyblock oyununa başlıyorsun.`;
    
    // Basit örnek: oyun alanına adım mesajı ekle
    const info = document.createElement('p');
    info.style.padding = '20px';
    info.style.textAlign = 'center';
    info.textContent = 'Skyblock adanı genişletmek için görevler ve crafting bekliyor!';
    gameArea.appendChild(info);

    // TODO: Gerçek oyun kodları burada başlayacak
  }

  // localStorage'dan nick çek
  const savedNick = localStorage.getItem('playerNick');
  if(savedNick) {
    startGame(savedNick);
  } else {
    // Eğer nick yoksa alert ya da modal gösterilebilir
    alert('Lütfen ana sayfaya dönüp nick giriniz!');
  }
})();
