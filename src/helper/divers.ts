import { mat4, ReadonlyMat4, ReadonlyVec3, vec4 } from "gl-matrix";
import GLTFNode from "../classes/GLTFLoader/GLTFNode.ts";

export const alignTo = (val: number, align: number) => {
  return Math.floor((val + align - 1) / align) * align;
};
export const GLTFRenderMode = {
  POINTS: 0,
  LINE: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  // Note: fans are not supported in WebGPU, use should be
  // an error or converted into a list/strip
  TRIANGLE_FAN: 6,
};
enum GLTFComponentType {
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  INT = 5124,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
  DOUBLE = 5130,
}

export enum GLTFType {
  "SCALAR",
  "VEC2",
  "VEC3",
  "VEC4",
  "MAT2",
  "MAT3",
  "MAT4",
}

export function flattenTree(
  allNodes: any[],
  node: any,
  parentTransform: ReadonlyMat4,
): any {
  const flattened = [];
  const tfm = readNodeTransform(node);
  if (parentTransform != undefined) mat4.mul(tfm, parentTransform, tfm);

  // Add the flattened current node
  const n = {
    matrix: tfm,
    mesh: node["mesh"],
    camera: node["camera"],
  };
  flattened.push(n);

  // Loop through the node's children and flatten them as well
  if (node["children"]) {
    for (let i = 0; i < node["children"].length; ++i) {
      flattened.push(
        ...flattenTree(allNodes, allNodes[node["children"][i]], tfm),
      );
    }
  }
  return flattened;
}

export function readNodeTransform(node) {
  if (node["matrix"]) {
    const m = node["matrix"];
    // Both glTF and gl matrix are column major
    return mat4.fromValues(
      m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
      m[9],
      m[10],
      m[11],
      m[12],
      m[13],
      m[14],
      m[15],
    );
  } else {
    let scale = [1, 1, 1];
    let rotation = [0, 0, 0, 1];
    let translation = [0, 0, 0];
    if (node["scale"]) {
      scale = node["scale"];
    }
    if (node["rotation"]) {
      rotation = node["rotation"];
    }
    if (node["translation"]) {
      translation = node["translation"];
    }
    const m = mat4.create();
    return mat4.fromRotationTranslationScale(m, rotation, translation, scale);
  }
}

function gltfTypeNumComponents(type: GLTFType) {
  switch (type) {
    case GLTFType.SCALAR:
      return 1;
    case GLTFType.VEC2:
      return 2;
    case GLTFType.VEC3:
      return 3;
    case GLTFType.VEC4:
    case GLTFType.MAT2:
      return 4;
    case GLTFType.MAT3:
      return 9;
    case GLTFType.MAT4:
      return 16;
    default:
      throw Error(`Invalid glTF Type ${type}`);
  }
}

// Note: only returns non-normalized type names,
// so byte/ubyte = sint8/uint8, not snorm8/unorm8, same for ushort
export function gltfVertexType(
  componentType: GLTFComponentType,
  type: GLTFType,
): GPUVertexFormat {
  let typeStr: GPUVertexFormat;
  switch (componentType) {
    case GLTFComponentType.BYTE:
      // @ts-ignore
      typeStr = "sint8";
      break;
    case GLTFComponentType.UNSIGNED_BYTE:
      // @ts-ignore
      typeStr = "uint8";
      break;
    case GLTFComponentType.SHORT:
      // @ts-ignore
      typeStr = "sint16";
      break;
    case GLTFComponentType.UNSIGNED_SHORT:
      // @ts-ignore
      typeStr = "uint16";
      break;
    case GLTFComponentType.INT:
      // @ts-ignore
      typeStr = "int32";
      break;
    case GLTFComponentType.UNSIGNED_INT:
      // @ts-ignore
      typeStr = "uint32";
      break;
    case GLTFComponentType.FLOAT:
      // @ts-ignore
      typeStr = "float32";
      break;
    default:
      throw Error(`Unrecognized or unsupported glTF type ${componentType}`);
  }

  switch (gltfTypeNumComponents(type)) {
    case 1:
      // @ts-ignore
      return typeStr;
    case 2:
      // @ts-ignore
      return typeStr + "x2";
    case 3:
      // @ts-ignore
      return typeStr + "x3";
    case 4:
      // @ts-ignore
      return typeStr + "x4";
    default:
      throw Error(`Invalid number of components for gltfType: ${type}`);
  }
}

export function gltfTypeSize(componentType: GLTFComponentType, type: GLTFType) {
  var componentSize = 0;
  switch (componentType) {
    case GLTFComponentType.BYTE:
      componentSize = 1;
      break;
    case GLTFComponentType.UNSIGNED_BYTE:
      componentSize = 1;
      break;
    case GLTFComponentType.SHORT:
      componentSize = 2;
      break;
    case GLTFComponentType.UNSIGNED_SHORT:
      componentSize = 2;
      break;
    case GLTFComponentType.INT:
      componentSize = 4;
      break;
    case GLTFComponentType.UNSIGNED_INT:
      componentSize = 4;
      break;
    case GLTFComponentType.FLOAT:
      componentSize = 4;
      break;
    case GLTFComponentType.DOUBLE:
      componentSize = 8;
      break;
    default:
      throw Error("Unrecognized GLTF Component Type?");
  }
  return gltfTypeNumComponents(type) * componentSize;
}

export const parseGltfType = (type: string) => {
  switch (type) {
    case "SCALAR":
      return GLTFType.SCALAR;
    case "VEC2":
      return GLTFType.VEC2;
    case "VEC3":
      return GLTFType.VEC3;
    case "VEC4":
      return GLTFType.VEC4;
    case "MAT2":
      return GLTFType.MAT2;
    case "MAT3":
      return GLTFType.MAT3;
    case "MAT4":
      return GLTFType.MAT4;
    default:
      throw Error(`Unhandled glTF Type ${type}`);
  }
};
