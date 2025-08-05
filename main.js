// main.js

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/PointerLockControls.js';

(() => {
  // --- SCENE & RENDERER ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // --- LIGHTS ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // --- CONTROLS ---
  const controls = new PointerLockControls(camera, document.body);

  // Başlangıç pozisyonu
  camera.position.set(0, 2, 5);

  // Hareket
  const move = { forward: false, backward: false, left: false, right: false };
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  // --- VOXEL WORLD ---
  const blockSize = 1;
  const blocks = [];

  // Blok malzemeleri
  const blockMaterials = {
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    grass: new THREE.MeshLambertMaterial({ color: 0x228b22 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x888888 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
    leaves: new THREE.MeshLambertMaterial({ color: 0x006400 }),
  };

  // Blok sınıfı
  class Block {
    constructor(x, y, z, type) {
      this.geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
      this.material = blockMaterials[type] || blockMaterials.dirt;
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.position.set(x, y, z);
      this.type = type;
      scene.add(this.mesh);
    }
    remove() {
      scene.remove(this.mesh);
    }
  }

  // Ada oluştur: 5x5 toprak + üstüne grass
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      blocks.push(new Block(x, 0, z, 'dirt'));
      if (Math.random() < 0.5) {
        blocks.push(new Block(x, 1, z, 'grass'));
      }
    }
  }

  // --- Envanter sistemi ---
  const inventory = [];
  let selectedSlot = 0;

  const inventoryEl = document.createElement('div');
  inventoryEl.id = 'inventory';
  document.body.appendChild(inventoryEl);

  // Slot oluştur
  function renderInventory() {
    inventoryEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.classList.add('inventory-slot');
      if (i === selectedSlot) slot.classList.add('selected');

      if (inventory[i]) {
        const img = document.createElement('img');
        img.src = inventory[i].img;
        img.title = inventory[i].type;
        slot.appendChild(img);
      }
      slot.addEventListener('click', () => {
        selectedSlot = i;
        renderInventory();
      });
      inventoryEl.appendChild(slot);
    }
  }

  // Başlangıç envanteri
  inventory[0] = { type: 'dirt', img: 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/dirt.png' };
  renderInventory();

  // --- Hareket olayları ---
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': move.forward = true; break;
      case 'KeyS': move.backward = true; break;
      case 'KeyA': move.left = true; break;
      case 'KeyD': move.right = true; break;
      case 'Digit1': selectInventorySlot(0); break;
      case 'Digit2': selectInventorySlot(1); break;
      case 'Digit3': selectInventorySlot(2); break;
      case 'Digit4': selectInventorySlot(3); break;
      case 'Digit5': selectInventorySlot(4); break;
      case 'Digit6': selectInventorySlot(5); break;
      case 'Digit7': selectInventorySlot(6); break;
      case 'Digit8': selectInventorySlot(7); break;
      case 'Digit9': selectInventorySlot(8); break;
    }
  });
  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': move.forward = false; break;
      case 'KeyS': move.backward = false; break;
      case 'KeyA': move.left = false; break;
      case 'KeyD': move.right = false; break;
    }
  });

  function selectInventorySlot(i) {
    selectedSlot = i;
    renderInventory();
  }

  // --- Blok etkileşimleri ---
  const raycaster = new THREE.Raycaster();

  window.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = blocks.map(b => b.mesh).filter(m => scene.children.includes(m));
    const intersectsResult = raycaster.intersectObjects(intersects);

    if (intersectsResult.length > 0) {
      const intersect = intersectsResult[0];
      const block = blocks.find(b => b.mesh === intersect.object);

      if (event.button === 0) {
        // Sol tık: blok kır
        block.remove();
        blocks.splice(blocks.indexOf(block), 1);

        // Envantere ekle
        addItemToInventory(block.type);

      } else if (event.button === 2) {
        // Sağ tık: blok koy
        const normal = intersect.face.normal.clone();
        const pos = intersect.point.clone().add(normal.multiplyScalar(blockSize));
        pos.x = Math.round(pos.x);
        pos.y = Math.round(pos.y);
        pos.z = Math.round(pos.z);

        // Yeni blok ekle envanterden
        const selectedItem = inventory[selectedSlot];
        if (!selectedItem) return;

        blocks.push(new Block(pos.x, pos.y, pos.z, selectedItem.type));

        // Envanterden bir azalt (basit)
        removeItemFromInventory(selectedItem.type);
      }
    }
  });

  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // --- Envanter fonksiyonları ---
  function addItemToInventory(type) {
    let slot = inventory.find(i => i && i.type === type);
    if (slot) {
      slot.count = (slot.count || 1) + 1;
    } else {
      for (let i = 0; i < 9; i++) {
        if (!inventory[i]) {
          inventory[i] = { type: type, img: getBlockImage(type), count: 1 };
          break;
        }
      }
    }
    renderInventory();
  }

  function removeItemFromInventory(type) {
    let slot = inventory.find(i => i && i.type === type);
    if (slot) {
      slot.count--;
      if (slot.count <= 0) {
        const idx = inventory.indexOf(slot);
        inventory[idx] = undefined;
      }
      renderInventory();
    }
  }

  function getBlockImage(type) {
    switch(type) {
      case 'dirt': return 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/dirt.png';
      case 'grass': return 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/grass.png';
      case 'stone': return 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/stone.png';
      case 'wood': return 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/wood.png';
      case 'leaves': return 'https://raw.githubusercontent.com/webinttr/minecraft-js/main/assets/leaves.png';
      default: return '';
    }
  }

  // --- Oyun döngüsü ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
      const delta = clock.getDelta();

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      direction.z = Number(move.forward) - Number(move.backward);
      direction.x = Number(move.right) - Number(move.left);
      direction.normalize();

      if (move.forward || move.backward) velocity.z -= direction.z * 50.0 * delta;
      if (move.left || move.right) velocity.x -= direction.x * 50.0 * delta;

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
    }

    renderer.render(scene, camera);
  }

  animate();

  // --- Eventler ---

  // PointerLock aç/kapat
  document.body.addEventListener('click', () => {
    controls.lock();
  });

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Basit AI (dolaşan blokyımsı NPC) ---

  class SimpleAI {
    constructor() {
      const geo = new THREE.SphereGeometry(0.3, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      this.mesh = new THREE.Mesh(geo, mat);
      this.mesh.position.set(0, 1, 0);
      scene.add(this.mesh);
      this.direction = new THREE.Vector3(1, 0, 0);
      this.speed = 0.5;
    }
    update(delta) {
      this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * delta));
      // basit sınırlar
      if (this.mesh.position.x > 3 || this.mesh.position.x < -3) this.direction.x *= -1;
      if (this.mesh.position.z > 3 || this.mesh.position.z < -3) this.direction.z *= -1;
    }
  }

  const npc = new SimpleAI();

  function updateAI(delta) {
    npc.update(delta);
  }

  // Güncelleme döngüsüne ekle
  (function gameLoop() {
    requestAnimationFrame(gameLoop);
    const delta = clock.getDelta();

    if (controls.isLocked) {
      const moveDelta = delta;
      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      direction.z = Number(move.forward) - Number(move.backward);
      direction.x = Number(move.right) - Number(move.left);
      direction.normalize();

      if (move.forward || move.backward) velocity.z -= direction.z * 50.0 * delta;
      if (move.left || move.right) velocity.x -= direction.x * 50.0 * delta;

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
    }

    updateAI(delta);

    renderer.render(scene, camera);
  })();
})();
