export default class GLTFBuffer {
  buffer: Uint8Array;
  constructor(buffer: ArrayBufferLike, offset: number, size: number) {
    this.buffer = new Uint8Array(buffer, offset, size);
  }
}
