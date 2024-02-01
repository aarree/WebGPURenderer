import Gpu from "../classes/modules/Gpu.ts";

// TODO: Move Type & Interface to separate files or the fitting class files
export interface Buffer {
  data: GPUBuffer;
  layout: GPUVertexBufferLayout;
  bindGroup?: GPUBindGroup;
}

export enum SlotType {
  binding,
  position,
  positionIn,
  positionOut,
}

export interface ShaderSlot {
  name: string;
  type: SlotType;
  position: number;
  dataType: ShaderDataFormat;
  size: number;
  createNewBuffer?: boolean;
  bindGroup?: GPUBindGroup;
  binding?: number;
}

export enum ShaderDataFormat {
  float32,
  vec2f32,
  vec3f32,
  vec4f32,
  mat4f32,
}

export interface ResourceData {
  type: ResourceType;
  name: string;
  data: Float32Array;
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
  buffer: Buffer;
  data: ResourceData;

  constructor(data: ResourceData) {
    console.group("Resource Init");
    this.data = data;
    console.log("ResourceData", data);
    this.buffer = Gpu.module.createBuffer(data);

    console.log("data", data);
    console.groupEnd();
  }

  upload() {}
}
