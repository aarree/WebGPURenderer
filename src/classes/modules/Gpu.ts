import Module from "../../core/Module.ts";
import {
  Buffer,
  ResourceData,
  ResourceType,
  ShaderGroup,
  ShaderSlot,
} from "../../core/Resource.ts";
import Material from "../Components/Material.ts";
import Renderer from "../SRenderer.ts";
import { alignTo } from "../../helper/divers.ts";
import Shader from "./Shader.ts";

interface ShaderSlotGroup {
  [key: string]: ShaderSlot[];
}

export default class Gpu extends Module {
  static module: Gpu;

  device: GPUDevice;
  renderer: Renderer;

  shaderBindings: ShaderSlotGroup = { default: [] };

  private constructor(device: GPUDevice, renderer: Renderer) {
    super();

    this.device = device;
    this.renderer = renderer;
  }

  createResourceBuffer(slots: ShaderSlot[], shaderGroup) {
    slots.forEach((slot) => {
      if (!slot.bufferData) return;
      if (shaderGroup === ShaderGroup.DEFAULT) {
        slot.buffer = this.device.createBuffer({
          label: `default_slot_${slot.name}`,
          size: alignTo(slot.bufferData.byteLength, 4),
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
      } else if (shaderGroup === ShaderGroup.VERTEX) {
        slot.buffer = this.device.createBuffer({
          label: `vertex_data_${slot.name}`,
          size: alignTo(slot.bufferData.byteLength, 4),
          usage:
            GPUBufferUsage.VERTEX |
            GPUBufferUsage.UNIFORM |
            GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
      } else if (shaderGroup === ShaderGroup.UPDATEABLE) {
        slot.buffer = this.device.createBuffer({
          label: `updateable_slot_${slot.name}`,
          size: alignTo(slot.bufferData.byteLength, 4),
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
      }
      // @ts-ignore
      new slot.bufferData.constructor(slot.buffer.getMappedRange()).set(
        slot.buffer,
      );
      // @ts-ignore
      slot.buffer.unmap();
      slot.buffer &&
        this.device.queue.writeBuffer(
          slot.buffer,
          /*bufferOffset=*/ 0,
          slot.bufferData,
        );
    });
  }

  createBindGroups(slots: ShaderSlot[]) {
    const vertexSlots = slots.filter(
      (slot) => slot.shaderGroup === ShaderGroup.VERTEX,
    );

    const uniformSlots = slots.filter(
      (slot) => slot.shaderGroup !== ShaderGroup.VERTEX && slot.buffer,
    );

    if (vertexSlots && vertexSlots[0] && vertexSlots[0].buffer) {
      slots.forEach((slot) => {
        console.log("SLOT", slot);
        this.addShaderBinding(slot);
      });
      vertexSlots[0].bindGroup = this.createBindGroup(
        vertexSlots[0].buffer,
        ShaderGroup.VERTEX,
      ).bindGroup;
      vertexSlots[0].bindGroupLayout = this.createBindGroup(
        vertexSlots[0].buffer,
        ShaderGroup.VERTEX,
      ).bindGroupLayout;
    }

    uniformSlots.forEach((slot) => {
      if (!slot.buffer) return new Error("no buffer");
      slot.bindGroup = this.createBindGroup(
        slot.buffer,
        ShaderGroup.VERTEX,
      ).bindGroup;
      slot.bindGroupLayout = this.createBindGroup(
        slot.buffer,
        ShaderGroup.VERTEX,
      ).bindGroupLayout;
    });

    console.log("bufferLayout", vertexSlots, slots);

    const update = (pass: GPURenderPassEncoder) => {
      for (let slot of uniformSlots) {
        if (!slot.bindGroup) {
          throw new Error(`No bindgroup for slot ${slot}`);
        }

        if (slot.bindGroup.__raw) {
          pass.setBindGroup(slot.position, slot.bindGroup.__raw);
        } else {
          pass.setBindGroup(slot.position, slot.bindGroup);
        }
      }
    };

    this.renderer.onUpdate(update);
  }

  addShaderBinding(slot: ShaderSlot, group = "default") {
    this.shaderBindings[group].push(slot);
  }

  createBindGroup(buffer: GPUBuffer, binding = 0) {
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
      entries: [{ binding: binding, resource: { buffer: buffer } }],
    });

    return {
      bindGroup,
      bindGroupLayout,
    };
  }

  private resolveShaderSlots(shaderSlots: ShaderSlot[]): GPUVertexAttribute[] {
    const attributes: GPUVertexAttribute[] = [];

    shaderSlots.forEach((slot, i) => {
      attributes.push({
        format: `float32x${slot.size}` as GPUVertexFormat,
        offset: i * slot.size * 4,
        shaderLocation: slot.position,
      });
    });

    return attributes;
  }

  createBufferLayout(shaderSlots: ShaderSlot[]): GPUVertexBufferLayout {
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
    return stride * 4;
  }
  private getUsage(type: ResourceType) {
    // TODO: better usage type handling
    if (type == ResourceType.Triangles) {
      return GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
    }
    if (type == ResourceType.Uniform) {
      return GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    }
    return (
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    );
    // throw new Error("Unsupported resource type");
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
      label: "default",
      bindGroupLayouts: [
        Shader.defaultBingroupLayput([...Shader.defaultSlots.values()]),
        bindGroupLayout,
      ],
    });

    let shader = material.shaderModule;

    if (material.shaderModule.__raw) {
      shader = material.shaderModule.__raw;
    }

    return this.device.createRenderPipeline({
      label: material.name,
      layout: layout,
      vertex: {
        module: shader,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shader,
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
