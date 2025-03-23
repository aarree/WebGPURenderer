import Shader from "../classes/modules/Shader.ts";
import { ShaderDataFormat, ShaderGroup, ShaderSlot } from "../core/Resource.ts";
export const shaderSlotWrapper = () => {
  const UNIFORMS: string[] = [];

  Shader.defaultSlots.forEach((slot) => {
    UNIFORMS.push(
      `${slot.name.toLowerCase()}: ${ShaderDataFormat[slot.dataType]},`,
    );
    console.log("SLOT", UNIFORMS);
  });
  return `
alias vec3f32 = vec3<f32>;
alias vec4f32 = vec4<f32>;
alias vec2f32 = vec2<f32>;
alias mat4f32 = mat4x4<f32>;

struct VertexInput {
@location(0) position: vec4f32,
@location(1) color: vec4f32

}

struct VertexOutput {
@builtin(position) position: vec4f32,
@location(0) frag_color: vec4f32,
@location(1) frag_position: vec4f32
}


struct Uniforms {
  ${UNIFORMS.join("\r\n\t")}
}

@group(1) @binding(0)
var<uniform>view_params: Uniforms;
`;
};

export const shaderSlotWrapperO = (
  slots: ShaderSlot[],
  uniforms: ShaderSlot[] = [],
) => {
  console.log(slots);
  console.log("customs", uniforms);
  return `
alias vec3f32 = vec3<f32>;
alias vec4f32 = vec4<f32>;
alias vec2f32 = vec2<f32>;
alias mat4f32 = mat4x4<f32>;


struct VertexInput {
    ${slots
      .map((slot) =>
        slot.shaderGroup === ShaderGroup.VERTEX
          ? `@location(${slot.position}) ${slot.name.toLowerCase()}: ${
              ShaderDataFormat[slot.dataType]
            },`
          : "",
      )
      .join("\r\n\t")}
};

struct Uniforms {
  ${Shader.defaultSlots
    .map((slot) => {
      console.log("SLOT", slot);
      return `${slot.name.toLowerCase()}: ${ShaderDataFormat[slot.dataType]},`;
    })
    .join("\r\n\t")}
}


struct VertexOutput {
    @builtin(position) position: vec4f32,
    ${slots
      .map((slot) =>
        slot.shaderGroup === ShaderGroup.VERTEX
          ? `@location(${slot.position}) frag_${slot.name.toLowerCase()}: ${
              ShaderDataFormat[slot.dataType]
            },`
          : "",
      )
      .join("\r\n\t")}
};
@group(0) @binding(0)
var<uniform>view_params: Uniforms;
`;
};

const customs = (slots: ShaderSlot[]) => {
  if (slots.length > 0) {
    return `struct Customs {
      ${slots
        .map(
          (slot) =>
            `${slot.name.toLowerCase()}: ${ShaderDataFormat[slot.dataType]},`,
        )
        .join("\r\n\t")}
    }
    
    @group(${ShaderGroup.UPDATEABLE}) @binding(0)
    var<uniform>customs: Customs;
    `;
  } else {
    return ``;
  }
};

// ${Shader.defaultSlots
//   .map((slot) => {
//     console.log("SLOT", slot);
//     return  `
// @group(0) @binding(${slot.shaderGroup || 0})
// var<uniform>${slot.name.toLowerCase()}: Uniforms;`;
//    })
//    .join("\r\n\t")}

// ${slots
//   .map((slot) => {
//     console.log("SLOT", slot);
//     return slot.type === SlotType.binding
//       ? `@group(0) @binding(${slot.binding || 0})
// var<uniform>${slot.name.toLowerCase()}: Uniforms;`
//        : "";
//    })
//    .join("\r\n\t")}

// struct Uniforms {
//   ${slots
//     .map((slot) => {
//       console.log("SLOT", slot);
//       return slot.shaderGroup === ShaderGroup.UPDATEABLE
//         ? `${slot.name.toLowerCase()}: ${ShaderDataFormat[slot.dataType]},`
//         : "";
//     })
//     .join("\r\n\t")}
//  }

//  @group(0) @binding(0)
//  var<uniform> view_params: Uniforms;
