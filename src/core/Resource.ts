import Gpu from "../classes/modules/Gpu.ts";

// TODO: Move Type & Interface to separate files or the fitting class files
export interface Buffer {
  data: GPUBuffer;
  layout?: GPUVertexBufferLayout;
  bindGroup?: GPUBindGroup;
}

export enum SlotType {
  binding,
  position,
}

export interface ShaderSlot {
  name: string;
  type: SlotType;
  position: number;
  size: number;
}

export interface ResourceData {
  type: ResourceType;
  name: string;
  data: Float32Array;
  shaderSlots: ShaderSlot[];
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
    this.data = data;
    this.buffer = Gpu.module.createBuffer(data);

    console.log("data", data);
  }

  upload() {}
}
