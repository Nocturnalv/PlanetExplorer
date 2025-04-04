import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshBVH, MeshBVHHelper, StaticGeometryGenerator } from 'three-mesh-bvh';

export class collisionTest{

	params = {
		gravity: -9.8,
		physicsSteps: 5,
		// TODO: support steps based on given sphere velocity / radius
		simulationSpeed: 1,
		pause: false,
		step: () => {  // what does this do? runs the physics 5 times?
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
	sphereVelocity = new THREE.Vector3();
	tempSphere = new THREE.Sphere();
	deltaVec = new THREE.Vector3();

	constructor(scene : THREE.Scene){
		this.scene = scene;
		
		this.clock = new THREE.Clock();
		
		new GLTFLoader()
		.load( 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/low-poly-jungle-scene/scene.gltf', res => {

			let environment = res.scene;
			environment.scale.setScalar( 0.05 );

			// collect all geometries to merge
			environment.updateMatrixWorld( true );

			const staticGenerator = new StaticGeometryGenerator( environment );
			staticGenerator.attributes = [ 'position' ];

			const mergedGeometry = staticGenerator.generate();
			mergedGeometry.boundsTree = new MeshBVH( mergedGeometry );

			const colliderMaterial = new THREE.MeshBasicMaterial({
				wireframe: true,
				opacity: 0.5,
				transparent: true,
			});

			this.collider = new THREE.Mesh( mergedGeometry, colliderMaterial );

			this.visualizer = new MeshBVHHelper( this.collider, 10 );
			scene.add( this.visualizer );
			scene.add( this.collider );
			scene.add( environment );
		} );
	
		// was with raycaster, manually set sphere position
		this.sphere = this.createSphere(scene);
		this.sphere.position.set (1,10,1);
		this.sphereVelocity
			.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 )
			.multiplyScalar( 0.5 );
	
		scene.add(this.sphere);
	}
	
	//render();
	
	createSphere(scene: THREE.Scene) {
		const white = new THREE.Color( 0xffffff );
		const color = new THREE.Color( 0x263238 / 2 ).lerp( white, Math.random() * 0.5 + 0.5 );
		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry( 1, 20, 20 ),
			new THREE.MeshBasicMaterial( { color } )
		);
		scene.add( sphere );
	
		const radius = 1;
		sphere.scale.setScalar( radius );
		this.sphereVelocity = new THREE.Vector3( 0, 0, 0 );
	
		return sphere;
	}
	
	updateSphereCollisions( deltaTime: number) {
		if (this.collider != null){
			const bvh = this.collider.geometry.boundsTree; // this is the environment i think?
			const sphereCollider = new THREE.Sphere( this.sphere.position, 1 );
		
			// move the sphere
			this.sphereVelocity.y += this.params.gravity * deltaTime;
			sphereCollider.center.addScaledVector( this.sphereVelocity, deltaTime );
		
			// get the sphere position in world space
			this.tempSphere.copy(new THREE.Sphere( this.sphere.position, 1 ));
		
			let collided = false;
		
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
							// move the sphere position to be outside the triangle
							// Not sure what this means
							const radius = this.tempSphere.radius;
							const depth = distance - radius;
							this.deltaVec.multiplyScalar( 1 / distance );
							this.tempSphere.center.addScaledVector( this.deltaVec, depth );
			
							collided = true;  // i think this is the main one
						}
					},
			
					boundsTraverseOrder: box => {
						return box.distanceToPoint( this.tempSphere.center ) - this.tempSphere.radius;
					},
				} );
			}
			
		
			if ( collided ) {
				// get the delta direction and reflect the velocity across it
				this.deltaVec.subVectors( this.tempSphere.center, sphereCollider.center ).normalize();
				this.sphereVelocity.reflect( this.deltaVec );
		
				// dampen the velocity and apply some drag
				const dot = this.sphereVelocity.dot( this.deltaVec );
				this.sphereVelocity.addScaledVector( this.deltaVec, - dot * 0.5 );
				this.sphereVelocity.multiplyScalar( Math.max( 1.0 - deltaTime, 0 ) );
		
				// update the sphere collider position
				sphereCollider.center.copy( this.tempSphere.center );
			}
		}
			
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
	}
	
	renderBall() {
		//requestAnimationFrame( this.render );
		const delta = this.clock != null? Math.min( this.clock.getDelta(), 0.1 ): 0;
		if ( this.collider ) {
			this.collider.visible = true;
			this.visualizer != null? this.visualizer.visible = true: null;
			if ( ! this.params.pause ) {
				this.update( this.params.simulationSpeed * delta );
			}
		}
	}
}