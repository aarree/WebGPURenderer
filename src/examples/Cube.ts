import Renderer from "../classes/SRenderer.ts";
import Actor from "../core/Actor.ts";
import Cube from "../classes/primitives/PCube.ts";
import SimpleMaterial from "../classes/Components/SimpleMaterial.ts";
import Transform from "../classes/Components/Transform.ts";

export const initCubeScene = async (r: Renderer) => {
  console.group("initCubeScene");
  const mat = new SimpleMaterial({
    name: "CubeMaterial",
  });

  const cube = new Actor("Cube");
  r.addActor(cube);

  cube.addComponent("Transform", new Transform());
  cube.addComponent("Simple Cube", new Cube());
  cube.addComponent("Material", mat);

  console.log("cube", cube);

  r.render();
  // render next frame ion click instead of animation frame. Easier to debug.
  // request animationFrame needs to be disabled
  // r.canvas.addEventListener("click", () => r.render());
  console.groupEnd();
};
