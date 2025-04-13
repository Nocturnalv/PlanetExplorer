#include ./lygia/generative/fbm.glsl

uniform float u_radius;
uniform int u_heightNoiseSeed;
uniform float u_heightNoiseScale;
uniform float u_heightScale;

varying vec3 v_vertexPos;
varying vec3 v_vertexNormal;

void main()
{
    float noiseSample = fbm(vec3(position.xy * 1.0f / (u_heightNoiseScale), u_heightNoiseSeed));
    // v_elevation = noiseSample;
    float displacement = noiseSample * u_heightScale * u_radius;
    vec3 displacedPos = normalize(position) * (u_radius + displacement);
    v_vertexPos = displacedPos;
    v_vertexNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1);
}
