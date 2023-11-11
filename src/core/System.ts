import Actor from "./Actor.ts";

export default class System {
  #actors: Actor[] = [];

  get actors(): Actor[] {
    return this.#actors;
  }

  public addActor(actor: Actor): void {
    this.#actors.push(actor);
  }

  public removeActor(actor: Actor): void {
    this.#actors = this.#actors.filter((a) => a !== actor);
  }
}
