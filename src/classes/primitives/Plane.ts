import MeshRenderer from "../Components/MeshRenderer.ts";
import Resource, { ResourceType } from "../../core/Resource.ts";
import { shaderDefaultSlots } from "../modules/Shader.ts";

// This is not a Plane ^^ (but a triangle)
export default class Plane extends MeshRenderer {
  constructor() {
    // const res = new Resource({
    //   name: "Plane",
    //   shaderSlots: [...shaderDefaultSlots],
    //   data: ,
    //   type: ResourceType.Triangles,
    // });
    super(
      "plane",
      new Float32Array([
        1,
        -1,
        0,
        1, // position
        1,
        0,
        0,
        1, // color
        1,
        1, // uv

        -1,
        -1,
        0,
        1, // position
        0,
        1,
        0,
        1, // color
        1,
        1, // uv

        0,
        1,
        0,
        1, // position
        0,
        0,
        1,
        1, // color
        1,
        -1, // uv
      ]),
    );
  }
}
