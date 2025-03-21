import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Planet } from "./planet"

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10)
camera.lookAt(new THREE.Vector3(0, 0, 0))
const controls: OrbitControls = new OrbitControls(camera, renderer.domElement)

var planet: Planet = new Planet(5, 50, 50)
planet.DisplaceVerticesRandomly(0.1)
scene.add(planet.GetMesh());
scene.add(new THREE.AxesHelper())

camera.position.z = 5;

function Animate() {
    controls.update()
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(Animate);
