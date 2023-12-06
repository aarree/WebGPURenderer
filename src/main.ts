import Renderer from "./classes/SRenderer.ts";
import { initCubeScene } from "./examples/Cube.ts";
import { initTriangleScene } from "./examples/Triangle.ts";
// @ts-ignore
import testScene from "./assets/gltf/test.glb";
import { initGLTFScene } from "./examples/GLTF.ts";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("no app avail");
}

app.innerHTML = `
    <h1>This is a webgpu app</h1>
    <canvas id="canvas" width="640" height="480"></canvas>
`;

const canvas: HTMLCanvasElement | null = app.querySelector("#canvas");

if (!canvas) {
  throw new Error("no canvas avail");
}

new Renderer(canvas, initGLTFScene);
// new Renderer(canvas, initTriangleScene);
