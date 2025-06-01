#include "lygia/generative/fbm.glsl"

varying vec3 v_vertexPos;
varying vec3 v_vertexNormal;
varying vec4 v_tangent;

uniform float u_Time;
uniform float u_zoom;
uniform vec3 u_color1;
uniform float u_radius;
uniform float u_speed;

void main()
{
    float pat = fbm(v_vertexPos * (u_zoom/ u_radius) + vec3(sin(u_Time * u_speed + v_vertexNormal.x), sin(u_Time * u_speed + v_vertexNormal.y), sin(u_Time * u_speed + v_vertexNormal.z))) + fbm(v_vertexNormal) - u_radius;
    vec3 newPos = v_vertexPos + v_vertexNormal * pat; 

    gl_FragColor = vec4(vec3(u_color1) + vec3(newPos.x), 1.0);
}
