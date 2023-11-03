// @ts-ignore
import simple from "../shader/simple.wgsl";
import normal from "../shader/normal.wgsl";

import { getTriangle } from "../helper/SimpleBuffers.ts";
import { mat4 } from "gl-matrix";
import ArcballCamera from "./ArcballCamera.ts";
import GLTFMesh from "./GLTFLoader/GLTFMesh.ts";
import GLTFScene from "./GLTFLoader/GLTFScene.ts";

export default class Renderer {
  context: GPUCanvasContext;
  shaderModules = new Map<string, GPUShaderModule>();
  swapChainFormat: GPUTextureFormat = "bgra8unorm";
  private renderPassDescriptor: GPURenderPassDescriptor;
  private renderPipeline?: GPURenderPipeline;

  projection: mat4;

  projView = mat4.create();

  tempTriangleBuffer?: GPUBuffer;
  camera?: ArcballCamera;
  private meshes: GLTFMesh[] = [];
  private scenes: GLTFScene[] = [];
  private viewParamsBuffer?: GPUBuffer;
  private viewParamBG?: GPUBindGroup;
  bindGroupLayout?: GPUBindGroupLayout;
  private device: GPUDevice;

  constructor(
    private canvas: HTMLCanvasElement,
    device: GPUDevice,
  ) {
    console.group("WebGpuinitiaizing");
    const context = canvas.getContext("webgpu");

    this.device = device;

    if (!context) {
      throw new Error("No Webgpu context available");
    }

    this.context = context;

    const { depthTexture } = this.setupDepthTexture();

    this.renderPassDescriptor = this.createRenderPassDescriptor(depthTexture);

    this.projection = mat4.perspective(
      mat4.create(),
      (50 * Math.PI) / 180.0,
      this.canvas.width / this.canvas.height,
      0.01,
      1000,
    );

    console.info("Initial renderer Loaded");
    console.groupEnd();
  }

  addScene(scene: GLTFScene) {
    console.info("add scene:", scene);
    this.scenes.push(scene);
  }
  setupCameraProjectionMatrix() {
    // Create bind group layout
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    // Create render pipeline
    // const layout = this.device.createPipelineLayout({
    //   bindGroupLayouts: [bindGroupLayout],
    // });

    // Create a buffer to store the view parameters
    this.viewParamsBuffer = this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.viewParamBG = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: this.viewParamsBuffer } }],
    });
  }

  setupSwapChain() {
    console.info("setup swapchain");
    this.context.configure({
      device: this.device,
      format: this.swapChainFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  setupDepthTexture() {
    console.info("setup depthtexture");
    const depthFormat: GPUTextureFormat = "depth24plus-stencil8";
    const depthTexture = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
        depthOrArrayLayers: 1,
      },
      format: depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    return { depthFormat, depthTexture };
  }

  async initRenderer() {
    console.group("Init Renderer");

    const normalShader = await this.setupShaderModule(normal);
    // this.shaderModules.set("simple", simpleShader);
    this.shaderModules.set("normal", normalShader);

    const { dataBuffer, vertexState, fragmentState } = getTriangle(this.device);
    this.tempTriangleBuffer = dataBuffer;
    this.setupSwapChain();
    const { depthFormat } = this.setupDepthTexture();
    this.setupCameraProjectionMatrix();

    this.renderPipeline = this.createPipeLine(
      vertexState(normalShader),
      fragmentState(normalShader, this.swapChainFormat),
      depthFormat,
    );

    console.log(this.renderPipeline);

    console.groupEnd();
  }

  render() {
    if (
      !this.camera ||
      !this.viewParamsBuffer ||
      !this.renderPipeline ||
      !this.viewParamBG ||
      !this.tempTriangleBuffer
    )
      return;

    this.projView = mat4.mul(
      this.projView,
      this.projection,
      this.camera.camera,
    );

    const upload = this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });

    const map = new Float32Array(upload.getMappedRange());
    map.set(this.projView);
    upload.unmap();

    for (let colorAttachment of this.renderPassDescriptor.colorAttachments) {
      if (colorAttachment) {
        colorAttachment.view = this.context.getCurrentTexture().createView();
      }
    }

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      upload,
      0,
      this.viewParamsBuffer,
      0,
      16 * 4,
    );

    const renderPass = commandEncoder.beginRenderPass(
      this.renderPassDescriptor,
    );

    // this.meshes.forEach((mesh) => mesh.render(renderPass, this.viewParamBG));
    // console.log(this.scenes);
    this.scenes.forEach((scene: GLTFScene) =>
      scene.render(renderPass, this.viewParamBG),
    );

    // renderPass.setPipeline(this.renderPipeline);
    // renderPass.setBindGroup(0, this.viewParamBG);
    // renderPass.setVertexBuffer(0, this.tempTriangleBuffer);
    // renderPass.draw(3, 1, 0, 0);
    //
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.render.bind(this));
  }

  createRenderPassDescriptor(
    depthTexture: GPUTexture,
  ): GPURenderPassDescriptor {
    console.info("create render pass");

    const clrAta: GPURenderPassColorAttachment = {
      // view will be set to the current render target each frame
      // @ts-ignore
      view: undefined,
      loadOp: "clear",
      storeOp: "store",
    };

    return {
      colorAttachments: [clrAta],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: "clear",
        depthClearValue: 1.0,
        depthStoreOp: "store",
        stencilLoadOp: "clear",
        stencilClearValue: 0,
        stencilStoreOp: "store",
      },
    };
  }

  createPipeLine(
    vertexState: GPUVertexState,
    fragmentState: GPUFragmentState,
    depthFormat: GPUTextureFormat,
  ) {
    console.info("create render pipeline");
    if (!this.bindGroupLayout) throw new Error("Cant access bind group layout");
    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });
    const pipeline = this.device.createRenderPipeline({
      layout: layout,
      vertex: vertexState,
      fragment: fragmentState,
      depthStencil: {
        format: depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    return pipeline;
  }

  async setupShaderModule(shaderCode: string) {
    console.info("compile shaders");
    const start = performance.now();
    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    const compilationInfo = await shaderModule.getCompilationInfo();

    if (compilationInfo.messages.length > 0) {
      let hadError = false;
      console.log("Shader compilation log:");
      for (let i = 0; i < compilationInfo.messages.length; ++i) {
        const msg = compilationInfo.messages[i];
        console.log(`${msg.lineNum}:${msg.linePos} - ${msg.message}`);
        hadError = hadError || msg.type == "error";
      }
      if (hadError) {
        throw new Error("Shader cant be compiled");
      }
    }
    const end = performance.now();
    console.info(`Compile time: ${end - start} ms`);

    return shaderModule;
  }
}
