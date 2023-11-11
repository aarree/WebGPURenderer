import Component, { Class } from "./Component.ts";
import { OnUpdateCallback } from "../classes/SRenderer.ts";

export default class Actor {
  #components = new Map<string, Component>();
  // eslint-disable-next-line no-unused-vars
  #actorUpdateQueue: Array<(pass: GPURenderPassEncoder) => void> = [];
  addComponent(label: string, component: Component) {
    // Check if component already exists
    if (this.#components.has(label))
      throw new Error("Component name already exists");

    for (const [, componentInst] of this.#components) {
      if (componentInst === component) {
        console.warn("Component already exists, component not added");
        return;
      }
    }

    // Add component
    this.#components.set(label, component);
    component.actor = this;

    // Check dependencies
    for (const [, componentInst] of this.#components) {
      componentInst.checkDependencies();
    }
  }

  onUpdate(callback: OnUpdateCallback) {
    this.#actorUpdateQueue.push(callback);
  }

  isComponentAvail(module: Class<Component>) {
    for (const [, component] of this.#components) {
      if (component instanceof module) return true;
    }
    return false;
  }

  getComponent<T>(module: Class<Component>): T {
    for (const [, component] of this.#components) {
      if (component instanceof module) return component as T;
    }

    throw new Error(
      "Component not found. Pls make sure all dependenies are met. Acces to dependencies should only occure on Init",
    );
  }

  update(pass: GPURenderPassEncoder) {
    for (let actorUpdateQueueElement of this.#actorUpdateQueue) {
      actorUpdateQueueElement(pass);
    }

    console.log("render");
  }
}
