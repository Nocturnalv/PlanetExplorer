import * as THREE from 'three';
import { Settings } from "./settings"
import VertexShader from "./shaders/vertex.glsl";
import FragmentShader from "./shaders/fragment.glsl";

export class Planet {
    #sphere: THREE.Mesh | null = null
    // The percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    #settings: Settings = new Settings()
    #scene: THREE.Scene
    #currRadius: number = this.Settings.Radius

    get Settings() { return this.#settings }
    get Mesh() { return this.#sphere }

    UpdateMesh() {
        // this.DisplaceVerticesFromNoise()
        this.UpdateUniforms()
    }

    ChangeMeshRadius(): void {
        if (this.#sphere === null) return
        let prevRadius = this.#currRadius
        let newRadius = this.Settings.Radius
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        let scaleFactor = newRadius / prevRadius
        for (var i: number = 0; i < vertexBuf.count; i++) {
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            let upDirection = vertexPos.clone().normalize()
            let newVertexPos = upDirection.multiplyScalar(vertexPos.length() * scaleFactor)
            vertexBuf.setXYZ(i, newVertexPos.x, newVertexPos.y, newVertexPos.z)
        }
        this.#currRadius = newRadius
        vertexBuf.needsUpdate = true
        this.UpdateUniforms()
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
                u_numberColorBands: { value: this.Settings.NumberColorBands }
            }
        })

        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3))
        this.#sphere = new THREE.Mesh(geometry, material)
        this.#scene.add(this.#sphere)
        this.#scene.add(new THREE.AxesHelper())
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
    }

    constructor(settings: Settings, scene: THREE.Scene) {
        this.#settings = settings
        this.#scene = scene
        this.Settings.SetupPlanetListeners(this)
        this.GenerateMesh()
        this.UpdateMesh()
    }
}
