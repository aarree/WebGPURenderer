import GLTFBuffer from "./GLTFBuffer";
import { alignTo } from "../../helper/divers";

export interface BufferViewModel {
  buffer: number;
  byteLength: number;
  byteOffset?: number;
  byteStride?: number;
}
export default class GLTFBufferView {
  view: ArrayBufferView;
  length: number;
  byteStride = 0;
  viewOffset = 0;
  gpuBuffer: GPUBuffer | null;
  usage: number;
  needsUpload = true;
  constructor(buffer: GLTFBuffer, view: BufferViewModel) {
    console.group("Buffer View");

    console.log("Buffer View", view);

    this.length = view["byteLength"];

    console.log("Buffer view Length:", this.length);

    if (view["byteStride"] !== undefined) {
      this.byteStride = view["byteStride"];
    }

    console.log("ByteStride:", this.byteStride);

    if (view["byteOffset"] !== undefined) {
      this.viewOffset = view["byteOffset"];
    }

    console.log("View Offset:", this.viewOffset);

    this.view = buffer.buffer.subarray(
      this.viewOffset,
      this.viewOffset + this.length,
    );

    console.log(this.view.byteLength);

    this.needsUpload = false;
    this.gpuBuffer = null;
    this.usage = 0;

    console.groupEnd();
  }
  // When this buffer is referenced as vertex data or index data we
  // add the corresponding usage flag here so that the GPU buffer can
  // be created properly.
  addUsage(usage: number) {
    this.usage = this.usage | usage;
  }
  // Upload the buffer view to a GPU buffer
  upload(device: GPUDevice) {
    // Note: must align to 4 byte size when mapped at creation is true
    const buf = device.createBuffer({
      size: alignTo(this.view.byteLength, 4),
      usage: this.usage,
      mappedAtCreation: true,
    });
    // @ts-ignore
    new this.view.constructor(buf.getMappedRange()).set(this.view);
    buf.unmap();
    this.gpuBuffer = buf;
    this.needsUpload = false;
  }
}
