import System from "../core/System.ts";

export default class Renderer extends System {
  adapter?: GPUAdapter | null;
  device?: GPUDevice;
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;

  constructor(canvas: HTMLCanvasElement, cb?: (r: Renderer) => void) {
    super();
    console.group("Renderer");
    console.log("Starting initialization of the WebGPU renderer");

    this.canvas = canvas;

    const context = canvas.getContext("webgpu");

    if (!context) {
      throw new Error("WebGPU is not supported/enabled in your browser");
    }

    this.context = context;

    this.init().then(() => {
      console.log("WebGPU renderer initialized");
      cb && cb(this);
      console.groupEnd();
    });
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

    this.context.configure({
      device: this.device,
      format: "bgra8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  render() {
    this.actors.forEach((actor) => actor.render());
    requestAnimationFrame(this.render.bind(this));
  }
}
