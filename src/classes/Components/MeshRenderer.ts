import Component from "../../core/Component.ts";
import Resource from "../../core/Resource.ts";
import Gpu from "../modules/Gpu.ts";
import Material from "./Material.ts";

export default class MeshRenderer extends Component {
  resource: Resource;
  #material?: Material;

  constructor(res: Resource) {
    super();
    this.resource = res;
    this.addDependency(Material);
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
        this.resource.buffer.layout,
        this.material,
      ),
    );

    pass.setVertexBuffer(0, this.resource.buffer.data);

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
      pass.draw(
        this.resource.data.vertexcount ||
          this.resource.data.data.length / (stride / 4),
      );
    // }
  }
}
