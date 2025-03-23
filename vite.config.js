import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [glsl()],
  build: {
    target: "esnext",
  },
  server: {
    host: true,
    port: 80,
  },
  preview: {
    port: 80,
    host: true,
  },
  assetsInclude: ["**/*.glb"],
});
