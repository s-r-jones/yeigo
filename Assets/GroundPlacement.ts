import { SurfaceDetection } from "./SurfaceDetection";

@component
export class GroundPlacement extends BaseScriptComponent {
  @input
  @allowUndefined
  objectVisuals: SceneObject;

  @input
  @allowUndefined
  surfaceDetection: SurfaceDetection;

  private cubeTrans;

  onAwake() {
    this.cubeTrans = this.getSceneObject().getTransform();

    this.createEvent("OnStartEvent").bind(() => {
      this.startSurfaceDetection();
    });
  }

  startSurfaceDetection() {
    this.objectVisuals.enabled = false;
    this.surfaceDetection.startGroundCalibration((pos, rot) => {
      this.onSurfaceDetected(pos, rot);
    });
  }

  private onSurfaceDetected(pos: vec3, rot: quat) {
    this.objectVisuals.enabled = true;
    this.cubeTrans.setWorldPosition(pos);
    this.cubeTrans.setWorldRotation(rot);
  }
}
