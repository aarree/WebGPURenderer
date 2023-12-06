import GLTFAccessor from "./GLTFAccessor";
import { GLTFRenderMode } from "../../helper/divers.ts";

export default class GLTFPrimitive {
  private positions: GLTFAccessor;
  private indices: GLTFAccessor;
  private topology: number;
  renderPipeline: GPURenderPipeline | null;
  constructor(
    positions: GLTFAccessor,
    indices: GLTFAccessor,
    topology: number,
  ) {
    this.positions = positions;
    this.indices = indices;
    this.topology = topology;
    this.renderPipeline = null;
    // Set usage for the positions data and flag it as needing upload
    this.positions.view.needsUpload = true;
    this.positions.view.addUsage(GPUBufferUsage.VERTEX);

    if (this.indices) {
      // Set usage for the indices data and flag it as needing upload
      this.indices.view.needsUpload = true;
      this.indices.view.addUsage(GPUBufferUsage.INDEX);
    }
  }

  buildRenderPipeline(
    device: GPUDevice,
    shaderModule: GPUShaderModule,
    colorFormat: "bgra8unorm",
    depthFormat: GPUTextureFormat,
    uniformsBGLayout: GPUBindGroupLayout,
    nodeParamsBGLayout: GPUBindGroupLayout,
    label: string,
  ) {
    const vertexAtrributes: GPUVertexAttribute = {
      format: this.positions.vertexType,
      offset: 0,
      shaderLocation: 0,
    };

    const buffer: GPUVertexBufferLayout = {
      arrayStride: this.positions.byteStride,
      attributes: [
        // Note: We do not pass the positions.byteOffset here, as its
        // meaning can vary in different glB files, i.e., if it's
        // being used for interleaved element offset or an absolute
        // offset.
        vertexAtrributes,
      ],
    };
    // Vertex attribute state and shader stage
    const vertexState: GPUVertexState = {
      // Shader stage info
      module: shaderModule,
      entryPoint: "vertex_main",
      // Vertex buffer info
      buffers: [buffer],
    };

    const fragmentState: GPUFragmentState = {
      // Shader info
      module: shaderModule,
      entryPoint: "fragment_main",
      // Output render target info
      targets: new Array<GPUColorTargetState>({ format: colorFormat }),
    };

    // Our loader only supports triangle lists and strips, so by default we set
    // the primitive topology to triangle list, and check if it's
    // instead a triangle strip
    const primitive: GPUPrimitiveState = {
      topology: "triangle-list",
    };

    if (this.topology === GLTFRenderMode.TRIANGLE_STRIP) {
      primitive.topology = "triangle-strip";
      primitive.stripIndexFormat = this.indices.vertexType;
    }

    const layout = device.createPipelineLayout({
      bindGroupLayouts: [uniformsBGLayout, nodeParamsBGLayout],
    });

    this.renderPipeline = device.createRenderPipeline({
      label: label,
      layout: layout,
      vertex: vertexState,
      fragment: fragmentState,
      primitive: primitive,
      depthStencil: {
        format: depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });
  }

  render(renderPassEncoder: GPURenderPassEncoder) {
    if (!this.renderPipeline) throw new Error("create a renderpipline first");
    renderPassEncoder.setPipeline(this.renderPipeline);

    // Apply the accessor's byteOffset here to handle both global and interleaved
    // offsets for the buffer. Setting the offset here allows handling both cases,
    // with the downside that we must repeatedly bind the same buffer at different
    // offsets if we're dealing with interleaved attributes.
    // Since we only handle positions at the moment, this isn't a problem.
    renderPassEncoder.setVertexBuffer(
      0,
      this.positions.view.gpuBuffer,
      this.positions.byteOffset,
      this.positions.byteLength,
    );

    if (this.indices && this.indices.view.gpuBuffer) {
      renderPassEncoder.setIndexBuffer(
        this.indices.view.gpuBuffer,
        this.indices.vertexType,
        this.indices.byteOffset,
        this.indices.byteLength,
      );
      renderPassEncoder.drawIndexed(this.indices.count);
    } else {
      renderPassEncoder.draw(this.positions.count);
    }
  }
}
