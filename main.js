// main.js (Skyblock oyununun ana js dosyası)

(() => {
  // DOM elementleri
  const gameArea = document.getElementById('game-area');

  // Ada ızgarası boyutları (ör: 8x8)
  const GRID_SIZE = 8;

  // Envanter başlangıcı
  let inventory = {
    dirt: 10,    // Başlangıç blokları
    wood: 5,
  };

  // Ada ızgarası: her hücre bir blok türü ya da boş
  // Başlangıçta ortada birkaç blok olsun (dirt)
  let islandGrid = [];

  // Oyun durumu
  let playerNick = localStorage.getItem('playerNick') || 'Oyuncu';

  // Görevler basit örnek
  let tasks = [
    { id: 1, desc: '3 toprak bloğu kır', type: 'break', block: 'dirt', amount: 3, progress: 0, done: false },
    { id: 2, desc: '5 tahta bloğu ekle', type: 'place', block: 'wood', amount: 5, progress: 0, done: false },
  ];

  // Seçili blok türü envanterden, default dirt
  let selectedBlock = 'dirt';

  // Initialize island grid
  function initGrid() {
    islandGrid = [];
    for(let y=0; y<GRID_SIZE; y++) {
      let row = [];
      for(let x=0; x<GRID_SIZE; x++) {
        // Başlangıçta ortada 2x2 dirt blok yerleştir
        if (x >= 3 && x <= 4 && y >= 3 && y <= 4) {
          row.push('dirt');
        } else {
          row.push(null);
        }
      }
      islandGrid.push(row);
    }
  }

  // Render grid (ada görünümü)
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

  // Render envanter
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

  // Render görevler
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

  // Tüm UI render (oyun alanı içine)
  function renderGame() {
    gameArea.innerHTML = `
      <p><strong>Oyuncu:</strong> ${playerNick}</p>
      ${renderGrid()}
      ${renderInventory()}
      ${renderTasks()}
      <p>Seçili blok: <strong>${selectedBlock}</strong></p>
      <p><em>Sol tık: Kır, Sağ tık: Yerleştir</em></p>
    `;

    // Grid hücrelerine event ekle
    document.querySelectorAll('#island-grid .grid-cell').forEach(cell => {
      cell.oncontextmenu = e => e.preventDefault(); // sağ tık menüyü engelle

      cell.onclick = () => {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        breakBlock(x,y);
      };
      cell.onauxclick = (e) => {
        if (e.button === 2) { // sağ tık ile blok koy
          const x = +cell.dataset.x;
          const y = +cell.dataset.y;
          placeBlock(x,y);
        }
      };
    });

    // Envanter butonlarına tıklama
    document.querySelectorAll('.inv-item').forEach(btn => {
      btn.onclick = () => {
        selectedBlock = btn.dataset.block;
        renderGame();
      };
    });
  }

  // Blok kırma fonksiyonu
  function breakBlock(x,y) {
    if (islandGrid[y][x]) {
      const brokenBlock = islandGrid[y][x];
      islandGrid[y][x] = null;

      // Envantere ekle
      inventory[brokenBlock] = (inventory[brokenBlock] || 0) + 1;

      updateTasks('break', brokenBlock);
      renderGame();
    }
  }

  // Blok koyma fonksiyonu
  function placeBlock(x,y) {
    if (!islandGrid[y][x] && inventory[selectedBlock] > 0) {
      islandGrid[y][x] = selectedBlock;
      inventory[selectedBlock]--;

      updateTasks('place', selectedBlock);
      renderGame();
    }
  }

  // Görev güncelleme
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

  // Başlat
  function start() {
    initGrid();
    renderGame();
  }

  start();

})();
