import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/PointerLockControls.js';
import { initNickModal } from './nickModal.js';

let scene, camera, renderer, controls, raycaster;
let inventory = { dirt: 10 };
let world = {};
const BLOCK = 1;

let move = { forward: false, back: false, left: false, right: false };
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

initNickModal(startGame);

function startGame(nick) {
  initScene();
  animate();
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 5);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, document.body);
  document.body.addEventListener('click', () => controls.lock());

  raycaster = new THREE.Raycaster();

  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(10, 20, 10);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  generateSkyBlock();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'KeyW') move.forward = true;
    if (e.code === 'KeyS') move.back = true;
    if (e.code === 'KeyA') move.left = true;
    if (e.code === 'KeyD') move.right = true;
  });

  document.addEventListener('keyup', e => {
    if (e.code === 'KeyW') move.forward = false;
    if (e.code === 'KeyS') move.back = false;
    if (e.code === 'KeyA') move.left = false;
    if (e.code === 'KeyD') move.right = false;
  });

  document.addEventListener('mousedown', onMouseDown);
}

function generateSkyBlock() {
  const geo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
  const mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(x, 0, z);
      scene.add(cube);
      world[`${x},0,${z}`] = cube;
    }
  }
}

function onMouseDown(e) {
  if (!controls.isLocked) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(Object.values(world));

  if (intersects.length === 0) return;

  const intersect = intersects[0];
  const pos = intersect.object.position;

  const key = `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`;

  if (e.button === 0 && world[key]) {
    scene.remove(world[key]);
    delete world[key];
    inventory.dirt++;
    updateInventory();
  }

  if (e.button === 2 && inventory.dirt > 0) {
    e.preventDefault();
    const normal = intersect.face.normal.clone();
    const placePos = pos.clone().add(normal);
    const placeKey = `${Math.round(placePos.x)},${Math.round(placePos.y)},${Math.round(placePos.z)}`;
    if (!world[placeKey]) {
      const geo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
      const mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.copy(placePos);
      scene.add(cube);
      world[placeKey] = cube;
      inventory.dirt--;
      updateInventory();
    }
  }
}

function updateInventory() {
  const div = document.getElementById('inventory');
  if (div) div.textContent = `Toprak blok: ${inventory.dirt}`;
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  prevTime = time;

  velocity.x -= velocity.x * 10 * delta;
  velocity.z -= velocity.z * 10 * delta;

  direction.z = Number(move.forward) - Number(move.back);
  direction.x = Number(move.right) - Number(move.left);
  direction.normalize();

  if (move.forward || move.back) velocity.z -= direction.z * 20 * delta;
  if (move.left || move.right) velocity.x -= direction.x * 20 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  renderer.render(scene, camera);
}
