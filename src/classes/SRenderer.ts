import System from "../core/System.ts";
import Camera from "./Components/Camera.ts";
import Actor from "../core/Actor.ts";
import Gpu from "./modules/Gpu.ts";
import Shader from "./modules/Shader.ts";

// eslint-disable-next-line no-unused-vars
export type OnUpdateCallback = (n: GPURenderPassEncoder) => void;
// eslint-disable-next-line no-unused-vars
type RendererCallback = (n: Renderer) => void;
export type CreateFrameCallback = (
  // eslint-disable-next-line no-unused-vars
  pass: GPURenderPassEncoder,
  // eslint-disable-next-line no-unused-vars
  cmd: GPUCommandEncoder,
) => void;
export default class Renderer extends System {
  adapter?: GPUAdapter | null;
  device?: GPUDevice;
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;

  // eslint-disable-next-line no-unused-vars
  #runOnUpdate = new Array<OnUpdateCallback>();

  activeCamera: Camera;
  private depthTexture: any;

  constructor(canvas: HTMLCanvasElement, cb: RendererCallback) {
    super();
    console.group("Renderer");
    console.log("Starting initialization of the WebGPU renderer");
    this.canvas = canvas;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.devicePixelContentBoxSize?.[0].inlineSize ||
            entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height = entry.devicePixelContentBoxSize?.[0].blockSize ||
            entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const canvas = entry.target as HTMLCanvasElement;
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        // re-render
      }
      
      this.depthTexture = this.device?.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      
      this.activeCamera.updateScreenSize(canvas.width, canvas.height);
      this.createFrame(() => {});

    });
    try {
      observer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(canvas, { box: "content-box" });
    }

   
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU is not supported/enabled in your browser");
    }

    this.context = context;

    this.activeCamera = new Camera(canvas);
    console.groupEnd();

    this.init().then(() => {
      console.group("After render initialization");

      this.depthTexture = this.device?.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      
      console.log("Viewparams & DepthTexture buffer initialized");

      const defaultCameraActor = new Actor();
      console.log("Default camera created");
      defaultCameraActor.addComponent("defaultCamera", this.activeCamera);
      console.log("Default camera attached to camera actor");
      this.addActor(defaultCameraActor);

      console.log("WebGPU renderer initialized");
      console.groupEnd();
      
      cb && cb(this);
    });
  }

  onUpdate(cb: OnUpdateCallback) {
    this.#runOnUpdate.push(cb);
  }

  async init() {
    console.group("Initializing WebGPU Renderer");
    if (navigator.gpu === undefined) {
      throw new Error("WebGPU is not supported/enabled in your browser");
    }

    this.adapter = await navigator.gpu.requestAdapter();

    if (!this.adapter) {
      throw new Error("no adapter avail");
    }

    this.device = await this.adapter.requestDevice();

    if (!this.device) {
      throw new Error("no adapter avail");
    }

    // Inititialize BaseModules
    Gpu.init(this.device as GPUDevice, this);
    Shader.init(this.device as GPUDevice);

    this.context.configure({
      device: this.device,
      format: "bgra8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    
    console.groupEnd()
  }
  
  createFrame(cb: CreateFrameCallback) {
    const encoder = this.device?.createCommandEncoder() as GPUCommandEncoder;

    this.activeCamera.updatedCameraProjectionBuffer();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
    // console.log("pass", pass);
    //
    // console.group("Render pass update");
    for (let runOnUpdateElement of this.#runOnUpdate) {
      runOnUpdateElement(pass);
    }
    // console.groupEnd();
    // console.group("Render pass callback");
    cb(pass, encoder);
    // console.groupEnd();

    pass?.end();

    const commandBuffer = encoder.finish() as GPUCommandBuffer;
    this.device?.queue.submit([commandBuffer]);
  }

  render() {
    // console.group("Render");
    const frameCallback = (pass: GPURenderPassEncoder) => {
      for (let actor of this.actors) {
        actor.update(pass);
      }
    }
    
    this.createFrame(frameCallback);
    requestAnimationFrame(this.render.bind(this));
    // console.groupEnd();
  }
}
