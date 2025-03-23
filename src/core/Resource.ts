import { vec2, vec3, vec4 } from "gl-matrix";
import Gpu from "../classes/modules/Gpu.ts";
import Shader from "../classes/modules/Shader.ts";
import System from "./System.ts";
import Renderer from "../classes/SRenderer.ts";

// TODO: Move Type & Interface to separate files or the fitting class files
export interface Buffer {
  data: GPUBuffer;
  layout: GPUVertexBufferLayout;
  bindGroup?: GPUBindGroup;
}

export enum ShaderGroup {
  VERTEX,
  DEFAULT,
  UPDATEABLE,
  STATIC,
}

export interface ShaderSlot {
  name: string;
  position: number;
  dataType: ShaderDataFormat;
  size: number;
  bufferData?: Float32Array | vec2 | vec3 | vec4;
  bindGroup?: GPUBindGroup;
  bindGroupLayout?: GPUBindGroupLayout;
  buffer?: GPUBuffer;
}

export enum ShaderDataFormat {
  float32,
  vec2f32,
  vec3f32,
  vec4f32,
  mat4f32,
}
// Create Sub resources for geometry, bindings textures etc
export interface ResourceData {
  type: ResourceType;
  name: string;
  shaderGroup: ShaderGroup;
  shaderSlots: ShaderSlot[];
  dataFormat: ShaderDataFormat;
  vertexcount?: number;
  indices?: number;
  stride?: number;
}

export enum ResourceType {
  Uniform = 1,
  Points = 2,
  Lines = 3,
  Triangles = 4,
}

export default class Resource {
  data: ResourceData;
  constructor(data: ResourceData) {
    console.group("Resource Init");
    Gpu.module.createResourceBuffer(data.shaderSlots, data.shaderGroup);

    if (data.shaderGroup === ShaderGroup.DEFAULT) {
      Shader.module.addToShaderDefaults(data.shaderSlots);
    }

    if (data.shaderGroup === ShaderGroup.VERTEX) {
      data.bindGroup = Gpu.module.device.createBindGroup({
        label: data.name + "BindGroup",
        layout: Gpu.module.device.createBindGroupLayout({
          entries: data.shaderSlots.map((slot) => {
            return {
              buffer: { type: "uniform" },
              binding: slot.position,
              visibility: GPUShaderStage.VERTEX,
            };
          }),
        }),
        entries: data.shaderSlots.map((slot) => {
          return {
            binding: slot.position,
            resource: {
              buffer: data.shaderSlots[0].buffer,
              offset: 0,
              size: 1,
            },
          } as GPUBindGroupEntry;
        }),
      });
    }
    const renderer: Renderer = System.all[0] as Renderer;
    renderer.onUpdate((pass) => {
      // console.log("Resource Update", ShaderGroup[data.shaderGroup]);
      pass.setBindGroup(data.shaderGroup, data.bindGroup);
    });

    console.log("ResourceData", data);
    // Gpu.module.createBindGroups(data.shaderSlots);
    console.log("ResourceData", this);

    this.data = data;
    console.log("data", data);
    console.groupEnd();
  }

  upload() {}
}
