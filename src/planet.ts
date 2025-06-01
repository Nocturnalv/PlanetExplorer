import * as THREE from 'three';
import { Settings } from "./settings"
import VertexShader from "./shaders/vertex.glsl";
import FragmentShader from "./shaders/fragment.glsl";
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { seededRandom } from 'three/src/math/MathUtils.js';

export class Planet {
    #sphere: THREE.Mesh | null = null
    // The percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    #settings: Settings = new Settings()
    #scene: THREE.Scene
    #noises: SimplexNoise[] = []
    #noiseOffsets: THREE.Vector3[] = []
    #clock = new THREE.Clock();

    get Settings() { return this.#settings }
    get Mesh() { return this.#sphere }

    UpdateMesh() {
        this.UpdateUniforms()
    }

    RegenerateMesh() {
        if (this.#sphere == null) return;
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        for (var i: number = 0; i < vertexBuf.count; i++) {
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            let samplePos = vertexPos.multiplyScalar(this.Settings.HeightNoiseScale);
            let sample = 0.0;
            for (var j = 0; j < this.#noises.length; j++) {
                let noise = this.#noises[j]
                let offset = this.#noiseOffsets[j]
                let p = (j + 1) / this.#noises.length
                let strength = 1.0 - Math.pow(p, this.Settings.HeightNoiseEffectFalloff);
                sample += noise.noise3d(samplePos.x + offset.x, samplePos.y + offset.y, samplePos.z + offset.z) * strength
            }
            let displacement = sample * this.Settings.HeightScale * this.Settings.Radius
            let displacedPos = vertexPos.normalize().multiplyScalar(this.Settings.Radius + displacement);
            vertexBuf.setXYZ(i, displacedPos.x, displacedPos.y, displacedPos.z)
        }
        vertexBuf.needsUpdate = true
        this.#sphere.geometry.computeVertexNormals()
        this.#sphere.geometry.computeTangents()
    }

    GenerateOctaves() {
        while (this.#noises.length > this.#settings.HeightNoiseOctaves)
            this.#noises.pop()
        this.#noiseOffsets.pop()
        while (this.#noises.length < this.#settings.HeightNoiseOctaves) {
            this.#noises.push(new SimplexNoise())
            let base = this.#settings.HeightNoiseSeed + this.#noises.length * 3;
            this.#noiseOffsets.push(new THREE.Vector3(
                seededRandom(base) * 1000000000,
                seededRandom(base + 1) * 1000000000,
                seededRandom(base + 2) * 1000000000
            ))
        }
    }

    GenerateMesh(): void {
        if (this.#sphere !== null)
            this.#scene.remove(this.#sphere)
        const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
            this.#settings.Radius,
            this.#settings.WidthSegments,
            this.#settings.HeightSegments
        )
        const material: THREE.ShaderMaterial = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            uniforms: {
                u_radius: { value: this.Settings.Radius },
                u_flatAColor: { value: this.Settings.FlatAColor },
                u_flatBColor: { value: this.Settings.FlatBColor },
                u_steepAColor: { value: this.Settings.SteepAColor },
                u_steepBColor: { value: this.Settings.SteepBColor },
                u_heightNoiseSeed: { value: this.Settings.HeightNoiseSeed },
                u_heightScale: { value: this.Settings.HeightScale },
                u_heightNoiseScale: { value: this.Settings.HeightNoiseScale },
                u_biomeNoiseSeed: { value: this.Settings.BiomeNoiseSeed },
                u_biomeNoiseScale: { value: this.Settings.BiomeNoiseScale },
                u_useColorBanding: { value: this.Settings.UseColorBanding },
                u_numberColorBands: { value: this.Settings.NumberColorBands },
                u_cameraPos: { value: this.Settings.CameraPos },
                u_lightPos: { value: this.Settings.SunPosition },
                u_lightColor: { value: this.Settings.SunColor },
                u_emissivity: { value: this.Settings.PlanetEmissivity },
                u_roughness: { value: this.Settings.PlanetRoughness },
                u_baseReflectance: { value: this.Settings.PlanetReflectance },
                u_moonNormal: { value: new THREE.TextureLoader().load("assets/texture/normal/moon_normal.png") }
            }
        })
        geometry.computeVertexNormals()
        geometry.computeTangents()
        this.#sphere = new THREE.Mesh(geometry, material)
        this.#sphere.receiveShadow = true;
        this.#scene.add(this.#sphere)
        this.#scene.add(new THREE.AxesHelper())
        this.RegenerateMesh()
    }

    //Generates Audio, can be changed

    GenerateAudio(listener : THREE.AudioListener): void {
        const audioLoader = new THREE.AudioLoader()
        this.#settings.PlanetSound = new THREE.PositionalAudio(listener)
        audioLoader.load( 'sound/ambientPlanet.ogg', (buffer) => {
            this.#settings.PlanetSound?.setBuffer( buffer );
            this.#settings.PlanetSound?.setLoop( true );
            this.#settings.PlanetSound?.setVolume( 1 );
            this.#settings.PlanetSound?.setRolloffFactor(3);
            this.#settings.PlanetSound?.setRefDistance(this.Settings.Radius);
        });

        this.#sphere?.add(this.#settings.PlanetSound);
    }

    //Updates the sound refDistance with the planet Radius


    UpdateUniforms(): void {
        if (this.#sphere === null) return;
        let shader: THREE.ShaderMaterial = this.#sphere.material as THREE.ShaderMaterial;
        shader.uniforms.u_radius.value = this.Settings.Radius;
        this.#settings.PlanetSound?.setRefDistance(this.Settings.Radius);
        shader.uniforms.u_flatAColor.value = this.Settings.FlatAColor;
        shader.uniforms.u_flatBColor.value = this.Settings.FlatBColor;
        shader.uniforms.u_steepAColor.value = this.Settings.SteepAColor;
        shader.uniforms.u_steepBColor.value = this.Settings.SteepBColor;
        shader.uniforms.u_heightScale.value = this.Settings.HeightScale;
        shader.uniforms.u_heightNoiseSeed.value = this.Settings.HeightNoiseSeed;
        shader.uniforms.u_heightNoiseScale.value = this.Settings.HeightNoiseScale;
        shader.uniforms.u_biomeNoiseSeed.value = this.Settings.BiomeNoiseSeed;
        shader.uniforms.u_useColorBanding.value = this.Settings.UseColorBanding;
        shader.uniforms.u_numberColorBands.value = this.Settings.NumberColorBands;
        shader.uniforms.u_cameraPos.value = this.Settings.CameraPos
        shader.uniforms.u_lightPos.value = this.Settings.SunPosition
        shader.uniforms.u_lightColor.value = this.Settings.LightColor
        shader.uniforms.u_emissivity.value = this.Settings.PlanetEmissivity
        shader.uniforms.u_roughness.value = this.Settings.PlanetRoughness
        shader.uniforms.u_baseReflectance.value = this.Settings.PlanetReflectance
        this.RegenerateMesh()
    }

    constructor(settings: Settings, scene: THREE.Scene, listener: THREE.AudioListener) {
        this.#settings = settings
        this.#scene = scene
        this.Settings.SetupPlanetListeners(this)
        this.GenerateOctaves()
        this.GenerateMesh()
        this.UpdateMesh()
        this.GenerateAudio(listener);
    }
}
