import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Settings } from './settings';

let tardisModel: THREE.Object3D | null = null;
let tardisLight: THREE.DirectionalLight | null = null;
let settingsRef: Settings | null = null;

export function loadTardis(scene: THREE.Scene, settings: Settings): void {
  settingsRef = settings; // Store the settings reference

  const loader = new GLTFLoader();

  loader.load(
    '/tardis.gltf',
    (gltf) => {
      tardisModel = gltf.scene;
      tardisModel.scale.set(0.2, 0.2, 0.2);
      tardisModel.position.copy(settings.TardisPosition);
      tardisModel.rotation.y = Math.PI / 4;

      // Create the directional light
      tardisLight = new THREE.DirectionalLight(0xffffff, 0.7);
      tardisLight.castShadow = true;

      scene.add(tardisLight);
      scene.add(tardisLight.target);
      scene.add(tardisModel);
    },
    undefined,
    (error) => {
      console.error('Error loading TARDIS model:', error);
    }
  );
}

export function updateTardis(): void {
  if (!settingsRef) return; 

  if (tardisModel) {

    tardisModel.position.copy(settingsRef.TardisPosition);
    tardisModel.rotation.y += 0.002;
  }

  if (tardisLight && tardisModel && settingsRef) {
    
    tardisLight.position.copy(settingsRef.LightPos);
    tardisModel.position.copy(settingsRef.TardisPosition);
    
    tardisLight.target.position.copy(tardisModel.position);
    tardisLight.target.updateMatrixWorld();
  }
}
