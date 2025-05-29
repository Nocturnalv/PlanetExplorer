import * as THREE from 'three';
import { Planet } from "./planet";
import { Settings } from "./settings";
import * as CANNON from 'cannon-es';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import CannonDebugRenderer from "./debugCollision/cannonDebugRenderer";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

export class collisionTest{
	scene: THREE.Scene;
	clock: THREE.Clock;
	sphere: THREE.Mesh;
	planet: Planet | null = null;
	sphereBody: CANNON.Body | null = null;
	planetBody: CANNON.Body | null = null;
	world: CANNON.World | null = null;
	pitchObject: THREE.Object3D | null = null;
	yawObject: THREE.Object3D | null = null;
	textGeo: TextGeometry | null = null;

	//camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera: THREE.PerspectiveCamera;

	groundMaterial: CANNON.Material | null = null;
	playerMaterial: CANNON.Material | null = null;

	// Controls
	fwdPressed: boolean | null = null;
	bkdPressed: boolean | null = null;
	rgtPressed: boolean | null = null;
	lftPressed: boolean | null = null;
	mouse: THREE.Vector2 = new THREE.Vector2(0,0);

	// Debug
	cannonDebugRenderer: CannonDebugRenderer | null = null;
	arrowHelper: THREE.ArrowHelper | null = null;
	collider: THREE.Mesh | null = null;

	//get cameraFunc() { return this.camera; }

	loader: FontLoader = new FontLoader();

	constructor(scene : THREE.Scene, planet : Planet, camera : THREE.PerspectiveCamera) {
		this.scene = scene;
		this.clock = new THREE.Clock();
        this.planet = planet;
		this.camera = camera;

		this.fwdPressed, this.bkdPressed, this.rgtPressed, this.lftPressed;

		this.world = new CANNON.World();                   

        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.playerMaterial = new CANNON.Material('playerMaterial')
        const playerGroundContactMaterial = new CANNON.ContactMaterial(
            this.playerMaterial,
            this.groundMaterial,
            {   friction: 1,
                restitution: 0.5,
                contactEquationStiffness: 1000,
			});

   		this.world.addContactMaterial(playerGroundContactMaterial);

		this.planetBody = this.generatePlanetCollider(this.groundMaterial);
		this.world.addBody(this.planetBody);

		// this.collider = this.generatePlanetColliderDebug();
		// this.scene.add(this.collider);

		this.sphere = this.createSphere();
		this.scene.add(this.sphere);

		this.sphereBody = this.createSphereBody(this.playerMaterial);
		this.world.addBody(this.sphereBody);

		this.keyDownFunc = this.keyDownFunc.bind(this);
		this.keyUpFunc = this.keyUpFunc.bind(this);
		this.stepFunc = this.stepFunc.bind(this);
		this.mouseMoveFunc = this.mouseMoveFunc.bind(this);
		window.addEventListener('keydown', this.keyDownFunc);
		window.addEventListener('keyup', this.keyUpFunc);
		document.addEventListener('mousemove', this.mouseMoveFunc);
		this.world.addEventListener('postStep', this.stepFunc);

		this.planetBody?.addEventListener('collide', (event: any) => {
			// console.log('Collision detected with:', event.body);
			// console.log('Contact normal:', event.contact);
		});

		this.yawObject = new THREE.Object3D();

		//this.cannonDebugRenderer = new CannonDebugRenderer(this.scene, this.world)
	}

	generatePlanetCollider(material: CANNON.Material){
		if (this.planet && this.planet.Mesh) {

			const mergedGeo = BufferGeometryUtils.mergeVertices(this.planet.Mesh.geometry.clone());
			mergedGeo.computeVertexNormals();

			const colliderShape = this.createTrimesh(mergedGeo);
			colliderShape.updateTree();

			const planetBody = new CANNON.Body({
				mass: 0,
				material: material,
			})

			planetBody.addShape(colliderShape)
			planetBody.position.set(this.planet.Mesh.position.x, this.planet.Mesh.position.y, this.planet.Mesh.position.z)
			planetBody.quaternion.set(this.planet.Mesh.quaternion.x, this.planet.Mesh.quaternion.y, this.planet.Mesh.quaternion.z, this.planet.Mesh.quaternion.w)
			planetBody.collisionResponse = true;	
			planetBody.allowSleep = false;
			
			return planetBody;
		}
		return new CANNON.Body();
	}

	generatePlanetColliderDebug(){
		const colliderMaterial = new THREE.MeshBasicMaterial({
			wireframe: true,
			opacity: 0.1,
			transparent: true,
			color: 0xff0000,
		});
		let collider;
		if(this.planet && this.planet.Mesh){
		const merged = BufferGeometryUtils.mergeVertices(this.planet?.Mesh?.geometry.clone());
		merged.computeVertexNormals();
			collider = new THREE.Mesh(merged, colliderMaterial );
		}else{
			collider = new THREE.Mesh(this.planet?.Mesh?.geometry, colliderMaterial );
		}
		return collider;
	}
		
	createSphere() {
		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry( 0.5, 20, 20 ),
			new THREE.MeshBasicMaterial( { 
				wireframe: false,
				color: 0x00ff00,
				transparent: true,
				opacity: 0.5,
		}));
		let spherePos = this.spawnPos(new THREE.Vector3(20, 20, 0));
		sphere.position.set(spherePos.x, spherePos.y, spherePos.z);
		return sphere
	}

	createSphereBody(material: CANNON.Material){
		const sphereBody = new CANNON.Body({
			mass: 1,
			shape: new CANNON.Sphere(0.5),
			linearDamping: 0.2, // reduce sliding
			angularDamping: 0.2, // reduce rotation
			material: material,
		});
		sphereBody.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
		sphereBody.collisionResponse = true;
		sphereBody.allowSleep = false;
		return sphereBody;
	}
	
	movementFunc(){
		if (this.sphereBody && this.yawObject){
			this.sphereBody.quaternion.setFromVectors(new CANNON.Vec3(0,1,0), this.sphereBody.position.clone());

			let facingVec = new THREE.Vector3(0,0,1).applyEuler( this.sphere.rotation );
			let sideingVec = new THREE.Vector3(1,0,0).applyEuler( this.sphere.rotation );
			let upVec = new THREE.Vector3(0,1,0).applyEuler( this.sphere.rotation );

			const gravityUpThree = this.sphere.position.clone().negate().multiplyScalar(-1).normalize(); // from sphere to planet center
			const upThree = new THREE.Vector3(0,1,0);
		
			const threeQuat = new THREE.Quaternion().setFromUnitVectors(upThree, gravityUpThree);
		
			const yaw = new THREE.Quaternion().setFromAxisAngle(
				new THREE.Vector3(gravityUpThree.x, gravityUpThree.y, gravityUpThree.z), 
				this.yawObject.rotation.y
			);
		
			threeQuat.premultiply(yaw);
		
			this.sphereBody.quaternion.set(threeQuat.x, threeQuat.y, threeQuat.z, threeQuat.w);

			const v = new CANNON.Vec3();

			this.fwdPressed? v.vadd(new CANNON.Vec3(-facingVec.x, -facingVec.y, -facingVec.z), v) : null;
			this.bkdPressed? v.vadd(new CANNON.Vec3(facingVec.x, facingVec.y, facingVec.z), v): null;
			this.rgtPressed? v.vadd(new CANNON.Vec3(sideingVec.x, sideingVec.y, sideingVec.z), v): null;
			this.lftPressed? v.vadd(new CANNON.Vec3(-sideingVec.x, -sideingVec.y, -sideingVec.z), v): null;

			// if (this.spacePressed){
			// 	v.vadd(new CANNON.Vec3(upVec.x, upVec.y, upVec.z), v);
			// 	v.scale(2,v);
			// } else{ null;} // jumping messes up collision so no jumping

			return v;
		}
		return new CANNON.Vec3(0,0,0);
	} 

	// Update physics and animation
	update() {
		const delta = this.clock != null? this.clock.getDelta(): 0;

		this.world?.step(1 / 60, delta, 10); // More steps less bugs slower gravity

		const movementVector = this.movementFunc();
		this.sphereBody?.velocity.set(2*movementVector.x, 2*movementVector.y, 2*movementVector.z);

		if (this.sphereBody){
			this.sphere.position.set(this.sphereBody.position.x, this.sphereBody.position.y, this.sphereBody.position.z);
			this.sphere.quaternion.set(this.sphereBody.quaternion.x, this.sphereBody.quaternion.y, this.sphereBody.quaternion.z, this.sphereBody.quaternion.w);
		}

		if(this.cannonDebugRenderer){
			this.cannonDebugRenderer?.update()
		}
	}
	
	spawnPos(p: THREE.Vector3) {
        const raycaster = new THREE.Raycaster()
        const outside = p.clone();
	
        const inside = new THREE.Vector3().subVectors(new THREE.Vector3(), outside).normalize()
			
        raycaster.set(outside, inside);
		let pos = new THREE.Vector3()
		if (this.planet && this.planet.Mesh){
			const intersects = raycaster.intersectObject(this.planet.Mesh, false)
			if (intersects.length > 0) {
				pos = intersects[0].point.addScaledVector(outside.normalize(), 1.5)
			}
		}
        return pos
    }

    keyDownFunc(e : KeyboardEvent){
        switch ( e.code ) {
			case 'KeyW': this.fwdPressed = true; break;
			case 'KeyS': this.bkdPressed = true; break;
			case 'KeyD': this.rgtPressed = true; break;
			case 'KeyA': this.lftPressed = true; break;
		};
    }

    keyUpFunc(e: KeyboardEvent) {
        switch (e.code) {
            case 'KeyW': this.fwdPressed = false; break;
            case 'KeyS': this.bkdPressed = false; break;
            case 'KeyD': this.rgtPressed = false; break;
            case 'KeyA': this.lftPressed = false; break;
        }
    }

	stepFunc(){
		const v = new CANNON.Vec3();
		if (this.sphereBody){
			v.set( -this.sphereBody?.position.x, -this.sphereBody.position.y, -this.sphereBody.position.z ).normalize();
			v.scale(98, this.sphereBody.force);
			this.sphereBody.applyLocalForce(v, this.sphereBody.position);
		}
	}

	mouseMoveFunc(e : any){
		this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		const { movementX, movementY } = e;
		if (this.yawObject){
			this.yawObject.rotation.y -= movementX * 0.003;
		}
	}

	createTrimesh(geometry: THREE.BufferGeometry): CANNON.Trimesh {
		const geo = BufferGeometryUtils.mergeVertices(geometry.clone());
		if (!geo.index) {
			throw new Error("");
		}

		const vertices = [];
		for (let i = 0; i < geo.attributes.position.count; i++) {
			vertices.push(geo.attributes.position.getX(i), geo.attributes.position.getY(i), geo.attributes.position.getZ(i));
		}
		const indices = [];
		for (let i = 0; i < geo.index.count; i++) {
			indices.push(geo.index.getX(i));
		}
		return new CANNON.Trimesh(vertices, indices);
	}  

	disposeAll() {
		if (this.collider) {
			this.scene.remove(this.collider);
			if (this.collider.geometry) this.collider.geometry.dispose();
			if (this.collider.material && 'dispose' in this.collider.material) {
				(this.collider.material as THREE.Material).dispose();
			}
			this.collider = null;
		}
		if (this.planetBody && this.world && this.sphereBody) {
			this.world.removeBody(this.planetBody);
			this.world.removeBody(this.sphereBody);
			this.planetBody = null;
			this.sphereBody = null;
		}
		if (this.sphere ) {
			this.scene.remove(this.sphere);
			this.planet = null;
		}
	}
}
