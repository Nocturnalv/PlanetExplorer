import * as THREE from 'three';
import { Planet } from "./planet";
import { Settings } from "./settings";


export class stars{
	scene: THREE.Scene;
	starCount: number = 300; // add this to params somehow?
	moonCount: number = 50; // add this to params somehow?
	stars: THREE.Mesh[] = [];

	constructor(scene : THREE.Scene) {
		this.scene = scene;
		this.generateStars();
	}

	generateStars(){
		let numStars = 0;
		while (numStars < this.starCount) {
			const x = Math.random() * 200 - 100;
			const y = Math.random() * 200 - 100;
			const z = Math.random() * 200 - 100;
			const distance = Math.sqrt(x * x + y * y + z * z);
			if (distance > 25) {
				this.generateStar(x, y, z);
				numStars++;
			}
		}
	}

	generateMoons(){
		let numMoons = 0;
		const moonSize = Math.random() * 50 + 10;
		while (numMoons < this.moonCount) {
			const x = Math.random() * 200 - 100;
			const y = Math.random() * 200 - 100;
			const z = Math.random() * 200 - 100;
			const distance = Math.sqrt(x * x + y * y + z * z);
			if (distance > 25) {
				this.generateMoon(x, y, z, moonSize);
				numMoons++;
			}
		}
	}

	generateStar(x : number, y: number, z: number){
		const starGeometry = new THREE.SphereGeometry(0.1, 32, 32);
		const starMaterial = new THREE.MeshStandardMaterial({ 
			color: 0xff0000,
			emissive: 0xffffff,
			emissiveIntensity: 1
		});
		const star = new THREE.Mesh(starGeometry, starMaterial);
		star.position.set(x, y, z);
		this.scene.add(star);
		this.stars.push(star);
	}

	generateMoon(x : number, y: number, z: number, moonSize: number){
		const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
		const moonMaterial = new THREE.MeshStandardMaterial({ 
			color: 0xffffff,
			//color: new THREE.Color('hsl(0,100%,100%)'), // randomize
			//normalMap: new THREE.TextureLoader().load('path/to/normal-map.png'),
		});
		const moon = new THREE.Mesh(moonGeometry, moonMaterial);
		moon.position.set(x, y, z);
		this.scene.add(moon);
	}

	disposeStars() {
        for (const star of this.stars) {
            this.scene.remove(star);
            if (star.geometry) star.geometry.dispose();
            if (star.material) {
                (star.material as THREE.Material).dispose();
            }
        }
        this.stars = [];
    }
}