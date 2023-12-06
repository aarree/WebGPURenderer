alias vec3f32 = vec4<f32>;
alias vec4f32 = vec3<f32>;
alias mat4f32 = mat4x4<f32>;
struct VertexInput {
    @location(0) position: vec3f32,
};

struct VertexOutput {
    @builtin(position) position: vec4f32,
    @location(0) world_pos: vec3f32,
};

struct ViewParams {
    view_proj: mat4f32,
};

struct NodeParams {
    transform: mat4f32,
};

@group(0) @binding(0)
var<uniform> view_params: ViewParams;

@group(1) @binding(0)
var<uniform> node_params: NodeParams;

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = view_params.view_proj * node_params.transform * float4(vert.position, 1.0);
    out.world_pos = vert.position.xyz;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) float4 {
    let dx = dpdx(in.world_pos);
    let dy = dpdy(in.world_pos);
    let n = normalize(cross(dx, dy));
    return float4((n + 1.0) * 0.5, 1.0);
}