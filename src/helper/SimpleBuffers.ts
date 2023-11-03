export const getTriangle = (device: GPUDevice) => {
  console.info("Setup Triangle buffer");
  // Allocate Buffer memory
  const dataBuffer = device.createBuffer({
    size: 3 * 2 * 4 * 4,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  // TODO: check whats happening without Float32Array
  new Float32Array(dataBuffer.getMappedRange()).set([
    1,
    -1,
    0,
    1, // position
    1,
    0,
    0,
    1, // color
    -1,
    -1,
    0,
    1, // position
    0,
    1,
    0,
    1, // color
    0,
    1,
    0,
    1, // position
    0,
    0,
    1,
    1, // color
  ]);

  dataBuffer.unmap();
  console.info("Setup Vertex state");

  const vertexState = (shader: GPUShaderModule): GPUVertexState => {
    // Shader stage info
    return {
      module: shader,
      entryPoint: "vertex_main",
      // Vertex buffer info
      buffers: [
        {
          arrayStride: 2 * 4 * 4,
          attributes: [
            { format: "float32x4", offset: 0, shaderLocation: 0 },
            { format: "float32x4", offset: 4 * 4, shaderLocation: 1 },
          ],
        },
      ],
    };
  };
  console.info("Setup Fragment state");

  const fragmentState = (
    shader: GPUShaderModule,
    swapChainFormat: GPUTextureFormat,
  ): GPUFragmentState => {
    return {
      // Shader info
      module: shader,
      entryPoint: "fragment_main",
      // Output render target info
      targets: [{ format: swapChainFormat }],
    };
  };

  return { dataBuffer, vertexState, fragmentState };
  //
};
