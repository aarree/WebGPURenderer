import System from "../core/System.ts";
import Camera from "./Components/Camera.ts";
import Actor from "../core/Actor.ts";
import Gpu from "./modules/Gpu.ts";
import Shader from "./modules/Shader.ts";
import State from "./modules/State.ts";
import { defineProxyStore } from "../../../pinata/lib/defineStore";

export const { store, watch } = defineProxyStore("engine", {
  state: {
    canvas: { width: 0, height: 0 },
    actors: [],
  },
  actions: {},
});

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

  activeCamera!: Camera = {};
  private depthTexture: any;
  state;
  constructor(canvas: HTMLCanvasElement) {
    super();
    console.group("Renderer");
    console.log("Starting initialization of the WebGPU renderer");
    // State.init();

    // State.module.setStore("engine", {
    //   state: {
    //     canvas: { width: 0, height: 0 },
    //     actors: [],
    //   },
    //   actions: {},
    // });
    this.state = store.state;
    this._actors = this.state.actors;

    watch(["canvas"], () => {
      requestAnimationFrame(() => {
        canvas.width = this.state.canvas.width;
        canvas.height = this.state.canvas.height;

        this.depthTexture = this.device?.createTexture({
          size: [this.state.canvas.width, this.state.canvas.height],
          format: "depth24plus",
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
      });
    });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;

        this.state.canvas.width = Math.max(1, width);
        this.state.canvas.height = Math.max(1, height);
      }
    });

    try {
      observer.observe(canvas, {
        box: "device-pixel-content-box",
      });
    } catch {
      observer.observe(canvas, {
        box: "content-box",
      });
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU is not supported/enabled in your browser");
    }

    this.context = context;

    console.groupEnd();

    this._ready = this.init().then(() => {
      console.group("After render initialization");

      this.depthTexture = this.device?.createTexture({
        size: [this.state.canvas.width, this.state.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      console.log("Viewparams & DepthTexture buffer initialized");
      this.activeCamera = new Camera(canvas);

      const defaultCameraActor = new Actor("Camera");
      console.log("Default camera created");
      defaultCameraActor.addComponent("defaultCamera", this.activeCamera);
      console.log("Default camera attached to camera actor");
      this.addActor(defaultCameraActor);

      console.log("WebGPU renderer initialized");
      console.groupEnd();

      return true;
    });
  }

  onUpdate(cb: OnUpdateCallback) {
    this.#runOnUpdate.push(cb);
  }

  private async init() {
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

    // Inititialize DeviceModules
    Gpu.init(this.device as GPUDevice, this);
    Shader.init(this.device as GPUDevice);

    this.context.configure({
      device: this.device,
      format: "bgra8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    console.groupEnd();
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
          clearValue: { r: 255, g: 255, b: 255, a: 1 },
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
      for (let actor of this.state.actors) {
        actor.update(pass);
      }
    };

    this.createFrame(frameCallback);
    requestAnimationFrame(this.render.bind(this));
    // console.groupEnd();
  }
}
