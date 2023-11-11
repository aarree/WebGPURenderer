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
  viewParamsBuffer?: GPUBuffer;

  // eslint-disable-next-line no-unused-vars
  #runOnUpdate = new Array<OnUpdateCallback>();

  activeCamera: Camera;
  private depthTexture: any;

  constructor(canvas: HTMLCanvasElement, cb: RendererCallback) {
    super();
    console.group("Renderer");
    console.log("Starting initialization of the WebGPU renderer");

    this.canvas = canvas;

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU is not supported/enabled in your browser");
    }

    this.context = context;

    this.activeCamera = new Camera(canvas);

    this.init().then(() => {
      this.viewParamsBuffer = this.device?.createBuffer({
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.depthTexture = this.device?.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      const defaultCameraActor = new Actor();

      defaultCameraActor.addComponent("defaultCamera", this.activeCamera);
      this.addActor(defaultCameraActor);

      console.log("WebGPU renderer initialized");
      cb && cb(this);
      console.groupEnd();
    });
  }

  onUpdate(cb: OnUpdateCallback) {
    this.#runOnUpdate.push(cb);
  }

  async init() {
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
  }
  
  setUpViewport(cmd: GPUCommandEncoder) {
    console.log("setupview", this.activeCamera);
    if (!this.activeCamera.buffer?.data) return;

    cmd.copyBufferToBuffer(
      this.activeCamera.updatedCameraProjectionBuffer,
      0,
      this.activeCamera.buffer?.data,
      0,
      16 * 4,
    );
  }
  
  createFrame(cb: CreateFrameCallback) {
    const encoder = this.device?.createCommandEncoder() as GPUCommandEncoder;

    this.setUpViewport(encoder);

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

    for (let runOnUpdateElement of this.#runOnUpdate) {
      runOnUpdateElement(pass);
    }

    cb(pass, encoder);

    pass?.end();

    const commandBuffer = encoder.finish() as GPUCommandBuffer;
    this.device?.queue.submit([commandBuffer]);
  }

  render() {
    this.createFrame((pass) => {
      for (let actor of this.actors) {
        actor.update(pass);
      }
    });
    // requestAnimationFrame(this.render.bind(this));
  }
}
