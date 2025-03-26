import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";
import { Settings } from "./settings"

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10)
camera.lookAt(new THREE.Vector3(0, 0, 0))
const controls: OrbitControls = new OrbitControls(camera, renderer.domElement)

// I’m sure there’s a better name for this
class Global {
    #activePlanet: Planet

    get ActivePlanet() { return this.#activePlanet }

    constructor() {
        let settings = new Settings()
        this.#activePlanet = new Planet(settings, scene)
        if (this.#activePlanet.Mesh === null) return
        scene.add(this.#activePlanet.Mesh);
    }

    DoNothing(): void {
        return
    }
}

let global = new Global()
global.DoNothing()

function Animate() {
    controls.update()
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(Animate);
