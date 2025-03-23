export default abstract class Module {
  static module: this;
  protected constructor() {}

  static init(...args: unknown): Module {
    if (!this.module) {
      this.module = new this(...args);
    }
    return this.module;
  }
}
