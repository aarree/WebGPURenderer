export default abstract class Module {
  static module: Module;
  protected constructor() {}

  static init(...args: any): Module {
    throw Error("Not Implemented. Args:", args);
  }
}
