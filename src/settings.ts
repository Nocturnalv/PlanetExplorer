import * as THREE from "three";
import { Pane, FolderApi } from "tweakpane";
import { Planet } from "./planet";
import { mx_hash_int_3 } from "three/src/nodes/materialx/lib/mx_noise.js";

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
    LightPos: THREE.Vector3 = new THREE.Vector3(6.0, 0.0, 0.0)
    LightColor: THREE.Color = new THREE.Color()
    PlanetEmissivity: THREE.Color = new THREE.Color(0x000000)
    PlanetRoughness: number = 0.65
    PlanetReflectance: THREE.Color = new THREE.Color()

    WidthSegments = 256
    HeightSegments = 256

    Pane: Pane = new Pane({ title: "Planet Configuration" })

    SetupPlanetListeners(planet: Planet): void {
        this.Pane.addBinding(this, "Radius", { label: "Radius", min: 1, max: 10, step: 0.1 })
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
    }

    constructor() { }
}
