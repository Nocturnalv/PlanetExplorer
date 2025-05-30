import * as THREE from 'three';

let wormholeMaterial: THREE.ShaderMaterial;

export function createWormhole(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.2, 8, 10, 64, 1, true);
    geometry.rotateX(Math.PI / 2); // Lay flat along Z
    geometry.rotateY(Math.PI);     // Flip 180°

    wormholeMaterial = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
            u_time: { value: 0 },
            // base color unused here since gradient is computed in shader
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float u_time;

            // Helper function to convert HSV to RGB
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1., 2./3., 1./3., 3.);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
            }

            void main() {
                // Animate hue over time
                float hueStart = mod(u_time * 0.1, 1.0);           // hue cycles every 10 seconds
                float hueEnd = mod(hueStart + 0.5, 1.0);           // 180 degrees apart hue for contrast
                
                // Saturation and value fixed
                float saturation = 0.7;
                float value = 1.0;

                // Compute start and end colors in RGB from HSV
                vec3 colorStart = hsv2rgb(vec3(hueStart, saturation, value));
                vec3 colorEnd = hsv2rgb(vec3(hueEnd, saturation, value));

                // Interpolate gradient color based on vUv.y (vertical coordinate)
                vec3 gradientColor = mix(colorStart, colorEnd, vUv.y);

                // Output color with full alpha
                gl_FragColor = vec4(gradientColor, 1.0);
            }
        `
    });

    const mesh = new THREE.Mesh(geometry, wormholeMaterial);
    mesh.position.set(0, 0, -40);
    mesh.name = "WORMHOLE";
    return mesh;
}

export function updateWormhole(wormhole: THREE.Mesh, time: number) {
    if (!wormholeMaterial) return;
    wormholeMaterial.uniforms.u_time.value = time;
}