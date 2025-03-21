import * as THREE from "three";
import { GUI } from "lil-gui";
import { FBM } from "three-noise";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10)
camera.lookAt(new THREE.Vector3(0, 0, 0))
const controls: OrbitControls = new OrbitControls(camera, renderer.domElement)

var settings = {
    "seed": Math.random(),
    "maxProportionalDisplacement": 0.1
}

function RegeneratePlanetMesh() {
    planet.DisplaceVerticesFromNoise(settings["maxProportionalDisplacement"], noise)
}

var noise = new FBM({ seed: settings["seed"] })

var planet: Planet = new Planet(5, 50, 50)
RegeneratePlanetMesh()
scene.add(planet.GetMesh());
scene.add(new THREE.AxesHelper())

camera.position.z = 5;

var gui = new GUI()
gui.add(settings, "seed").min(0).max(10).step(0.01).name("Seed").onFinishChange((_: any) => {
    noise = new FBM({ seed: settings["seed"] })
    RegeneratePlanetMesh()
});

gui.add(settings, "maxProportionalDisplacement").min(0).max(1).name("Max Proportional Displacement").step(0.01).onChange((_: any) => RegeneratePlanetMesh())

function Animate() {
    controls.update()
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(Animate);
