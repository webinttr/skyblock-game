import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/PointerLockControls.js';

import { initNickModal } from './nickModal.js';

window.addEventListener('DOMContentLoaded', () => {
  initNickModal();

  let camera, scene, renderer, controls;
  let raycaster;
  let world = {};
  const BLOCK_SIZE = 1;
  const WORLD_SIZE = 8;

  let inventory = { dirt: 10 };
  let playerPos = { x: 0, y: 5, z: 0 };

  let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();

  let prevTime = performance.now();

  init();
  animate();

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(playerPos.x, playerPos.y, playerPos.z);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, document.body);
    document.body.addEventListener('click', () => controls.lock());

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    raycaster = new THREE.Raycaster();

    generateIsland();

    window.addEventListener('resize', debounce(onWindowResize, 200));
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function generateIsland() {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {
      for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {
        if (Math.sqrt(x * x + z * z) <= WORLD_SIZE) {
          const mesh = new THREE.Mesh(geometry, dirtMat);
          mesh.position.set(x * BLOCK_SIZE, 0, z * BLOCK_SIZE);
          scene.add(mesh);
          world[`${x},0,${z}`] = mesh;
        }
      }
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseDown(event) {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(Object.values(world));
    if (intersects.length > 0) {
      const intersect = intersects[0];

      if (event.button === 0) { // Sol tıklama - blok kır
        const pos = intersect.object.position;
        const key = `${Math.round(pos.x / BLOCK_SIZE)},${Math.round(pos.y / BLOCK_SIZE)},${Math.round(pos.z / BLOCK_SIZE)}`;
        if(world[key]) {
          // Bellek temizliği
          const obj = world[key];
          scene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
          delete world[key];

          inventory.dirt = (inventory.dirt || 0) + 1;
          updateInventory();
        }
      } else if (event.button === 2) { // Sağ tıklama - blok ekle
        event.preventDefault();

        if (!intersect.face) return;

        const normal = intersect.face.normal.clone(); // clone önemli
        const pos = intersect.object.position.clone().add(normal.multiplyScalar(BLOCK_SIZE));
        const key = `${Math.round(pos.x / BLOCK_SIZE)},${Math.round(pos.y / BLOCK_SIZE)},${Math.round(pos.z / BLOCK_SIZE)}`;

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

  function updateInventory() {
    const invDiv = document.getElementById('inventory');
    if (invDiv) invDiv.textContent = `Toprak blok: ${inventory.dirt}`;
  }

  function onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': moveForward = true; break;
      case 'KeyS': moveBackward = true; break;
      case 'KeyA': moveLeft = true; break;
      case 'KeyD': moveRight = true; break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': moveForward = false; break;
      case 'KeyS': moveBackward = false; break;
      case 'KeyA': moveLeft = false; break;
      case 'KeyD': moveRight = false; break;
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!controls.isLocked) {
      renderer.render(scene, camera);
      return;
    }

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const speed = 5;

    if (moveForward || moveBackward) velocity.z += direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x += direction.x * speed * delta;

    controls.moveRight(velocity.x * delta);
    controls.moveForward(velocity.z * delta);

    renderer.render(scene, camera);
  }

  // Basit debounce fonksiyonu (resize için)
  function debounce(func, wait) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
  }
});
