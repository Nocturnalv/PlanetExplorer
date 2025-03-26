import * as THREE from 'three';
import { Settings } from "./settings"
import { FBM } from "three-noise";

export class Planet {
    #sphere: THREE.Mesh | null = null
    // The percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    #settings: Settings = new Settings()
    #noise: any = new FBM({ seed: this.Settings.Seed })
    #scene: THREE.Scene
    #currRadius: number = this.Settings.Radius

    get Settings() { return this.#settings }
    get Mesh() { return this.#sphere }

    UpdateSeed(): void {
        this.#noise = new FBM({ seed: this.Settings.Seed })
        this.UpdateMesh()
    }

    UpdateMesh() {
        this.DisplaceVerticesFromNoise()
        this.ColorVertices()
    }

    DisplaceVerticesFromNoise(): void {
        if (this.#sphere === null) return
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        for (var i: number = 0; i < vertexBuf.count; i++) {
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            let surfaceNormal = vertexPos.clone().normalize()
            let offsetLengthRatio = this.#settings.Radius / vertexPos.length()
            // Find the original vertex position (the point on the same vector from the sphere’s center)
            // but 1 radius away. This will ensure that changes don’t compound
            let originalVertexPos = vertexPos.multiplyScalar(offsetLengthRatio)
            let displacement: number = this.#noise.get3(originalVertexPos) * (this.#settings.TerrainExaggeration * this.#settings.Radius)
            let newVertexPos = originalVertexPos.add(surfaceNormal.multiplyScalar(displacement))
            vertexBuf.setXYZ(i, newVertexPos.x, newVertexPos.y, newVertexPos.z)
        }
        vertexBuf.needsUpdate = true
    }

    ChangeMeshRadius(): void {
        if (this.#sphere === null) return
        let prevRadius = this.#currRadius
        let newRadius = this.Settings.Radius
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        let scaleFactor = newRadius / prevRadius
        for (var i: number = 0; i < vertexBuf.count; i++) {
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            let surfaceNormal = vertexPos.clone().normalize()
            let newVertexPos = surfaceNormal.multiplyScalar(vertexPos.length() * scaleFactor)
            vertexBuf.setXYZ(i, newVertexPos.x, newVertexPos.y, newVertexPos.z)
        }
        this.#currRadius = newRadius
        vertexBuf.needsUpdate = true
    }

    ColorVertices(): void {
        if (this.#sphere === null) return
        let positionAttr = this.#sphere.geometry.getAttribute("position")
        let colourAttr = this.#sphere.geometry.getAttribute("color")
        for (var i = 0; i < positionAttr.count; i++) {
            let vertexPos = new THREE.Vector3(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i))
            let displacement: number = vertexPos.length() - this.#settings.Radius
            let percentageDisplacment: number = displacement / this.#settings.TerrainExaggeration
            let mixAmount = percentageDisplacment
            let finalColour = new THREE.Vector3(
                THREE.MathUtils.lerp(this.Settings.ColorA.r, this.Settings.ColorB.r, mixAmount),
                THREE.MathUtils.lerp(this.Settings.ColorA.g, this.Settings.ColorB.g, mixAmount),
                THREE.MathUtils.lerp(this.Settings.ColorA.b, this.Settings.ColorB.b, mixAmount)
            )
            colourAttr.setXYZ(i, finalColour.x, finalColour.y, finalColour.z)
        }
        colourAttr.needsUpdate = true
    }

    GenerateMesh(): void {
        if (this.#sphere !== null)
            this.#scene.remove(this.#sphere)
        const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(
            this.#settings.Radius,
            this.#settings.WidthSegments,
            this.#settings.HeightSegments
        )
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ vertexColors: true })
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3))
        this.#sphere = new THREE.Mesh(geometry, material)
        this.#scene.add(this.#sphere)
        this.#scene.add(new THREE.AxesHelper())
    }

    constructor(settings: Settings, scene: THREE.Scene) {
        this.#settings = settings
        this.#scene = scene
        this.Settings.SetupPlanetListeners(this)
        this.GenerateMesh()
        this.UpdateMesh()
    }
}
