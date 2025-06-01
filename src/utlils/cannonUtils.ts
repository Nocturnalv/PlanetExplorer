import * as THREE from 'three'
import * as CANNON from 'cannon-es'
export class CannonUtils {
    CreateTrimesh(geometry: THREE.BufferGeometry): CANNON.Trimesh {
        let vertices: number[];
        if (geometry.index === null) {
            vertices = Array.from(geometry.attributes.position.array);
        } else {
            vertices = Array.from(geometry.clone().toNonIndexed().attributes.position.array);
        }
        const indices = Object.keys(vertices).map(Number)
        return new CANNON.Trimesh(vertices, indices)
    }
}
export default CannonUtils