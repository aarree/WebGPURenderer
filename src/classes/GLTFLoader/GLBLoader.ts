import GLTFBuffer from "./GLTFBuffer.ts";
import GLTFBufferView from "./GLTFBufferView.ts";
import GLTFAccessor from "./GLTFAccessor.ts";
import GLTFPrimitive from "./GLTFPrimitive.ts";
import GLTFMesh from "./GLTFMesh.ts";
import {
  flattenTree,
  GLTFRenderMode,
  readNodeTransform,
} from "../../helper/divers.ts";
import GLTFNode from "./GLTFNode.ts";
import GLTFScene from "./GLTFScene.ts";

export default class GLBLoader {
  constructor() {}

  static checkGLTFHeader(header: Uint32Array) {
    console.log(header);
    // Validate glb file contains correct magic value
    if (header[0] != 0x46546c67) {
      throw Error("Provided file is not a glB file");
    }
    if (header[1] != 2) {
      throw Error("Provided file is glTF 2.0 file");
    }
    // Validate that first chunk is JSON
    if (header[4] != 0x4e4f534a) {
      throw Error(
        "Invalid glB: The first chunk of the glB file is not a JSON chunk!",
      );
    }
  }

  static getGLTFChunks(buffer: ArrayBufferLike) {
    const header = new Uint32Array(buffer, 0, 5);

    this.checkGLTFHeader(header);

    const jsonChunk = JSON.parse(
      new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, header[3])),
    );

    const binaryHeader = new Uint32Array(buffer, 20 + header[3], 2);
    if (binaryHeader[1] != 0x004e4942) {
      throw Error(
        "Invalid glB: The second chunk of the glB file is not a binary chunk!",
      );
    }

    const binaryChunk = new GLTFBuffer(buffer, 28 + header[3], binaryHeader[0]);
    return { binaryChunk, jsonChunk };
  }

  static createAccessors(jsonChunk: any, bufferViews: GLTFBufferView[]) {
    const accessors = [];
    for (let i = 0; i < jsonChunk.accessors.length; ++i) {
      const accessorInfo = jsonChunk.accessors[i];
      const viewID = accessorInfo["bufferView"];
      accessors.push(new GLTFAccessor(bufferViews[viewID], accessorInfo));
    }

    return { accessors };
  }

  static createBufferViews(jsonChunk: any, binaryChunk: any) {
    const bufferViews: GLTFBufferView[] = [];

    for (let i = 0; i < jsonChunk.bufferViews.length; ++i) {
      bufferViews.push(
        new GLTFBufferView(binaryChunk, jsonChunk.bufferViews[i]),
      );
    }

    return { bufferViews };
  }

  static createMesh(jsonChunk: any, accessors: GLTFAccessor[]) {
    // const mesh = jsonChunk.meshes[0];
    const meshes: GLTFMesh[] = [];
    jsonChunk.meshes.forEach((mesh: any) => {
      const meshPrimitives = [];

      if (!mesh.primitives) {
        throw Error("no primitives found");
      }

      // Loop through the mesh's primitives and load them
      for (let i = 0; i < mesh.primitives.length; ++i) {
        const prim = mesh.primitives[i];
        let topology = prim["mode"];
        // Default is triangles if mode specified
        if (topology === undefined) {
          topology = GLTFRenderMode.TRIANGLES;
        }
        if (
          topology != GLTFRenderMode.TRIANGLES &&
          topology != GLTFRenderMode.TRIANGLE_STRIP
        ) {
          throw Error(`Unsupported primitive mode ${prim["mode"]}`);
        }

        // Find the vertex indices accessor if provided
        let indices = null;
        if (jsonChunk["accessors"][prim["indices"]] !== undefined) {
          indices = accessors[prim["indices"]];
        }

        // Loop through all the attributes to find the POSITION attribute.
        // While we only want the position attribute right now, we'll load
        // the others later as well.
        let positions = null;
        for (let attr in prim["attributes"]) {
          const accessor = accessors[prim["attributes"][attr]];
          if (attr == "POSITION") {
            positions = accessor;
          }
        }

        if (!positions) throw new Error("no positions found");
        if (!indices) throw new Error("no indicies found");

        console.log(positions);
        console.log(indices);
        console.log(topology);

        // Add the primitive to the mesh's list of primitives
        meshPrimitives.push(new GLTFPrimitive(positions, indices, topology));
      }

      meshes.push(new GLTFMesh(mesh["name"], meshPrimitives));
    });

    // Create the GLTFMesh
    return { gltfMeshes: meshes };
  }

  static async uploadGlb(buffer: ArrayBufferLike, device: GPUDevice) {
    console.group("glb load");

    const { binaryChunk, jsonChunk } = this.getGLTFChunks(buffer);
    console.log("Binary chunk:", binaryChunk);
    console.log("jsonChunk", binaryChunk);

    const { bufferViews } = this.createBufferViews(jsonChunk, binaryChunk);
    console.log("bufferViews:", bufferViews);

    const { accessors } = this.createAccessors(jsonChunk, bufferViews);
    console.log("accessors:", accessors);
    console.log(`glTF file has ${jsonChunk.meshes.length} meshes`);

    const { gltfMeshes } = this.createMesh(jsonChunk, accessors);
    console.log("gltfMesh:", gltfMeshes);

    for (let i = 0; i < bufferViews.length; ++i) {
      if (bufferViews[i].needsUpload) {
        bufferViews[i].upload(device);
      }
    }
    console.log(bufferViews);

    let defaultSceneNodes = jsonChunk["scenes"][0]["nodes"];
    if (jsonChunk["scenes"]) {
      defaultSceneNodes = jsonChunk["scenes"][jsonChunk["scene"]]["nodes"];
    }
    console.log(jsonChunk["scenes"]);
    const defaultNodes = [];

    for (let i = 0; i < defaultSceneNodes.length; ++i) {
      // Get each node referenced by the scene and flatten it and its children
      // out to a single-level scene so that we don't need to keep track of nested
      // transforms in the renderer
      // We'll need to put a bit more thought here when we start handling animated nodes
      // in the hierarchy. For now this is fine.
      const n = jsonChunk["nodes"][defaultSceneNodes[i]];
      const flattenedNodes = flattenTree(jsonChunk["nodes"], n);

      // Add all the mesh nodes in the flattened node list to the scene's default nodes
      for (let j = 0; j < flattenedNodes.length; ++j) {
        const fn = flattenedNodes[j];
        if (fn["mesh"] != undefined) {
          defaultNodes.push(
            new GLTFNode(n["name"], fn["matrix"], gltfMeshes[fn["mesh"]]),
          );
        }
      }
    }

    console.groupEnd();
    return new GLTFScene(defaultNodes);
    // return gltfMeshes;
  }
}
