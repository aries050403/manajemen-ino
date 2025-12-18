// --- Implementasi Three.js ---
let scene, camera, renderer, pond, feeder, feedParticles = [];
let isFeeding = false;

function init() {
    const container = document.getElementById('canvas-container');
    const hint = document.getElementById('loading-hint');
    
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    
    // Hapus isi container sebelum menambahkan renderer (kecuali elemen overlay)
    if (hint) hint.style.display = 'none';
    container.appendChild(renderer.domElement);

    // Pencahayaan
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    scene.add(directional);

    // Model Tambak
    createPond();
    createFeeder();
    createSensors();

    // Event Listener Tombol Pakan - Pastikan ID benar
    const btn = document.getElementById('btn-manual-feed');
    if (btn) {
        btn.addEventListener('mousedown', () => { isFeeding = true; });
        btn.addEventListener('mouseup', () => { isFeeding = false; });
        btn.addEventListener('mouseleave', () => { isFeeding = false; });
        btn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            isFeeding = true; 
        }, { passive: false });
        btn.addEventListener('touchend', () => { isFeeding = false; });
    }

    window.addEventListener('resize', onWindowResize);
    animate();
}

function createPond() {
    const group = new THREE.Group();
    
    // Kolam Utama (Biru)
    const floorGeo = new THREE.BoxGeometry(10, 0.5, 6);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x0ea5e9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    group.add(floor);

    // Dinding Kayu
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x8b5e3c });
    const longWallGeo = new THREE.BoxGeometry(10.5, 2.5, 0.4);
    const shortWallGeo = new THREE.BoxGeometry(0.4, 2.5, 6.5);

    const w1 = new THREE.Mesh(longWallGeo, wallMat); w1.position.set(0, 1, 3);
    const w2 = new THREE.Mesh(longWallGeo, wallMat); w2.position.set(0, 1, -3);
    const w3 = new THREE.Mesh(shortWallGeo, wallMat); w3.position.set(5, 1, 0);
    const w4 = new THREE.Mesh(shortWallGeo, wallMat); w4.position.set(-5, 1, 0);
    
    group.add(w1, w2, w3, w4);
    scene.add(group);
}

function createFeeder() {
    const feederGroup = new THREE.Group();
    
    // Tabung Putih
    const bodyGeo = new THREE.CylinderGeometry(0.6, 0.4, 2, 16);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 4;
    feederGroup.add(body);

    // Tutup Biru
    const capGeo = new THREE.CylinderGeometry(0.7, 0.6, 0.2, 16);
    const capMat = new THREE.MeshPhongMaterial({ color: 0x1d4ed8 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 5;
    feederGroup.add(cap);

    // Penyangga (Tiang)
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8);
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x334155 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(1, 2, 0);
    feederGroup.add(pole);

    // Antena
    const antGeo = new THREE.BoxGeometry(0.02, 0.5, 0.02);
    const ant = new THREE.Mesh(antGeo, poleMat);
    ant.position.y = 5.3;
    feederGroup.add(ant);

    feederGroup.position.set(4, 0, 0);
    scene.add(feederGroup);
    feeder = feederGroup;
}

function createSensors() {
    const boxGeo = new THREE.BoxGeometry(0.5, 0.3, 0.1);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0x065f46 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(4, 1.8, -2.8);
    scene.add(box);
}

function spawnPellet() {
    const pelletGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const pelletMat = new THREE.MeshPhongMaterial({ color: 0x451a03 }); // Coklat pakan
    const pellet = new THREE.Mesh(pelletGeo, pelletMat);
    
    // Posisi awal di bawah feeder
    pellet.position.set(4, 3.2, 0);
    
    // Kecepatan jatuh dengan sedikit variasi horizontal
    pellet.userData = {
        velocity: new THREE.Vector3(
            (Math.random() - 1.5) * 0.1, // Menyebar ke arah tengah kolam
            -0.05,
            (Math.random() - 0.5) * 0.08
        )
    };
    
    scene.add(pellet);
    feedParticles.push(pellet);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotasi Kamera Otomatis
    const time = Date.now() * 0.0003;
    camera.position.x = Math.cos(time) * 15;
    camera.position.z = Math.sin(time) * 15;
    camera.lookAt(0, 0, 0);

    // Logika Simulasi Pakan
    if (isFeeding) {
        // Munculkan partikel secara masif saat tombol ditekan
        spawnPellet();
        spawnPellet();
        // Efek getaran pada alat feeder
        if (feeder) {
            feeder.position.x = 4 + (Math.random() - 0.5) * 0.05;
            feeder.position.z = (Math.random() - 0.5) * 0.05;
        }
    } else if (feeder) {
        feeder.position.x = 4;
        feeder.position.z = 0;
    }

    // Update pergerakan partikel
    for (let i = feedParticles.length - 1; i >= 0; i--) {
        const p = feedParticles[i];
        p.position.add(p.userData.velocity);
        p.userData.velocity.y -= 0.003; // Gravitasi
        
        // Hapus jika menyentuh air (ketinggian kolam ~0.5)
        if (p.position.y < 0.5) {
            scene.remove(p);
            feedParticles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

// Jalankan init setelah seluruh jendela dimuat
window.addEventListener('load', init);