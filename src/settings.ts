import * as THREE from "three";
import { Pane } from "tweakpane";
import { Planet } from "./planet";

export class Settings {
    Radius: number = 5
    WidthSegments = 256
    HeightSegments = 256
    Seed: number = Math.random()
    TerrainExaggeration: number = 0.1
    SmallHeightColor: THREE.Color = new THREE.Color()
    LargeHeightColor: THREE.Color = new THREE.Color()
    SmallSteepnessColor: THREE.Color = new THREE.Color()
    LargeSteepnessColor: THREE.Color = new THREE.Color()

    Pane: Pane = new Pane({ title: "Planet Configuration" })

    SetupPlanetListeners(planet: Planet): void {
        this.Pane.addBinding(this, "Radius", { label: "Radius", min: 1, max: 10, step: 0.1 })
            .on("change", planet.ChangeMeshRadius.bind(planet))
        this.Pane.addBinding(this, "Seed", { label: "Seed", min: 0.01, max: 1024, step: 0.01 })
            .on("change", planet.UpdateSeed.bind(planet))
        this.Pane.addBinding(this, "TerrainExaggeration", { label: "Terrain Exaggeration", min: 0.01, max: 1, step: 0.01 })
            .on("change", planet.UpdateMesh.bind(planet))
        this.Pane.addBinding(this, "SmallHeightColor", { color: { type: "float" }, label: "Small Height Colour" })
            .on("change", planet.ColorVertices.bind(planet))
        this.Pane.addBinding(this, "LargeHeightColor", { color: { type: "float" }, label: "Large Height Colour" })
            .on("change", planet.ColorVertices.bind(planet))
        this.Pane.addBinding(this, "SmallSteepnessColor", { color: { type: "float" }, label: "Small Steepness Colour" })
            .on("change", planet.ColorVertices.bind(planet))
        this.Pane.addBinding(this, "LargeSteepnessColor", { color: { type: "float" }, label: "Large Steepness Colour" })
            .on("change", planet.ColorVertices.bind(planet))

    }

    constructor() { }
}
