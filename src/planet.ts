import * as THREE from 'three';

export class Planet {
    #sphere: THREE.Mesh
    #radius: number

    GetMesh(): THREE.Mesh {
        return this.#sphere;
    }

    // @param: maxProportionalDisplacement —  the percentage of the sphere’s radius by which it can be deformed. Domain [0, 1].
    DisplaceVerticesRandomly(maxProportionalDisplacement: number): void {
        // Do we really not have a clamp function in the year of our lord 2025
        maxProportionalDisplacement = Math.max(0, Math.min(1, maxProportionalDisplacement))
        let vertexBuf = this.#sphere.geometry.getAttribute("position");
        for (var i: number = 0; i < vertexBuf.count; i++) {
            // Using the normal buffer might be an easier way to compute this…  oh well
            let displacement: number = Math.random() * (maxProportionalDisplacement * this.#radius)
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

    constructor(radius: number, widthSegments: number, heightSegments: number) {
        const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x42a426, wireframe: true });
        this.#sphere = new THREE.Mesh(geometry, material);
        this.#radius = radius
    }
}
