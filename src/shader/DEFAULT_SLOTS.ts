import { ShaderSlot } from "../core/Resource.ts";

export const shaderSlotWrapper = (slots: ShaderSlot[]) => `
alias float4 = vec4<f32>;
alias float2 = vec2<f32>;


struct VertexInput {
    ${slots
      .map(
        (slot) =>
          `@location(${slot.position}) ${slot.name.toLowerCase()}: float${
            slot.size
          },`,
      )
      .join("\r\n\t")}
};

struct VertexOutput {
    @builtin(position) position: float4,
    ${slots
      .map(
        (slot) =>
          `@location(${slot.position}) frag_${slot.name.toLowerCase()}: float${
            slot.size
          },`,
      )
      .join("\r\n\t")}  
};
`;
