import Material, { MaterialModel } from "./Material.ts";

export default class SimpleMaterial extends Material {
  constructor({ name, type, color }: MaterialModel) {
    super({ name, type, color },
        `
                    // New: define a struct that contains the data we want to pass
                    // through the uniform buffer
                    struct ViewParams {
                        view_proj: mat4x4<f32>,
                    };
                    
                    // New: create a uniform variable of our struct type
                    // and assign it group and binding indices
                    @group(0) @binding(0)
                    var<uniform> view_params: ViewParams;
                    
                    @vertex
                    fn vertexMain(vert: VertexInput) -> VertexOutput {
                        var out: VertexOutput;
                        out.position = view_params.view_proj * vert.position;
                        out.frag_color = vert.color;
                        out.frag_position = 0.5 * (vert.position + vec4(1.0, 1.0, 1.0, 1.0));
                        return out;
                    };
                    
                    @fragment
                    fn fragmentMain(in: VertexOutput) -> @location(0) vec4f32 {
                        return in.frag_position;
                    }
                `
        );
  }
}
