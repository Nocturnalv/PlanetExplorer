import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Settings } from './settings';
import { Planet } from "./planet";

let melonModel: THREE.Object3D | null = null;
let melonLight: THREE.DirectionalLight | null = null;

let settingsRef: Settings | null = null;
let planetRef: Planet | null = null;

const loader = new GLTFLoader();
const clouds: THREE.Object3D[] = [];

export function loadMelon(scene: THREE.Scene, settings: Settings, planet: Planet): void {
  settingsRef = settings;
  planetRef = planet;

  loader.load(
    '/spacemelon.gltf',
    (gltf) => {
      melonModel = gltf.scene;
      melonModel.scale.set(0.5, Math.random() * (1 - 0.2) + 0.2, Math.random() * (1 - 0.2) + 0.2);
      if (settingsRef && settingsRef.Radius) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          const minOffset = 1.05;
          const maxOffset = 1.07;
          const distance = settingsRef.Radius * (minOffset + Math.random() * (maxOffset - minOffset));

          const x = distance * Math.sin(phi) * Math.cos(theta);
          const y = distance * Math.sin(phi) * Math.sin(theta);
          const z = distance * Math.cos(phi);

          melonModel.position.set(x, y, z);

          }
          melonModel.rotation.z = - (Math.PI / 2);
          melonModel.name = 'MELON';

      melonLight = new THREE.DirectionalLight(0xffcc88, 0.6);
      melonLight.castShadow = true;

      const spotLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 3, 0.5);
      spotLight.position.set(5, 5, 5);
      spotLight.target = melonModel;
      scene.add(spotLight);
      scene.add(spotLight.target);

      scene.add(melonLight);
      scene.add(melonLight.target);
      scene.add(melonModel);
    },
    undefined,
    (error) => {
      console.error('Error loading SpaceMelon model:', error);
    }
  );
}

export function spawnCloud(scene: THREE.Scene): void {
  if (!melonModel) {
    console.warn('MELON not loaded yet; cannot spawn cloud.');
    return;
  }

  loader.load(
    '/pinkcloud.gltf',
    (gltf) => {
      const cloud = gltf.scene;

      const scale = 0.2;
      cloud.scale.set(scale, scale, scale);

      const melonPos = melonModel!.position.clone();
      const planetCenter = (planetRef && planetRef.Mesh)
        ? planetRef.Mesh.position
        : new THREE.Vector3(0, 0, 0);

      const direction = melonPos.clone().sub(planetCenter).normalize();
      const cloudOffsetDistance = 2;
      const cloudPosition = melonPos.clone().add(direction.multiplyScalar(cloudOffsetDistance));

      cloud.position.copy(cloudPosition);
      cloud.lookAt(cloud.position.clone().add(direction)); 
      cloud.rotateX(Math.PI / 2); 
      cloud.rotateY(Math.PI / 2);     

      clouds.push(cloud);
      scene.add(cloud);

     cloud.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const matArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          matArray.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.transparent = true;
              mat.opacity = 0;
            }
          });
        }
      });

      clouds.push(cloud);
      scene.add(cloud);

      const fadeDuration = 1000;
      const fadeStart = performance.now();

      const animateOpacity = (time: number) => {
        const elapsed = time - fadeStart;
        const t = Math.min(elapsed / fadeDuration, 1);

        cloud.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const matArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            matArray.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.opacity = t;
              }
            });
          }
        });

        if (t < 1) requestAnimationFrame(animateOpacity);
      };
      requestAnimationFrame(animateOpacity);

      setTimeout(() => {
        scene.remove(cloud);
        const index = clouds.indexOf(cloud);
        if (index !== -1) clouds.splice(index, 1);

        cloud.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            const matArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            matArray.forEach(mat => mat.dispose());
          }
        });
      }, 10000);
    },
    undefined,
    (err) => console.error('Error loading cloud model:', err)
  );
}

export function updateMelon(): void {
  if (!settingsRef || !melonModel || !melonModel.parent) return; // <- parent check is crucial
  melonModel.position.copy(settingsRef.MelonPosition);

  if (melonLight) {
    melonLight.position.set(
      melonModel.position.x + 5,
      melonModel.position.y + 5,
      melonModel.position.z + 5
    );
    melonLight.target.position.copy(melonModel.position);
    melonLight.target.updateMatrixWorld();
  }
}

export function disposeMelon(scene: THREE.Scene): void {
  if (melonModel != null) {
    scene.remove(melonModel);
    melonModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    melonModel = null;
  }

  if (melonLight != null) {
    scene.remove(melonLight);
    melonLight.dispose();
    melonLight = null;
  }
}

export function disposeClouds(scene: THREE.Scene): void {
  for (const cloud of clouds) {
    scene.remove(cloud);

    cloud.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
        console.log("Melon model disposed");
      }
    });
  }

  clouds.length = 0;
}