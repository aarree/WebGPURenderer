import GLTFNode from "./GLTFNode.ts";

export default class GLTFScene {
  constructor(readonly nodes: GLTFNode[]) {}

  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    colorFormat: "bgra8unorm",
    depthFormat: GPUTextureFormat,
    uniformsBGLayout: GPUBindGroupLayout,
  ) {
    for (const node of this.nodes) {
      node.buildRenderPipeline(
        device,
        shaderModule,
        colorFormat,
        depthFormat,
        uniformsBGLayout,
      );
    }
  }

  render(renderPassEncoder: GPURenderPassEncoder, uniformsBG: GPUBindGroup) {
    renderPassEncoder.setBindGroup(0, uniformsBG);

    for (const node of this.nodes) {
      node.render(renderPassEncoder);
    }
  }
}
