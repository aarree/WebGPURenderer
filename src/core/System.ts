import Actor from "./Actor.ts";

export default class System {
  static all: System[] = [];

  constructor() {
    console.group("System");
    console.log(this.constructor.name, "System Initialized");
    console.log("Systemdata:", this);
    System.all.push(this);
    console.groupEnd();
  }

  private _ready: Promise.IThenable<this>;
  public get ready(): Promise.IThenable<this> {
    return this._ready.then(() => {
      return this;
    });
  }

  private _actors: Actor[] = [];

  get actors(): Actor[] {
    return this._actors;
  }

  public addActor(actor: Actor): void {
    this._actors.push(actor);
  }

  public removeActor(actor: Actor): void {
    this._actors = this.actors.filter((a) => a !== actor);
  }
}
