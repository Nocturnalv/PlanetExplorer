#include "lygia/generative/fbm.glsl"

uniform vec3 u_flatAColor;
uniform vec3 u_flatBColor;
uniform vec3 u_steepAColor;
uniform vec3 u_steepBColor;
uniform float u_heightScale;
uniform int u_biomeNoiseSeed;
uniform float u_biomeNoiseScale;
uniform float u_radius;
uniform bool u_useColorBands;
uniform float u_numberColorBands;

varying vec3 v_vertexPos;
varying vec3 v_vertexNormal;

const float c_baseBiomeNoiseScale = 3.0f;

void main()
{
    float biomeNoise = snoise(vec4(v_vertexPos * (1.0f / (u_biomeNoiseScale * c_baseBiomeNoiseScale)), u_biomeNoiseSeed)) * 0.5f + 0.5f;
    float bandedNoise = float(u_useColorBands) * (floor(u_numberColorBands * biomeNoise) / u_numberColorBands)
            + float(!u_useColorBands) * biomeNoise;
    vec3 biomeColor = mix(u_flatAColor, u_flatBColor, bandedNoise);
    float height = (length(v_vertexPos / normalize(v_vertexPos)) - u_radius) * 0.5f + 0.5f;
    vec3 steepColor = mix(u_steepAColor, u_steepBColor, height);
    float steepness = 1.0f - dot(v_vertexNormal, normalize(v_vertexPos));
    vec3 finalCol = mix(biomeColor, steepColor, steepness);
    gl_FragColor = vec4(finalCol, 1.0f);
}
