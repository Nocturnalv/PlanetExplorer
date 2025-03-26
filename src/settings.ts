import * as THREE from "three";
import { Pane } from "tweakpane";
import { Planet } from "./planet";

export class Settings {
    Radius: number = 5
    WidthSegments = 256
    HeightSegments = 256
    Seed: number = Math.random()
    TerrainExaggeration: number = 0.1
    ColorA: THREE.Color = new THREE.Color(0x42a426)
    ColorB: THREE.Color = new THREE.Color(0x6a52b6)

    Pane: Pane = new Pane({ title: "Planet Configuration" })

    SetupPlanetListeners(planet: Planet): void {
        this.Pane.addBinding(this, "Radius", { label: "Radius", min: 1, max: 10, step: 0.1 })
            .on("change", planet.ChangeMeshRadius.bind(planet))
        this.Pane.addBinding(this, "Seed", { label: "Seed", min: 0.01, max: 1024, step: 0.01 })
            .on("change", planet.UpdateSeed.bind(planet))
        this.Pane.addBinding(this, "TerrainExaggeration", { label: "Terrain Exaggeration", min: 0.01, max: 1, step: 0.01 })
            .on("change", planet.UpdateMesh.bind(planet))
        this.Pane.addBinding(this, "ColorA", { color: { type: "float" }, label: "Colour A" })
            .on("change", planet.ColorVertices.bind(planet))
        this.Pane.addBinding(this, "ColorB", { color: { type: "float" }, label: "Colour B" })
            .on("change", planet.ColorVertices.bind(planet))
    }

    constructor() { }
}
