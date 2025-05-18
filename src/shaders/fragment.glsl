#include "lygia/generative/fbm.glsl"

uniform vec3 u_flatAColor;
uniform vec3 u_flatBColor;
uniform vec3 u_steepAColor;
uniform vec3 u_steepBColor;
uniform float u_heightScale;
uniform int u_biomeNoiseSeed;
uniform float u_biomeNoiseScale;
uniform float u_radius;
uniform bool u_useColorBanding;
uniform float u_numberColorBands;
uniform vec3 u_cameraPos;
uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
// TODO: Should be for mesh, instead of uniform
uniform vec3 u_emissivity;
// TODO: Should be for mesh, instead of uniform
uniform float u_roughness;
uniform vec3 u_baseReflectance;
uniform vec3 u_normalMapBlend;
uniform sampler2D u_moonNormal;

// NOTE: This might not be the right way. https://stackoverflow.com/questions/4899555/glsl-how-to-get-pixel-x-y-z-world-position
varying vec3 v_vertexPos;
varying vec3 v_vertexNormal;
varying vec4 v_tangent;

const float c_baseBiomeNoiseScale = 3.0f;

float g1CookTorrance(vec3 x, vec3 normal, vec3 halfView)
{
    float a = dot(x, halfView) / dot(x, normal);
    float chi = float(a > 0.0f);
    float alphaSquared = pow(u_roughness, 4.0f);
    float xDotNormalSquared = pow(max(dot(x, normal), 0.0f), 2.0f);
    float tanSquaredTheta = (1.0f - xDotNormalSquared) / xDotNormalSquared;
    float denom = 1.0f + sqrt(1.0f + alphaSquared * tanSquaredTheta);
    float b = 2.0f / denom;
    return chi * b;
}

// Cook-Torrance Geometry Shadowing GGX
float geometryShadowing(vec3 normal, vec3 view, vec3 light, vec3 halfView)
{
    float g1View = g1CookTorrance(view, normal, halfView);
    float g1Light = g1CookTorrance(light, normal, halfView);
    return g1View * g1Light;
}

float normalDistribution(vec3 normal, vec3 halfView)
{
    float alphaSquared = pow(u_roughness, 4.0f);
    float a = dot(normal, halfView);
    float chi = float(a > 0.0f);
    float normalDotHalfViewSquared = pow(dot(normal, halfView), 2.0f);
    float pi = radians(180.0f);
    float denom = pi * pow(normalDotHalfViewSquared * (alphaSquared - 1.0f) + 1.0f, 2.0f);
    float b = alphaSquared / denom;
    return chi * b;
}

// Fresnel factor —  calculates the specular reflection of light
// This is Schlick’s approximation of the Fresnel factor
// Specular Reflectivity = Base Reflectivity + (1 - Base Reflectivity)(1 - (View · halfView))^5
// Base Reflectivity: reflectivity when viewing the surface at a perpendicular angle
// View: view vector (from which material is being viewed)
// halfView: halfView vector (evenly between view and light vectors)
vec3 fresnel(vec3 view, vec3 normal)
{
    return u_baseReflectance + (vec3(1.0f) - u_baseReflectance) * pow(1.0f - dot(view, normal), 5.0f);
}

vec3 specular(vec3 normal, vec3 view, vec3 light, vec3 halfView, vec3 albedo)
{
    float d = normalDistribution(normal, halfView);
    float g = geometryShadowing(normal, view, light, halfView);
    vec3 f = fresnel(view, halfView);
    vec3 dgf = d * g * f;
    float denom = 4.0f * dot(normal, light) * dot(normal, view);
    vec3 specular = dgf / denom;
    return albedo * specular;
}

// Lambertian model of diffuse lighting
// Diffuse Reflection = (Colour / π)(Incoming light normal · Surface normal)
// This term is applied in the base BRDF, so this can be simplified to:
// Diffuse Reflection = (Colour / π)
vec3 diffuse(vec3 albedo)
{
    return albedo / radians(180.0f);
}

// BRDF = k_d × f_diffuse + k_s × f_specular
// k_d and k_s represent proportion of diffuse and specular light reflected respectively
// Consequently, k_d + k_s = 1 (no energy is created an no energy is destroyed)
// k_s is dictated by the fresnel effect
// ∴ k_s = fresnel(); k_d = 1 - k_s
// The Cook-Torrance lighting model includes k_s. So, practically, this is
// BRDF = (1 - `fresnel()`) × `diffuse()` + `specular()`
vec3 brdf(vec3 normal, vec3 view, vec3 light, vec3 halfView, vec3 albedo)
{
    vec3 ks = fresnel(view, halfView);
    vec3 kd = vec3(1.0f) - ks;
    vec3 diffuse = diffuse(albedo);
    vec3 specular = specular(normal, view, light, halfView, albedo);
    return (ks * specular) + (diffuse);
}

// THE RENDERING EQUATION
// L_o(x, V) = L_e(x, V) + Σ_n f_r(x, L_n, V)L_i(x, L_n)(L_n · N)
// x: frag pos, V: view vector, L_n: light vector
// In other words…
// Colour = Emitted Light + Sum(BRDF × Incoming light × Reflection angle penalty)
vec3 pbr(vec3 normal, vec3 view, vec3 light, vec3 halfView, vec3 albedo)
{
    vec3 brdf = brdf(normal, view, light, halfView, albedo);
    return u_emissivity + brdf * u_lightColor * dot(light, normal);
}

vec3 albedo()
{
    float biomeNoise = snoise(vec4(v_vertexPos * (1.0f / (u_biomeNoiseScale * c_baseBiomeNoiseScale)), u_biomeNoiseSeed)) * 0.5f + 0.5f;
    float bandedNoise = float(u_useColorBanding) * (floor(u_numberColorBands * biomeNoise) / u_numberColorBands)
            + float(!u_useColorBanding) * biomeNoise;
    vec3 biomeColor = mix(u_flatAColor, u_flatBColor, bandedNoise);
    float height = (length(v_vertexPos / normalize(v_vertexPos)) - u_radius) * 0.5f + 0.5f;
    vec3 steepColor = mix(u_steepAColor, u_steepBColor, height);
    float steepness = 1.0f - dot(v_vertexNormal, normalize(v_vertexPos));
    vec3 finalCol = mix(biomeColor, steepColor, steepness);
    return finalCol;
}

vec3 triplanar(vec3 vertexNormal)
{
    vec3 vertex = abs(normalize(v_vertexPos));
    vec3 normal = abs(round(vertexNormal));
    vec2 uv = mix(mix(mix(vertex.xy, vertex.zy, normal.x), vertex.xz, normal.y), vertex.xy, normal.z);
    return vertexNormal + 0.1 * (texture(u_moonNormal, uv).xyz * 2.0f - 1.0f);
}

void main()
{
    vec3 normal = triplanar(normalize(v_vertexNormal));
    vec3 view = normalize(u_cameraPos - v_vertexPos);
    vec3 light = normalize(u_lightPos);
    vec3 halfView = normalize(view + light);
    vec3 albedo = albedo();

    vec3 color = pbr(normal, view, light, halfView, albedo);
    // vec3 color = triplanarTest(normalize(v_vertexNormal));
    gl_FragColor = vec4(color, 1.0f);
}
