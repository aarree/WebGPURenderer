import Module from "../../core/Module.ts";
import {
  Buffer,
  ResourceData,
  ResourceType,
  ShaderSlot,
  SlotType,
} from "../../core/Resource.ts";
import Material from "../Components/Material.ts";
import Renderer from "../SRenderer.ts";

export default class Gpu extends Module {
  static module: Gpu;

  device: GPUDevice;
  renderer: Renderer;
  private constructor(device: GPUDevice, renderer: Renderer) {
    super();

    Gpu.module = this;
    this.device = device;
    this.renderer = renderer;
  }

  createBuffer({ data, name, type, shaderSlots }: ResourceData): Buffer {
    // filter for slots with position
    const vertexPositionRelevantSlots = shaderSlots.filter(
      (slot) => slot.type === SlotType.position,
    );
    const bindGroupRelevantSlots = shaderSlots.filter(
      (slot) => slot.type === SlotType.binding,
    );
    // create buffer
    const buffer: Buffer = {
      data: this.device.createBuffer({
        label: name,
        size: data.byteLength,
        usage: this.getUsage(type),
        mappedAtCreation: true,
      }),

      // create buffer layout with vertex position relevant slots
      layout:
        vertexPositionRelevantSlots &&
        this.createBufferLayout(vertexPositionRelevantSlots),
    };

    // create shaderBindings
    const shaderBindings: GPUBindGroup[] = [];
    bindGroupRelevantSlots?.forEach(() => {
      shaderBindings.push(this.createBindGroup(buffer).bindGroup);
    });

    if (shaderBindings.length > 1) {
      throw Error("Only one binding per Buffer is allowed");
    }

    if (bindGroupRelevantSlots && bindGroupRelevantSlots.length > 0) {
      // Hooking into the renderer and set the bindgroup for the frame
      this.renderer.onUpdate((pass) => {
        pass.setBindGroup(
          bindGroupRelevantSlots[0].position,
          shaderBindings[0],
        );
      });
    }

    new Float32Array(buffer.data.getMappedRange()).set(data);
    buffer.data.unmap();

    this.device.queue.writeBuffer(buffer.data, /*bufferOffset=*/ 0, data);
    return buffer;
  }

  createBindGroup(buffer: Buffer) {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: buffer.data } }],
    });

    return {
      bindGroup,
      bindGroupLayout,
    };
  }

  private resolveShaderSlots(shaderSlots: ShaderSlot[]): GPUVertexAttribute[] {
    const attributes: GPUVertexAttribute[] = [];

    shaderSlots.forEach((slot) => {
      attributes.push({
        format: `float32x${slot.size}` as GPUVertexFormat,
        offset: slot.size * slot.position,
        shaderLocation: slot.position,
      });
    });

    return attributes;
  }

  private createBufferLayout(shaderSlots: ShaderSlot[]): GPUVertexBufferLayout {
    return {
      arrayStride: this.getVertexArrayStride(shaderSlots),
      attributes: this.resolveShaderSlots(shaderSlots),
    };
  }

  getVertexArrayStride(slots: ShaderSlot[]) {
    let stride = 0;
    slots.forEach((slot) => {
      stride += slot.size;
    });
    console.log("Stride", stride);
    return stride * 4;
  }
  private getUsage(type: ResourceType) {
    if (type == ResourceType.Triangles) {
      return GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    }
    if (type == ResourceType.Uniform) {
      return (
        GPUBufferUsage.VERTEX |
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST
      );
    }
    return (
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.UNIFORM |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST
    );
    // throw new Error("Unsupported resource type");
  }

  static init(device: GPUDevice, renderer: Renderer) {
    if (this.module) {
      return this.module;
    }

    return new Gpu(device, renderer);
  }

  createRenderPipeline(
    vertexBufferLayout: GPUVertexBufferLayout,
    material: Material,
  ): GPURenderPipeline {
    // const shaderModule = this.shaders.get(shaderModuleName);
    //  console.log(shaderModule);
    //
    //  // TODO: needs to moved out of the gpu class. This should happen at Actor Level
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    return this.device.createRenderPipeline({
      label: material.name,
      layout: layout,
      vertex: {
        module: material.shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: material.shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }
}
