import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";
import { Settings } from "./settings"

// I’m sure there’s a better name for this
class Global {
    #activePlanet: Planet
    #controls: OrbitControls
    #camera: THREE.PerspectiveCamera
    #scene: THREE.Scene
    #renderer: THREE.WebGLRenderer

    get ActivePlanet() { return this.#activePlanet }

    constructor() {
        this.#renderer = new THREE.WebGLRenderer();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);
        this.#scene = new THREE.Scene();
        this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.#camera.position.set(10, 10, 10)
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
        this.#renderer.setAnimationLoop(this.Tick.bind(this));

        let settings = new Settings()
        this.#activePlanet = new Planet(settings, this.#scene)
    }

    Tick() {
        this.#controls.update()
        this.#renderer.render(this.#scene, this.#camera);
    }
}

new Global()
