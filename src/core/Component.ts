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

  private async init() {
    console.group("Initializing", this.constructor.name, "Component");
    console.log(
      "All Dependencies resolved. Initializing:",
      this.constructor.name,
    );
    this.#initialized = true;
    await this.onInit();
    console.groupEnd();
  }

  checkDependencies() {
    // TODO: simplify this
    console.group("Checking Dependencies and inititalize Component");
    if (this.#initialized) {
      console.groupEnd();

      return;
    }

    let ready = true;
    console.log("check dependencies");
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
        
        console.groupEnd();
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
    console.log("successfully checked dependencies");
    console.groupEnd();
    // TODO: init should be separated from check dependencies
    ready && this.init();
  }

  set actor(actor: Actor) {
    this.#actor = actor;
    const updateActor = (p:  GPURenderPassEncoder) => this.update(p)
    actor.onUpdate(updateActor);
  }

  get actor() {
    if (!this.#actor) throw new Error("Actor not set");
    return this.#actor;
  }

  abstract onInit(): void;

  // eslint-disable-next-line no-unused-vars
  abstract update(pass: GPURenderPassEncoder): void;
}
