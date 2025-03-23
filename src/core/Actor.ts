import Component, { Class } from "./Component.ts";
import { OnUpdateCallback } from "../classes/SRenderer.ts";

export default class Actor {
  label: string;
  private _components;
  // eslint-disable-next-line no-unused-vars
  private _actorUpdateQueue: Array<(pass: GPURenderPassEncoder) => void> = [];

  constructor(label: string = "Actor") {
    this.label = label;
    this._components = new Map<string, Component>();
  }
  addComponent(label: string, component: Component) {
    console.group(
      "add",
      component.constructor.name,
      "Component to",
      label,
      "Actor",
    );

    console.log("SET MAP", label);

    // Check if component already exists
    if (this._components.has(label))
      throw new Error("Component name already exists");

    for (const [, componentInst] of this._components) {
      if (componentInst === component) {
        console.warn("Component already exists, component not added");
        console.groupEnd();

        return;
      }
    }

    // Add component
    this._components.set(label, component);
    component.actor = this;
    console.groupEnd();

    // Check dependencies
    for (const [, componentInst] of this._components) {
      componentInst.checkDependencies();
    }
  }

  onUpdate(callback: OnUpdateCallback) {
    this._actorUpdateQueue.push(callback);
  }

  isComponentAvail(module: Class<Component>) {
    for (const [, component] of this._components) {
      if (component instanceof module) return true;
    }
    return false;
  }

  getComponent<T>(module: Class<Component>): T {
    for (const [, component] of this._components) {
      if (component instanceof module) return component as T;
    }

    throw new Error(
      "Component not found. Pls make sure all dependenies are met. Acces to dependencies should only occure on Init",
    );
  }

  update(pass: GPURenderPassEncoder) {
    for (let actorUpdateQueueElement of this._actorUpdateQueue) {
      actorUpdateQueueElement(pass);
    }

    // console.log("render");
  }
}
