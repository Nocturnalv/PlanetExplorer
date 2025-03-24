import * as THREE from 'three';

export class Planet {
    #sphere: THREE.Mesh
    // The percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    #terrainExaggeration: number
    #radius: number

    GetMesh(): THREE.Mesh {
        return this.#sphere;
    }

    DisplaceVerticesRandomly(): void {
        // Do we really not have a clamp function in the year of our lord 2025
        this.#terrainExaggeration = Math.max(0, Math.min(1, this.#terrainExaggeration))
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        for (var i: number = 0; i < vertexBuf.count; i++) {
            // Using the normal buffer might be an easier way to compute this…  oh well
            let displacement: number = Math.random() * (this.#terrainExaggeration * this.#radius)
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            // To extrude the terrain, we want to unit vector which points “outward”
            // Since our sphere is currently centered on (0, 0, 0), normal should just be Center →  Vertex
            //  = (0, 0, 0) →  vertexPos = normalise(vertexPos - (0, 0, 0))
            // I’m sure that’s wrong somehow, just not yet quite sure how
            let surfaceNormal = vertexPos.clone().normalize()
            let newVertexPos = vertexPos.add(surfaceNormal.multiplyScalar(displacement))
            vertexBuf.setXYZ(i, newVertexPos.x, newVertexPos.y, newVertexPos.z)
        }
        vertexBuf.needsUpdate = true
    }

    DisplaceVerticesFromNoise(noise: any): void {
        this.#terrainExaggeration = Math.max(0, Math.min(1, this.#terrainExaggeration))
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        for (var i: number = 0; i < vertexBuf.count; i++) {
            let vertexPos = new THREE.Vector3(vertexBuf.getX(i), vertexBuf.getY(i), vertexBuf.getZ(i))
            let surfaceNormal = vertexPos.clone().normalize()
            let offsetLengthRatio = this.#radius / vertexPos.length()
            // Find the original vertex position (the point on the same vector from the sphere’s center)
            // but 1 radius away. This will ensure that changes don’t compound
            let originalVertexPos = vertexPos.multiplyScalar(offsetLengthRatio)
            let displacement: number = noise.get3(originalVertexPos) * (this.#terrainExaggeration * this.#radius)
            let newVertexPos = originalVertexPos.add(surfaceNormal.multiplyScalar(displacement))
            vertexBuf.setXYZ(i, newVertexPos.x, newVertexPos.y, newVertexPos.z)
        }
        vertexBuf.needsUpdate = true
    }

    ColorVertices(colorA: THREE.Color, colorB: THREE.Color): void {
        let positionAttr = this.#sphere.geometry.getAttribute("position")
        let colourAttr = this.#sphere.geometry.getAttribute("color")
        for (var i = 0; i < positionAttr.count; i++) {
            let vertexPos = new THREE.Vector3(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i))
            let displacement: number = vertexPos.length() - this.#radius
            let percentageDisplacment: number = displacement / this.#terrainExaggeration
            let mixAmount = percentageDisplacment
            let finalColour = new THREE.Vector3(
                THREE.MathUtils.lerp(colorA.r, colorB.r, mixAmount),
                THREE.MathUtils.lerp(colorA.g, colorB.g, mixAmount),
                THREE.MathUtils.lerp(colorA.b, colorB.b, mixAmount)
            )
            colourAttr.setXYZ(i, finalColour.x, finalColour.y, finalColour.z)
        }
        colourAttr.needsUpdate = true
    }

    constructor(radius: number, widthSegments: number, heightSegments: number, terrainExaggeration: number) {
        const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ vertexColors: true })
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3))
        this.#sphere = new THREE.Mesh(geometry, material)
        this.#radius = radius
        this.#terrainExaggeration = terrainExaggeration
    }
}
