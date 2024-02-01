import Component, {Class} from "../../core/Component.ts";
import Shader from "../modules/Shader.ts";
import MeshRenderer from "./MeshRenderer.ts";
import Actor from "../../core/Actor.ts";

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
  #shaderModule?: GPUShaderModule;
  #shaderCode?: string;

  constructor({ name, type, color }: MaterialModel, code: string) {
    console.group("Material Initialization");
    super();
    this.addDependency(MeshRenderer);
    this.name = name;
    this.#shaderCode = code;

    if (type) this.type = type;
    if (color) this.color = color;
    console.log("Material", this);
    console.groupEnd();
  }

  get shaderModule() {
    if (!this.#shaderModule) throw new Error("Shader module not created");
    return this.#shaderModule;
  }

  update(pass: GPURenderPassEncoder) {
    // Material updated
  }

  mesh?: MeshRenderer;

  get shaderCode() {
    if (!this.#shaderCode) throw new Error("Shader code not created");
    return this.#shaderCode;
  }
  set shaderCode(code: string) {
    this.#shaderCode = code;
  }

  onInit() {
    console.log(
      "Material Resource:",
      this.actor.getComponent<MeshRenderer>(MeshRenderer).resource,
    );
    this.#shaderModule = Shader.module.createShaderModule({
      res: this.actor.getComponent<MeshRenderer>(MeshRenderer).resource,
      code: this.shaderCode,
    });
  }

  
}
