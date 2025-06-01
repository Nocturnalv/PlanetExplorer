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
            varying vec3 vPosition;
            varying vec2 vUv;

            void main() {
                vPosition = position;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision mediump float;

        varying vec2 vUv;
        uniform float u_time;

        void main() {
            vec2 centerUv = vUv - 0.5;
            float angle = atan(centerUv.y, centerUv.x);
            float radius = length(centerUv);

            angle += sin(u_time + radius * 10.0) * 0.5;
            vec2 swirlUv = vec2(cos(angle), sin(angle)) * radius + 0.5;

            vec3 purple = vec3(0.5, 0.0, 0.7);
            vec3 blue = vec3(0.0, 0.3, 1.0);

            float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
            vec3 colorA = mix(purple, blue, pulse);
            vec3 colorB = mix(blue, purple, pulse);

            vec3 gradientColor = mix(colorA, colorB, swirlUv.y);

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
//if you're wondering three.js normal Lightning.js is no longer an add on
//i couldn't get three-stdlib to work either (you can delete this comment)
let lightningMaterial: THREE.ShaderMaterial;

export function loadLightning(
    start: THREE.Vector3 = new THREE.Vector3(0, 0, -80),
    depth = 5,
    forkCount = 3,
    forkAngle = Math.PI / 4,
    decay = 0.7
): THREE.LineSegments {
    const positions: number[] = [];

    function fork(start: THREE.Vector3, dir: THREE.Vector3, length: number, currentDepth: number) {
        if (currentDepth > depth) return;

        const zigzag = length * (0.8 + Math.random() * 0.4);
        const end = start.clone().add(dir.clone().multiplyScalar(zigzag));
        positions.push(start.x, start.y, start.z, end.x, end.y, end.z);

        const localForkCount = Math.floor(Math.random() * (forkCount + 1));

        for (let i = 0; i < localForkCount; i++) {
            const randomAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            const randomAngle = (Math.random() - 0.5) * 2 * forkAngle;
            const variation = dir.clone().applyAxisAngle(randomAxis, randomAngle).normalize();
            fork(end, variation, zigzag * decay, currentDepth + 1);
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
            varying vec3 vPosition;

            float hash(float n) {
                return fract(sin(n) * 43758.5453123);
            }

            float noise(vec3 x) {
                vec3 p = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);

                float n = p.x + p.y * 57.0 + 113.0 * p.z;
                return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
            }

            void main() {
                float t = u_time * 4.0;
                float pulse = 1.0 - abs(sin(t));
                float alpha = smoothstep(0.3, 1.0, pulse * noise(vec3(gl_FragCoord.xy * 0.05, t)));
                gl_FragColor = vec4(0.2, 0.8, 1.0, alpha);
            }
        `
    });

    return new THREE.LineSegments(geometry, lightningMaterial);
}

export function updateLightning(time: number) {
    if (lightningMaterial) {
        lightningMaterial.uniforms.u_time.value = time;
    }
}