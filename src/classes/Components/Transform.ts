import Component from "../../core/Component.ts";
import Resource, {
  ResourceType,
  ShaderDataFormat,
  ShaderGroup,
} from "../../core/Resource.ts";
import { vec3 } from "gl-matrix";
import MeshRenderer from "./MeshRenderer.ts";
import Material from "./Material.ts";

export default class Transform extends Component {
  transform = vec3.create();
  #transformResource: Resource;
  constructor() {
    super();

    // TODO: Make that work with the shader system
    this.#transformResource = new Resource({
      type: ResourceType.Uniform,
      name: "Object Transform",
      shaderGroup: ShaderGroup.DEFAULT,
      dataFormat: ShaderDataFormat.vec3f32,
      shaderSlots: [
        {
          name: "transform",
          bufferData: this.transform,
          size: 8,
          position: 1,
          dataType: ShaderDataFormat.vec3f32,
        },
      ],
    });

    this.addDependency(MeshRenderer);
    this.addDependency(Material);
  }

  update(pass: GPURenderPassEncoder) {}

  onInit() {
    this.actor
      .getComponent<Material>(Material)
      .addUniform(this.#transformResource.data.shaderSlots[0]);
  }
}
