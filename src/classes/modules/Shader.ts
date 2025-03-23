import Module from "../../core/Module.ts";
import Resource, {
  ShaderDataFormat,
  ShaderGroup,
  ShaderSlot,
} from "../../core/Resource.ts";

import { shaderSlotWrapper } from "../../shader/DEFAULT_SLOTS";
import Renderer from "../SRenderer.ts";
import System from "../../core/System.ts";
import Gpu from "./Gpu.ts";

export const shaderDefaultSlots: ShaderSlot[] = [
  // {
  //   name: "view_proj",
  //   position: 1,
  //   size: 4,
  //   shaderGroup: ShaderGroup.DEFAULT,
  //   dataType: ShaderDataFormat.mat4f32,
  // },
];

export default class Shader extends Module {
  static module: Shader;
  static defaultSlots: Map<string, ShaderSlot> = new Map();
  static defaultBindgroup: GPUBindGroup;
  static defaultBingroupLayput: (slots: ShaderSlot[]) => GPUBindGroupLayout = (
    slots,
  ) =>
    Gpu.module.device.createBindGroupLayout({
      entries: slots.map((slot) => {
        return {
          buffer: { type: "uniform" },
          binding: slot.position,
          visibility: GPUShaderStage.VERTEX,
        };
      }),
    });

  private shaders: Map<string, GPUShaderModule> = new Map<
    string,
    GPUShaderModule
  >();
  private device: GPUDevice;

  private constructor(device: GPUDevice) {
    super();
    this.device = device;
  }

  addBindGroup() {}
  addToShaderDefaults(slots: ShaderSlot[]) {
    slots.forEach((slot) => {
      console.log("slotname", slot.name);
      if (Shader.defaultSlots.get(slot.name)) {
        console.warn("slotname Slot already exists", slot);
        return;
      }
      Shader.defaultSlots.set(slot.name, slot);
    });

    Shader.defaultBindgroup = Gpu.module.device.createBindGroup({
      label: "DEFAULT BindGroup",
      layout: Shader.defaultBingroupLayput(slots),
      entries: slots.map((slot) => {
        return {
          binding: slot.position,
          resource: {
            buffer: slot.buffer,
            offset: 0,
            size: 1,
          },
        } as GPUBindGroupEntry;
      }),
    });

    const renderer: Renderer = System.all[0] as Renderer;
    renderer.onUpdate((pass) => {
      pass.setBindGroup(ShaderGroup.DEFAULT, Shader.defaultBindgroup);
    });
  }
  createShaderModule({
    res,
    code,
    uniforms = [],
  }: {
    res: Resource;
    code: string;
    uniforms?: ShaderSlot[];
  }) {
    console.group("createShader");
    console.log("generatedShaderCode", res, uniforms);
    const slots = res.data.shaderSlots;
    const generatedShaderCode = shaderSlotWrapper(slots, uniforms) + code;
    console.log("generatedShaderCode", generatedShaderCode);
    const shaderModule = this.device.createShaderModule({
      label: res.data.name,
      code: generatedShaderCode,
    });

    for (let [, shader] of this.shaders) {
      if (shader === shaderModule) {
        return shaderModule;
      }
    }

    this.shaders.set(res.data.name, shaderModule);
    console.groupEnd();
    return shaderModule;
  }
}
