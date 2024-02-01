import Renderer from "../classes/SRenderer.ts";
import Actor from "../core/Actor.ts";
import Cube from "../classes/primitives/PCube.ts";
import SimpleMaterial from "../classes/Components/SimpleMaterial.ts";

export const initCubeScene = async (r: Renderer) => {
  console.group("initCubeScene");
  const mat = new SimpleMaterial({
    name: "CubeMaterial",
  });

  const cube = new Actor();
  cube.addComponent("Simple Cube", new Cube());
  cube.addComponent("Material", mat);

  console.log("cube", cube);

  r.addActor(cube);

  r.render();
  // render next frame ion click instread of animation frame. Easier to debug.
  // request animationFrame needs to be disabled
  // r.canvas.addEventListener("click", () => r.render());
  console.groupEnd();
};
