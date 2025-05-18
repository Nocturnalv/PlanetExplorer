import * as THREE from 'three';
import { MeshBVH, MeshBVHHelper, StaticGeometryGenerator } from 'three-mesh-bvh';
import { Planet } from "./planet";
import { Settings } from "./settings";
import * as CANNON from 'cannon-es';
import CannonUtils from './utils/cannonUtils';

//import * as controls from "./helper.ts"

export class collisionTest {
    cannonUtils = new CannonUtils();

    scene: THREE.Scene;
    clock: THREE.Clock;
    sphere: THREE.Mesh;
    planet: Planet | null = null;
    arrowHelper: THREE.ArrowHelper | null = null;
    world: CANNON.World | null = null;
    sphereShape: CANNON.Sphere | null = null;
    sphereBody: CANNON.Body | null = null;
    earthBody: CANNON.Body | null = null;
    collider: THREE.Mesh | null = null;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    groundMaterial: CANNON.Material | null = null;
    playerMaterial: CANNON.Material | null = null;

    fwdPressed: boolean | null = null;
    bkdPressed: boolean | null = null;
    rgtPressed: boolean | null = null;
    lftPressed: boolean | null = null;
    spacePressed: boolean | null = null;

    get cameraFunc() { return this.camera; }

    constructor(scene: THREE.Scene, planet: Planet) {
        this.scene = scene;
        this.clock = new THREE.Clock();
        this.planet = planet;

        this.fwdPressed = false;
        this.bkdPressed = false;
        this.rgtPressed = false;
        this.lftPressed = false;
        this.spacePressed = false;

        this.world = new CANNON.World();
        //this.world.gravity.set(0, 0, 0);
        // this.world.broadphase = new CANNON.NaiveBroadphase(); // Use a broadphase algorithm
        // this.world.defaultContactMaterial.friction = 0.4; // Adjust friction
        // this.world.defaultContactMaterial.restitution = 0.5; // Adjust restitution

        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.playerMaterial = new CANNON.Material('playerMaterial')
        const wheelGroundContactMaterial = new CANNON.ContactMaterial(
            this.playerMaterial,
            this.groundMaterial,
            {
                friction: 0.1,
                restitution: 0.5,
                contactEquationStiffness: 1000,
            }
        )
        this.world.addContactMaterial(wheelGroundContactMaterial)

        if (this.planet && this.planet.Mesh) {

            const shape = this.cannonUtils.CreateTrimesh(this.planet.Mesh.geometry)
            this.earthBody = new CANNON.Body({
                mass: 0,
                material: this.groundMaterial,
            })
            this.earthBody.addShape(shape)
            this.earthBody.position.set(this.planet.Mesh.position.x, this.planet.Mesh.position.y, this.planet.Mesh.position.z)
            this.earthBody.quaternion.set(this.planet.Mesh.quaternion.x, this.planet.Mesh.quaternion.y, this.planet.Mesh.quaternion.z, this.planet.Mesh.quaternion.w)
            this.earthBody.collisionResponse = true;

            this.world.addBody(this.earthBody)

            const colliderMaterial = new THREE.MeshBasicMaterial({
                wireframe: true,
                opacity: 0.1,
                transparent: true,
            });
            this.collider = new THREE.Mesh(this.planet.Mesh.geometry, colliderMaterial);
            scene.add(this.collider);
        }

        this.keyDownFunc = this.keyDownFunc.bind(this);
        this.keyUpFunc = this.keyUpFunc.bind(this)
        window.addEventListener('keydown', this.keyDownFunc);
        window.addEventListener('keyup', this.keyUpFunc);
        this.stepFunc = this.stepFunc.bind(this);
        this.world.addEventListener('postStep', this.stepFunc);

        this.earthBody?.addEventListener('collide', (event: any) => {
            console.log('Collision detected with:', event.body);
            console.log('Contact normal:', event.contact);
        });

        this.sphere = this.createSphere();

        let spherePos = this.getSpawnPosition(new THREE.Vector3(20, 20, 0));
        this.sphere.position.set(spherePos.x, spherePos.y, spherePos.z);

        scene.add(this.sphere);

        this.sphereBody = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(1),
            linearDamping: 0.1, // Add damping to reduce sliding
            angularDamping: 0.1, // Add damping to reduce rotation
            material: this.playerMaterial,
        });
        this.sphereBody.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
        this.sphereBody.collisionResponse = true;
        this.sphereBody.allowSleep = false;

        this.world?.addBody(this.sphereBody);
    }

    createSphere() {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 20, 20),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader().load("assets/texture/tempMap.png")
            })
        );
        this.scene.add(sphere);
        const radius = 1;
        sphere.scale.setScalar(radius);
        return sphere;
    }


    walkies() {
        if (this.sphereBody) {
            this.sphereBody.quaternion.setFromVectors(new CANNON.Vec3(0, 1, 0), this.sphereBody.position.clone());

            let facingVec = new THREE.Vector3(1, 0, 0).applyEuler(this.sphere.rotation);
            let sideingVec = new THREE.Vector3(0, 0, 1).applyEuler(this.sphere.rotation);
            let upVec = new THREE.Vector3(0, 1, 0).applyEuler(this.sphere.rotation);

            // this.arrowHelper = new THREE.ArrowHelper( facingVec, this.sphere.position, 5, 0xffff00 );
            // this.scene.add( this.arrowHelper );

            // this.arrowHelper = new THREE.ArrowHelper( sideingVec, this.sphere.position, 5, 0xffff00 );
            // this.scene.add( this.arrowHelper );

            const v = new CANNON.Vec3();

            this.fwdPressed ? v.set(facingVec.x, facingVec.y, facingVec.z).normalize() : null;
            this.bkdPressed ? v.set(-facingVec.x, -facingVec.y, -facingVec.z).normalize() : null;
            this.rgtPressed ? v.set(sideingVec.x, sideingVec.y, sideingVec.z).normalize() : null;
            this.lftPressed ? v.set(-sideingVec.x, -sideingVec.y, -sideingVec.z).normalize() : null;
            this.spacePressed ? v.set(upVec.x, upVec.y, upVec.z).normalize() : null;

            return v;

        }
        //return new THREE.Vector3(0,0,0);
        return new CANNON.Vec3(0, 0, 0);
    }

    // Update physics and animation
    update() {

        //console.log(this.sphereBody?.position);
        const delta = this.clock != null ? this.clock.getDelta() : 0;

        const inside = new THREE.Vector3()
            .subVectors(new THREE.Vector3(), this.sphere.position)
            .normalize()

        // this.arrowHelper = new THREE.ArrowHelper( inside, this.sphere.position, 5, 0x00ff00 );
        // this.scene.add( this.arrowHelper );

        //this.world?.gravity.set(inside.x, inside.y, inside.z).normalize()
        //this.world?.gravity.set(inside.x, inside.y, inside.z); // Set gravity to 9.81 m/s²

        this.world?.step(1 / 60, delta, 5); // Fixed time step with interpolation
        //this.world?.step(delta); // Fixed time step with interpolation

        const movementVector = this.walkies();
        this.sphereBody?.velocity.set(2 * movementVector.x, 2 * movementVector.y, 2 * movementVector.z);

        if (this.sphereBody) {
            this.sphere.position.set(this.sphereBody.position.x, this.sphereBody.position.y, this.sphereBody.position.z)
            this.sphere.quaternion.set(
                this.sphereBody.quaternion.x,
                this.sphereBody.quaternion.y,
                this.sphereBody.quaternion.z,
                this.sphereBody.quaternion.w
            )
        }
    }

    getSpawnPosition(p: THREE.Vector3) {
        const raycaster = new THREE.Raycaster()
        const outside = p.clone();

        const inside = new THREE.Vector3()
            .subVectors(new THREE.Vector3(), outside)
            .normalize()

        raycaster.set(outside, inside);
        let pos = new THREE.Vector3()
        if (this.planet && this.planet.Mesh) {
            const intersects = raycaster.intersectObject(this.planet.Mesh, false)
            if (intersects.length > 0) {
                pos = intersects[0].point.addScaledVector(outside.normalize(), 1.1)
            }
        }
        return pos
    }


    keyDownFunc(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyW': this.fwdPressed = true; break;
            case 'KeyS': this.bkdPressed = true; break;
            case 'KeyD': this.rgtPressed = true; break;
            case 'KeyA': this.lftPressed = true; break;
            case 'Space': this.spacePressed = true; break;
        };
    }

    keyUpFunc(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyW': this.fwdPressed = false; break;
            case 'KeyS': this.bkdPressed = false; break;
            case 'KeyD': this.rgtPressed = false; break;
            case 'KeyA': this.lftPressed = false; break;
            case 'Space': this.spacePressed = false; break;
        }
    }

    stepFunc() {
        const v = new CANNON.Vec3();
        if (this.sphereBody) {
            v.set(-this.sphereBody?.position.x, -this.sphereBody.position.y, -this.sphereBody.position.z).normalize();
            v.scale(9.8, this.sphereBody.force);
            this.sphereBody.applyLocalForce(v, this.sphereBody.position);
        }
    }
}
