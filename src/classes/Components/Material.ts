import Component from "../../core/Component.ts";
import Shader from "../modules/Shader.ts";
import MeshRenderer from "./MeshRenderer.ts";
import Resource, { ShaderGroup, ShaderSlot } from "../../core/Resource.ts";
import Renderer from "../SRenderer.ts";
import Gpu from "../modules/Gpu.ts";
// TODO: Handle global vs local uniform bindings
// camera postion and lights, vs colors and object specifics
export interface MaterialModel {
  name: string;
  type?: "standard";
  color?: {
    r: number;
    g: number;
    b: number;
  };
}

export default class Material extends Component {
  name: string;
  type: "standard" = "standard";
  color: {
    r: number;
    g: number;
    b: number;
  } = {
    r: 55,
    g: 22,
    b: 111,
  };
  _shaderModule?: GPUShaderModule;
  _shaderCode?: string;
  _uniformsBindings: ShaderSlot[] = [];

  constructor({ name, type, color }: MaterialModel, code: string) {
    console.group("Material Initialization");
    super();
    this.addDependency(MeshRenderer);
    this.name = name;
    this._shaderCode = code;

    if (type) this.type = type;
    if (color) this.color = color;
    console.log("Material", this);
    console.groupEnd();

    // TODO: Move Bindgroup creation to material level
    // Gpu.module.device.createBindGroupLayout({
    //   entries: [
    //     {
    //       binding: 0,
    //       buffer: { type: "uniform" },
    //     },
    //   ],
    // });
  }

  get shaderModule() {
    if (!this._shaderModule) throw new Error("Shader module not created");
    return this._shaderModule;
  }

  update(pass: GPURenderPassEncoder) {
    // Material updated
  }

  mesh?: MeshRenderer;
  addUniform(slot: ShaderSlot) {
    // if (slot.shaderGroup !== ShaderGroup.UPDATEABLE) throw new Error("Uniform not found");
    this._uniformsBindings.push(slot);
  }
  get shaderCode() {
    if (!this._shaderCode) throw new Error("Shader code not created");
    return this._shaderCode;
  }
  set shaderCode(code: string) {
    this._shaderCode = code;
  }

  onInit() {
    console.log(
      "Material Resource:",
      this.actor.getComponent<MeshRenderer>(MeshRenderer).resource,
    );

    console.log(this.shaderCode);

    this._shaderModule = Shader.module.createShaderModule({
      res: this.actor.getComponent<MeshRenderer>(MeshRenderer).resource,
      code: this.shaderCode,
      uniforms: this._uniformsBindings,
    });
  }
}
