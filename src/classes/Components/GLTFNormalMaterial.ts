import Material, { MaterialModel } from "./Material.ts";

export default class GLTFNormalMaterial extends Material {
  constructor(data: MaterialModel) {
    super(data);
    this.shaderCode = `
struct ViewParams {
    view_proj: mat4x4<f32>,
};

struct NodeParams {
    transform: mat4x4<f32>,
};

@group(0) @binding(0)
var<uniform> view_params: ViewParams;

@group(1) @binding(0)
var<uniform> node_params: NodeParams;

@vertex
fn vertexMain(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = view_params.view_proj * node_params.transform * vec4f32(vert.position, 1.0);
    out.frag_world_pos = vert.position.xyz;
    return out;
};

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) float4 {
    let dx = dpdx(in.frag_world_pos);
    let dy = dpdy(in.frag_world_pos);
    let n = normalize(cross(dx, dy));
    return float4((n + 1.0) * 0.5, 1.0);
}
    `;
  }
}
