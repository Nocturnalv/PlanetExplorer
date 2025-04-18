import * as THREE from 'three';
import { MeshBVH, MeshBVHHelper, StaticGeometryGenerator } from 'three-mesh-bvh';
import { Planet } from "./planet";
import { Settings } from "./settings";
import * as CANNON from 'cannon-es';
//import * as controls from "./helper.ts"

export class collisionTest{

	params = {
		gravity: -9.8,
		physicsSteps: 6,
		simulationSpeed: 1,
		pause: false,
		step: () => {
			const steps = this.params.physicsSteps;
			for ( let i = 0; i < steps; i ++ ) {
				this.update( 0.016 / steps );
			}
		},
	};

	scene: THREE.Scene;
	clock: THREE.Clock;
	collider: THREE.Mesh | null = null;
	visualizer: MeshBVHHelper | null = null;
	sphere: THREE.Mesh;
	planet: Planet | null = null;
	sphereVelocity = new THREE.Vector3();
	gravityVelocity = new THREE.Vector3();
	movementVelocity = new THREE.Vector3();
	tempSphere = new THREE.Sphere();
	deltaVec = new THREE.Vector3();
	settings: Settings = new Settings();
	arrowHelper: THREE.ArrowHelper | null = null;
	onSurface: boolean = false;

	world: CANNON.World | null = null;
	sphereShape: CANNON.Sphere | null = null;
	sphereBody: CANNON.Body | null = null;

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	// //sphere2: THREE.Mesh;
	// sphereShape2: CANNON.Sphere | null = null;
	// sphereBody2: CANNON.Body | null = null;


	fwdPressed: boolean | null = null;
    bkdPressed: boolean | null = null;
    rgtPressed: boolean | null = null;
    lftPressed: boolean | null = null;
    spacePressed: boolean | null = null;

	get cameraFunc() { return this.camera; }

	constructor(scene : THREE.Scene, planet : Planet) {
		this.scene = scene;
		this.clock = new THREE.Clock();
        this.planet = planet;

		this.fwdPressed = false;
		this.bkdPressed = false;
		this.rgtPressed = false;
		this.lftPressed = false;
		this.spacePressed = false;

		//this.world = new CANNON.World();
		//this.world.gravity.set(0, -1, 0);

		if (this.planet && this.planet.Mesh) {

			this.planet.Mesh.updateMatrixWorld(true);
			const staticGenerator = new StaticGeometryGenerator( this.planet.Mesh );
			staticGenerator.attributes = [ 'position' ];

			const mergedGeometry = staticGenerator.generate();
			mergedGeometry.boundsTree = new MeshBVH( mergedGeometry );

			this.planet.Mesh.geometry.boundsTree = new MeshBVH( this.planet.Mesh.geometry );

			const colliderMaterial = new THREE.MeshBasicMaterial({
				wireframe: true,
				opacity: 0,
				transparent: true,
			});

			this.collider = new THREE.Mesh( this.planet.Mesh.geometry, colliderMaterial );
			this.collider = new THREE.Mesh( mergedGeometry, colliderMaterial );

			this.visualizer = new MeshBVHHelper( this.collider, 10 );
			scene.add( this.visualizer );
			scene.add( this.collider );
		}

		this.keyDownFunc = this.keyDownFunc.bind(this);
		this.keyUpFunc = this.keyUpFunc.bind(this)
		window.addEventListener('keydown', this.keyDownFunc);
		window.addEventListener('keyup', this.keyUpFunc);

		this.sphere = this.createSphere(scene);
		this.sphere.position.set (30,30,0);
		scene.add(this.sphere);

		// this.camera.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
		// this.camera.lookAt(new THREE.Vector3(1,0,0).applyEuler( this.sphere.rotation ));
	

		// this.sphere2 = this.createSphere(scene);
		// this.sphere2.position.set (-10,-9,0);
		// scene.add(this.sphere2);
		// this.sphereShape = new CANNON.Sphere(1);
		// this.sphereBody = new CANNON.Body({mass:1});
		// this.sphereBody.addShape(this.sphereShape);
		// this.sphereBody.position.set( this.sphere.position.x, this.sphere.position.y, this.sphere.position.z );
		// this.world?.addBody(this.sphereBody);
		// this.sphereShape2 = new CANNON.Sphere(1);
		// this.sphereBody2 = new CANNON.Body({mass:1});
		// this.sphereBody2.addShape(this.sphereShape2);
		// this.sphereBody2.position.set( this.sphere2.position.x, this.sphere2.position.y, this.sphere2.position.z );
		// this.world?.addBody(this.sphereBody2);
	}
		
	createSphere(scene: THREE.Scene) {
		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry( 1, 20, 20 ),
			new THREE.MeshBasicMaterial( { 
				map: new THREE.TextureLoader().load("texture/tempMap.png") } )
		);
		scene.add( sphere );
	
		const radius = 1;
		sphere.scale.setScalar( radius );
		this.sphereVelocity = new THREE.Vector3( 0, 0, 0 );

		return sphere;		
	}
	
	updateSphereCollisions( deltaTime: number) {
		if (this.collider != null){
			const bvh = this.collider.geometry.boundsTree;
			const sphereCollider = new THREE.Sphere( this.sphere.position, 1 );

			let maximumDistance = Math.max( Math.abs(this.sphere.position.x), Math.abs(this.sphere.position.y), Math.abs(this.sphere.position.z ));
			let gravityVec = new THREE.Vector3( (0 - this.sphere.position.x)/maximumDistance, (0 - this.sphere.position.y)/maximumDistance, (0 - this.sphere.position.z)/maximumDistance );
			
			this.gravityVelocity.addScaledVector( gravityVec, 1);

			this.sphereVecFunc()
				
			sphereCollider.center.addScaledVector( this.sphereVelocity, deltaTime );
		
			this.tempSphere.copy(sphereCollider);
				
			this.sphere.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), this.sphere.position.clone().normalize());

			let collided = false;
			this.onSurface = false;
		
			if (bvh != null ){
				bvh.shapecast( {
					intersectsBounds: box => {
						return box.intersectsSphere( this.tempSphere );
					},
			
					intersectsTriangle: tri => {
						// get delta between closest point and center
						tri.closestPointToPoint( this.tempSphere.center, this.deltaVec );
						this.deltaVec.sub( this.tempSphere.center ); 			// subtract the centre of the sphere from the delta vector
						const distance = this.deltaVec.length(); 		// the distance is the length of delta vector
						if ( distance < this.tempSphere.radius ) {		// If the distance is less than the radius (so if its intersecting?)
							// move the sphere position to be outside the triangle - Not sure what this means
							const radius = this.tempSphere.radius;
							const depth = distance - radius;
							
							this.deltaVec.multiplyScalar( 1 / distance );
							this.tempSphere.center.addScaledVector( this.deltaVec, depth );
							collided = true;
							this.onSurface = true;

							this.gravityVelocity.set(0,0,0);
							this.sphereVecFunc();
						}
						// if (distance < 1.2 * this.tempSphere.radius) {
						// 	this.onSurface = true;
						// }
					},
			
					boundsTraverseOrder: box => {
						return box.distanceToPoint( this.tempSphere.center ) - this.tempSphere.radius;
					},
				} );
			}
			
			if ( collided ) {
				// // get the delta direction and reflect the velocity across it
				// this.deltaVec.subVectors( this.roundVec(this.tempSphere.center), this.roundVec(sphereCollider.center) ).normalize();
				// this.sphereVelocity.reflect( this.roundVec(this.deltaVec) );
				// // dampen the velocity and apply some drag
				// const dot = this.sphereVelocity.dot( this.deltaVec );
				// this.sphereVelocity.addScaledVector( this.deltaVec, - dot * 1 );
				// this.sphereVelocity.multiplyScalar( Math.max( 1.0 - deltaTime, 0 ) );
			
				sphereCollider.center.copy( this.tempSphere.center );

				const surfaceNormal = new THREE.Vector3().subVectors(this.sphere.position, new THREE.Vector3(0,0,0)).normalize();
				this.sphere.position.copy(surfaceNormal).multiplyScalar( 5 + this.tempSphere.radius );

			}
		}
	}

	walkies(){
		let facingVec = new THREE.Vector3(1,0,0).applyEuler( this.sphere.rotation );
		let sideingVec = new THREE.Vector3(0,0,1).applyEuler( this.sphere.rotation );

		this.arrowHelper = new THREE.ArrowHelper( this.sphereVelocity, this.sphere.position, 1, 0x0000ff );
		this.scene.add( this.arrowHelper );

		let faceVec = new THREE.Vector3().subVectors(this.sphere.position, facingVec);

		let sideVec = new THREE.Vector3().subVectors(this.sphere.position, sideingVec);;

		//console.log(this.fwdPressed)
		if (this.onSurface){
			if (this.fwdPressed || this.bkdPressed || this.rgtPressed || this.lftPressed){
				this.fwdPressed? this.movementVelocity.set(-0.5*faceVec.x, -0.5*faceVec.y, -0.5*faceVec.z): null;
				this.bkdPressed? this.movementVelocity.set(0.5*faceVec.x, 0.5*faceVec.y, 0.5*faceVec.z): null;
				this.rgtPressed? this.movementVelocity.set(-0.5*sideVec.x, -0.5*sideVec.y, -0.5*sideVec.z): null;
				this.lftPressed? this.movementVelocity.set(0.5*sideVec.x, 0.5*sideVec.y, 0.5*sideVec.z): null;
			}else{
				this.movementVelocity.set(0,0,0);
			}
			if (this.spacePressed){
				let maximumDistance = Math.max( Math.abs(this.sphere.position.x), Math.abs(this.sphere.position.y), Math.abs(this.sphere.position.z ));
				let gravityVec = new THREE.Vector3( (0 - this.sphere.position.x)/maximumDistance, (0 - this.sphere.position.y)/maximumDistance, (0 - this.sphere.position.z)/maximumDistance );
				this.movementVelocity.addScaledVector( gravityVec, -10 );
			}
		}else{
			this.movementVelocity.set(0,0,0); 
		}
	} 

	sphereVecFunc(){
		this.sphereVelocity.set(0,0,0);
		//if (this.gravityVelocity )
		this.sphereVelocity.addScaledVector( this.gravityVelocity, 1 );
		this.sphereVelocity.addScaledVector( this.movementVelocity, 1 );
	}

	// Update physics and animation
	update( delta : number ) {
		if ( this.collider ) {
			const steps = this.params.physicsSteps;
			for ( let i = 0; i < steps; i ++ ) {
				this.updateSphereCollisions( delta / steps);
			}
			this.sphere.position.addScaledVector( this.sphereVelocity, delta );
		}
		this.walkies();

		// this.camera.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
		// //this.camera.lookAt(new THREE.Vector3(1,0,0).applyEuler( this.sphere.rotation ));
		// this.camera.lookAt(this.sphereVelocity);
	


		// this.world?.step( delta );	

		// if (this.sphereBody){

		// 	const v = new CANNON.Vec3();
		// 	v.set( -this.sphereBody.position.x, -this.sphereBody.position.y, -this.sphereBody.position.z ).normalize();
		// 	v.scale(9.8, this.sphereBody.force);ww
		// 	this.sphereBody.applyLocalForce(v, this.sphereBody.position);
		// 	this.sphereBody.force.y += this.sphereBody.mass;

		// 	this.sphere.position.set(this.sphereBody.position.x, this.sphereBody.position.y, this.sphereBody.position.z)
		// 	this.sphere.quaternion.set(
		// 		this.sphereBody.quaternion.x,
		// 		this.sphereBody.quaternion.y,
		// 		this.sphereBody.quaternion.z,
		// 		this.sphereBody.quaternion.w
		// 	)
		// }

		// if (this.sphereBody2){

		// 	const v = new CANNON.Vec3();
		// 	v.set( -this.sphereBody2.position.x, -this.sphereBody2.position.y, -this.sphereBody2.position.z ).normalize();
		// 	v.scale(9.8, this.sphereBody2.force);
		// 	this.sphereBody2.applyLocalForce(v, this.sphereBody2.position);
		// 	this.sphereBody2.force.y += this.sphereBody2.mass;

		// 	this.sphere2.position.set(this.sphereBody2.position.x, this.sphereBody2.position.y, this.sphereBody2.position.z)
		// 	this.sphere2.quaternion.set(
		// 		this.sphereBody2.quaternion.x,
		// 		this.sphereBody2.quaternion.y,
		// 		this.sphereBody2.quaternion.z,
		// 		this.sphereBody2.quaternion.w
		// 	)
		// }
	}
	
	renderBall() {
		const delta = this.clock != null? this.clock.getDelta(): 0;
		if ( this.collider ) {
			//this.collider.visible = true;
			//this.visualizer != null? this.visualizer.visible = true: null;
			if ( ! this.params.pause ) {
				this.update( this.params.simulationSpeed * delta );
			}
		}
	}

    keyDownFunc(e : KeyboardEvent){
		console.log("fired");
        switch ( e.code ) {
			case 'KeyW': this.fwdPressed = true; break;
			case 'KeyS': this.bkdPressed = true; break;
			case 'KeyD': this.rgtPressed = true; break;
			case 'KeyA': this.lftPressed = true; break;
			case 'Space': this.spacePressed = true; break;
		};
		console.log(this.fwdPressed);
    }

    keyUpFunc(e : KeyboardEvent){
		console.log("unfired");
        switch ( e.code ) {
            case 'KeyW': this.fwdPressed = false; break;
            case 'KeyS': this.bkdPressed = false; break;
            case 'KeyD': this.rgtPressed = false; break;
            case 'KeyA': this.lftPressed = false; break;
            case 'Space': this.spacePressed = false; break;
        }
    }
}