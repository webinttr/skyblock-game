// main.js

(() => {
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const blockSize = 1;
  const islandBlocks = [];

  function addBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshLambertMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    scene.add(cube);
    islandBlocks.push(cube);
    return cube;
  }

  // Ada oluştur (5x5x1 toprak)
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      addBlock(x, 0, z, 0x8b4513);
      if (Math.random() < 0.4) addBlock(x, 1, z, 0x228b22);
    }
  }

  camera.position.set(0, 2, 5);

  const controls = new THREE.PointerLockControls(camera, document.body);

  document.body.addEventListener('click', () => {
    controls.lock();
  });

  const move = { forward: false, backward: false, left: false, right: false };
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();

  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW':
        move.forward = true;
        break;
      case 'KeyS':
        move.backward = true;
        break;
      case 'KeyA':
        move.left = true;
        break;
      case 'KeyD':
        move.right = true;
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
        move.forward = false;
        break;
      case 'KeyS':
        move.backward = false;
        break;
      case 'KeyA':
        move.left = false;
        break;
      case 'KeyD':
        move.right = false;
        break;
    }
  });

  const raycaster = new THREE.Raycaster();

  window.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(islandBlocks);

    if (intersects.length > 0) {
      const intersect = intersects[0];

      if (event.button === 0) {
        // Sol tık - blok kır
        scene.remove(intersect.object);
        islandBlocks.splice(islandBlocks.indexOf(intersect.object), 1);
      } else if (event.button === 2) {
        // Sağ tık - blok koy
        const normal = intersect.face.normal.clone();
        const pos = intersect.point.clone().add(normal.multiplyScalar(blockSize));
        pos.x = Math.round(pos.x);
        pos.y = Math.round(pos.y);
        pos.z = Math.round(pos.z);

        addBlock(pos.x, pos.y, pos.z, 0x8b4513);
      }
    }
  });

  window.addEventListener('contextmenu', (e) => e.preventDefault());

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

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
