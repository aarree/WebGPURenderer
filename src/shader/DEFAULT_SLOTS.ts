import {
  ShaderDataFormat,
  ShaderSlot,
  SlotType,
} from "../core/Resource.ts";

export const shaderSlotWrapper = (slots: ShaderSlot[]) => `
alias vec3f32 = vec3<f32>;
alias vec4f32 = vec4<f32>;
alias vec2f32 = vec2<f32>;
alias mat4f32 = mat4x4<f32>;


struct VertexInput {
    ${slots
      .map((slot) =>
        slot.type === SlotType.position
          ? `@location(${slot.position}) ${slot.name.toLowerCase()}: ${
              ShaderDataFormat[slot.dataType]
            },`
          : "",
      )
      .join("\r\n\t")}
};

struct VertexOutput {
    @builtin(position) position: vec4f32,
    ${slots
      .map((slot) =>
        (slot.type === SlotType.positionOut) || (slot.type == SlotType.position)
          ? `@location(${slot.position}) frag_${slot.name.toLowerCase()}: ${
              ShaderDataFormat[slot.dataType]
            },`
          : "",
      )
      .join("\r\n\t")}  
};
`;
