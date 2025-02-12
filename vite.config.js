import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [glsl()],
  server: {
    host: true,
    port: 80,
  },
  assetsInclude: ["**/*.glb"],
});
