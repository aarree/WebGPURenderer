import Module from "../../core/Module.ts";

export default class Gpu extends Module {
  static module: Gpu;

  device: GPUDevice;
  private constructor(device: GPUDevice) {
    super();

    Gpu.module = this;
    this.device = device;
  }

  static init(device: GPUDevice) {
    if (this.module) {
      return this.module;
    }

    return new Gpu(device);
  }
}
