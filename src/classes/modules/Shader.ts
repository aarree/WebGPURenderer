import Module from "../../core/Module.ts";
import Resource, { ShaderSlot, SlotType } from "../../core/Resource.ts";
import { shaderSlotWrapper } from "../../shader/DEFAULT_SLOTS";
export const shaderDefaultSlots: ShaderSlot[] = [
  {
    name: "Position",
    position: 0,
    size: 4,
    type: SlotType.position,
  },
  {
    name: "Color",
    position: 1,
    size: 4,
    type: SlotType.position,
  },
];

export default class Shader extends Module {
  static module: Shader;

  private shaders: Map<string, GPUShaderModule> = new Map<
    string,
    GPUShaderModule
  >();
  private device: GPUDevice;

  private constructor(device: GPUDevice) {
    super();

    Shader.module = this;
    this.device = device;
  }

  static init(device: GPUDevice) {
    if (this.module) {
      return this.module;
    }

    return new Shader(device);
  }

  createShaderModule({ res, code }: { res: Resource; code: string }) {
    const shaderModule = this.device.createShaderModule({
      label: res.data.name,
      code: shaderSlotWrapper(res.data.shaderSlots) + code,
    });

    for (let [, shader] of this.shaders) {
      if (shader === shaderModule) {
        return shaderModule;
      }
    }

    this.shaders.set(res.data.name, shaderModule);
    return shaderModule;
  }
}
