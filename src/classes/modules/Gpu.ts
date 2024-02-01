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
import { alignTo } from "../../helper/divers.ts";

export default class Gpu extends Module {
  static module: Gpu;

  device: GPUDevice;
  renderer: Renderer;
  bindGroupLayouts: GPUBindGroupLayout[] = [];
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
        size: alignTo(data.byteLength, 4),
        usage: this.getUsage(type),
        mappedAtCreation: true,
      }),

      // create buffer layout with vertex position relevant slots
      layout:
        vertexPositionRelevantSlots &&
        this.createBufferLayout(vertexPositionRelevantSlots),
    };

    // create shaderBindings

    // create bindgroup for relevant slots
    bindGroupRelevantSlots?.forEach((shaderSlot) => {
      console.group("create bindgroup for", shaderSlot.name);
      console.log(shaderSlot);
      if (shaderSlot.createNewBuffer) {
        const buffer: Buffer = {
          data: this.device.createBuffer({
            label: shaderSlot.name,
            size: alignTo(shaderSlot.size, 4),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
          }),
          layout: this.createBufferLayout([shaderSlot]),
        };

        buffer.data.unmap();

        const bindgroup = this.createBindGroup(buffer, shaderSlot.binding);
        console.log(shaderSlot);
        shaderSlot.bindGroup = bindgroup.bindGroup;

        this.bindGroupLayouts.push(bindgroup.bindGroupLayout);

        return;
      }
      shaderSlot.bindGroup = this.createBindGroup(buffer).bindGroup;
      console.groupEnd(); 
    });

    if (bindGroupRelevantSlots && bindGroupRelevantSlots.length > 0) {
      // Hooking into the renderer and set the bindgroup for the frame
      const update = (pass: GPURenderPassEncoder) => {
        for (let slot of bindGroupRelevantSlots) {
          if(!slot.bindGroup) {
            throw new Error(`No bindgroup for slot ${slot}`);
          }
          pass.setBindGroup(slot.position, slot.bindGroup);
        }
      }
      
      this.renderer.onUpdate(update);
    }

    // @ts-ignore
    new data.constructor(buffer.data.getMappedRange()).set(data);
    buffer.data.unmap();

    this.device.queue.writeBuffer(buffer.data, /*bufferOffset=*/ 0, data);

    return buffer;
  }

  createBindGroup(buffer: Buffer, binding = 0) {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: binding,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{ binding: binding, resource: { buffer: buffer.data } }],
    });

    return {
      bindGroup,
      bindGroupLayout,
    };
  }

  private resolveShaderSlots(shaderSlots: ShaderSlot[]): GPUVertexAttribute[] {
    const attributes: GPUVertexAttribute[] = [];

    shaderSlots.forEach((slot,i) => {
      if (slot.type !== SlotType.positionOut) {
        attributes.push({
          format: `float32x${slot.size}` as GPUVertexFormat,
          offset: (i * slot.size) * 4,
          shaderLocation: slot.position,
        });
      }
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
      if (slot.type !== SlotType.positionOut) {
        stride += slot.size;
      }
    });
    return stride * 4;
  }
  private getUsage(type: ResourceType) {
    // TODO: better usage type handling
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
      bindGroupLayouts: [bindGroupLayout, ...this.bindGroupLayouts],
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
