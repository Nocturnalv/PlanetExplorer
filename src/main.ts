import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Planet } from "./planet";
import { Settings } from "./settings"
import { collisionTest } from "./collisionTest.ts";
import { stars } from "./stars.ts";
import { disposeTardis, loadTardis, updateTardis } from './tardis.ts';
import { disposeMelon, loadMelon, spawnCloud, disposeClouds, melonModel } from './melon.ts';
import { createWormhole, updateWormhole } from './wormhole.ts';
import { Helper } from './helper';

class Global {
    #activePlanet: Planet
    #controls: OrbitControls
    #camera: THREE.PerspectiveCamera
    #scene: THREE.Scene
    #renderer: THREE.WebGLRenderer
    #testScene: collisionTest
    #settings: Settings
    #stars: stars
    #tardis
    #listener: THREE.AudioListener | null = null
    #debugLightSphere: THREE.Mesh
    #mouse: THREE.Vector2 = new THREE.Vector2(0, 0);
    #helper: Helper;
    #wasEPressed: boolean = false;
    #wormhole: THREE.Mesh;

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
        if (this.#testScene != null) {
            this.#testScene.disposeAll();
        }
        if (this.#stars != null) {
            this.#stars.disposeStars();
        }
        if (this.#listener == null) {
            this.#listener = new THREE.AudioListener();
        }
        this.#activePlanet = new Planet(this.#settings, this.#scene, this.#listener)
        this.#testScene = new collisionTest(this.#scene, this.#activePlanet, this.#camera);
        this.#stars = new stars(this.#scene);
        this.#stars.generateStars();
        disposeTardis(this.#scene)
        loadTardis(this.#scene, this.#settings, this.#listener, this.#activePlanet);
        disposeMelon(this.#scene)
        loadMelon(this.#scene, this.#settings);
        disposeClouds(this.#scene); 
    }

    constructor() {
        this.#renderer = new THREE.WebGLRenderer();
        this.#renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.#renderer.domElement);
        this.#scene = new THREE.Scene();
        this.#listener = new THREE.AudioListener();
        this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.#camera.position.set(10, 10, 10)
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.#camera.add(this.#listener);
        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
        this.#renderer.setAnimationLoop(this.Tick.bind(this));
        this.#settings = new Settings();
        this.#helper = new Helper();
        this.#helper.listener();
        this.#wormhole = createWormhole();
        this.#scene.add(this.#wormhole);

        this.#settings.Pane.addButton({
            title: "Generate",
            label: "New Planet"
        }).on("click", this.GenerateNewPlanet.bind(this))
        this.GenerateNewPlanet()
        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;

        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.0;

        this.#debugLightSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, opacity: 0, transparent: true })
        );
        this.#scene.add(this.#debugLightSphere)

        this.#settings.LightSound = new THREE.PositionalAudio(this.#listener);
        const audioLoader = new THREE.AudioLoader()
        audioLoader.load('sound/ambientSun.ogg', (buffer) => {
            this.#settings.LightSound?.setBuffer(buffer);
            this.#settings.LightSound?.setLoop(true);
            this.#settings.LightSound?.setVolume(0.25);
            this.#settings.LightSound?.setRolloffFactor(2.5);
        });
        this.#debugLightSphere.add(this.#settings.LightSound);

        this.mouseMove = this.mouseMove.bind(this);
        this.mouseClick = this.mouseClick.bind(this);
        document.addEventListener('mousemove', this.mouseMove);
        document.addEventListener('click', this.mouseClick);
    }

    Tick() {
        this.#controls.update();
        this.#renderer.render(this.#scene, this.#camera);
        
        updateWormhole(this.#wormhole, performance.now() * 0.001);

        updateTardis();

        let shader: THREE.ShaderMaterial = this.ActivePlanet.Mesh!.material as THREE.ShaderMaterial;
        shader.uniforms.u_cameraPos.value = this.#camera.position;
        let lightPos: THREE.Vector3 = shader.uniforms.u_lightPos.value;
        this.#debugLightSphere.position.set(lightPos.x, lightPos.y, lightPos.z);
        this.#testScene.update();

        if (this.#helper.isePressed && !this.#wasEPressed) {
            console.log('E key pressed — spawning cloud.');
            spawnCloud(this.#scene);
        }
        this.#wasEPressed = this.#helper.isePressed;
    }

    mouseMove(event: MouseEvent) {
        this.#mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.#mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
            disposeMelon(this.#scene);
            break;
            }
        object = object.parent;
        }
    }
}
}
new Global()