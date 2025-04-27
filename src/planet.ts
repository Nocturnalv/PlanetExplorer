import * as THREE from 'three';
import { Settings } from "./settings"
import VertexShader from "./shaders/vertex.glsl";
import FragmentShader from "./shaders/fragment.glsl";
import { SimplexNoise } from 'three/examples/jsm/Addons.js';

export class Planet {
    #sphere: THREE.Mesh | null = null
    // The percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    #settings: Settings = new Settings()
    #scene: THREE.Scene
    #noise = new SimplexNoise()

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
            let samplePos = vertexPos.multiplyScalar(this.Settings.BiomeNoiseScale);
            let sample = this.#noise.noise3d(samplePos.x, samplePos.y, samplePos.z) * this.Settings.HeightNoiseScale;
            let displacement = sample * this.Settings.HeightScale * this.Settings.Radius
            let displacedPos = vertexPos.normalize().multiplyScalar(this.Settings.Radius + displacement);
            vertexBuf.setXYZ(i, displacedPos.x, displacedPos.y, displacedPos.z)
        }
        vertexBuf.needsUpdate = true
        this.#sphere.geometry.computeVertexNormals()
        this.#sphere.geometry.computeTangents()
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
                u_lightPos: { value: this.Settings.LightPos },
                u_lightColor: { value: this.Settings.LightColor },
                u_emissivity: { value: this.Settings.PlanetEmissivity },
                u_roughness: { value: this.Settings.PlanetRoughness },
                u_baseReflectance: { value: this.Settings.PlanetReflectance },
                u_normalMapBlend: { value: this.Settings.TriplanarNormalBlend },
                u_moonNormal: { value: new THREE.TextureLoader().load("assets/moon_normal.jpg") }
            }
        })
        geometry.computeVertexNormals()
        geometry.computeTangents()
        this.#sphere = new THREE.Mesh(geometry, material)
        this.#scene.add(this.#sphere)
        this.#scene.add(new THREE.AxesHelper())
        this.RegenerateMesh()
    }

    UpdateUniforms(): void {
        if (this.#sphere === null) return;
        let shader: THREE.ShaderMaterial = this.#sphere.material as THREE.ShaderMaterial;
        shader.uniforms.u_radius.value = this.Settings.Radius;
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
        shader.uniforms.u_lightPos.value = this.Settings.LightPos
        shader.uniforms.u_lightColor.value = this.Settings.LightColor
        shader.uniforms.u_emissivity.value = this.Settings.PlanetEmissivity
        shader.uniforms.u_roughness.value = this.Settings.PlanetRoughness
        shader.uniforms.u_baseReflectance.value = this.Settings.PlanetReflectance
        shader.uniforms.u_normalMapBlend.value = this.Settings.TriplanarNormalBlend
        console.log("Update mesh uniforms");
        this.RegenerateMesh()
    }

    constructor(settings: Settings, scene: THREE.Scene) {
        this.#settings = settings
        this.#scene = scene
        this.Settings.SetupPlanetListeners(this)
        this.GenerateMesh()
        this.UpdateMesh()
    }
}
