varying float elevation;

void main()
{
    // TODO: pass in radius and terrain exaggeration as uniforms
    elevation = (length(position) - 5.0f) + 0.5f;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
