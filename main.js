// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster, mouse;
let world = {}; // bloklar { 'x,y,z': mesh }
const BLOCK_SIZE = 1;
const WORLD_SIZE = 16; // Skyblock adası yarıçapı (x,z)

let inventory = { dirt: 10 }; // Başlangıç envanteri

// Oyuncunun pozisyonu gridde (blok koordinatları)
let playerPos = { x: 0, y: 5, z: 0 };

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Açık mavi gökyüzü

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(playerPos.x, playerPos.y, playerPos.z);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, document.body);

  document.body.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    // İstersen buraya "mouse kilitlendi" mesajı ekle
  });

  controls.addEventListener('unlock', () => {
    // İstersen buraya "mouse serbest" mesajı ekle
  });

  // Işıklar
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Raycaster ve fare
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Skyblock adası oluştur
  generateIsland();

  // Event listener
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousedown', onMouseDown, false);

  // Basit klavye hareketi
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  initMovement();
}

// Ada oluşturma - sadece düz toprak + birkaç blok
function generateIsland() {
  const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // kahverengi toprak

  for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {
    for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {
      // Ada sınırı - dairesel
      if (Math.sqrt(x * x + z * z) <= WORLD_SIZE) {
        const mesh = new THREE.Mesh(geometry, dirtMat);
        mesh.position.set(x * BLOCK_SIZE, 0, z * BLOCK_SIZE);
        scene.add(mesh);
        world[`${x},0,${z}`] = mesh;
      }
    }
  }
}

// Pencere yeniden boyutlanınca
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Fare tıklaması: blok kır veya koy
function onMouseDown(event) {
  if (!controls.isLocked) return;

  // Kamera önüne doğru ray gönder
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(Object.values(world));
  if (intersects.length > 0) {
    const intersect = intersects[0];

    if (event.button === 0) {
      // Sol tık: blok kır
      const pos = intersect.object.position;
      const key = `${pos.x / BLOCK_SIZE},${pos.y / BLOCK_SIZE},${pos.z / BLOCK_SIZE}`;
      // Blok sahneden kaldır
      scene.remove(world[key]);
      delete world[key];
      // Envantere ekle (dirt için)
      inventory.dirt = (inventory.dirt || 0) + 1;
      updateInventory();
    } else if (event.button === 2) {
      // Sağ tık: blok koy (üstüne koy)
      event.preventDefault();

      // Koyulacak pozisyon = intersection noktası + yüzey normali
      const normal = intersect.face.normal;
      const pos = intersect.object.position.clone().add(normal.multiplyScalar(BLOCK_SIZE));
      const key = `${pos.x / BLOCK_SIZE},${pos.y / BLOCK_SIZE},${pos.z / BLOCK_SIZE}`;

      if (inventory.dirt > 0 && !world[key]) {
        const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        const material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const block = new THREE.Mesh(geometry, material);
        block.position.copy(pos);
        scene.add(block);
        world[key] = block;
        inventory.dirt--;
        updateInventory();
      }
    }
  }
}

// Envanter güncelleme
function updateInventory() {
  const invDiv = document.getElementById('inventory');
  if (invDiv) {
    invDiv.textContent = `Toprak blok: ${inventory.dirt}`;
  }
}

// Basit oyuncu hareketi
let moveForward = false,
  moveBackward = false,
  moveLeft = false,
  moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
      moveForward = true;
      break;
    case 'KeyS':
      moveBackward = true;
      break;
    case 'KeyA':
      moveLeft = true;
      break;
    case 'KeyD':
      moveRight = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
      moveForward = false;
      break;
    case 'KeyS':
      moveBackward = false;
      break;
    case 'KeyA':
      moveLeft = false;
      break;
    case 'KeyD':
      moveRight = false;
      break;
  }
}

function initMovement() {
  // Basit yerçekimi ve zıplama yok, ama konumu güncelliyoruz
  const clock = new THREE.Clock();

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    const delta = clock.getDelta();
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const speed = 5;

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    renderer.render(scene, camera);
  }

  gameLoop();
}
