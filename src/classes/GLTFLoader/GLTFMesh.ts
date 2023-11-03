import GLTFPrimitive from "./GLTFPrimitive.ts";

export default class GLTFMesh {
  constructor(
    private name: string,
    private primitives: GLTFPrimitive[],
  ) {
    console.group("GLTFMesh");
    console.log("name", name);
    console.log("primitives", primitives);
    console.groupEnd();
  }
  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    colorFormat: "bgra8unorm",
    depthFormat: GPUTextureFormat,
    uniformsBGLayout: GPUBindGroupLayout,
    nodeParamsBGLayout: GPUBindGroupLayout,
  ) {
    for (let i = 0; i < this.primitives.length; ++i) {
      this.primitives[i].buildRenderPipeline(
        device,
        shaderModule,
        colorFormat,
        depthFormat,
        uniformsBGLayout,
        nodeParamsBGLayout,
        this.name + "_" + i,
      );
    }
  }

  render(renderPassEncoder: GPURenderPassEncoder) {
    for (let i = 0; i < this.primitives.length; ++i) {
      this.primitives[i].render(renderPassEncoder);
    }
  }
}
