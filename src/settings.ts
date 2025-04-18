import * as THREE from "three";
import { Pane, FolderApi } from "tweakpane";
import { Planet } from "./planet";

export class Settings {
    Radius: number = 10
    FlatAColor: THREE.Color = new THREE.Color()
    FlatBColor: THREE.Color = new THREE.Color()
    SteepAColor: THREE.Color = new THREE.Color()
    SteepBColor: THREE.Color = new THREE.Color()
    HeightNoiseSeed: number = 0;
    HeightScale: number = 0.5;
    HeightNoiseScale: number = 10;
    BiomeNoiseSeed: number = 0;
    BiomeNoiseScale: number = 1.0;
    UseColorBanding: boolean = false
    NumberColorBands: number = 10;

    WidthSegments = 256
    HeightSegments = 256

    Pane: Pane = new Pane({ title: "Planet Configuration" })

    SetupPlanetListeners(planet: Planet): void {
        this.Pane.addBinding(this, "Radius", { label: "Radius", min: 1, max: 10, step: 0.1 })
            .on("change", planet.ChangeMeshRadius.bind(planet))
        let planetCols: FolderApi = this.Pane.addFolder({ title: "Planet Colours" }).on("change", planet.UpdateUniforms.bind(planet))
        planetCols.addBinding(this, "FlatAColor", { color: { type: "float" }, label: "Flat Color A" })
        planetCols.addBinding(this, "FlatBColor", { color: { type: "float" }, label: "Flat Color B" })
        planetCols.addBinding(this, "SteepAColor", { color: { type: "float" }, label: "Steep Color A" })
        planetCols.addBinding(this, "SteepBColor", { color: { type: "float" }, label: "Steep Color B" })
        let planetNoise: FolderApi = this.Pane.addFolder({ title: "Planet Noise" }).on("change", planet.UpdateUniforms.bind(planet))
        planetNoise.addBinding(this, "HeightNoiseSeed", { min: -1000000, max: 1000000, step: 1, label: "Height Noise Seed" })
        planetNoise.addBinding(this, "HeightScale", { min: 0, max: 1, step: 0.001, label: "Height Scale" })
        planetNoise.addBinding(this, "HeightNoiseScale", { min: 0, max: 20, step: 0.001, label: "Height Noise Scale" })
        planetNoise.addBinding(this, "BiomeNoiseSeed", { min: -1000000, max: 1000000, step: 1, label: "Biome Noise Seed" })
        planetNoise.addBinding(this, "BiomeNoiseScale", { min: 0.1, max: 5, step: 0.001, label: "Biome Noise Scale" })
        let rendering: FolderApi = this.Pane.addFolder({ title: "Rendering" }).on("change", planet.UpdateUniforms.bind(planet))
        rendering.addBinding(this, "UseColorBanding", { label: "Use Color Banding" })
        rendering.addBinding(this, "NumberColorBands", { min: 1, max: 25, step: 1, label: "Number of Color Bands" })
    }

    constructor() { }
}
