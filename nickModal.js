export function initNickModal() {
  const modal = document.getElementById('nick-modal');
  const nickInput = document.getElementById('nick-input');
  const saveBtn = document.getElementById('save-nick-btn');
  const nickDisplay = document.getElementById('player-nick-display');
  const startGameBtn = document.getElementById('start-game-btn');

  function openModal() {
    modal.classList.add('active');
    nickInput.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  function showWelcome(nick) {
    nickDisplay.textContent = `Hoş geldin, ${nick}!`;
    startGameBtn.style.display = 'inline-block';
  }

  function startGame(nick) {
    alert(`${nick}, oyuna başlıyorsun!`);
    window.location.href = '/p/minecraft.html'; // Blogger sayfanın doğru linki olmalı
  }

  const savedNick = localStorage.getItem('playerNick');
  if (savedNick) {
    closeModal();
    showWelcome(savedNick);
  } else {
    openModal();
  }

  saveBtn.onclick = () => {
    const nick = nickInput.value.trim();
    if (nick.length < 3) {
      alert('Lütfen en az 3 karakterlik takma ad girin.');
      return;
    }
    localStorage.setItem('playerNick', nick);
    closeModal();
    showWelcome(nick);
  };

  startGameBtn.onclick = () => {
    const nick = localStorage.getItem('playerNick');
    if (nick) startGame(nick);
    else openModal();
  };
}
