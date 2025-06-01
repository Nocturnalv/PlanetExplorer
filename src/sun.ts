import * as THREE from 'three';
import { Settings } from "./settings"
import VertexShader from "./shaders/vertex_sun.glsl";
import FragmentShader from "./shaders/fragment_sun.glsl";
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { seededRandom } from 'three/src/math/MathUtils.js';

function getRandomArbitrary(min : number, max : number) {
  return Math.random() * (max - min) + min;
}

function randomPolarity() {
    let num = Math.random()
    if (num <= 0.5) {
        return -1
    } else {
        return 1
    }
}

export class Sun {
    #sphere: THREE.Mesh | null = null
    #light: THREE.PointLight | null = null
    #settings: Settings = new Settings()
    #scene: THREE.Scene | null = null
    #noises: SimplexNoise[] = []
    #noiseOffsets: THREE.Vector3[] = []
    #index: number | null = null
    #clock = new THREE.Clock();

    getPosition() {
        return this.#settings.SunPosition;
    }

    GenerateMesh() {
        if (this.#sphere !== null) {
            this.#scene?.remove(this.#sphere)
        }
        this.#sphere = new THREE.Mesh(new THREE.SphereGeometry(this.#settings.SunRadius), new THREE.ShaderMaterial({
            uniforms: {
                u_Time: {value: 0.0},
                u_zoom: {value: this.#settings.SunZoom},
                u_radius: {value: this.#settings.SunRadius},
                u_color1: {value: this.#settings.SunColor},
                u_speed: {value: this.#settings.SunSpeed}
            },
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
        }));
        this.#sphere.position.set(this.#settings.SunPosition.x, this.#settings.SunPosition.y, this.#settings.SunPosition.z)
        this.#scene?.add(this.#sphere)
    }

    GenerateLight() {
        this.#light = new THREE.PointLight(0xffffff, 1, 10000 )
        this.#light.castShadow = true;
        this.#sphere?.add(this.#light)
    }

    GenerateSound(listener : THREE.AudioListener) {
        this.#settings.LightSound = new THREE.PositionalAudio(listener);
        const audioLoader = new THREE.AudioLoader()
        audioLoader.load('sound/ambientSun.ogg', (buffer) => {
            this.#settings.LightSound?.setBuffer(buffer);
            this.#settings.LightSound?.setLoop(true);
            this.#settings.LightSound?.setVolume(0.25);
            this.#settings.LightSound?.setRolloffFactor(2.5);
        }); 
        
        this.#sphere?.add(this.#settings.LightSound);
    }

    UpdatePosition() {
        this.#sphere?.position.set(this.#settings.SunPosition.x, this.#settings.SunPosition.y, this.#settings.SunPosition.z);
        this.#light?.position.set(this.#settings.SunPosition.x, this.#settings.SunPosition.y, this.#settings.SunPosition.z);
    }

    UpdateMesh() {
        this.GenerateMesh();
    }

    //Update method
    Tick() {
        const elapsedTime = this.#clock.getElapsedTime();
        if (this.#sphere != null) {
            (this.#sphere.material as THREE.ShaderMaterial).uniforms.u_Time.value = elapsedTime;
        }
    }

    constructor(settings: Settings, scene: THREE.Scene, listener : THREE.AudioListener) {
        this.#settings = settings
        this.#scene = scene
        this.GenerateMesh()
        this.GenerateLight()
        this.#settings.SetupSunListeners(this)
        this.GenerateSound(listener)
    }

    get Settings() { return this.#settings }
    get Mesh() { return this.#sphere }

}
