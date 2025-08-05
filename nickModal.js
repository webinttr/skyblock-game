export function initNickModal(startCallback) {
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
      alert("En az 3 karakter girin.");
      return;
    }
    localStorage.setItem('playerNick', nick);
    closeModal();
    showWelcome(nick);
  };

  startGameBtn.onclick = () => {
    const nick = localStorage.getItem('playerNick');
    if (nick && startCallback) startCallback(nick);
  };
}
