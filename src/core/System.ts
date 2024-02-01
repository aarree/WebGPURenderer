import Actor from "./Actor.ts";

export default class System {
  static all: System[] = [];
  
  constructor() {
    console.group('System');
    console.log(this.constructor.name ,'System Initialized');
    console.log('Systemdata:', this);
    System.all.push(this);
    console.groupEnd();
  }
  
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
