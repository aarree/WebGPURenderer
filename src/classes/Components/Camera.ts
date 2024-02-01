import Component from "../../core/Component.ts";
import ArcballCamera from "../ArcballCamera.ts";
import { mat4 } from "gl-matrix";
import { InputController } from "../InputController.ts";
import Gpu from "../modules/Gpu.ts";
import { Buffer, ResourceType, ShaderDataFormat, SlotType } from "../../core/Resource.ts";

// Camera is a special component that where at least one instance must be available in the Renderer
// Because of that one instance will be created by default when the renderer get initialized.
export default class Camera extends Component {
    private camera: ArcballCamera;
    private projection: any;
    
    projView: any;
    buffer?: Buffer;
    constructor(canvas: HTMLCanvasElement) {
        super();

        this.camera = new ArcballCamera([0, 0, 5], [0, 0, 0], [0, 1, 0],
            0.5, [canvas.width, canvas.height]);
        
        this.camera.rotate([409, 803],[522, 800]);
        

        // Create a perspective projection matrix
        this.projection = mat4.perspective(mat4.create(), 50 * Math.PI / 180.0,
            canvas.width / canvas.height, 0.1, 100);

        // Matrix which will store the computed projection * view matrix
        this.projView = mat4.create();

        // Controller utility for interacting with the canvas and driving the Arcball camera
        const controller = new InputController();
        controller.mousemove = (prev, cur, evt) => {
            if (evt.buttons == 1) {
                
                this.camera.rotate(prev, cur);

            } else if (evt.buttons == 2) {
                this.camera.pan([cur[0] - prev[0], prev[1] - cur[1]]);
            }
        };
        controller.wheel = (amt) => { this.camera.zoom(amt * 0.5); };
        controller.registerForCanvas(canvas);
        
    }
    
    updateScreenSize(width: number, height: number) {
        console.log("Updating screen size");
        this.camera.screenDimensions = [width, height];
        this.camera.updateCameraMatrix();
    }
    onInit(): void {

        this.buffer = Gpu.module.createBuffer({
            data: this.projView,
            type: ResourceType.Uniform,
            name: "Camera ProjView",
            dataFormat: ShaderDataFormat.mat4f32,
            shaderSlots: [{
                name: "projView",
                size: 4,
                type: SlotType.binding,
                position: 0,
                binding: 0,
                dataType: ShaderDataFormat.mat4f32
            }],
        });
    }
    
    update() {}

    updatedCameraProjectionBuffer() {
        this.projView = mat4.mul(this.projView, this.projection, this.camera.camera);
        
        if(!this.buffer?.data) throw new Error("Camera Buffer is null");

        Gpu.module.device.queue.writeBuffer(
            this.buffer.data,
            0,
            this.projView.buffer,
            this.projView.byteOffset,
            this.projView.byteLength,
        );
    }
}