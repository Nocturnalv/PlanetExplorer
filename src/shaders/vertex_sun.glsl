#include ./lygia/generative/fbm.glsl
attribute vec4 tangent;

varying vec3 v_vertexPos;
varying vec3 v_vertexNormal;
varying vec4 v_tangent;

uniform float u_Time;
uniform vec3 u_color1;

void main()
{
    // float noiseSample = fbm(vec3(position.xy * 1.0f / (u_heightNoiseScale), u_heightNoiseSeed));
    // float displacement = noiseSample * u_heightScale * u_radius;
    // vec3 displacedPos = normalize(position) * (u_radius + displacement);
    v_vertexPos = position;
    v_vertexNormal = normal;
    v_tangent = tangent;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
}
