import * as THREE from 'three';

let wormholeMaterial: THREE.ShaderMaterial;

export function loadWormhole(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.2, 8, 10, 64, 1, true);
    geometry.rotateX(Math.PI / 2); 
    geometry.rotateY(Math.PI);     

    wormholeMaterial = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
            u_time: { value: 0 },
        },
        vertexShader: `
            varying vec2 wrap;
            void main() {
                wrap = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 wrap;
            uniform float u_time;

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1., 2./3., 1./3., 3.);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
            }

            void main() {
                float hueStart = mod(u_time * 0.1, 1.0);           
                float hueEnd = mod(hueStart + 0.5, 1.0);         
                
                float saturation = 0.7;
                float value = 1.0;

                vec3 colorStart = hsv2rgb(vec3(hueStart, saturation, value));
                vec3 colorEnd = hsv2rgb(vec3(hueEnd, saturation, value));
                vec3 gradientColor = mix(colorStart, colorEnd, wrap.y);

                gl_FragColor = vec4(gradientColor, 1.0);
            }
        `
    });

    const mesh = new THREE.Mesh(geometry, wormholeMaterial);
    mesh.position.set(0, 0, -80);
    mesh.name = "WORMHOLE";
    return mesh;
}

export function updateWormhole(wormhole: THREE.Mesh, time: number, generateNewCount: number) {
    if (!wormholeMaterial) return;

    wormholeMaterial.uniforms.u_time.value = time;

    const maxScale = 1.0;
    const growthFactor = 0.1;
    const scale = Math.min(generateNewCount * growthFactor, maxScale);
    wormhole.scale.set(scale, scale, scale);
}

let lightningMaterial: THREE.ShaderMaterial;

export function loadLightning(
    start: THREE.Vector3 = new THREE.Vector3(0, 0, -80),
    depth = 5,
    branchCount = 3,
    branchAngle = Math.PI / 4,
    decay = 0.7
): THREE.LineSegments {
    const positions: number[] = [];

    function fork(start: THREE.Vector3, dir: THREE.Vector3, length: number, currentDepth: number) {
        if (currentDepth > depth) return;

        const lengthJitter = length * (0.8 + Math.random() * 0.4);
        const end = start.clone().add(dir.clone().multiplyScalar(lengthJitter));
        positions.push(start.x, start.y, start.z, end.x, end.y, end.z);

        const localBranchCount = Math.floor(Math.random() * (branchCount + 1));

        for (let i = 0; i < localBranchCount; i++) {
            const randomAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            const randomAngle = (Math.random() - 0.5) * 2 * branchAngle;
            const newDir = dir.clone().applyAxisAngle(randomAxis, randomAngle).normalize();
            fork(end, newDir, lengthJitter * decay, currentDepth + 1);
        }
    }

    const initialDir = new THREE.Vector3(0, 0, 1);
    fork(start, initialDir, 5, 0);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    lightningMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_time: { value: 0.0 }
        },
        vertexShader: `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float u_time;

            void main() {
                float pulse = abs(sin(u_time * 20.0)); // fast flicker
                gl_FragColor = vec4(0.0, 1.0, 1.0, pulse); // cyan lightning with alpha flicker
            }
        `,
        transparent: true,
        depthWrite: false
    });

    return new THREE.LineSegments(geometry, lightningMaterial);
}

export function updateLightning(time: number) {
    if (lightningMaterial) {
        lightningMaterial.uniforms.u_time.value = time;
    }
}