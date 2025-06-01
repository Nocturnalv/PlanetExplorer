import * as THREE from "three";
import { Pane, FolderApi, BladeApi } from "tweakpane";
import { Planet } from "./planet";
import { Sun } from "./sun";
import { seededRandom } from "three/src/math/MathUtils.js";

function getRandomArbitrary(min : number, max : number) {
  return Math.random() * (max - min) + min;
}

function randomPolarity() {
    let num = Math.random()
    if (num <= 0.5) {
        return -1
    } else {
        return 1
    }
}

export class Settings {
    Radius: number = 5
    FlatAColor: THREE.Color = new THREE.Color(Math.random(), Math.random(), Math.random())
    FlatBColor: THREE.Color = new THREE.Color(Math.random(), Math.random(), Math.random())
    SteepAColor: THREE.Color = new THREE.Color(Math.random(), Math.random(), Math.random())
    SteepBColor: THREE.Color = new THREE.Color(Math.random(), Math.random(), Math.random())
    HeightNoiseSeed: number = 0
    HeightScale: number = 0.05
    HeightNoiseScale: number = 1.0
    HeightNoiseOctaves: number = 3
    HeightNoiseEffectFalloff: number = 0.5
    BiomeNoiseSeed: number = 0
    BiomeNoiseScale: number = 0.6
    UseColorBanding: boolean = false
    NumberColorBands: number = 10
    CameraPos: THREE.Vector3 = new THREE.Vector3()
    LightPos: THREE.Vector3 = new THREE.Vector3(15.0, 0.0, 0.0)
    LightColor: THREE.Color = new THREE.Color()
    LightSound: THREE.PositionalAudio | null = null;
    PlanetEmissivity: THREE.Color = new THREE.Color(0x000000)
    PlanetRoughness: number = 0.65
    PlanetReflectance: THREE.Color = new THREE.Color()
    PlanetSound: THREE.PositionalAudio | null = null;
    TardisPosition: THREE.Vector3 = new THREE.Vector3(7, 0, 0);
    TardisSound: THREE.PositionalAudio | null = null;
    MelonPosition: THREE.Vector3 = new THREE.Vector3(10, 0, 3);
    SunColor: THREE.Color = new THREE.Color(Math.random(), Math.random(), Math.random())
    SunRadius: number = 500
    SunPosition: THREE.Vector3= new THREE.Vector3(30000.0, 0, 0)
    SunZoom: number = 2
    SunSpeed: number = 0.05
    ToneMapFactor: number = 1
    ToneMapMin: number = 0.05
    ToneMapMax: number = 0.8
    RayleighFactor: number = 1
    RayleighMin: number = 0
    RayleighMax: number = 0.8
    SunFolder: FolderApi | null = null
    SoundOn: boolean = false

    WidthSegments = 256
    HeightSegments = 256

    Pane: Pane = new Pane({ title: "Planet Explorer Configuration" })
    PlanetBindings: BladeApi[] = []

    SetupPlanetListeners(planet: Planet): void {
        for (var api of this.PlanetBindings)
            this.Pane.remove(api)
        this.PlanetBindings = []
        let radius = this.Pane.addBinding(this, "Radius", { label: "Radius", min: 1, max: 10, step: 0.1 })
            .on("change", planet.UpdateUniforms.bind(planet))
        let planetCols: FolderApi = this.Pane.addFolder({ title: "Planet Colours" }).on("change", planet.UpdateUniforms.bind(planet))
        planetCols.addBinding(this, "FlatAColor", { color: { type: "float" }, label: "Flat Color A" })
        planetCols.addBinding(this, "FlatBColor", { color: { type: "float" }, label: "Flat Color B" })
        planetCols.addBinding(this, "SteepAColor", { color: { type: "float" }, label: "Steep Color A" })
        planetCols.addBinding(this, "SteepBColor", { color: { type: "float" }, label: "Steep Color B" })
        let planetNoise: FolderApi = this.Pane.addFolder({ title: "Planet Noise" }).on("change", planet.UpdateUniforms.bind(planet))
        planetNoise.addBinding(this, "HeightNoiseSeed", { min: -1000000, max: 1000000, step: 1, label: "Height Noise Seed" })
        planetNoise.addBinding(this, "HeightScale", { min: 0, max: 1, step: 0.001, label: "Height Scale" })
        planetNoise.addBinding(this, "HeightNoiseOctaves", { min: 0, max: 10, step: 1 }).on("change", _ => { planet.GenerateOctaves.bind(planet); planet.RegenerateMesh.bind(planet) })
        planetNoise.addBinding(this, "HeightNoiseEffectFalloff", { min: 0.0, max: 2.0, step: 0.001 }).on("change", planet.RegenerateMesh.bind(planet))
        planetNoise.addBinding(this, "HeightNoiseScale", { min: 0.001, max: 2.0, step: 0.001, label: "Height Noise Scale" })
        planetNoise.addBinding(this, "BiomeNoiseSeed", { min: -1000000, max: 1000000, step: 1, label: "Biome Noise Seed" })
        planetNoise.addBinding(this, "BiomeNoiseScale", { min: 0.1, max: 5, step: 0.001, label: "Biome Noise Scale" })
        let rendering: FolderApi = this.Pane.addFolder({ title: "Rendering" }).on("change", planet.UpdateUniforms.bind(planet))
        rendering.addBinding(this, "UseColorBanding", { label: "Use Color Banding" })
        rendering.addBinding(this, "NumberColorBands", { min: 1, max: 25, step: 1, label: "Number of Color Bands" })
        rendering.addBinding(this, "LightPos", { label: "Light Position" })
        rendering.addBinding(this, "LightColor", { color: { type: "float" }, label: "Light Color" })
        rendering.addBinding(this, "PlanetEmissivity", { color: { type: "float" }, label: "Planet Emissivity" })
        rendering.addBinding(this, "PlanetRoughness", { min: 0.0, max: 1.0, step: 0.01, label: "Planet Roughness" })
        rendering.addBinding(this, "PlanetReflectance", { color: { type: "float" }, label: "Planet Reflectance" })
        rendering.addBinding(this, "TardisPosition", { label: "TARDIS Position" });
        rendering.addBinding(this, "MelonPosition", { label: "Melon Position" });
        let sound: FolderApi = this.Pane.addFolder({ title: "Sound" }).on("change", planet.UpdateUniforms.bind(planet))
        let soundButton = sound.addButton({title:"Toggle Sound"});
        this.PlanetBindings = [radius, planetCols, planetNoise, rendering, sound]

        //Set up "Play Sound" button
        soundButton.on("click", ()=>{
            if (this.SoundOn) {
                this.LightSound?.pause();
                this.PlanetSound?.pause();
                this.TardisSound?.pause();    
                this.SoundOn = false;            
            } else {
                this.LightSound?.play();
                this.PlanetSound?.play();
                this.TardisSound?.play();
                this.SoundOn = true;            
            }
        })
    }

    SetupSunListeners(sun: Sun) {
        if (this.SunFolder != null) {
            this.SunFolder.dispose();
        }
        this.SunFolder = this.Pane.addFolder({title: "Sun"})
        this.SunFolder.addBinding(this, 'SunColor', {color: { type: "float" }, label: "Sun Colour"}).on("change", sun.UpdateMesh.bind(sun));
        this.SunFolder.addBinding(this, 'SunZoom', {min: 0.0,  step: 0.1, label: "Sun Shader Zoom"}).on("change", sun.UpdateMesh.bind(sun));
        this.SunFolder.addBinding(this, 'SunSpeed', {min: 0.0,  step: 0.01, label: "Sun Shader Speed"}).on("change", sun.UpdateMesh.bind(sun));
        this.SunFolder.addBinding(this, 'SunRadius', {min: 0.0,  step: 0.5, label: "Sun Radius"}).on("change", sun.UpdateMesh.bind(sun));
        this.SunFolder.addBinding(this, 'SunPosition', {label: "Sun Position"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'ToneMapFactor', {min: 0.0, step: 0.1, label: "ToneMap Factor"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'ToneMapMin', {min: 0.0, max: 1, label: "ToneMap Minimum"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'ToneMapMax', {min: 0.0, max: 1, label: "ToneMap Maximum"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'RayleighFactor', {min: 0.0, step: 0.1, label: "Rayleigh Factor"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'RayleighMin', {min: 0.0, max: 1, label: "Rayleigh Minimum"}).on("change", sun.UpdatePosition.bind(sun));
        this.SunFolder.addBinding(this, 'RayleighMax', {min: 0.0, max: 1, label: "Rayleigh Maximum"}).on("change", sun.UpdatePosition.bind(sun));
    }

    Randomise(seed: number) {
        this.Radius = 5.0 + 2.0 * (seededRandom(seed) * 2.0 - 1.0)
        seed += 1
        this.FlatAColor = new THREE.Color(seededRandom(seed), seededRandom(seed + 1), seededRandom(seed + 2))
        seed += 3
        this.FlatBColor = new THREE.Color(seededRandom(seed), seededRandom(seed + 1), seededRandom(seed + 2))
        seed += 3
        this.SteepAColor = new THREE.Color(seededRandom(seed), seededRandom(seed + 1), seededRandom(seed + 2))
        seed += 3
        this.SteepBColor = new THREE.Color(seededRandom(seed), seededRandom(seed + 1), seededRandom(seed + 2))
        seed += 3
        this.HeightNoiseSeed = seededRandom(seed) * Number.MAX_SAFE_INTEGER
        seed += 1
        this.HeightScale = 0.05 + 0.025 * (seededRandom(seed) * 2.0 - 1.0)
        seed += 1
        this.HeightNoiseScale = 1.0 + 0.5 * (seededRandom(seed) * 2.0 - 1.0)
        seed += 1
        this.BiomeNoiseSeed = this.HeightNoiseSeed = seededRandom(seed) * Number.MAX_SAFE_INTEGER
        seed += 1
        this.SunColor = new THREE.Color(Math.random(), Math.random(), Math.random())
        // TODO: BiomeNoiseScale: number = 0.6
    }

    constructor() { }
}
