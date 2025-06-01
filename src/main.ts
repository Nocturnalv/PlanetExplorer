import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";
import { Settings } from "./settings"
import { collisionTest } from "./collisionTest.ts";
import { stars } from "./stars.ts";
import { disposeTardis, loadTardis, updateTardis } from './tardis.ts';
import { loadMelon, disposeMelon, spawnCloud, disposeClouds} from './melon.ts';
import { loadWormhole, updateWormhole, loadLightning, updateLightning } from './wormhole.ts';
import { Sun } from "./sun.ts";
import { Sky } from "./skycolor.js";
import { Helper } from './helper';

// I’m sure there’s a better name for this
class Global {
    #activePlanet: Planet
    #controls: OrbitControls
    #camera: THREE.PerspectiveCamera
    #scene: THREE.Scene
    #renderer: THREE.WebGLRenderer
    #testScene: collisionTest
    #settings: Settings
    #stars: stars
    #sun: Sun
    #tardis
    #wormhole: THREE.Mesh;
    #generateNewCount: number = 0;
    #melonEatSound: THREE.Audio | null = null;
    #helper: Helper;
    #wasEPressed: boolean = false;
    #listener: THREE.AudioListener | null = null
    #debugLightSphere: THREE.Mesh
    #mouse: THREE.Vector2 = new THREE.Vector2(0, 0);
    sky: Sky | null = null

    get ActivePlanet() { return this.#activePlanet }

    GenerateNewPlanet() {
        this.#wasEPressed = false;
        this.#generateNewCount++;
        THREE.ColorManagement.enabled = false;
        this.#settings.Randomise(Math.random() * 100)
        if (this.ActivePlanet != null) {
            this.ActivePlanet.Mesh?.geometry.dispose()
            if (this.ActivePlanet.Mesh?.material instanceof Array)
                this.ActivePlanet.Mesh?.material.forEach(mat => mat.dispose())
            else
                this.ActivePlanet.Mesh?.material.dispose()
            this.#scene.remove(this.ActivePlanet.Mesh!)
        }
        if (this.#testScene != null) {
            this.#testScene.disposeAll();
        }
        if (this.#stars != null) {
            this.#stars.disposeStars();
        }
        if (this.#sun != null) {
            this.#sun.Mesh?.geometry.dispose()
            this.#scene.remove(this.#sun.Mesh!)
        }
        if (this.#listener == null) {
            this.#listener = new THREE.AudioListener();
        }
        this.#activePlanet = new Planet(this.#settings, this.#scene, this.#listener)
        this.#testScene = new collisionTest(this.#scene, this.#activePlanet, this.#camera);
        this.#stars = new stars(this.#scene);
        this.#sun = new Sun(this.#settings, this.#scene, this.#listener);
        this.#stars.generateStars();
        disposeTardis(this.#scene)
        loadTardis(this.#scene, this.#settings, this.#listener, this.#activePlanet);
        disposeMelon(this.#scene)
        loadMelon(this.#scene, this.#settings, this.#activePlanet);
        disposeClouds(this.#scene); 
        const maxWormhole = 1.0;
        const growth = 0.1;
        const scale = Math.min(this.#generateNewCount * growth, maxWormhole);
        this.#wormhole.scale.set(scale, scale, scale);
        const lightningBranch = loadLightning(new THREE.Vector3(0, 0, -80));
        lightningBranch.name = "LightningShoot";
        this.#scene.add(lightningBranch);
        this.sky = new Sky(this.#settings, this.#scene, this.#renderer);
    }

    constructor() {
        this.#renderer = new THREE.WebGLRenderer();
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderer.shadowMap.enabled = true;
        document.body.appendChild(this.#renderer.domElement);
        this.#scene = new THREE.Scene();
        this.#listener = new THREE.AudioListener();
        this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.#camera.position.set(10, 10, 10)
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.#camera.add(this.#listener);
        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
        this.#renderer.setAnimationLoop(this.Tick.bind(this));
        this.#settings = new Settings();
        this.#helper = new Helper();
        this.#helper.listener();
        this.#wormhole = loadWormhole();
        this.#wormhole.scale.set(1, 1, 1);
        this.#scene.add(this.#wormhole);
        this.#settings.Pane.addButton({
            title: "Generate",
            label: "New Planet"
        }).on("click", this.GenerateNewPlanet.bind(this))
        this.GenerateNewPlanet()
        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;

        this.mouseMove = this.mouseMove.bind(this);
        this.mouseClick = this.mouseClick.bind(this);
        document.addEventListener('mousemove', this.mouseMove);
        document.addEventListener('click', this.mouseClick);

        const eatSoundLoader = new THREE.AudioLoader();
        this.#melonEatSound = new THREE.Audio(this.#listener);
        eatSoundLoader.load('sound/eatingEffect.ogg', (buffer) => {
            this.#melonEatSound!.setBuffer(buffer);
            this.#melonEatSound!.setVolume(0.35); // adjust as needed
        });

    }

    Tick() {
        this.sky?.tick(this.#camera, this.#settings, this.#renderer, this.#activePlanet);
        this.#sun?.Tick();
        this.#controls.update()
        this.#renderer.render(this.#scene, this.#camera);
        updateTardis();
        // Update camera pos…  this had sure better be temporary
        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;
        this.#testScene.update();

        // Only trigger once per key press
        if (this.#helper.isePressed && !this.#wasEPressed) {
            console.log('E key pressed — spawning cloud.');
            spawnCloud(this.#scene);
                this.#wasEPressed = true;
        }

        updateWormhole(this.#wormhole, performance.now() * 0.001, this.#generateNewCount);
        updateLightning(performance.now() * 0.001);

    }

    mouseMove(event: MouseEvent) {
        this.#mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.#mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    mouseClick(event: MouseEvent) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.#mouse, this.#camera);
    const intersects = raycaster.intersectObjects(this.#scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        if (clickedObject.name === "Glass_Box") {
            console.log("tardistime");
            this.GenerateNewPlanet();
        }

    let object = clickedObject;
    while (object) {
        if (object.name === "MELON") {
            console.log("melontime");
            if (this.#melonEatSound && this.#melonEatSound.buffer) {
                this.#melonEatSound.play();
            }
            disposeMelon(this.#scene);
            break;
            }
        object = object.parent;
        }

    }
}
}

new Global()
