(() => {
  const gameArea = document.getElementById('game-area');
  const nickDisplay = document.getElementById('player-nick-display');
  const nickModal = document.getElementById('nick-modal');
  const nickInput = document.getElementById('nick-input');
  const saveNickBtn = document.getElementById('save-nick-btn');

  const GRID_SIZE = 8;
  let playerNick = null;
  let selectedBlock = 'dirt';

  // Ada verisi: 2D dizi [y][x]
  // Başlangıç ada: 3x3 toprak, çevresi boş
  let islandGrid = [];

  // Envanter: blok adı => sayı
  let inventory = {
    dirt: 10,
    wood: 5,
    grass: 3
  };

  // Görev sistemi
  let tasks = [
    { id: 1, desc: '3 toprak bloğu kır', type: 'break', block: 'dirt', amount: 3, progress: 0, done: false },
    { id: 2, desc: '5 tahta bloğu yerleştir', type: 'place', block: 'wood', amount: 5, progress: 0, done: false },
  ];

  // Başlat - oyuncu adı varsa modal kapat, yoksa aç
  function init() {
    const storedNick = localStorage.getItem('playerNick');
    if(storedNick && storedNick.length >= 3){
      playerNick = storedNick;
      closeModal();
      startGame();
    } else {
      openModal();
    }
  }

  // Modal aç/kapat
  function openModal(){
    nickModal.style.display = 'flex';
    nickInput.focus();
  }
  function closeModal(){
    nickModal.style.display = 'none';
  }

  saveNickBtn.addEventListener('click', () => {
    const val = nickInput.value.trim();
    if(val.length < 3){
      alert('En az 3 karakterlik takma ad girin.');
      nickInput.focus();
      return;
    }
    playerNick = val;
    localStorage.setItem('playerNick', playerNick);
    closeModal();
    startGame();
  });

  // Ada oluştur
  function initGrid(){
    islandGrid = [];
    for(let y=0; y<GRID_SIZE; y++){
      let row = [];
      for(let x=0; x<GRID_SIZE; x++){
        // Ada ortasında 3x3 toprak
        if(x >= 2 && x <= 4 && y >= 2 && y <= 4){
          row.push('dirt');
        } else {
          row.push(null);
        }
      }
      islandGrid.push(row);
    }
  }

  // Grid'i renderla
  function renderGrid(){
    let html = '';
    for(let y=0; y<GRID_SIZE; y++){
      for(let x=0; x<GRID_SIZE; x++){
        const block = islandGrid[y][x];
        html += `<div class="grid-cell ${block || 'empty'}" data-x="${x}" data-y="${y}"></div>`;
      }
    }
    return html;
  }

  // Envanteri renderla
  function renderInventory(){
    let html = '<div class="items">';
    for(const [block, count] of Object.entries(inventory)){
      html += `<button class="inv-item ${selectedBlock === block ? 'selected' : ''}" data-block="${block}">${block} (${count})</button>`;
    }
    html += '</div>';
    return html;
  }

  // Görevleri renderla
  function renderTasks(){
    let html = '<ul>';
    for(const task of tasks){
      html += `<li class="${task.done ? 'done' : ''}">${task.desc} - ${task.progress}/${task.amount}</li>`;
    }
    html += '</ul>';
    return html;
  }

  // Ana render
  function renderGame(){
    nickDisplay.textContent = `${playerNick}'s Skyblock Ada`;
    gameArea.innerHTML = `
      <div id="island-grid">${renderGrid()}</div>
      <div id="inventory">
        <h3>Envanter</h3>
        ${renderInventory()}
        <div id="tasks">
          <h3>Görevler</h3>
          ${renderTasks()}
        </div>
      </div>
      <div id="info-text">Sol tık: Kır, Sağ tık: Yerleştir, Seçmek için envanterden blok seç</div>
    `;

    // Grid hücrelerine olay ekle
    document.querySelectorAll('.grid-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        breakBlock(x,y);
      });
      cell.addEventListener('contextmenu', e => {
        e.preventDefault();
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        placeBlock(x,y);
      });
    });

    // Envanter butonlarına olay ekle
    document.querySelectorAll('.inv-item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedBlock = btn.dataset.block;
        renderGame();
      });
    });
  }

  // Blok kırma
  function breakBlock(x,y){
    if(islandGrid[y][x]){
      const block = islandGrid[y][x];
      islandGrid[y][x] = null;
      inventory[block] = (inventory[block] || 0) + 1;
      updateTasks('break', block);
      renderGame();
    }
  }

  // Blok yerleştirme
  function placeBlock(x,y){
    if(!islandGrid[y][x] && inventory[selectedBlock] > 0){
      islandGrid[y][x] = selectedBlock;
      inventory[selectedBlock]--;
      updateTasks('place', selectedBlock);
      renderGame();
    }
  }

  // Görev güncelle
  function updateTasks(type, block){
    tasks.forEach(task => {
      if(!task.done && task.type === type && task.block === block){
        task.progress++;
        if(task.progress >= task.amount){
          task.done = true;
          alert(`Görevi tamamladınız:\n${task.desc}`);
        }
      }
    });
  }

  // Başlat
  function startGame(){
    initGrid();
    renderGame();
  }

  init();
})();
