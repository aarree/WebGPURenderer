import Renderer from "./classes/SRenderer.ts";
import { initCubeScene } from "./examples/Cube.ts";
import { initTriangleScene } from "./examples/Triangle.ts";

import { store } from "./state/Store.ts";
// @ts-ignore
import testScene from "./assets/gltf/test.glb";
import "./ui/webcomponents/Panel.ts";
import "./ui/webcomponents/Layout.ts";
import "./ui/webcomponents/WGPUDebug.ts";

const canvas: HTMLCanvasElement | null = document.querySelector("#canvas");

if (!canvas) {
  throw new Error("no canvas avail");
}
// TODO: Move engine state to store
const r = new Renderer(canvas);
// Wait until the renderer is ready before initializing the scenes.
await r.ready;
// initialize scenes
initCubeScene(r);
initTriangleScene(r);

// document.querySelector("#debug").actors = r.actors;

// bind camera rotation to store
store.state.rotation = r.activeCamera.camera.rotation;
r.activeCamera.camera.rotation = store.state.rotation;

// add camera to store
store.state.camera = r.activeCamera.camera;
