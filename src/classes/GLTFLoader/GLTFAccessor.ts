import GLTFBufferView from "./GLTFBufferView";
import {
  GLTFType,
  gltfTypeSize,
  gltfVertexType,
  parseGltfType,
} from "../../helper/divers";

interface AccessorDataModel {
  bufferView: number;
  componentType: number;
  count: number;
  type: "VEC3" | "VEC2" | "VEC4" | "SCALAR";
  max: number[];
  min: number[];
  byteOffset?: number;
}

export default class GLTFAccessor {
  private gltfType: GLTFType;
  count: number;
  private componentType: number;
  view: GLTFBufferView;
  byteOffset = 0;
  constructor(view: GLTFBufferView, accessor: AccessorDataModel) {
    this.count = accessor.count;
    this.componentType = accessor.componentType;
    this.gltfType = parseGltfType(accessor.type);
    this.view = view;

    if (accessor.byteOffset) {
      this.byteOffset = accessor.byteOffset;
    }
  }
  get byteLength() {
    return this.count * this.byteStride;
  }
  get byteStride() {
    const elementSize = gltfTypeSize(this.componentType, this.gltfType);
    // console.log(this.view.byteStride);
    return Math.max(elementSize, this.view.byteStride);
  }

  // Get the vertex attribute type for accessors that are
  // used as vertex attributes
  get vertexType(): GPUVertexFormat {
    return gltfVertexType(this.componentType, this.gltfType);
  }
}
