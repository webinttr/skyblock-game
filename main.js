(() => {
  const gameArea = document.getElementById('game-area');
  const GRID_SIZE = 8;

  let inventory = { dirt: 10, wood: 5 };
  let islandGrid = [];
  let playerNick = localStorage.getItem('playerNick') || 'Oyuncu';
  let tasks = [
    { id: 1, desc: '3 toprak bloğu kır', type: 'break', block: 'dirt', amount: 3, progress: 0, done: false },
    { id: 2, desc: '5 tahta bloğu ekle', type: 'place', block: 'wood', amount: 5, progress: 0, done: false },
  ];
  let selectedBlock = 'dirt';

  function initGrid() {
    islandGrid = [];
    for(let y=0; y<GRID_SIZE; y++) {
      let row = [];
      for(let x=0; x<GRID_SIZE; x++) {
        if (x >= 3 && x <= 4 && y >= 3 && y <= 4) {
          row.push('dirt');
        } else {
          row.push(null);
        }
      }
      islandGrid.push(row);
    }
  }

  function renderGrid() {
    let html = '<div id="island-grid">';
    for(let y=0; y<GRID_SIZE; y++) {
      html += '<div class="grid-row">';
      for(let x=0; x<GRID_SIZE; x++) {
        const blockType = islandGrid[y][x];
        html += `<div class="grid-cell ${blockType || 'empty'}" data-x="${x}" data-y="${y}"></div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderInventory() {
    let html = '<div id="inventory">';
    html += '<h3>Envanter</h3><div class="items">';
    for (const [block, count] of Object.entries(inventory)) {
      html += `<button class="inv-item ${block} ${selectedBlock===block ? 'selected' : ''}" data-block="${block}">
        ${block} (${count})
      </button>`;
    }
    html += '</div></div>';
    return html;
  }

  function renderTasks() {
    let html = '<div id="tasks"><h3>Görevler</h3><ul>';
    for(const task of tasks) {
      html += `<li class="${task.done ? 'done' : ''}">
        ${task.desc} - ${task.progress}/${task.amount}
      </li>`;
    }
    html += '</ul></div>';
    return html;
  }

  function renderGame() {
    gameArea.innerHTML = `
      <h2 style="color:#00ffaa; margin-bottom:10px;">${playerNick}'s Skyblock Ada</h2>
      ${renderGrid()}
      ${renderInventory()}
      ${renderTasks()}
      <p>Seçili blok: <strong>${selectedBlock}</strong></p>
      <p><em>Sol tık: Kır, Sağ tık: Yerleştir</em></p>
    `;

    // Eventler
    document.querySelectorAll('#island-grid .grid-cell').forEach(cell => {
      cell.oncontextmenu = e => e.preventDefault();

      cell.onclick = () => {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        breakBlock(x,y);
      };
      cell.onauxclick = (e) => {
        if (e.button === 2) {
          const x = +cell.dataset.x;
          const y = +cell.dataset.y;
          placeBlock(x,y);
        }
      };
    });

    document.querySelectorAll('.inv-item').forEach(btn => {
      btn.onclick = () => {
        selectedBlock = btn.dataset.block;
        renderGame();
      };
    });
  }

  function breakBlock(x,y) {
    if (islandGrid[y][x]) {
      const brokenBlock = islandGrid[y][x];
      islandGrid[y][x] = null;
      inventory[brokenBlock] = (inventory[brokenBlock] || 0) + 1;
      updateTasks('break', brokenBlock);
      renderGame();
    }
  }

  function placeBlock(x,y) {
    if (!islandGrid[y][x] && inventory[selectedBlock] > 0) {
      islandGrid[y][x] = selectedBlock;
      inventory[selectedBlock]--;
      updateTasks('place', selectedBlock);
      renderGame();
    }
  }

  function updateTasks(type, block) {
    for(let task of tasks) {
      if(!task.done && task.type === type && task.block === block) {
        task.progress++;
        if(task.progress >= task.amount) {
          task.done = true;
          alert(`Tebrikler! Görevi tamamladınız:\n${task.desc}`);
        }
      }
    }
  }

  function start() {
    initGrid();
    renderGame();
  }

  start();
})();
