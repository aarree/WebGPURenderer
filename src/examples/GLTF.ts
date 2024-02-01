import testScene from "../assets/gltf/test.glb";
import GLBLoader from "../classes/GLTFLoader/GLBLoader.ts";
import Resource from "../core/Resource.ts";
import Material from "../classes/Components/Material.ts";
import Actor from "../core/Actor.ts";
import Renderer from "../classes/SRenderer.ts";
import GLTFNormalMaterial from "../classes/Components/GLTFNormalMaterial.ts";

const loadedTestScene = await fetch(testScene);

const testbuffer = await loadedTestScene.arrayBuffer();

export const initGLTFScene = (r: Renderer) => {
  const mat = new GLTFNormalMaterial({
    name: "TriangleMaterial",
  });

  const { jsonChunk, binaryChunk } = GLBLoader.getGLTFChunks(testbuffer);

  const { bufferViews } = GLBLoader.createBufferViews(jsonChunk, binaryChunk);
  console.log("bufferViews", bufferViews);

  const { accessors } = GLBLoader.createAccessors(jsonChunk, bufferViews);
  console.log("accessors:", accessors);
  console.log(`glTF file has ${jsonChunk.meshes.length} meshes`);

  const { gltfMeshes } = GLBLoader.createMesh(jsonChunk, accessors);
  console.log("gltfMesh:", gltfMeshes);

  gltfMeshes.forEach((mesh: Actor) => {
    mesh.addComponent("gltfMaterial", mat);
    r.addActor(mesh);
  });

  r.render();

  r.canvas.addEventListener("click", () => r.render());

  // const shader = r.shaderModules.get("normal");
  // const bingroup = r.bindGroupLayout;
  //
  // const loadedTestScene = await fetch(testScene);
  //
  // const testbuffer = await loadedTestScene.arrayBuffer();
  // const UTestScene = await GLBLoader.uploadGlb(testbuffer, device);
  //
  // const loadedAvoScene = await fetch(AvocadoScene);
  //
  // const buffer = await loadedAvoScene.arrayBuffer();
  // const UAvoScene = await GLBLoader.uploadGlb(buffer, device);
  //
  // if (!shader) throw new Error("select correct shader");
  // if (!bingroup) throw new Error("select correct bindgroup");
  //
  // UTestScene.buildRenderPipeline(
  //   device,
  //   shader,
  //   "bgra8unorm",
  //   "depth24plus-stencil8",
  //   bingroup,
  // );
  //
  // UAvoScene.buildRenderPipeline(
  //   device,
  //   shader,
  //   "bgra8unorm",
  //   "depth24plus-stencil8",
  //   bingroup,
  // );
  // // scene.nodes.forEach((node) => {
  // //   node.buildRenderPipeline(
  // //     device,
  // //     simpleShader,
  // //     "bgra8unorm",
  // //     "depth24plus-stencil8",
  // //     bingroup,
  // //   );
  // //   // r.addMesh(node.mesh);
  // // });
  // r.addScene(UAvoScene);
  // // r.addScene(UTestScene);
};
