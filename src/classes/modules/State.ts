import Module from "../../core/Module.ts";
import { defineProxyStore } from "../../../../pinata/lib/defineStore";

export default class State extends Module {
  #stores = new Map();
  static module: this;
  constructor() {
    super();
    console.log(this);
  }
  getStore(key: string) {
    console.log(this.#stores);
    return this.#stores.get(key);
  }
  setStore(key: string, value: any) {
    console.log(key, value);
    this.#stores.set(key, defineProxyStore(key, value));
  }
  delete(key: string) {
    this.#stores.delete(key);
  }
}
