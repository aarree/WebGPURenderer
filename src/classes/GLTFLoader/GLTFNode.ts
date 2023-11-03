import GLTFMesh from "./GLTFMesh.ts";

export default class GLTFNode {
  private nodeParamsBuf: GPUBuffer;
  private nodeParamsBG: GPUBindGroup;
  constructor(
    readonly name: string,
    public transform,
    readonly mesh: GLTFMesh,
  ) {
    console.log(this);
  }

  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    colorFormat: "bgra8unorm",
    depthFormat: GPUTextureFormat,
    uniformsBGLayout: GPUBindGroupLayout,
  ) {
    // Upload the node transform
    this.nodeParamsBuf = device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.nodeParamsBuf.getMappedRange()).set(this.transform);
    this.nodeParamsBuf.unmap();

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    this.nodeParamsBG = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.nodeParamsBuf } }],
    });

    this.mesh.buildRenderPipeline(
      device,
      shaderModule,
      colorFormat,
      depthFormat,
      uniformsBGLayout,
      bindGroupLayout,
    );
  }

  // translate() {
  //   // Translate the node to the origin
  //   const translation = vec3.create();
  //   vec3.set(translation, 0, 0, -1);
  //   mat4.translate(this.transform, this.transform, translation);
  //   console.log(this.transform);
  // }

  render(renderPassEncoder: GPURenderPassEncoder) {
    // Bind the node parameters bind group containing the node transform
    renderPassEncoder.setBindGroup(1, this.nodeParamsBG);
    this.mesh.render(renderPassEncoder);
    // this.translate();
  }
}
