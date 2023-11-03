import { mat3, mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
/* The arcball camera will be placed at the position 'eye', rotating
 * around the point 'center', with the up vector 'up'. 'screenDims'
 * should be the dimensions of the canvas or region taking mouse input
 * so the mouse positions can be normalized into [-1, 1] from the pixel
 * coordinates.
 */
export default class ArcballCamera {
  private veye: vec3;
  private vcenter: vec3;
  private vup: vec3;
  private invScreen: number[];
  private centerTranslation: mat4;
  private translation: mat4;
  private rotation: quat;
  camera: mat4;
  private invCamera: mat4;
  private eye: vec3;
  constructor(
    eye: vec3,
    private center: vec3,
    up: vec3,
    private zoomSpeed: number,
    private screenDims: number[],
  ) {
    this.eye = eye;
    this.veye = vec3.set(vec3.create(), this.eye[0], this.eye[1], this.eye[2]);
    this.vcenter = vec3.set(
      vec3.create(),
      this.center[0],
      this.center[1],
      this.center[2],
    );
    this.vup = vec3.set(vec3.create(), up[0], up[1], up[2]);
    vec3.normalize(this.vup, this.vup);

    const zAxis = vec3.sub(vec3.create(), this.vcenter, this.veye);
    const viewDist = vec3.len(zAxis);
    vec3.normalize(zAxis, zAxis);

    const xAxis = vec3.cross(vec3.create(), zAxis, this.vup);
    vec3.normalize(xAxis, xAxis);

    const yAxis = vec3.cross(vec3.create(), xAxis, zAxis);
    vec3.normalize(yAxis, yAxis);

    vec3.cross(xAxis, zAxis, yAxis);
    vec3.normalize(xAxis, xAxis);

    this.zoomSpeed = zoomSpeed;
    this.invScreen = [1.0 / screenDims[0], 1.0 / screenDims[1]];
    console.log(this.screenDims);
    this.centerTranslation = mat4.fromTranslation(mat4.create(), center);
    mat4.invert(this.centerTranslation, this.centerTranslation);

    const vt = vec3.set(vec3.create(), 0, 0, -1.0 * viewDist);
    this.translation = mat4.fromTranslation(mat4.create(), vt);

    const rotMat = mat3.fromValues(
      xAxis[0],
      xAxis[1],
      xAxis[2],
      yAxis[0],
      yAxis[1],
      yAxis[2],
      -zAxis[0],
      -zAxis[1],
      -zAxis[2],
    );
    mat3.transpose(rotMat, rotMat);
    this.rotation = quat.fromMat3(quat.create(), rotMat);
    quat.normalize(this.rotation, this.rotation);

    this.camera = mat4.create();
    this.invCamera = mat4.create();
    this.updateCameraMatrix();
  }

  rotate(prevMouse: [number, number], curMouse: [number, number]) {
    const mPrev = vec2.set(
      vec2.create(),
      clamp(prevMouse[0] * 2.0 * this.invScreen[0] - 1.0, -1.0, 1.0),
      clamp(1.0 - prevMouse[1] * 2.0 * this.invScreen[1], -1.0, 1.0),
    );

    const mCur = vec2.set(
      vec2.create(),
      clamp(curMouse[0] * 2.0 * this.invScreen[0] - 1.0, -1.0, 1.0),
      clamp(1.0 - curMouse[1] * 2.0 * this.invScreen[1], -1.0, 1.0),
    );

    const mPrevBall = screenToArcball(mPrev);
    const mCurBall = screenToArcball(mCur);
    // rotation = curBall * prevBall * rotation
    this.rotation = quat.mul(this.rotation, mPrevBall, this.rotation);
    this.rotation = quat.mul(this.rotation, mCurBall, this.rotation);

    this.updateCameraMatrix();
  }

  zoom(amount: number) {
    const vt = vec3.set(
      vec3.create(),
      0.0,
      0.0,
      amount * this.invScreen[1] * this.zoomSpeed,
    );
    const t = mat4.fromTranslation(mat4.create(), vt);
    this.translation = mat4.mul(this.translation, t, this.translation);
    if (this.translation[14] >= -0.2) {
      this.translation[14] = -0.2;
    }
    this.updateCameraMatrix();
  }

  pan(mouseDelta: [number, number]) {
    const delta = vec4.set(
      vec4.create(),
      mouseDelta[0] * this.invScreen[0] * Math.abs(this.translation[14]),
      mouseDelta[1] * this.invScreen[1] * Math.abs(this.translation[14]),
      0,
      0,
    );
    const worldDelta = vec4.transformMat4(vec4.create(), delta, this.invCamera);
    // @ts-ignore
    const translation = mat4.fromTranslation(mat4.create(), worldDelta);
    this.centerTranslation = mat4.mul(
      this.centerTranslation,
      translation,
      this.centerTranslation,
    );
    this.updateCameraMatrix();
  }

  updateCameraMatrix() {
    // camera = translation * rotation * centerTranslation
    const rotMat = mat4.fromQuat(mat4.create(), this.rotation);
    this.camera = mat4.mul(this.camera, rotMat, this.centerTranslation);
    this.camera = mat4.mul(this.camera, this.translation, this.camera);
    this.invCamera = mat4.invert(this.invCamera, this.camera);
  }

  get eyePos() {
    return [this.invCamera[12], this.invCamera[13], this.invCamera[14]];
  }

  get eyeDir() {
    let dir = vec4.set(vec4.create(), 0.0, 0.0, -1.0, 0.0);
    dir = vec4.transformMat4(dir, dir, this.invCamera);
    dir = vec4.normalize(dir, dir);
    return [dir[0], dir[1], dir[2]];
  }

  get upDir() {
    let dir = vec4.set(vec4.create(), 0.0, 1.0, 0.0, 0.0);
    dir = vec4.transformMat4(dir, dir, this.invCamera);
    dir = vec4.normalize(dir, dir);
    return [dir[0], dir[1], dir[2]];
  }
}

const screenToArcball = function (p: vec2) {
  const dist = vec2.dot(p, p);
  if (dist <= 1.0) {
    return quat.set(quat.create(), p[0], p[1], Math.sqrt(1.0 - dist), 0);
  } else {
    const unitP = vec2.normalize(vec2.create(), p);
    // cgmath is w, x, y, z
    // glmatrix is x, y, z, w
    return quat.set(quat.create(), unitP[0], unitP[1], 0, 0);
  }
};
const clamp = function (a: number, min: number, max: number) {
  return a < min ? min : a > max ? max : a;
};
