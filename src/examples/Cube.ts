import Renderer from "../classes/SRenderer.ts";
import Material from "../classes/Components/Material.ts";
import Actor from "../core/Actor.ts";
import Cube from "../classes/primitives/PCube.ts";
import SimpleMaterial from "../classes/Components/SimpleMaterial.ts";

export const initCubeScene = async (r: Renderer) => {
  const mat = new SimpleMaterial({
    name: "TriangleMaterial",
  });

  const cube = new Actor();
  cube.addComponent("Simple Cube", new Cube());
  cube.addComponent("Material", mat);

  r.addActor(cube);

  r.render();
  // render next frame ion click instread of animation frame. Easier to debug.
  r.canvas.addEventListener("click", () => r.render());
};
