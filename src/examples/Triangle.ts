import Renderer from "../classes/SRenderer.ts";
import Material from "../classes/Components/Material.ts";
import Actor from "../core/Actor.ts";
import Plane from "../classes/primitives/Plane.ts";
import SimpleMaterial from "../classes/Components/SimpleMaterial.ts";

export const initTriangleScene = async (r: Renderer) => {
  const mat = new SimpleMaterial({
    name: "TriangleMaterial",
  });

  const plane = new Actor();
  plane.addComponent("Simple Rectangle", new Plane());
  plane.addComponent("Material", mat);

  r.addActor(plane);

  r.render();

  // render next frame ion click instread of animation frame. Easier to debug.
  r.canvas.addEventListener("click", () => r.render());
};
