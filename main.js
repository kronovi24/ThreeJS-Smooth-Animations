import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


//setting up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);
camera.position.z = 5;

// Bloom setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 1.5; // intensity of glow
bloomPass.radius = 0.6;
composer.addPass(bloomPass);

// Mouse tracking
let mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
});


let CUBE_COUNT = 9; // Change this value as needed

// Calculate grid size (square or nearly square)
let gridSize = Math.ceil(Math.sqrt(CUBE_COUNT));
let spacing = 3; // Distance between cubes

let cube = [];
const originalPositions = [];
const targetPositions = [];

// movements
let expandValue = 5;
let rotationValue = 0.01;

// initialize cubes
function initCubes(){

    // calculate grid size in case CUBE_COUNT changed
    const gridSize = Math.ceil(Math.sqrt(CUBE_COUNT));
    const spacing = 3;
    
    for (let i = 0; i < CUBE_COUNT; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        // Center the grid around (0,0)
        const x = (col - (gridSize - 1) / 2) * spacing;
        const y = (row - (gridSize - 1) / 2) * spacing;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, -10);
        scene.add(mesh);
        cube.push(mesh);

        originalPositions.push({ x, y });
        targetPositions.push({ x, y });
    }
}

initCubes();

// Lighting to support emissive
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Rotation + Color logic
let rotation = 0.01;
let isMouseDown = false;
let clickCount = 0;
const colors = [
    0xff0000, 0x00ff00 , 0x7513CC , 0xCC13a8 , 0x2e1fe7  ];

// window responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', (event) => {
    // Only trigger if clicking on the renderer's canvas
    if (event.target === renderer.domElement) {
        clickCount = (clickCount + 1) % colors.length;
        cube.forEach(c => {
            c.material.color.set(colors[clickCount]);
            c.material.emissive.set(colors[clickCount]);
        });
    }
});

window.addEventListener('mousedown', (event) => {
    if (event.target === renderer.domElement) {
        isMouseDown = true;
        rotation = rotationValue * 5;
        cube.forEach((c, i) => {
            targetPositions[i].x = originalPositions[i].x * expandValue;
            targetPositions[i].y = originalPositions[i].y * expandValue;
        });
    }
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
    rotation = rotationValue;
    cube.forEach((c, i) => {
        targetPositions[i].x = originalPositions[i].x;
        targetPositions[i].y = originalPositions[i].y;
    });
});

// Enable for mobile touch for test only
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMouseDown = true;
    rotation = 0.05;
    cube.forEach((c, i) => {
        targetPositions[i].x = originalPositions[i].x * 5;
        targetPositions[i].y = originalPositions[i].y * 5;
    });
}, { passive: false });

window.addEventListener('touchend', (e) => {
    e.preventDefault();
    isMouseDown = false;
    rotation = 0.01;
    cube.forEach((c, i) => {
        targetPositions[i].x = originalPositions[i].x;
        targetPositions[i].y = originalPositions[i].y;
    });
}, { passive: false });




// Animate
function animate() {
    requestAnimationFrame(animate);

    cube.forEach((element, i) => {
        element.rotation.x += rotation;
        element.rotation.y += rotation;

        // Slide animation
        element.position.x += (targetPositions[i].x - element.position.x) * 0.1;
        element.position.y += (targetPositions[i].y - element.position.y) * 0.1;

        // Mouse follow
        if (!isMouseDown) {
            element.position.x += ((mouse.x * 10) + originalPositions[i].x - element.position.x) * 0.05;
            element.position.y += ((mouse.y * 10) + originalPositions[i].y - element.position.y) * 0.05;
        }
    });

    composer.render(); // Use bloom composer
}

animate();

window.reRender = reRender;
function reRender(){
    expandValue = Number(document.getElementById('expand_value').value);
    rotationValue = Number(document.getElementById('rotation_value').value);
    rotation = rotationValue;
    CUBE_COUNT = Number(document.getElementById('cube_count').value);

    cube.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    });

    cube.length = 0;
    originalPositions.length = 0;
    targetPositions.length = 0;

    initCubes();
}
