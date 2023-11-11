import Actor from "./Actor.ts";
// eslint-disable-next-line no-unused-vars
export type Class<T> = new (...args: any[]) => T;
export default abstract class Component {
  #actor?: Actor;
  #dependencies = new Map<Class<Component>, Component | undefined>();
  #initialized = false;

  addDependency(component: Class<Component>) {
    this.#dependencies.set(component, undefined);
  }

  init() {
    console.log(
      "All Dependencies resolved. Initializing:",
      this.constructor.name,
    );
    this.#initialized = true;
    this.onInit();
  }

  checkDependencies() {
    if (this.#initialized) return;

    let ready = true;

    for (let [requiredDependency] of this.#dependencies) {
      const dependency = this.actor.isComponentAvail(requiredDependency);

      if (!dependency) {
        console.warn(
          "Not all dependencies met for:",
          this.constructor.name,
          "Requires:",
          requiredDependency.name,
        );
        ready = false;
        return;
      }

      console.log(
        "Dependency met:",
        this.constructor.name,
        "Requires:",
        requiredDependency.name,
      );
      this.#dependencies.set(
        requiredDependency,
        this.actor.getComponent(requiredDependency),
      );
    }

    ready && this.init();
  }

  set actor(actor: Actor) {
    this.#actor = actor;
    actor.onUpdate((p) => this.update(p));
  }

  get actor() {
    if (!this.#actor) throw new Error("Actor not set");
    return this.#actor;
  }

  abstract onInit(): void;

  // eslint-disable-next-line no-unused-vars
  abstract update(pass: GPURenderPassEncoder): void;
}
