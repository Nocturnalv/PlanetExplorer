import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Settings } from './settings';
import { Planet } from "./planet";


let tardisModel: THREE.Object3D | null = null;
let tardisLight: THREE.DirectionalLight | null = null;
let settingsRef: Settings | null = null;
let planetRef: Planet | null = null;

export function loadTardis(scene: THREE.Scene, settings: Settings, listener: THREE.AudioListener, planet: Planet): void {
    settingsRef = settings; 
    planetRef = planet;

    const loader = new GLTFLoader();


    loader.load(
        '/tardis.gltf',
        (gltf) => {
            tardisModel = gltf.scene;
            tardisModel.scale.set(0.2, 0.2, 0.2);
            if (settingsRef && settingsRef.Radius) {
                tardisModel.position.copy(new THREE.Vector3(1.1 * settingsRef?.Radius, 0, 0));
            }
            tardisModel.rotation.z = - (Math.PI / 2);
            tardisModel.name = 'TARDIS';

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

    //Adds the sound to the tardis

    settingsRef.TardisSound = new THREE.PositionalAudio(listener);

    const audioLoader = new THREE.AudioLoader()
    audioLoader.load('sound/ambientTardis.ogg', (buffer) => {
        settingsRef?.TardisSound?.setBuffer(buffer);
        settingsRef?.TardisSound?.setLoop(true);
        settingsRef?.TardisSound?.setVolume(1);
        settingsRef?.TardisSound?.setRolloffFactor(3);
    });

    tardisModel?.add(settingsRef.TardisSound);
}

export function playTardisSound(): void {
    settingsRef?.TardisSound?.play();
}

export function updateTardis(): void {
    if (!settingsRef) return;

    if (tardisModel) {
        tardisModel.rotation.x += 0.002;
    }

    if (tardisLight && tardisModel && settingsRef) {

        tardisLight.position.copy(settingsRef.LightPos);
        tardisLight.target.position.copy(tardisModel.position);
        tardisLight.target.updateMatrixWorld();
    }

}

export function disposeTardis(scene: THREE.Scene): void {
    if (tardisLight != null) {
        scene.remove(tardisLight)
        tardisLight.dispose()
    }
    if (tardisModel != null) {
        scene.remove(tardisModel);
        if (tardisModel.geometry) tardisModel.geometry.dispose();
        if (tardisModel.material) {
            (tardisModel.material as THREE.Material).dispose();
        }
    }
}