import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";
import { Settings } from "./settings"
import { collisionTest } from "./collisionTest.ts";


// I’m sure there’s a better name for this
class Global {
    #activePlanet: Planet
    #controls: OrbitControls
    #camera: THREE.PerspectiveCamera
    #scene: THREE.Scene
    #renderer: THREE.WebGLRenderer
    #testScene: collisionTest
    #debugLightSphere: THREE.Mesh
    #settings: Settings

    get ActivePlanet() { return this.#activePlanet }

    GenerateNewPlanet() {
        this.#settings.Randomise(Math.random() * 100)
        if (this.ActivePlanet != null) {
            this.ActivePlanet.Mesh?.geometry.dispose()
            if (this.ActivePlanet.Mesh?.material instanceof Array)
                this.ActivePlanet.Mesh?.material.forEach(mat => mat.dispose())
            else
                this.ActivePlanet.Mesh?.material.dispose()
            this.#scene.remove(this.ActivePlanet.Mesh!)
        }
        this.#activePlanet = new Planet(this.#settings, this.#scene)
    }

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

        this.#settings = new Settings();
        this.#settings.Pane.addButton({
            title: "Generate",
            label: "New Planet"
        }).on("click", this.GenerateNewPlanet.bind(this))
        this.GenerateNewPlanet()
        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;
        this.#testScene = new collisionTest(this.#scene);

        this.#debugLightSphere = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffaa00 }))
        this.#scene.add(this.#debugLightSphere)
    }

    Tick() {
        this.#controls.update()
        this.#renderer.render(this.#scene, this.#camera);

        // Update camera pos…  this had sure better be temporary
        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;
        let lightPos: THREE.Vector3 = shader.uniforms.u_lightPos.value;
        this.#debugLightSphere.position.set(lightPos.x, lightPos.y, lightPos.z);
        this.#testScene.update();
    }
}

new Global()
