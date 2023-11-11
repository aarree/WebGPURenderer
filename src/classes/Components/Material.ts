import Component from "../../core/Component.ts";
import Shader from "../modules/Shader.ts";
import MeshRenderer from "./MeshRenderer.ts";

interface MaterialModel {
    name: string,
    type?: "standard",
    color?: {
        r: number,
        g: number,
        b: number
    }
}

export default class Material extends Component {
    name: string;
    type: "standard" = "standard"
    color: {
        r: number,
        g: number,
        b: number
    } = {
        r: 55,
        g: 22,
        b: 111
    }
    #shaderModule?: GPUShaderModule;
    
    get shaderModule() {
        if(!this.#shaderModule) throw new Error("Shader module not created");
        return this.#shaderModule; 
    }
    
    update(pass: GPURenderPassEncoder) {
        console.log("shader updated", pass)
    }
    
    mesh?: MeshRenderer;

    constructor({name, type, color}: MaterialModel) {
        super();
        this.addDependency(MeshRenderer);
        this.name = name;

        if(type) this.type = type;
        if(color) this.color = color;
    }
    
    onInit() {
        console.log("Material Resource:",this.actor.getComponent<MeshRenderer>(MeshRenderer).resource);
        this.#shaderModule = Shader.module.createShaderModule({
            res: this.actor.getComponent<MeshRenderer>(MeshRenderer).resource,
            code: `
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
                    fn fragmentMain(in: VertexOutput) -> @location(0) float4 {
                        return in.frag_position;
                    }
                `
        }) 
    }
}