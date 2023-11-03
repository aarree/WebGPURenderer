import Renderer from "./classes/Renderer.ts";
import ArcballCamera from "./classes/ArcballCamera.ts";
import { InputController } from "./classes/InputController.ts";
import GLBLoader from "./classes/GLTFLoader/GLBLoader.ts";

// @ts-ignore
import testScene from "./assets/gltf/test.glb";
import AvocadoScene from "./assets/gltf/cube.glb";
import { mat2, mat4 } from "gl-matrix";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("no app avail");
}

app.innerHTML = `
    <h1>this is a webgpu app</h1>
    <canvas id="canvas" width="640" height="480"></canvas>
`;

const canvas: HTMLCanvasElement | null = app.querySelector("#canvas");

if (!canvas) {
  throw new Error("no canvas avail");
}

const initWebGpu = async () => {
  if (navigator.gpu === undefined) {
    throw new Error("WebGPU is not supported/enabled in your browser");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("no adapter avail");
  }

  const device = await adapter.requestDevice();
  if (!adapter) {
    throw new Error("no adapter avail");
  }

  const r = new Renderer(canvas, device);
  await r.initRenderer();
  requestAnimationFrame(r.render.bind(r));

  const camera = new ArcballCamera([0, 0, 1], [0, 0, 0], [0, 1, 0], 0.5, [
    canvas.width,
    canvas.height,
  ]);

  r.camera = camera;

  const controller = new InputController();

  controller.mousemove = (prev, cur, evt) => {
    if (evt.buttons == 1) {
      camera.rotate(prev, cur);
    } else if (evt.buttons == 2) {
      camera.pan([cur[0] - prev[0], prev[1] - cur[1]]);
    }
  };

  controller.wheel = (amt: number) => {
    camera.zoom(amt * 0.5);
  };
  controller.registerForCanvas(canvas);

  const simpleShader = r.shaderModules.get("normal");
  const bingroup = r.bindGroupLayout;

  const loadedTestScene = await fetch(testScene);

  const testbuffer = await loadedTestScene.arrayBuffer();
  const UTestScene = await GLBLoader.uploadGlb(testbuffer, device);

  const loadedAvoScene = await fetch(AvocadoScene);

  const buffer = await loadedAvoScene.arrayBuffer();
  const UAvoScene = await GLBLoader.uploadGlb(buffer, device);

  if (!simpleShader) throw new Error("select correct shader");
  if (!bingroup) throw new Error("select correct bindgroup");

  UTestScene.buildRenderPipeline(
    device,
    simpleShader,
    "bgra8unorm",
    "depth24plus-stencil8",
    bingroup,
  );

  UAvoScene.buildRenderPipeline(
    device,
    simpleShader,
    "bgra8unorm",
    "depth24plus-stencil8",
    bingroup,
  );
  // scene.nodes.forEach((node) => {
  //   node.buildRenderPipeline(
  //     device,
  //     simpleShader,
  //     "bgra8unorm",
  //     "depth24plus-stencil8",
  //     bingroup,
  //   );
  //   // r.addMesh(node.mesh);
  // });
  r.addScene(UAvoScene);
  // r.addScene(UTestScene);
};

initWebGpu();
const mat = mat4.create();
console.log("mat", mat);
