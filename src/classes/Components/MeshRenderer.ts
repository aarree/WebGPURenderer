import Component from "../../core/Component.ts";
import Resource, {
  ResourceType,
  ShaderDataFormat,
  ShaderGroup,
} from "../../core/Resource.ts";
import Gpu from "../modules/Gpu.ts";
import Material from "./Material.ts";
import MeshResource from "./MeshResource.ts";

export default class MeshRenderer extends Component {
  resource: Resource;
  #material?: Material;
  buffer?: GPUBuffer;

  constructor(name: string, data: Float32Array) {
    super();
    this.resource = new Resource({
      type: ResourceType.Lines,
      name: name,
      shaderGroup: ShaderGroup.VERTEX,
      shaderSlots: [
        {
          bufferData: data,
          name: "Position",
          position: 0,
          size: 4,
          dataType: ShaderDataFormat.vec4f32,
        },
        {
          name: "Color",
          position: 1,
          size: 4,
          dataType: ShaderDataFormat.vec4f32,
        },
        {
          name: "uv",
          size: 2,
          position: 2,
          dataType: ShaderDataFormat.vec2f32,
        },
      ],
      dataFormat: ShaderDataFormat.vec3f32,
    });
    this.addDependency(Material);
    this.buffer = this.resource.data.shaderSlots[0].buffer;
  }

  get material(): Material {
    if (!this.#material) throw new Error("Material not found");
    return this.#material;
  }

  onInit() {
    this.#material = this.actor.getComponent<Material>(Material);
  }

  update(pass: GPURenderPassEncoder) {
    pass.setPipeline(
      Gpu.module.createRenderPipeline(
        Gpu.module.createBufferLayout(this.resource.data.shaderSlots),
        this.material,
      ),
    );

    if (this.buffer.__raw) {
      pass.setVertexBuffer(0, this.buffer.__raw);
    } else {
      pass.setVertexBuffer(0, this.buffer);
    }

    const stride = Gpu.module.getVertexArrayStride(
      this.resource.data.shaderSlots,
    );

    // if (
    //   this.resource.data.indices &&
    //   this.resource.data.indices.view.gpuBuffer
    // ) {
    //   console.log("render with index");
    // pass.setIndexBuffer(
    //   this.resource.data.indices.view.gpuBuffer,
    //   this.resource.data.indices.vertexType,
    //   this.resource.data.indices.byteOffset,
    //   this.resource.data.indices.byteLength,
    // );
    // pass.drawIndexed(this.resource.data.indices.count);
    // } else {
    // Draw without index data
    if (this.resource.data.shaderSlots[0].bufferData) {
      pass.draw(
        this.resource.data.vertexcount ||
          this.resource.data.shaderSlots[0].bufferData.length / (stride / 4),
      );
    }
    // }
  }
}
